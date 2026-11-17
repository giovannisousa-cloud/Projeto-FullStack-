import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Menu from './components/Menu'
import Login from './components/Login'
import Cadastro from './components/Cadastro'
import Dashboard from './components/Dashboard'
import Lancamentos from './components/Lancamentos'
import Categorias from './components/Categorias'
import FontesDestinos from './components/FontesDestinos'
import Relatorios from './components/Relatorios'
import Faturas from './components/Faturas'

// Rota protegida: sem token, volta para o login.
function Protegida({ children }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return (
    <>
      <Menu />
      <main className="container py-4">{children}</main>
    </>
  )
}

export default function App() {
  const { token } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
      <Route path="/cadastro" element={token ? <Navigate to="/" /> : <Cadastro />} />
      <Route path="/" element={<Protegida><Dashboard /></Protegida>} />
      <Route path="/lancamentos" element={<Protegida><Lancamentos /></Protegida>} />
      <Route path="/categorias" element={<Protegida><Categorias /></Protegida>} />
      <Route path="/fontes-destinos" element={<Protegida><FontesDestinos /></Protegida>} />
      <Route path="/relatorios" element={<Protegida><Relatorios /></Protegida>} />
      <Route path="/faturas" element={<Protegida><Faturas /></Protegida>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
