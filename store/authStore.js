import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Estado global de autenticação, persistido no localStorage.
 * Usamos skipHydration porque o localStorage não existe no servidor;
 * a hidratação é disparada pelo cliente em useAuthStore.persist.rehydrate().
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
)
