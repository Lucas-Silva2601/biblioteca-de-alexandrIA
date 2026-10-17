import axios from 'axios'

/**
 * Cliente HTTP compartilhado.
 * Por padrão usa "/api" (proxy do Next.js -> Flask), o que evita CORS.
 * Defina NEXT_PUBLIC_API_URL para falar diretamente com o backend.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Anexa o token JWT (se existir) a todas as requisições.
 * O token é gravado pelo Zustand no localStorage em 'auth-storage'.
 */
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const raw = window.localStorage.getItem('auth-storage')
    if (raw) {
      try {
        const { state } = JSON.parse(raw)
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`
        }
      } catch {
        // localStorage corrompido - segue sem token
      }
    }
  }
  return config
})

/** Em caso de 401, limpa a sessão salva. */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('auth-storage')
    }
    return Promise.reject(error)
  }
)

export default api
