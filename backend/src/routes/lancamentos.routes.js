import { Router } from 'express'
import { Lancamento } from '../models/Lancamento.js'
import { Categoria } from '../models/Categoria.js'
import { FonteDestino } from '../models/FonteDestino.js'
import { dataValida, mesAtual } from '../models/datas.js'
import { autenticar } from '../middlewares/autenticar.js'
import { validarLancamento } from '../middlewares/validar.js'

const router = Router()
router.use(autenticar)

// Regras que dependem do banco: a categoria e a fonte/destino precisam ser DESTE usuário,
// e o tipo da categoria precisa ser igual ao tipo do lançamento.
async function verificarRegras(usuarioId, l, parcelas) {
  const campos = {}
  const categoria = await Categoria.buscar(usuarioId, l.categoriaId)
  const fonte = await FonteDestino.buscar(usuarioId, l.fonteDestinoId)

  const nome = (tipo) => (tipo === 'saida' ? 'saída' : 'entrada')
  if (!categoria) campos.categoriaId = 'Categoria não encontrada.'
  else if (categoria.tipo !== l.tipo) {
    campos.categoriaId = `A categoria é de ${nome(categoria.tipo)}, mas o lançamento é de ${nome(l.tipo)}.`
  }
  if (!fonte) campos.fonteDestinoId = 'Fonte/destino não encontrado.'
  if (parcelas > 1 && (fonte?.tipo !== 'cartao_credito' || l.tipo !== 'saida')) {
    campos.parcelas = 'Só é possível parcelar saídas no cartão de crédito.'
  }
  return campos
}

// GET /api/lancamentos?inicio=&fim=&tipo=&categoriaId=&fonteDestinoId=&pagina=
// Sem datas -> mês atual. Filtro vazio -> não filtra.
router.get('/', async (req, res) => {
  const { inicio = mesAtual().inicio, fim = mesAtual().fim, tipo, categoriaId, fonteDestinoId } = req.query
  const pagina = Number(req.query.pagina ?? 1)
  if (!dataValida(inicio) || !dataValida(fim) || !(Number.isInteger(pagina) && pagina >= 1)) {
    return res.status(400).json({ erro: 'Filtros inválidos.' })
  }
  const filtros = {
    inicio,
    fim,
    tipo: tipo || null,
    categoriaId: categoriaId || null,
    fonteDestinoId: fonteDestinoId || null
  }
  res.json(await Lancamento.listar(req.usuarioId, filtros, pagina))
})

// GET /api/lancamentos/:id   (de outro usuário -> 404)
router.get('/:id', async (req, res) => {
  const lancamento = await Lancamento.buscar(req.usuarioId, req.params.id)
  if (!lancamento) return res.status(404).json({ erro: 'Lançamento não encontrado.' })
  res.json(lancamento)
})

// POST /api/lancamentos   (com "parcelas" > 1 cria uma linha por parcela)
router.post('/', validarLancamento, async (req, res) => {
  const campos = await verificarRegras(req.usuarioId, req.body, req.body.parcelas)
  if (Object.keys(campos).length) return res.status(400).json({ erro: 'Dados inválidos.', campos })
  res.status(201).json(await Lancamento.criar(req.usuarioId, req.body, req.body.parcelas))
})

// PUT /api/lancamentos/:id   (edita só esta linha/parcela)
router.put('/:id', validarLancamento, async (req, res) => {
  const campos = await verificarRegras(req.usuarioId, req.body, 1)
  if (Object.keys(campos).length) return res.status(400).json({ erro: 'Dados inválidos.', campos })
  const lancamento = await Lancamento.atualizar(req.usuarioId, req.params.id, req.body)
  if (!lancamento) return res.status(404).json({ erro: 'Lançamento não encontrado.' })
  res.json(lancamento)
})

// DELETE /api/lancamentos/:id?todasParcelas=true
router.delete('/:id', async (req, res) => {
  const apagados = await Lancamento.remover(req.usuarioId, req.params.id, req.query.todasParcelas === 'true')
  if (!apagados) return res.status(404).json({ erro: 'Lançamento não encontrado.' })
  res.status(204).end()
})

export default router
