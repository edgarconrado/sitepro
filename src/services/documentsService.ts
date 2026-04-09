/**
 * SitePro — Servicio de Documentos
 * Upload a Supabase Storage + CRUD en tabla documents
 */

import { supabase } from '@lib/supabase';

export interface DbDocument {
    id: string;
    project_id: string;
    file_url: string;
    file_name: string;
    file_size: number | null;
    mime_type: string | null;
    document_type: string | null;
    version: number;
    description: string | null;
    tags: string[] | null;
    created_at: string;
    updated_at: string;
    uploaded_by: string;
    uploader?: { full_name: string } | null;
}

export async function fetchProjectDocuments(projectId: string): Promise<DbDocument[]> {
    const { data, error } = await supabase
        .from('documents')
        .select('*, uploader:profiles!documents_uploaded_by_fkey(full_name)')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

    if (error) { console.error('[documentsService]', error.message); return []; }
    return data ?? [];
}

export async function uploadDocument(opts: {
    uri: string;
    base64?: string;
    mimeType?: string;
    projectId: string;
    documentType: string;
    description: string;
    tags: string[];
}): Promise<DbDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const rawExt = opts.mimeType?.split('/')[1] ?? opts.uri.split('.').pop()?.split('?')[0] ?? 'pdf';
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const mime = opts.mimeType ?? `application/${ext}`;
    const fileName = `${opts.projectId}/${user.id}_${Date.now()}.${ext}`;

    let uploadError: any;

    if (opts.base64) {
        const binaryStr = atob(opts.base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const { error } = await supabase.storage
            .from('documents')
            .upload(fileName, bytes.buffer, { contentType: mime, upsert: false });
        uploadError = error;
    } else {
        const response = await fetch(opts.uri);
        const arrayBuffer = await response.arrayBuffer();
        const { error } = await supabase.storage
            .from('documents')
            .upload(fileName, arrayBuffer, { contentType: mime, upsert: false });
        uploadError = error;
    }

    if (uploadError) throw new Error(`Upload falló: ${uploadError.message}`);

    // URL firmada (privada) o pública según configuración del bucket
    const { data: urlData } = await supabase.storage
        .from('documents')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 días

    const fileUrl = urlData?.signedUrl ?? '';

    const { data: doc, error: insertError } = await supabase
        .from('documents')
        .insert({
            project_id: opts.projectId,
            uploaded_by: user.id,
            file_url: fileUrl,
            file_name: fileName,
            mime_type: mime,
            document_type: opts.documentType,
            description: opts.description || null,
            tags: opts.tags.length > 0 ? opts.tags : null,
            version: 1,
        })
        .select('*, uploader:profiles!documents_uploaded_by_fkey(full_name)')
        .single();

    if (insertError) throw new Error(insertError.message);
    return doc;
}

export async function deleteDocument(doc: DbDocument): Promise<void> {
    await supabase.storage.from('documents').remove([doc.file_name]);
    const { error } = await supabase.from('documents').delete().eq('id', doc.id);
    if (error) throw new Error(error.message);
}

export async function getDocumentUrl(fileName: string): Promise<string> {
    const { data } = await supabase.storage
        .from('documents')
        .createSignedUrl(fileName, 60 * 60); // 1 hora
    return data?.signedUrl ?? '';
}

// Mapeo tipo DB → categoría UI
export const DOC_TYPE_TO_CATEGORY: Record<string, string> = {
    contrato: 'Contrato',
    reporte: 'Reporte',
    especificacion: 'Especificación',
    permiso: 'Permiso',
};

export const CATEGORY_TO_DB_TYPE: Record<string, string> = {
    'Contrato': 'contrato',
    'Contratos': 'contrato',
    'Reporte': 'reporte',
    'Reportes': 'reporte',
    'Especificación': 'especificacion',
    'Especificaciones': 'especificacion',
    'Permiso': 'permiso',
    'Permisos': 'permiso',
};