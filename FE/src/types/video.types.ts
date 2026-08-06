import { Content } from './curriculum.types';

export interface VideoFeedItem extends Content {
  // Add any feed-specific fields here if needed
}

export interface StreamUrlResponse {
  success: boolean;
  videoUrl: string;
}

export type VideoPlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error' | 'buffering';
