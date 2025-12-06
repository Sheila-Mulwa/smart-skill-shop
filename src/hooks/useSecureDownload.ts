import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DownloadState {
  isDownloading: boolean;
  downloadingId: string | null;
}

export const useSecureDownload = () => {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    downloadingId: null,
  });

  const downloadProduct = async (productId: string, productTitle: string) => {
    setDownloadState({ isDownloading: true, downloadingId: productId });

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Login Required',
          description: 'Please log in to download your purchases.',
          variant: 'destructive',
        });
        return false;
      }

      // Call the secure download edge function
      const response = await supabase.functions.invoke('secure-pdf-download', {
        body: { productId },
      });

      if (response.error) {
        console.error('Download error:', response.error);
        toast({
          title: 'Download Failed',
          description: response.error.message || 'Unable to download the file.',
          variant: 'destructive',
        });
        return false;
      }

      const { downloadUrl, title } = response.data;

      if (!downloadUrl) {
        toast({
          title: 'Download Failed',
          description: 'Could not generate download link.',
          variant: 'destructive',
        });
        return false;
      }

      // Create and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${title || productTitle}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Download Started',
        description: `Downloading "${title || productTitle}"`,
      });

      return true;
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setDownloadState({ isDownloading: false, downloadingId: null });
    }
  };

  return {
    downloadProduct,
    isDownloading: downloadState.isDownloading,
    downloadingId: downloadState.downloadingId,
  };
};
