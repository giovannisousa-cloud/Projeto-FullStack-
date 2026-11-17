import { Router } from 'express'
import { Categoria } from '../models/Categoria.js'
import { autenticar } from '../middlewares/autenticar.js'
import { validarCategoria } from '../middlewares/validar.js'

const router = Router()
router.use(autenticar)   // todas as rotas daqui exigem token

// GET /api/categorias
router.get('/', async (req, res) => {
  res.json(await Categoria.listar(req.usuarioId))
})

// POST /api/categorias   (nome repetido -> 409, tratado no middleware de erros)
router.post('/', validarCategoria, async (req, res) => {
  res.status(201).json(await Categoria.criar(req.usuarioId, req.body))
})

// PUT /api/categorias/:id
router.put('/:id', validarCategoria, async (req, res) => {
  const categoria = await Categoria.atualizar(req.usuarioId, req.params.id, req.body)
  if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada.' })
  res.json(categoria)
})

// DELETE /api/categorias/:id   (com lançamentos -> 409, tratado no middleware de erros)
router.delete('/:id', async (req, res) => {
  const apagados = await Categoria.remover(req.usuarioId, req.params.id)
  if (!apagados) return res.status(404).json({ erro: 'Categoria não encontrada.' })
  res.status(204).end()
})

export default router
