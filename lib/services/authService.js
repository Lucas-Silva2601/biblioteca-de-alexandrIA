import api from '@/lib/api'

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  register: async (email, password) => {
    const response = await api.post('/auth/register', { email, password })
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  loginWithGoogle: () => {
    // Redireciona para o OAuth do Google no backend
    window.location.href = `${api.defaults.baseURL}/auth/login/google`
  },
}
