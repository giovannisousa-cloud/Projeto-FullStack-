// Funções de formatação usadas em várias telas.

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const dinheiro = (valor) => moeda.format(valor ?? 0)

// 57.25 -> '57,3%'
export const porcento = (valor) => `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`

// '2026-11-17' -> '17/11/2026'
export const dataBR = (texto) => texto?.split('-').reverse().join('/')

// Primeiro e último dia do mês atual, no formato 'AAAA-MM-DD' (usado nos filtros de período).
export function mesAtual() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const ultimoDia = new Date(ano, hoje.getMonth() + 1, 0).getDate()
  return { inicio: `${ano}-${mes}-01`, fim: `${ano}-${mes}-${ultimoDia}` }
}

export const nomeTipoFonte = { renda: 'Renda', conta: 'Conta', cartao_credito: 'Cartão de crédito' }
