import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const links = [
  ['/', 'Início'],
  ['/lancamentos', 'Lançamentos'],
  ['/categorias', 'Categorias'],
  ['/fontes-destinos', 'Fontes/Destinos'],
  ['/relatorios', 'Relatórios'],
  ['/faturas', 'Faturas']
]

// Barra do topo. O NavLink coloca a classe "active" no link da página atual.
export default function Menu() {
  const { user, logout } = useAuth()
  return (
    <nav className="navbar bg-dark shadow-sm" data-bs-theme="dark">
      <div className="container">
        <span className="navbar-brand fw-bold">
          <span className="badge text-bg-success me-2">R$</span>Controle Financeiro
        </span>
        <div className="navbar-nav flex-row flex-wrap column-gap-3 me-auto">
          {links.map(([caminho, nome]) => (
            <NavLink key={caminho} to={caminho} end className="nav-link">{nome}</NavLink>
          ))}
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="small text-white-50">{user?.nome}</span>
          <button className="btn btn-outline-light btn-sm" onClick={logout}>Sair</button>
        </div>
      </div>
    </nav>
  )
}
