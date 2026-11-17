// Protege rotas: exige "Authorization: Bearer <token>" e guarda o id do usuário em req.usuarioId.
import jwt from 'jsonwebtoken'

export function autenticar(req, res, next) {
  const [esquema, token] = (req.headers.authorization ?? '').split(' ')
  if (esquema !== 'Bearer' || !token) return res.status(401).json({ erro: 'Token não informado.' })
  try {
    req.usuarioId = jwt.verify(token, process.env.JWT_SECRET).sub
    next()
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado.' })
  }
}
