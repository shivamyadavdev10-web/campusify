import axiosClient, { clearApiCache } from '../../src/api/axiosClient.api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { Alert } from 'react-native';

jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: 'ios' },
}));

describe('Axios Interceptors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearApiCache();
    // Re-initialize mock for async storage since cache gets populated once
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === 'accessToken') return Promise.resolve('mock-access-token');
      if (key === 'refreshToken') return Promise.resolve('mock-refresh-token');
      return Promise.resolve(null);
    });
    (DeviceInfo.getUniqueId as jest.Mock).mockResolvedValue('mock-device-id');
  });

  it('attaches tokens and deviceId to requests', async () => {
    const config: any = { headers: {} };

    // Need to cast interceptor because it's a mock or internal type
    const requestInterceptor = (axiosClient.interceptors.request as any).handlers[0].fulfilled;
    const resultConfig = await requestInterceptor(config);

    expect(resultConfig.headers.Authorization).toBe('Bearer mock-access-token');
    expect(resultConfig.headers['x-refresh-token']).toBe('mock-refresh-token');
    expect(resultConfig.headers['x-device-id']).toBe('mock-device-id');
  });

  it('updates token on response if new token is provided', async () => {
    const response: any = {
      headers: {
        'x-new-access-token': 'new-access',
        'x-new-refresh-token': 'new-refresh',
      },
    };

    const responseInterceptor = (axiosClient.interceptors.response as any).handlers[0].fulfilled;
    await responseInterceptor(response);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith('accessToken', 'new-access');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh');
    expect(axiosClient.defaults.headers.common.Authorization).toBe('Bearer new-access');
  });

  it('handles 401 by clearing cache and storage', async () => {
    const error: any = {
      response: { status: 401, data: {} },
    };

    const responseInterceptorError = (axiosClient.interceptors.response as any).handlers[0].rejected;
    
    await expect(responseInterceptorError(error)).rejects.toEqual(error);

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  it('handles 403 "another device" error', async () => {
    const error: any = {
      response: { status: 403, data: { message: 'another device' } },
    };

    const responseInterceptorError = (axiosClient.interceptors.response as any).handlers[0].rejected;
    
    await expect(responseInterceptorError(error)).rejects.toEqual(error);

    expect(Alert.alert).toHaveBeenCalledWith('Session Expired', 'Login from another device detected.');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
  });
});
