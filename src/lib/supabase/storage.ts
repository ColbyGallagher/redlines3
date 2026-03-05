import { supabase } from './client'

/**
 * Uploads a file to a Supabase Storage bucket.
 * @param bucket The name of the storage bucket.
 * @param path The path (including filename) where the file should be stored.
 * @param file The file object to upload.
 * @returns The data returned from Supabase on success.
 * @throws The error returned from Supabase on failure.
 */
export const uploadFile = async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file)
    if (error) {
        throw error
    }
    return data
}

/**
 * Gets the public URL for a file in a Supabase Storage bucket.
 * @param bucket The name of the storage bucket.
 * @param path The path to the file.
 * @returns The public URL string.
 */
export const getPublicUrl = (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
}

/**
 * Deletes a file from a Supabase Storage bucket.
 * @param bucket The name of the storage bucket.
 * @param path The path to the file.
 */
export const deleteFile = async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).remove([path])
    if (error) {
        throw error
    }
    return data
}
