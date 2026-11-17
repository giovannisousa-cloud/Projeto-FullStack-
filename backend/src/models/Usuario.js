// Único lugar que conversa com a tabela "usuarios".
// Consultas parametrizadas ($1, $2...): o valor nunca é colado dentro do texto do SQL.
import { pool } from '../config/db.js'

export const Usuario = {
  async criar({ nome, email, cpf, senhaHash }) {
    const { rows } = await pool.query(
      'insert into usuarios (nome, email, cpf, senha_hash) values ($1, $2, $3, $4) returning id, nome, email',
      [nome, email, cpf, senhaHash]
    )
    return rows[0]
  },

  async buscarPorEmail(email) {
    const { rows } = await pool.query('select * from usuarios where email = $1', [email])
    return rows[0]
  },

  async buscarPorId(id) {
    const { rows } = await pool.query('select id, nome, email from usuarios where id = $1', [id])
    return rows[0]
  }
}
