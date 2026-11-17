// Acesso à tabela "categorias". Toda consulta filtra por usuario_id (cada um só vê o que é seu).
import { pool } from '../config/db.js'

const PADRAO = [
  ['Salário', 'entrada'], ['Outras entradas', 'entrada'],
  ['Alimentação', 'saida'], ['Moradia', 'saida'], ['Saúde', 'saida'],
  ['Mobilidade', 'saida'], ['Lazer', 'saida'], ['Educação', 'saida'], ['Outros', 'saida']
]

export const Categoria = {
  async listar(usuarioId) {
    const { rows } = await pool.query(
      'select id, nome, tipo from categorias where usuario_id = $1 order by tipo, nome', [usuarioId])
    return rows
  },

  async buscar(usuarioId, id) {
    const { rows } = await pool.query(
      'select id, nome, tipo from categorias where id = $1 and usuario_id = $2', [id, usuarioId])
    return rows[0]
  },

  async criar(usuarioId, { nome, tipo }) {
    const { rows } = await pool.query(
      'insert into categorias (usuario_id, nome, tipo) values ($1, $2, $3) returning id, nome, tipo',
      [usuarioId, nome, tipo])
    return rows[0]
  },

  // Só o nome pode ser editado: mudar o tipo deixaria lançamentos antigos inconsistentes.
  async atualizar(usuarioId, id, { nome }) {
    const { rows } = await pool.query(
      'update categorias set nome = $1 where id = $2 and usuario_id = $3 returning id, nome, tipo',
      [nome, id, usuarioId])
    return rows[0]
  },

  // Devolve quantas linhas apagou (0 = não existe para este usuário).
  // Se houver lançamentos usando a categoria, o banco recusa (erro 23503).
  async remover(usuarioId, id) {
    const { rowCount } = await pool.query(
      'delete from categorias where id = $1 and usuario_id = $2', [id, usuarioId])
    return rowCount
  },

  async criarPadrao(usuarioId) {
    for (const [nome, tipo] of PADRAO) await Categoria.criar(usuarioId, { nome, tipo })
  }
}
