import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Campo from './Campo'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function entrar(e) {
    e.preventDefault()
    if (!email || !senha) return setErro('Preencha e-mail e senha.')   // validação antes do envio
    setEnviando(true)
    setErro(null)
    try {
      await login(email, senha)       // deu certo: o AuthContext guarda o token e o App vai para "/"
    } catch (falha) {
      setErro(falha.message)          // erro depois do envio (ex.: "E-mail ou senha inválidos.")
      setEnviando(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-sm-9 col-md-6 col-lg-4">
            <div className="text-center mb-4">
              <span className="badge text-bg-success fs-4 mb-3">R$</span>
              <h1 className="h3 mb-1">Controle Financeiro</h1>
              <p className="text-body-secondary mb-0">Entre para ver suas finanças.</p>
            </div>
            <form className="card border-0 shadow-sm" onSubmit={entrar} noValidate>
              <div className="card-body p-4">
                {erro && <div className="alert alert-danger">{erro}</div>}
                <Campo label="E-mail">
                  <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Campo>
                <Campo label="Senha">
                  <input type="password" className="form-control" value={senha} onChange={(e) => setSenha(e.target.value)} />
                </Campo>
                <button className="btn btn-primary w-100" disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</button>
              </div>
            </form>
            <p className="text-center mt-3">Não tem conta? <Link to="/cadastro">Cadastre-se</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
