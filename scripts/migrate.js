// Roda as migrations pendentes da pasta migrations/ no Postgres do Supabase.
// Uso: npm run migrate
// Arquivos: migrations/NNN_o_que_ela_faz.sql — executados em ordem numérica, cada um em uma transação.
// As já aplicadas ficam registradas em public.schema_migrations e não rodam de novo.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envFile = join(root, 'mcp-supabase', '.env')
if (!process.env.SUPABASE_DB_URL && existsSync(envFile)) process.loadEnvFile(envFile)

if (!process.env.SUPABASE_DB_URL) {
  console.error('SUPABASE_DB_URL não definida. Preencha mcp-supabase/.env (veja mcp-supabase/.env.example).')
  process.exit(1)
}

const dir = join(root, 'migrations')
const arquivos = readdirSync(dir).filter((f) => /^\d+_.+\.sql$/.test(f)).sort()

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
await client.connect()

try {
  await client.query(`
    create table if not exists public.schema_migrations (
      arquivo     text primary key,
      aplicada_em timestamptz not null default now()
    );
    alter table public.schema_migrations enable row level security;
  `)
  const { rows } = await client.query('select arquivo from public.schema_migrations')
  const aplicadas = new Set(rows.map((r) => r.arquivo))
  const pendentes = arquivos.filter((f) => !aplicadas.has(f))

  if (!pendentes.length) console.log('Nenhuma migration pendente.')

  for (const arquivo of pendentes) {
    process.stdout.write(`→ ${arquivo} ... `)
    try {
      await client.query('begin')
      await client.query(readFileSync(join(dir, arquivo), 'utf8'))
      await client.query('insert into public.schema_migrations (arquivo) values ($1)', [arquivo])
      await client.query('commit')
      console.log('ok')
    } catch (err) {
      await client.query('rollback')
      console.log('ERRO')
      throw err
    }
  }
} catch (err) {
  console.error(err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
