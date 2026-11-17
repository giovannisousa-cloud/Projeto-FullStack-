import { Router } from 'express'
import { FonteDestino } from '../models/FonteDestino.js'
import { autenticar } from '../middlewares/autenticar.js'
import { validarFonteDestino } from '../middlewares/validar.js'

const router = Router()
router.use(autenticar)

// GET /api/fontes-destinos
router.get('/', async (req, res) => {
  res.json(await FonteDestino.listar(req.usuarioId))
})

// POST /api/fontes-destinos
router.post('/', validarFonteDestino, async (req, res) => {
  res.status(201).json(await FonteDestino.criar(req.usuarioId, req.body))
})

// PUT /api/fontes-destinos/:id
router.put('/:id', validarFonteDestino, async (req, res) => {
  const fonte = await FonteDestino.atualizar(req.usuarioId, req.params.id, req.body)
  if (!fonte) return res.status(404).json({ erro: 'Fonte/destino não encontrado.' })
  res.json(fonte)
})

// DELETE /api/fontes-destinos/:id
router.delete('/:id', async (req, res) => {
  const apagados = await FonteDestino.remover(req.usuarioId, req.params.id)
  if (!apagados) return res.status(404).json({ erro: 'Fonte/destino não encontrado.' })
  res.status(204).end()
})

export default router
