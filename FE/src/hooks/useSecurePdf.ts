import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';

export function useSecurePdf(url: string) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let downloadResumable: FileSystem.DownloadResumable | null = null;

    const loadPdf = async () => {
      try {
        if (!url) return;

        // 1. Create a safe, unique filename based on the URL
        const safeFilename = url.split('?')[0].replace(/[^a-zA-Z0-9]/g, '') + '.pdf';
        
        // 2. Point to the highly secure, persistent DocumentDirectory
        const fileUri = `${FileSystem.documentDirectory}${safeFilename}`;

        // 3. Check if we already have it saved from a previous session
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        if (fileInfo.exists) {
          // It's already cached securely! Load instantly.
          if (isMounted) {
            setProgress(1); // 100%
            setLocalUri(fileUri);
          }
          return;
        }

        // 4. If not found, securely download it and hide it in DocumentDirectory
        downloadResumable = FileSystem.createDownloadResumable(
          url,
          fileUri,
          {},
          (downloadProgress) => {
            const currentProgress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
            if (isMounted) {
              setProgress(currentProgress);
            }
          }
        );

        const result = await downloadResumable.downloadAsync();
        
        if (isMounted && result) {
          setLocalUri(result.uri);
        }
      } catch (err) {
        console.error('Secure PDF Download Error:', err);
        if (isMounted) setError(true);
      }
    };

    loadPdf();

    // Cleanup: cancel download if user closes the modal early
    return () => {
      isMounted = false;
      if (downloadResumable) {
        downloadResumable.pauseAsync().catch(() => {});
      }
    };
  }, [url]);

  return { localUri, progress, error };
}
