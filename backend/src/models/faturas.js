// Regra de negócio das faturas de cartão de crédito (funções puras, sem banco).

function ultimoDiaDoMes(ano, mes) {              // mes: 0 a 11
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate()
}

function dataSegura(ano, mes, dia) {             // aceita mes > 11 e ajusta dia 31 em meses curtos
  const a = ano + Math.floor(mes / 12)
  const m = ((mes % 12) + 12) % 12
  return new Date(Date.UTC(a, m, Math.min(dia, ultimoDiaDoMes(a, m))))
}

// Em qual fatura cai uma compra (ou a parcela N dela).
// Compra ANTES do dia de fechamento -> fatura que fecha neste mês; no dia ou depois -> mês seguinte.
// A parcela N cai N-1 meses depois da 1ª.
export function calcularFatura(dataCompra, cartao, numeroParcela = 1) {
  const [ano, mes, dia] = dataCompra.split('-').map(Number)
  const m = mes - 1
  const fechamentoDoMes = Math.min(cartao.dia_fechamento, ultimoDiaDoMes(ano, m))

  let mesFechamento = dia < fechamentoDoMes ? m : m + 1
  mesFechamento += numeroParcela - 1

  const fechamento = dataSegura(ano, mesFechamento, cartao.dia_fechamento)
  // Vencimento depois do fechamento -> mesmo mês; senão -> mês seguinte.
  const mesVencimento = cartao.dia_vencimento > cartao.dia_fechamento ? mesFechamento : mesFechamento + 1
  const vencimento = dataSegura(ano, mesVencimento, cartao.dia_vencimento)

  const iso = (d) => d.toISOString().slice(0, 10)
  return { referencia: iso(vencimento).slice(0, 7), fechamento: iso(fechamento), vencimento: iso(vencimento) }
}

const arredondar = (v) => Math.round(v * 100) / 100

// Monta a fatura aberta + as próximas "meses" faturas de um cartão.
export function montarFaturas(cartao, lancamentos, meses, hoje) {
  // A fatura aberta é a fatura em que cairia uma compra feita hoje.
  // As próximas são calculadas como se fossem as parcelas 2, 3, 4... dessa compra.
  const faturas = []
  for (let i = 1; i <= meses + 1; i++) {
    faturas.push({ ...calcularFatura(hoje, cartao, i), lancamentos: [], total: 0 })
  }

  let limiteUtilizado = 0
  for (const l of lancamentos) {
    const f = calcularFatura(l.data, cartao, l.parcela_atual)
    if (f.vencimento >= hoje) limiteUtilizado += l.valor     // parcela ainda não venceu: ocupa o limite
    const fatura = faturas.find((x) => x.referencia === f.referencia)
    if (fatura) {
      fatura.lancamentos.push(l)
      fatura.total += l.valor
    }
  }

  faturas.forEach((f) => { f.total = arredondar(f.total) })
  return {
    id: cartao.id,
    nome: cartao.nome,
    limite: cartao.limite,
    limiteUtilizado: arredondar(limiteUtilizado),
    limiteDisponivel: arredondar(cartao.limite - limiteUtilizado),
    faturas
  }
}
