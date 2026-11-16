import pg from 'pg'

let pool

export function getPool() {
  if (pool) return pool
  const connectionString = process.env.SUPABASE_DB_URL
  if (!connectionString) {
    throw new Error(
      'SUPABASE_DB_URL não definida. Copie mcp-supabase/.env.example para mcp-supabase/.env e preencha a connection string do Supabase.'
    )
  }
  pool = new pg.Pool({
    connectionString,
    // O Supabase exige SSL; o certificado do pooler não está na cadeia padrão do Node.
    ssl: { rejectUnauthorized: false },
    max: 3,
    idleTimeoutMillis: 10_000
  })
  return pool
}

/** Executa uma função dentro de uma transação (BEGIN/COMMIT, ROLLBACK em erro). */
export async function withTransaction(fn) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

const IDENT = /^[a-z_][a-z0-9_]{0,62}$/

/** Valida e coloca aspas num identificador (tabela, coluna, schema). */
export function ident(name) {
  if (!IDENT.test(name)) {
    throw new Error(`Identificador inválido: "${name}". Use apenas letras minúsculas, números e _ (snake_case).`)
  }
  return `"${name}"`
}

const TYPE = /^[a-z][a-z0-9_ ]*(\(\s*\d+(\s*,\s*\d+)?\s*\))?(\[\])?$/

export function sqlType(type) {
  const t = type.trim().toLowerCase()
  if (!TYPE.test(t)) throw new Error(`Tipo de coluna inválido: "${type}"`)
  return t
}

/** Expressões livres (default, check). Bloqueia ; e comentários para impedir múltiplos comandos. */
export function sqlExpr(expr) {
  if (/;|--|\/\*/.test(expr)) throw new Error(`Expressão não permitida: "${expr}"`)
  return expr
}
