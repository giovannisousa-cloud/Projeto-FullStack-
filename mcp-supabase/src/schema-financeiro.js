// Estrutura do controle financeiro: reaproveita a migration 001 (fonte única do SQL).
import { readFileSync } from 'node:fs'

export const SCHEMA_FINANCEIRO_SQL = readFileSync(
  new URL('../../migrations/001_criar_tabelas_categorias_contas_lancamentos.sql', import.meta.url),
  'utf8'
)
