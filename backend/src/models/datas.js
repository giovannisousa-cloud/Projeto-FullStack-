// Funções puras de data. Todas trabalham com texto 'AAAA-MM-DD' e em UTC (sem fuso horário).

export const hoje = () => new Date().toISOString().slice(0, 10)

export function dataValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto ?? '')) return false
  const d = new Date(`${texto}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto   // rejeita 2026-02-30
}

// Soma (ou subtrai) dias de uma data.
export function somarDias(texto, dias) {
  const d = new Date(`${texto}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

// Primeiro e último dia do mês atual.
export function mesAtual() {
  const d = new Date()
  const inicio = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  const fim = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) }
}

// Período anterior para comparação.
// Mês inteiro (01/10 a 31/10) -> mês anterior inteiro (01/09 a 30/09).
// Qualquer outro período -> mesmo número de dias, logo antes do início.
export function periodoAnterior(inicio, fim) {
  const ehMesInteiro = inicio.endsWith('-01') && somarDias(fim, 1).endsWith('-01') && inicio.slice(0, 7) === fim.slice(0, 7)
  if (ehMesInteiro) {
    const fimAnterior = somarDias(inicio, -1)
    return { inicio: `${fimAnterior.slice(0, 7)}-01`, fim: fimAnterior }
  }
  const dias = (new Date(fim) - new Date(inicio)) / 86_400_000 + 1
  return { inicio: somarDias(inicio, -dias), fim: somarDias(inicio, -1) }
}
