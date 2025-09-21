import { create } from 'zustand';

export type UserProfile = {
  readonly id: string;
  readonly email: string;
  readonly username: string | null;
  readonly fullName: string;
  readonly role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'INFO_IT';
  readonly domainId: string | null;
  readonly domain?: { readonly id: string; readonly name: string; readonly slug: string } | null;
};

export type AuthState = {
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly user: UserProfile | null;
  setTokens: (t: { accessToken: string; refreshToken: string }) => void;
  setUser: (u: UserProfile | null) => void;
  clear: () => void;
  loadFromStorage: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  setTokens: ({ accessToken, refreshToken }) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },
  setUser: (user) => set({ user }),
  clear: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ accessToken: null, refreshToken: null, user: null });
  },
  loadFromStorage: () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    set({ accessToken, refreshToken });
  },
}));
