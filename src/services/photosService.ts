/**
 * SitePro — Servicio de Fotos
 * Upload a Supabase Storage + CRUD en tabla photos
 */

import { supabase } from '@lib/supabase';

export interface DbPhoto {
    id: string;
    project_id: string;
    file_url: string;
    file_name: string;
    location: string | null;
    zone: string | null;
    description: string | null;
    taken_at: string;
    created_at: string;
    uploaded_by: string;
    uploader?: {
        full_name: string;
        avatar_url: string | null;
    } | null;
}

// ─── Cargar fotos de un proyecto ─────────────────────────────
export async function fetchProjectPhotos(projectId: string): Promise<DbPhoto[]> {
    const { data, error } = await supabase
        .from('photos')
        .select(`
      id, project_id, file_url, file_name, location, zone,
      description, taken_at, created_at, uploaded_by,
      uploader:profiles!photos_uploaded_by_fkey(full_name, avatar_url)
    `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[photosService] fetch error:', error.message);
        return [];
    }
    return data ?? [];
}

// ─── Subir foto a Storage y guardar en BD ─────────────────────
// Usa base64 para evitar el problema de blob corrupto en React Native
export async function uploadPhoto(opts: {
    uri: string;
    base64?: string;     // base64 sin prefijo "data:image/..."
    mimeType?: string;
    projectId: string;
    location: string;
    zone: string;
    description: string;
}): Promise<DbPhoto> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    // Determinar extensión y mime
    const rawExt = opts.mimeType?.split('/')[1]
        ?? opts.uri.split('.').pop()?.split('?')[0]
        ?? 'jpeg';
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const mime = opts.mimeType ?? `image/${rawExt}`;
    const fileName = `${opts.projectId}/${user.id}_${Date.now()}.${ext}`;

    let uploadError: any;

    if (opts.base64) {
        // ✅ Camino correcto en React Native: base64 → Uint8Array → ArrayBuffer
        const binaryStr = atob(opts.base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }

        const { error } = await supabase.storage
            .from('photos')
            .upload(fileName, bytes.buffer, { contentType: mime, upsert: false });
        uploadError = error;
    } else {
        // Fallback con fetch (puede funcionar según el dispositivo)
        const response = await fetch(opts.uri);
        const arrayBuffer = await response.arrayBuffer();
        const { error } = await supabase.storage
            .from('photos')
            .upload(fileName, arrayBuffer, { contentType: mime, upsert: false });
        uploadError = error;
    }

    if (uploadError) throw new Error(`Upload falló: ${uploadError.message}`);

    // URL pública
    const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

    // Guardar en BD
    const { data: photo, error: insertError } = await supabase
        .from('photos')
        .insert({
            project_id: opts.projectId,
            uploaded_by: user.id,
            file_url: urlData.publicUrl,
            file_name: fileName,
            location: opts.location || null,
            zone: opts.zone || null,
            description: opts.description || null,
            taken_at: new Date().toISOString(),
        })
        .select(`
      id, project_id, file_url, file_name, location, zone,
      description, taken_at, created_at, uploaded_by,
      uploader:profiles!photos_uploaded_by_fkey(full_name, avatar_url)
    `)
        .single();

    if (insertError) throw new Error(`BD falló: ${insertError.message}`);
    return photo;
}

// ─── Eliminar foto ────────────────────────────────────────────
export async function deletePhoto(photo: DbPhoto): Promise<void> {
    await supabase.storage.from('photos').remove([photo.file_name]);
    const { error } = await supabase.from('photos').delete().eq('id', photo.id);
    if (error) throw new Error(error.message);
}