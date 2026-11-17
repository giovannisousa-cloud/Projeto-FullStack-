import { Router } from 'express'
import { Relatorio } from '../models/Relatorio.js'
import { FonteDestino } from '../models/FonteDestino.js'
import { Lancamento } from '../models/Lancamento.js'
import { dataValida, hoje, mesAtual, periodoAnterior } from '../models/datas.js'
import { montarFaturas } from '../models/faturas.js'
import { autenticar } from '../middlewares/autenticar.js'

const router = Router()
router.use(autenticar)

const arredondar = (v) => Math.round(v * 100) / 100

// Lê ?inicio=&fim= (padrão: mês atual). Devolve null se as datas forem inválidas.
function lerPeriodo(query) {
  const { inicio = mesAtual().inicio, fim = mesAtual().fim } = query
  if (!dataValida(inicio) || !dataValida(fim) || inicio > fim) return null
  return { inicio, fim }
}

// GET /api/relatorios/categorias?inicio=&fim=   (RF7)
router.get('/categorias', async (req, res) => {
  const periodo = lerPeriodo(req.query)
  if (!periodo) return res.status(400).json({ erro: 'Período inválido.' })
  const anterior = periodoAnterior(periodo.inicio, periodo.fim)

  const atual = await Relatorio.porCategoria(req.usuarioId, periodo.inicio, periodo.fim)
  const antes = await Relatorio.porCategoria(req.usuarioId, anterior.inicio, anterior.fim)

  // Para um tipo (saída ou entrada): o total e cada categoria com % e o valor do período anterior.
  function resumo(tipo) {
    const linhas = atual.filter((c) => c.tipo === tipo)
    const total = linhas.reduce((soma, c) => soma + c.total, 0)
    const categorias = linhas.map((c) => ({
      id: c.id,
      nome: c.nome,
      total: c.total,
      percentual: arredondar((c.total / total) * 100),
      periodoAnterior: antes.find((a) => a.id === c.id)?.total ?? 0
    }))
    return { total: arredondar(total), categorias }
  }

  res.json({ periodo, periodoAnterior: anterior, saidas: resumo('saida'), entradas: resumo('entrada') })
})

// GET /api/relatorios/fontes-destinos?inicio=&fim=   (RF8)
router.get('/fontes-destinos', async (req, res) => {
  const periodo = lerPeriodo(req.query)
  if (!periodo) return res.status(400).json({ erro: 'Período inválido.' })
  const linhas = await Relatorio.porFonteDestino(req.usuarioId, periodo.inicio, periodo.fim)
  // Saldo = entradas - saídas (o enunciado pede o saldo para as do tipo "conta").
  res.json({
    periodo,
    fontesDestinos: linhas.map((f) => ({ ...f, saldo: f.tipo === 'conta' ? arredondar(f.entradas - f.saidas) : null }))
  })
})

// GET /api/relatorios/faturas?meses=3   (RF9: fatura aberta + próximas N, de cada cartão)
router.get('/faturas', async (req, res) => {
  const meses = Math.min(Number(req.query.meses) || 3, 12)
  const fontes = await FonteDestino.listar(req.usuarioId)
  const cartoes = fontes.filter((f) => f.tipo === 'cartao_credito')
  const resultado = []
  for (const cartao of cartoes) {
    const lancamentos = await Lancamento.saidasDoCartao(req.usuarioId, cartao.id)
    resultado.push(montarFaturas(cartao, lancamentos, meses, hoje()))
  }
  res.json(resultado)
})

export default router
