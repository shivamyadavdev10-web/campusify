import { create } from 'zustand';

export interface DownloadedVideo {
  id: string;
  title: string;
  url: string;
  duration?: string;
  size?: string;
}

interface DownloadStore {
  downloadedVideos: DownloadedVideo[];
  isDownloading: boolean;
  addVideo: (videoMetadata: DownloadedVideo) => void;
  removeVideo: (videoId: string) => void;
}

const useDownloadStore = create<DownloadStore>((set) => ({
  downloadedVideos: [], 
  isDownloading: false,
  
  addVideo: (videoMetadata) => set((state) => ({ 
    downloadedVideos: [...state.downloadedVideos, videoMetadata] 
  })),
  
  removeVideo: (videoId) => set((state) => ({
    downloadedVideos: state.downloadedVideos.filter((v) => v.id !== videoId)
  }))
}));

export default useDownloadStore;