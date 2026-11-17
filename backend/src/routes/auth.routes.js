import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { Usuario } from '../models/Usuario.js'
import { Categoria } from '../models/Categoria.js'
import { FonteDestino } from '../models/FonteDestino.js'
import { validarCadastro } from '../middlewares/validar.js'
import { autenticar } from '../middlewares/autenticar.js'

const router = Router()

// No máximo 10 tentativas de login por minuto por IP (freia tentativas de adivinhar senha).
const limiteLogin = rateLimit({ windowMs: 60_000, limit: 10, message: { erro: 'Muitas tentativas. Aguarde um minuto.' } })

const gerarToken = (usuario) => jwt.sign({}, process.env.JWT_SECRET, { subject: String(usuario.id), expiresIn: '1h' })

// POST /api/auth/cadastro
router.post('/cadastro', validarCadastro, async (req, res) => {
  const { nome, email, cpf, senha } = req.body   // já validados e normalizados por validarCadastro
  try {
    const senhaHash = await bcrypt.hash(senha, 10)   // hash + salt: a senha nunca é gravada
    const usuario = await Usuario.criar({ nome, email, cpf, senhaHash })
    // Todo usuário novo já começa com categorias e fontes/destinos padrão.
    await Categoria.criarPadrao(usuario.id)
    await FonteDestino.criarPadrao(usuario.id)
    res.status(201).json({ token: gerarToken(usuario), usuario })
  } catch (erro) {
    // 23505 = violação de UNIQUE no Postgres: quem garante a unicidade é o banco.
    if (erro.code === '23505') {
      const campo = erro.constraint?.includes('cpf') ? 'cpf' : 'email'
      return res.status(409).json({
        erro: 'Usuário já cadastrado.',
        campos: { [campo]: `Já existe um usuário com este ${campo === 'cpf' ? 'CPF' : 'e-mail'}.` }
      })
    }
    throw erro   // outros erros vão para o middleware de erros
  }
})

// POST /api/auth/login
router.post('/login', limiteLogin, async (req, res) => {
  const { email, senha } = req.body ?? {}
  if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' })

  const usuario = await Usuario.buscarPorEmail(String(email).trim().toLowerCase())
  const senhaCerta = usuario && await bcrypt.compare(String(senha), usuario.senha_hash)
  // Mensagem genérica: não revela se o e-mail existe.
  if (!senhaCerta) return res.status(401).json({ erro: 'E-mail ou senha inválidos.' })

  res.json({ token: gerarToken(usuario), usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } })
})

// GET /api/auth/me  (rota protegida: devolve o usuário dono do token)
router.get('/me', autenticar, async (req, res) => {
  const usuario = await Usuario.buscarPorId(req.usuarioId)
  if (!usuario) return res.status(401).json({ erro: 'Usuário não existe mais.' })
  res.json(usuario)
})

export default router
