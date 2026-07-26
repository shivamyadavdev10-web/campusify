import { useAuthStore } from '../../src/store/useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosClient from '../../src/api/axiosClient.api';

jest.mock('../../src/api/axiosClient.api', () => {
  const actual = jest.requireActual('../../src/api/axiosClient.api');
  return {
    __esModule: true,
    ...actual,
    default: {
      get: jest.fn(),
      post: jest.fn(),
      defaults: {
        headers: { common: {} },
      },
    },
    clearApiCache: jest.fn(),
  };
});

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ isLoading: true, userToken: null, userProfile: null });
  });

  it('initializes correctly with default state', () => {
    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.userToken).toBeNull();
    expect(state.userProfile).toBeNull();
  });

  it('bootstrapAsync handles valid token', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('mock-token');
    (axiosClient.get as jest.Mock).mockResolvedValueOnce({ data: { status: true, data: { name: 'Test User' } } });

    await useAuthStore.getState().bootstrapAsync();

    const state = useAuthStore.getState();
    expect(axiosClient.defaults.headers.common.Authorization).toBe('Bearer mock-token');
    expect(state.userToken).toBe('mock-token');
    expect(state.userProfile).toEqual({ name: 'Test User' });
    expect(state.isLoading).toBe(false);
  });

  it('bootstrapAsync handles invalid/expired token', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid-token');
    (axiosClient.get as jest.Mock).mockRejectedValueOnce(new Error('Unauthorized'));

    await useAuthStore.getState().bootstrapAsync();

    const state = useAuthStore.getState();
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(state.userToken).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('login stores tokens and fetches profile', async () => {
    (axiosClient.get as jest.Mock).mockResolvedValueOnce({ data: { status: true, data: { name: 'Test User' } } });

    await useAuthStore.getState().login('new-access', 'new-refresh');

    const state = useAuthStore.getState();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('accessToken', 'new-access');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('refreshToken', 'new-refresh');
    expect(axiosClient.defaults.headers.common.Authorization).toBe('Bearer new-access');
    expect(state.userToken).toBe('new-access');
    expect(state.userProfile).toEqual({ name: 'Test User' });
  });

  it('logout clears tokens and resets state', async () => {
    (axiosClient.post as jest.Mock).mockResolvedValueOnce({});
    
    useAuthStore.setState({ userToken: 'some-token', userProfile: { name: 'test' } });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(axiosClient.post).toHaveBeenCalledWith('/auth/logout');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(axiosClient.defaults.headers.common.Authorization).toBeUndefined();
    expect(state.userToken).toBeNull();
    expect(state.userProfile).toBeNull();
  });
});
