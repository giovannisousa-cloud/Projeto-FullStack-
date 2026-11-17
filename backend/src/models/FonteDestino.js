// Acesso à tabela "fontes_destinos" (salário, conta corrente, cartões...).
import { pool } from '../config/db.js'

const CAMPOS = 'id, nome, tipo, dia_fechamento, dia_vencimento, limite'

export const FonteDestino = {
  async listar(usuarioId) {
    const { rows } = await pool.query(
      `select ${CAMPOS} from fontes_destinos where usuario_id = $1 order by nome`, [usuarioId])
    return rows
  },

  async buscar(usuarioId, id) {
    const { rows } = await pool.query(
      `select ${CAMPOS} from fontes_destinos where id = $1 and usuario_id = $2`, [id, usuarioId])
    return rows[0]
  },

  async criar(usuarioId, f) {
    const { rows } = await pool.query(
      `insert into fontes_destinos (usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite)
       values ($1, $2, $3, $4, $5, $6) returning ${CAMPOS}`,
      [usuarioId, f.nome, f.tipo, f.diaFechamento, f.diaVencimento, f.limite])
    return rows[0]
  },

  // O tipo não muda depois de criado (mesmo motivo da categoria).
  async atualizar(usuarioId, id, f) {
    const { rows } = await pool.query(
      `update fontes_destinos set nome = $1, dia_fechamento = $2, dia_vencimento = $3, limite = $4
       where id = $5 and usuario_id = $6 returning ${CAMPOS}`,
      [f.nome, f.diaFechamento, f.diaVencimento, f.limite, id, usuarioId])
    return rows[0]
  },

  async remover(usuarioId, id) {
    const { rowCount } = await pool.query(
      'delete from fontes_destinos where id = $1 and usuario_id = $2', [id, usuarioId])
    return rowCount
  },

  async criarPadrao(usuarioId) {
    await FonteDestino.criar(usuarioId, { nome: 'Salário', tipo: 'renda' })
    await FonteDestino.criar(usuarioId, { nome: 'Conta corrente', tipo: 'conta' })
  }
}
