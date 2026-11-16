import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const MENSAGENS = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
  'User already registered': 'Este e-mail já está cadastrado.'
}
const traduzir = (error) => new Error(MENSAGENS[error.message] || error.message)

const toUser = (u) => u && { id: u.id, email: u.email, nome: u.user_metadata?.nome || u.email, cpf: u.user_metadata?.cpf }

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const login = async (email, senha) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw traduzir(error)
  }

  const cadastrar = async ({ nome, email, cpf, senha }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome, cpf } }
    })
    if (error) throw traduzir(error)
    if (!data.session) throw new Error('Cadastro realizado! Confirme seu e-mail para entrar.')
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) return null

  return <AuthContext.Provider value={{ token: session?.access_token ?? null, user: toUser(session?.user), session, login, logout, cadastrar }}>
    {children}
  </AuthContext.Provider>
}
