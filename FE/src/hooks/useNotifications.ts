import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../core/api/client';

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: 'alert' | 'course_update' | 'general';
  createdAt: string;
  read: boolean;
  url?: string;
}

export interface NotificationResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export const useNotifications = () => {
  return useQuery<NotificationResponse>({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/user/notifications').then(res => res.data.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true, // Fetch when user returns to app
  });
};

export const markNotificationsRead = () => {
    return apiClient.put('/user/notifications/read');
};
