import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Campo from './Campo'

const VAZIO = { nome: '', email: '', cpf: '', senha: '', confirmacao: '' }

// Máscara: "52998224725" -> "529.982.247-25"
function mascaraCpf(valor) {
  return valor.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

// Validação no navegador (o servidor valida de novo, inclusive os dígitos do CPF).
function validar(d) {
  const erros = {}
  if (!d.nome.trim()) erros.nome = 'Informe o nome.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) erros.email = 'Informe um e-mail válido.'
  if (d.cpf.replace(/\D/g, '').length !== 11) erros.cpf = 'O CPF deve ter 11 dígitos.'
  if (d.senha.length < 8 || !/[A-Za-z]/.test(d.senha) || !/\d/.test(d.senha)) {
    erros.senha = 'Mínimo de 8 caracteres, com letras e números.'
  }
  if (d.confirmacao !== d.senha) erros.confirmacao = 'As senhas não conferem.'
  return erros
}

export default function Cadastro() {
  const { cadastrar } = useAuth()
  const [dados, setDados] = useState(VAZIO)
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const mudar = (campo) => (e) => {
    const valor = campo === 'cpf' ? mascaraCpf(e.target.value) : e.target.value
    setDados({ ...dados, [campo]: valor })
  }

  async function enviar(e) {
    e.preventDefault()
    const encontrados = validar(dados)
    setErros(encontrados)
    setErroGeral(null)
    if (Object.keys(encontrados).length) return

    setEnviando(true)
    try {
      const { confirmacao, ...semConfirmacao } = dados
      await cadastrar(semConfirmacao)
    } catch (falha) {
      // Ex.: 409 -> { cpf: 'Já existe um usuário com este CPF.' } aparece embaixo do campo CPF.
      setErros(falha.campos)
      setErroGeral(falha.message)
      setEnviando(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-sm-10 col-md-7 col-lg-5">
            <div className="text-center mb-4">
              <span className="badge text-bg-success fs-4 mb-3">R$</span>
              <h1 className="h3 mb-1">Criar conta</h1>
              <p className="text-body-secondary mb-0">Preencha seus dados para começar.</p>
            </div>
            <form className="card border-0 shadow-sm" onSubmit={enviar} noValidate>
              <div className="card-body p-4">
                {erroGeral && <div className="alert alert-danger">{erroGeral}</div>}
                <Campo label="Nome" erro={erros.nome}>
                  <input className="form-control" value={dados.nome} onChange={mudar('nome')} />
                </Campo>
                <Campo label="E-mail" erro={erros.email}>
                  <input type="email" className="form-control" value={dados.email} onChange={mudar('email')} />
                </Campo>
                <Campo label="CPF" erro={erros.cpf}>
                  <input className="form-control" placeholder="000.000.000-00" value={dados.cpf} onChange={mudar('cpf')} />
                </Campo>
                <div className="row">
                  <Campo label="Senha" erro={erros.senha} className="col-sm-6 mb-3">
                    <input type="password" className="form-control" value={dados.senha} onChange={mudar('senha')} />
                  </Campo>
                  <Campo label="Confirmar senha" erro={erros.confirmacao} className="col-sm-6 mb-3">
                    <input type="password" className="form-control" value={dados.confirmacao} onChange={mudar('confirmacao')} />
                  </Campo>
                </div>
                <button className="btn btn-primary w-100" disabled={enviando}>{enviando ? 'Enviando...' : 'Cadastrar'}</button>
              </div>
            </form>
            <p className="text-center mt-3">Já tem conta? <Link to="/login">Entrar</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}
