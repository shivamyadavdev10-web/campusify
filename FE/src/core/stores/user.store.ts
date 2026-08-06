import { create } from 'zustand';
import { User } from '../../types/auth.types';

interface UserState {
  profile: User | null;
  setProfile: (user: User) => void;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (user) => set({ profile: user }),
  clearProfile: () => set({ profile: null }),
}));
