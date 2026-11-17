import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')))

  const guardarSessao = ({ token, usuario }) => {
    localStorage.setItem('token', token)   // sobrevive ao recarregar a página
    setToken(token)
    setUser(usuario)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  // Ao abrir a página com um token salvo, confirma com o servidor que ele ainda vale.
  useEffect(() => {
    if (!token) return
    api('/auth/me').then(setUser).catch(logout).finally(() => setLoading(false))
  }, [])

  // O cliente HTTP dispara este evento quando a API responde 401.
  useEffect(() => {
    window.addEventListener('sessao-expirada', logout)
    return () => window.removeEventListener('sessao-expirada', logout)
  }, [])

  const login = async (email, senha) => guardarSessao(await api('/auth/login', { method: 'POST', body: { email, senha } }))
  const cadastrar = async (dados) => guardarSessao(await api('/auth/cadastro', { method: 'POST', body: dados }))

  if (loading) return null

  return <AuthContext.Provider value={{ token, user, login, logout, cadastrar }}>{children}</AuthContext.Provider>
}
