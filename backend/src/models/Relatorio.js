// Consultas dos relatórios. Os totais são somados pelo banco (GROUP BY + SUM).
import { pool } from '../config/db.js'

export const Relatorio = {
  // Total por categoria (entradas e saídas) no período.
  async porCategoria(usuarioId, inicio, fim) {
    const { rows } = await pool.query(
      `select c.id, c.nome, c.tipo, sum(l.valor) as total
         from lancamentos l
         join categorias c on c.id = l.categoria_id
        where l.usuario_id = $1 and l.data between $2 and $3
        group by c.id, c.nome, c.tipo
        order by total desc`,
      [usuarioId, inicio, fim])
    return rows
  },

  // Entradas e saídas de cada fonte/destino no período.
  async porFonteDestino(usuarioId, inicio, fim) {
    const { rows } = await pool.query(
      `select f.id, f.nome, f.tipo,
              coalesce(sum(case when l.tipo = 'entrada' then l.valor end), 0) as entradas,
              coalesce(sum(case when l.tipo = 'saida'   then l.valor end), 0) as saidas
         from fontes_destinos f
         join lancamentos l on l.fonte_destino_id = f.id
        where f.usuario_id = $1 and l.data between $2 and $3
        group by f.id, f.nome, f.tipo
        order by f.nome`,
      [usuarioId, inicio, fim])
    return rows
  }
}
