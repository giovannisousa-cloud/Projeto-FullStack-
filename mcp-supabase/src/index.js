#!/usr/bin/env node
// Servidor MCP (stdio) para CRIAR coisas no Supabase do controle financeiro:
// estrutura do app, tabelas, índices, registros e SQL de criação.
// Não expõe ferramentas de leitura, alteração ou exclusão de dados.

import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import * as z from 'zod'
import { getPool, withTransaction, ident, sqlType, sqlExpr } from './db.js'
import { SCHEMA_FINANCEIRO_SQL } from './schema-financeiro.js'

const envFile = join(dirname(fileURLToPath(import.meta.url)), '..', '.env')
if (existsSync(envFile)) process.loadEnvFile(envFile)

const ok = (text) => ({ content: [{ type: 'text', text }] })
const fail = (err) => ({ content: [{ type: 'text', text: `Erro: ${err.message}` }], isError: true })
const run = (fn) => async (args) => {
  try { return ok(await fn(args)) } catch (err) { return fail(err) }
}

const server = new McpServer({ name: 'supabase-financeiro', version: '1.0.0' })

// 1) Estrutura completa do app -------------------------------------------------
server.registerTool(
  'criar_estrutura_financeira',
  {
    title: 'Criar estrutura do controle financeiro',
    description:
      'Cria (se não existirem) as tabelas categorias, contas e lancamentos do app, com chaves estrangeiras, ' +
      'índices, RLS habilitado e políticas por usuário (auth.uid() = user_id). Idempotente.',
    inputSchema: {}
  },
  run(async () => {
    await withTransaction((c) => c.query(SCHEMA_FINANCEIRO_SQL))
    return 'Estrutura criada/confirmada: public.categorias, public.contas, public.lancamentos (RLS + políticas por usuário).'
  })
)

// 2) Tabela genérica -----------------------------------------------------------
const coluna = z.object({
  nome: z.string().describe('Nome da coluna em snake_case'),
  tipo: z.string().describe('Tipo Postgres, ex.: text, uuid, numeric(14,2), timestamptz, bigint, boolean, jsonb'),
  obrigatoria: z.boolean().optional().describe('NOT NULL'),
  unica: z.boolean().optional().describe('UNIQUE'),
  padrao: z.string().optional().describe('Expressão DEFAULT, ex.: now(), auth.uid(), 0'),
  referencia: z
    .object({
      tabela: z.string(),
      coluna: z.string().default('id'),
      schema: z.string().default('public'),
      ao_excluir: z.enum(['cascade', 'set null', 'restrict', 'no action']).default('no action')
    })
    .optional()
    .describe('Chave estrangeira')
})

server.registerTool(
  'criar_tabela',
  {
    title: 'Criar tabela',
    description:
      'Cria uma tabela com chave primária "id bigint identity" automática e created_at. ' +
      'Habilita RLS por padrão. Se com_user_id=true, adiciona user_id (auth.users) e política de dono.',
    inputSchema: {
      tabela: z.string().describe('Nome da tabela em snake_case'),
      schema: z.string().default('public'),
      colunas: z.array(coluna).min(1),
      com_user_id: z.boolean().default(true).describe('Adiciona user_id + política RLS por usuário'),
      habilitar_rls: z.boolean().default(true)
    }
  },
  run(async ({ tabela, schema, colunas, com_user_id, habilitar_rls }) => {
    const full = `${ident(schema)}.${ident(tabela)}`
    const defs = ['"id" bigint generated always as identity primary key']
    if (com_user_id) defs.push('"user_id" uuid not null default auth.uid() references auth.users (id) on delete cascade')

    for (const col of colunas) {
      let d = `${ident(col.nome)} ${sqlType(col.tipo)}`
      if (col.obrigatoria) d += ' not null'
      if (col.unica) d += ' unique'
      if (col.padrao !== undefined) d += ` default ${sqlExpr(col.padrao)}`
      if (col.referencia) {
        const r = col.referencia
        d += ` references ${ident(r.schema)}.${ident(r.tabela)} (${ident(r.coluna)}) on delete ${r.ao_excluir}`
      }
      defs.push(d)
    }
    defs.push('"created_at" timestamptz not null default now()')

    const stmts = [`create table ${full} (\n  ${defs.join(',\n  ')}\n)`]
    // Índices nas FKs (Postgres não cria automaticamente)
    if (com_user_id) stmts.push(`create index on ${full} ("user_id")`)
    for (const col of colunas) if (col.referencia) stmts.push(`create index on ${full} (${ident(col.nome)})`)
    if (habilitar_rls || com_user_id) stmts.push(`alter table ${full} enable row level security`)
    if (com_user_id) {
      stmts.push(
        `create policy ${ident(`${tabela}_dono`)} on ${full} for all to authenticated ` +
          `using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)`
      )
    }

    await withTransaction(async (c) => { for (const s of stmts) await c.query(s) })
    return `Tabela ${schema}.${tabela} criada.\n\nSQL executado:\n${stmts.join(';\n')};`
  })
)

// 3) Índice --------------------------------------------------------------------
server.registerTool(
  'criar_indice',
  {
    title: 'Criar índice',
    description: 'Cria um índice (btree, gin, etc.) em uma ou mais colunas. Usa IF NOT EXISTS.',
    inputSchema: {
      tabela: z.string(),
      schema: z.string().default('public'),
      colunas: z.array(z.string()).min(1),
      unico: z.boolean().default(false),
      metodo: z.enum(['btree', 'gin', 'gist', 'brin', 'hash']).default('btree'),
      nome: z.string().optional()
    }
  },
  run(async ({ tabela, schema, colunas, unico, metodo, nome }) => {
    const idxName = nome ?? `${tabela}_${colunas.join('_')}_idx`.slice(0, 63)
    const sql =
      `create ${unico ? 'unique ' : ''}index if not exists ${ident(idxName)} on ${ident(schema)}.${ident(tabela)} ` +
      `using ${metodo} (${colunas.map(ident).join(', ')})`
    await getPool().query(sql)
    return `Índice criado: ${sql}`
  })
)

// 4) Registros -----------------------------------------------------------------
server.registerTool(
  'inserir_registros',
  {
    title: 'Inserir registros',
    description:
      'Insere um ou mais registros numa tabela (consulta parametrizada, tudo em uma transação). ' +
      'Atenção: a conexão é administrativa e ignora RLS, então auth.uid() é nulo — informe user_id ' +
      'explicitamente nas tabelas que o exigem (ex.: categorias, contas, lancamentos).',
    inputSchema: {
      tabela: z.string(),
      schema: z.string().default('public'),
      registros: z.array(z.record(z.string(), z.any())).min(1).max(1000)
    }
  },
  run(async ({ tabela, schema, registros }) => {
    const full = `${ident(schema)}.${ident(tabela)}`
    const inseridos = await withTransaction(async (c) => {
      const out = []
      for (const reg of registros) {
        const cols = Object.keys(reg)
        if (!cols.length) throw new Error('Registro vazio')
        const vals = cols.map((k) => (reg[k] !== null && typeof reg[k] === 'object' ? JSON.stringify(reg[k]) : reg[k]))
        const sql =
          `insert into ${full} (${cols.map(ident).join(', ')}) ` +
          `values (${cols.map((_, i) => `$${i + 1}`).join(', ')}) returning *`
        const { rows } = await c.query(sql, vals)
        out.push(rows[0])
      }
      return out
    })
    return `${inseridos.length} registro(s) inserido(s) em ${schema}.${tabela}:\n${JSON.stringify(inseridos, null, 2)}`
  })
)

// 5) SQL de criação livre ------------------------------------------------------
const BLOQUEADOS = /\b(drop|truncate|delete|update|grant\s+all|revoke|alter\s+\w+\s+\S+\s+drop|rename)\b/i

server.registerTool(
  'executar_sql_criacao',
  {
    title: 'Executar SQL de criação',
    description:
      'Executa SQL de criação (CREATE TABLE/FUNCTION/TRIGGER/POLICY/VIEW/TYPE, ALTER TABLE ... ADD, INSERT) ' +
      'em uma transação. Recusa comandos destrutivos (DROP, TRUNCATE, DELETE, UPDATE, RENAME, REVOKE).',
    inputSchema: {
      sql: z.string().min(1).describe('Um ou mais comandos SQL de criação')
    }
  },
  run(async ({ sql }) => {
    // Remove strings e comentários antes de procurar palavras proibidas
    const semLiterais = sql
      .replace(/'(?:[^']|'')*'/g, "''")
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
    const m = semLiterais.match(BLOQUEADOS)
    if (m) throw new Error(`Comando não permitido neste MCP (somente criação): "${m[0]}"`)
    await withTransaction((c) => c.query(sql))
    return 'SQL executado com sucesso.'
  })
)

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('MCP supabase-financeiro pronto (stdio).')
