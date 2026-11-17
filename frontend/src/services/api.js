// Único ponto de comunicação com a API: coloca o token em toda requisição
// e, se o servidor responder 401 (token expirado), avisa a aplicação para sair.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export async function api(caminho, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token')

  let resposta
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers: {
        ...(body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: body && JSON.stringify(body)
    })
  } catch {
    throw new Error('Não foi possível conectar ao servidor.')
  }

  const dados = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    if (resposta.status === 401 && token) window.dispatchEvent(new Event('sessao-expirada'))
    const erro = new Error(dados?.erro ?? `Erro ${resposta.status}`)
    erro.campos = dados?.campos ?? {}   // mensagens por campo (ex.: { cpf: 'Já existe...' })
    throw erro
  }
  return dados
}
