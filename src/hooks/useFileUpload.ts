import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const useFileUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle',
  });

  const uploadFile = async (
    file: File,
    bucket: string,
    path: string
  ): Promise<string | null> => {
    try {
      setUploadProgress({ progress: 0, status: 'uploading' });

      // For large files, we'll use the standard upload with upsert
      // Supabase handles chunking internally for files
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      setUploadProgress({ progress: 100, status: 'success' });

      // Get public URL for public buckets, or signed URL for private buckets
      if (bucket === 'product-covers') {
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);
        return publicUrl;
      } else {
        // For private buckets like PDFs, return the path
        // We'll generate signed URLs when needed
        return data.path;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadProgress({ progress: 0, status: 'error', error: errorMessage });
      return null;
    }
  };

  const resetProgress = () => {
    setUploadProgress({ progress: 0, status: 'idle' });
  };

  return { uploadFile, uploadProgress, resetProgress };
};
