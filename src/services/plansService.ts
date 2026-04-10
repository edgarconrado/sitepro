/**
 * SitePro — Servicio de Planos
 * Upload PNG/PDF a Supabase Storage + CRUD en tabla plans
 */

import { supabase } from '@lib/supabase';

export interface DbPlan {
    id: string;
    project_id: string;
    file_url: string;
    file_name: string;
    file_type: 'png' | 'pdf';
    mime_type: string;
    code: string;
    title: string;
    discipline: string;
    level: string;
    revision: string;
    scale: string | null;
    status: 'Vigente' | 'Revisión' | 'Obsoleto';
    uploaded_by: string;
    created_at: string;
    updated_at: string;
    uploader?: { full_name: string } | null;
}

export async function fetchProjectPlans(projectId: string): Promise<DbPlan[]> {
    const { data, error } = await supabase
        .from('plans')
        .select('*, uploader:profiles!plans_uploaded_by_fkey(full_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) { console.error('[plansService]', error.message); return []; }
    return data ?? [];
}

export async function uploadPlan(opts: {
    uri: string;
    base64?: string;
    mimeType: string;   // 'image/png' | 'application/pdf'
    projectId: string;
    code: string;
    title: string;
    discipline: string;
    level: string;
    revision: string;
    scale: string;
}): Promise<DbPlan> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    // Solo PNG y PDF
    const isPdf = opts.mimeType === 'application/pdf';
    const isImg = opts.mimeType === 'image/png' || opts.mimeType === 'image/jpeg' || opts.mimeType === 'image/jpg';
    if (!isPdf && !isImg) throw new Error('Solo se permiten archivos PNG, JPG o PDF');

    const ext = isPdf ? 'pdf' : (opts.mimeType === 'image/jpeg' || opts.mimeType === 'image/jpg') ? 'jpg' : 'png';
    const fileName = `${opts.projectId}/${user.id}_${Date.now()}.${ext}`;

    // Upload base64 → Uint8Array (fix blob corrupto en RN)
    if (!opts.base64) throw new Error('Se requiere base64 del archivo');
    const binaryStr = atob(opts.base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

    const { error: uploadError } = await supabase.storage
        .from('plans')
        .upload(fileName, bytes.buffer, { contentType: opts.mimeType, upsert: false });

    if (uploadError) throw new Error(`Upload falló: ${uploadError.message}`);

    // URL pública
    const { data: urlData } = supabase.storage.from('plans').getPublicUrl(fileName);

    // Guardar en BD (inicialmente con el PDF)
    const { data: plan, error: insertError } = await supabase
        .from('plans')
        .insert({
            project_id: opts.projectId,
            uploaded_by: user.id,
            file_url: urlData.publicUrl,
            file_name: fileName,
            file_type: ext,
            mime_type: opts.mimeType,
            code: opts.code,
            title: opts.title,
            discipline: opts.discipline,
            level: opts.level,
            revision: opts.revision,
            scale: opts.scale,
            status: 'Vigente',
        })
        .select('*, uploader:profiles!plans_uploaded_by_fkey(full_name)')
        .single();

    if (insertError) throw new Error(insertError.message);

    // Si es PDF → convertir a JPG en background via Edge Function
    if (isPdf) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            // Usar el nombre exacto de la función como aparece en el dashboard
            const fnUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/rapid-responder`;
            await fetch(fnUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token ?? ''}`,
                },
                body: JSON.stringify({
                    planId: plan.id,
                    fileName: fileName,
                    projectId: opts.projectId,
                }),
            });
        } catch (e) {
            // La conversión falla silenciosamente — el PDF sigue disponible
            console.warn('[plansService] PDF conversion failed:', e);
        }
    }

    return plan;
}

export async function deletePlan(plan: DbPlan): Promise<void> {
    await supabase.storage.from('plans').remove([plan.file_name]);
    const { error } = await supabase.from('plans').delete().eq('id', plan.id);
    if (error) throw new Error(error.message);
}