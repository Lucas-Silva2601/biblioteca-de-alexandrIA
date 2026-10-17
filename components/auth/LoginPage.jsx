'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { authService } from '@/lib/services/authService'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = useAuthStore((state) => state.login)

  // Hidrata o store persistido (localStorage só existe no cliente)
  useEffect(() => {
    useAuthStore.persist.rehydrate()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = isLogin
        ? await authService.login(email, password)
        : await authService.register(email, password)

      login(data.user, data.token)
      router.push('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    authService.loginWithGoogle()
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-[#141414] to-[#1f1f1f] p-5">
      <div className="w-full max-w-[450px] rounded-xl bg-surface p-10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] max-[480px]:p-5">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-5xl text-wood max-[480px]:text-4xl">📚</h1>
          <h2 className="mb-2 text-2xl font-bold text-wood">Biblioteca de AlexandrIA</h2>
          <p className="text-sm text-muted">Chat sobre livros com IA</p>
        </div>

        <div className="mb-8 flex gap-2.5 rounded-lg bg-background p-1">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 rounded-md px-3 py-3 font-medium transition-colors duration-300 ${
              isLogin ? 'bg-wood text-white' : 'text-muted'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 rounded-md px-3 py-3 font-medium transition-colors duration-300 ${
              !isLogin ? 'bg-wood text-white' : 'text-muted'
            }`}
          >
            Registrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="rounded-lg border border-danger bg-red-500/10 px-3 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-muted">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="rounded-lg border border-line bg-background px-3.5 py-3.5 text-base text-ink outline-none transition-colors duration-300 focus:border-wood"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-muted">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
              className="rounded-lg border border-line bg-background px-3.5 py-3.5 text-base text-ink outline-none transition-colors duration-300 focus:border-wood"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-wood px-3.5 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(229,9,20,0.4)]"
          >
            {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        <div className="my-5 flex items-center text-center text-muted before:h-0 before:flex-1 before:border-b before:border-line after:h-0 after:flex-1 after:border-b after:border-line">
          <span className="px-2.5 text-sm">ou</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-3.5 py-3.5 text-base font-medium text-[#333] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          Continuar com Google
        </button>
      </div>
    </div>
  )
}
