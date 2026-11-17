// Conexão com o Postgres (Supabase). O "pool" reaproveita conexões entre as requisições.
import 'dotenv/config'
import pg from 'pg'

// Por padrão o pg devolve NUMERIC como texto ("10.50") e DATE como objeto Date (com fuso horário).
// Aqui pedimos: NUMERIC -> número e DATE -> texto 'AAAA-MM-DD'.
pg.types.setTypeParser(1700, Number)
pg.types.setTypeParser(1082, (texto) => texto)

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 5
})
