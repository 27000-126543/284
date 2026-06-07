import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { mockUsers } from '@/api/mock';

interface UserState {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      users: mockUsers,

      login: async (username: string, password: string) => {
        const user = mockUsers.find((u) => u.username === username);
        if (user && password === '123456') {
          set({ currentUser: user });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null });
      },

      setUsers: (users) => set({ users }),

      addUser: (user) =>
        set((state) => ({
          users: [...state.users, user],
        })),

      updateUser: (user) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === user.id ? user : u)),
        })),

      deleteUser: (id) =>
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        })),
    }),
    {
      name: 'user-storage',
    }
  )
);
