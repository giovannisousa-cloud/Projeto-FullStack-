// Acesso à tabela "lancamentos".
import { randomUUID } from 'node:crypto'
import { pool } from '../config/db.js'

export const POR_PAGINA = 20

// Divide o valor em parcelas usando centavos (inteiros), para não perder nenhum centavo.
// A sobra do arredondamento vai para a 1ª parcela. Ex.: 100,00 em 3x -> 33,34 + 33,33 + 33,33
export function dividirParcelas(valor, parcelas) {
  const centavos = Math.round(valor * 100)
  const base = Math.floor(centavos / parcelas)
  const sobra = centavos - base * parcelas
  return Array.from({ length: parcelas }, (_, i) => (i === 0 ? base + sobra : base) / 100)
}

// Filtros da listagem. Um filtro null significa "não filtrar por este campo".
const FILTRO = `
  l.usuario_id = $1
  and l.data between $2 and $3
  and ($4::text is null or l.tipo = $4)
  and ($5::int  is null or l.categoria_id = $5)
  and ($6::int  is null or l.fonte_destino_id = $6)`

export const Lancamento = {
  async listar(usuarioId, { inicio, fim, tipo, categoriaId, fonteDestinoId }, pagina = 1) {
    const valores = [usuarioId, inicio, fim, tipo, categoriaId, fonteDestinoId]

    // Os lançamentos da página pedida (20 por página).
    const { rows: itens } = await pool.query(
      `select l.id, l.tipo, l.descricao, l.valor, l.data, l.parcela_atual, l.total_parcelas,
              l.categoria_id, c.nome as categoria, l.fonte_destino_id, f.nome as fonte_destino
         from lancamentos l
         join categorias c      on c.id = l.categoria_id
         join fontes_destinos f on f.id = l.fonte_destino_id
        where ${FILTRO}
        order by l.data desc, l.id desc
        limit $7 offset $8`,
      [...valores, POR_PAGINA, (pagina - 1) * POR_PAGINA])

    // Quantidade e totais de TODAS as páginas, calculados pelo banco.
    const { rows } = await pool.query(
      `select count(*)::int as quantidade,
              coalesce(sum(case when l.tipo = 'entrada' then l.valor end), 0) as entradas,
              coalesce(sum(case when l.tipo = 'saida'   then l.valor end), 0) as saidas
         from lancamentos l
        where ${FILTRO}`,
      valores)
    const { quantidade, entradas, saidas } = rows[0]

    return {
      itens,
      pagina,
      totalPaginas: Math.max(1, Math.ceil(quantidade / POR_PAGINA)),
      totais: { entradas, saidas, saldo: entradas - saidas }
    }
  },

  async buscar(usuarioId, id) {
    const { rows } = await pool.query(
      'select * from lancamentos where id = $1 and usuario_id = $2', [id, usuarioId])
    return rows[0]
  },

  // Cria 1 linha por parcela dentro de uma TRANSAÇÃO: ou grava todas, ou nenhuma.
  async criar(usuarioId, l, parcelas = 1) {
    const valores = dividirParcelas(l.valor, parcelas)
    const grupo = parcelas > 1 ? randomUUID() : null
    const cliente = await pool.connect()
    try {
      await cliente.query('begin')
      const criados = []
      for (let i = 0; i < parcelas; i++) {
        const { rows } = await cliente.query(
          `insert into lancamentos (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id,
                                    parcela_atual, total_parcelas, grupo_parcelamento)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning *`,
          [usuarioId, l.tipo, l.descricao, valores[i], l.data, l.categoriaId, l.fonteDestinoId,
            i + 1, parcelas, grupo])
        criados.push(rows[0])
      }
      await cliente.query('commit')
      return criados
    } catch (erro) {
      await cliente.query('rollback')
      throw erro
    } finally {
      cliente.release()
    }
  },

  async atualizar(usuarioId, id, l) {
    const { rows } = await pool.query(
      `update lancamentos set tipo = $1, descricao = $2, valor = $3, data = $4, categoria_id = $5, fonte_destino_id = $6
        where id = $7 and usuario_id = $8 returning *`,
      [l.tipo, l.descricao, l.valor, l.data, l.categoriaId, l.fonteDestinoId, id, usuarioId])
    return rows[0]
  },

  // todasParcelas = true apaga todas as parcelas da mesma compra.
  async remover(usuarioId, id, todasParcelas) {
    const lancamento = await Lancamento.buscar(usuarioId, id)
    if (!lancamento) return 0
    if (todasParcelas && lancamento.grupo_parcelamento) {
      const { rowCount } = await pool.query(
        'delete from lancamentos where grupo_parcelamento = $1 and usuario_id = $2',
        [lancamento.grupo_parcelamento, usuarioId])
      return rowCount
    }
    const { rowCount } = await pool.query(
      'delete from lancamentos where id = $1 and usuario_id = $2', [id, usuarioId])
    return rowCount
  },

  // Todas as saídas de um cartão (usado no cálculo das faturas).
  async saidasDoCartao(usuarioId, cartaoId) {
    const { rows } = await pool.query(
      `select id, descricao, valor, data, parcela_atual, total_parcelas
         from lancamentos
        where usuario_id = $1 and fonte_destino_id = $2 and tipo = 'saida'
        order by data, id`,
      [usuarioId, cartaoId])
    return rows
  }
}
