import { createContext, useContext, useEffect, useState } from 'react'
import api, { setUnauthorizedHandler } from '../services/api'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('orbe_token'))
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orbe_user')) } catch { return null }
  })

  const logout = () => {
    localStorage.removeItem('orbe_token')
    localStorage.removeItem('orbe_user')
    setToken(null); setUser(null)
  }

  useEffect(() => { setUnauthorizedHandler(logout) }, [])
  const login = async (email, senha) => {
    const { data } = await api.post('/auth/login', { email, senha })
    const receivedToken = data.token
    localStorage.setItem('orbe_token', receivedToken)
    localStorage.setItem('orbe_user', JSON.stringify(data.usuario || data.user || { nome: 'Usuário' }))
    setToken(receivedToken); setUser(data.usuario || data.user || { nome: 'Usuário' })
  }
  const cadastrar = async (dados) => {
    await api.post('/auth/cadastro', dados)
    await login(dados.email, dados.senha)
  }
  return <AuthContext.Provider value={{ token, user, login, logout, cadastrar }}>
    {children}
  </AuthContext.Provider>
}
