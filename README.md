# Orbe — Controle Financeiro

Frontend React (Vite) com autenticação e banco no Supabase.

## Rodar

```bash
npm install
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

## Banco de dados

As tabelas ficam em `migrations/`. Para aplicar:

```bash
cp mcp-supabase/.env.example mcp-supabase/.env   # preencha SUPABASE_DB_URL
npm run migrate
```

## Estrutura

```
src/
  main.jsx         entrada do React
  App.jsx          telas e rotas
  AuthContext.jsx  login/cadastro (Supabase Auth)
  supabase.js      cliente Supabase
  styles.css
migrations/        SQL do banco
scripts/migrate.js aplica as migrations
mcp-supabase/      servidor MCP (opcional, para criar tabelas via Claude)
```
