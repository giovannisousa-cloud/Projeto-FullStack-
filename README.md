# Controle Financeiro — Projeto 2 (Full Stack)

Aplicação de controle financeiro pessoal: cadastro/login, categorias, fontes/destinos,
lançamentos (com compras parceladas no cartão), relatórios e previsão de faturas.

## Tecnologias

| Parte    | Tecnologias |
|----------|-------------|
| Back-end | Node.js, Express 5, PostgreSQL (Supabase) com `pg`, `bcrypt`, `jsonwebtoken`, `cors`, `express-rate-limit`, `dotenv` |
| Front-end| React 18 + Vite, React Router, Bootstrap 5, Recharts (gráficos) |

## Como rodar

### 1. Banco de dados
```bash
cd backend
npm install
cp .env.example .env      # preencha DATABASE_URL (Supabase > Database > Session pooler) e JWT_SECRET
npm run banco             # cria as tabelas (database/schema.sql) e carrega os dados de exemplo
```
> `npm run banco` **apaga** os dados existentes e recria tudo.

Usuários de exemplo (senha `senha1234`): `ana@teste.com` e `bruno@teste.com`.
Cada um tem 3 meses de lançamentos e uma compra parcelada (notebook em 10x).

### 2. Back-end (porta 3000)
```bash
cd backend
npm run dev
```

### 3. Front-end (porta 5173)
```bash
cd frontend
npm install
cp .env.example .env      # VITE_API_URL=http://localhost:3000/api
npm run dev
```

## Estrutura

```
backend/
  database/        schema.sql (tabelas) e criar.js (cria + seed)
  src/
    server.js      cria o app Express e registra as rotas
    routes/        rotas + controladores (auth, categorias, fontes-destinos, lancamentos, relatorios)
    models/        acesso ao banco (Usuario, Categoria, FonteDestino, Lancamento, Relatorio)
                   e regras puras: validacoes.js (CPF, e-mail, senha), datas.js, faturas.js
    middlewares/   autenticar.js (JWT), validar.js (valida o corpo das requisições), erros.js (erros centralizados)
    config/        db.js (pool de conexões)
frontend/
  src/
    components/    telas e componentes (Bootstrap)
    contexts/      AuthContext (usuário, token, login, logout, cadastrar)
    services/      api.js (único cliente HTTP, envia o token e trata 401) e useApi.js (hook)
```

## Onde está cada requisito

| Requisito | Back-end (`backend/src`) | Front-end (`frontend/src`) |
|---|---|---|
| RF1 Cadastro (CPF, e-mail e senha válidos, `409` se repetido) | `routes/auth.routes.js`, `middlewares/validar.js`, `models/validacoes.js` | `components/Cadastro.jsx` |
| RF2 Login, JWT e logout | `routes/auth.routes.js`, `middlewares/autenticar.js` | `contexts/AuthContext.jsx`, `services/api.js`, `components/Login.jsx` |
| RF3 Cada usuário só vê os próprios dados | todas as consultas em `models/` filtram por `usuario_id` | — |
| RF4 Categorias | `routes/categorias.routes.js`, `models/Categoria.js` | `components/Categorias.jsx` |
| RF5 Fontes/destinos | `routes/fontesDestinos.routes.js`, `models/FonteDestino.js` | `components/FontesDestinos.jsx` |
| RF6 Lançamentos, filtros, paginação e parcelas | `routes/lancamentos.routes.js`, `models/Lancamento.js` | `components/Lancamentos.jsx`, `components/LancamentoForm.jsx` |
| RF7 Relatório por categoria | `routes/relatorios.routes.js`, `models/Relatorio.js`, `models/datas.js` | `components/Relatorios.jsx`, `components/Grafico.jsx` |
| RF8 Relatório por fonte/destino | `routes/relatorios.routes.js`, `models/Relatorio.js` | `components/Relatorios.jsx` |
| RF9 Previsão de faturas | `routes/relatorios.routes.js`, `models/faturas.js` | `components/Faturas.jsx` |

## Roteiro de teste (apresentação)

1. `npm run banco`, depois `npm run dev` no `backend` e no `frontend`.
2. Cadastro: tente um e-mail já usado em maiúsculas (`ANA@teste.com`) e o CPF `529.982.247-25` → a mensagem aparece no campo.
3. Entre como `ana@teste.com`. No Postman, faça `GET /api/lancamentos/:id` de um lançamento da Ana com o token do Bruno → `404`; sem token → `401`.
4. Lançamentos: crie uma saída de R$ 100,00 em 3x no "Cartão Nubank" → parcelas de 33,34 + 33,33 + 33,33.
5. Relatórios e Faturas: veja onde caiu cada parcela (o notebook 10x do seed aparece em "Notebook 2/10", "3/10"...).

## Rotas da API

Todas, exceto cadastro e login, exigem `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/cadastro` | Cadastra usuário (201, 400, 409) |
| POST | `/api/auth/login` | Login, devolve o JWT (200, 400, 401) |
| GET | `/api/auth/me` | Usuário logado |
| GET, POST | `/api/categorias` | Lista / cria |
| PUT, DELETE | `/api/categorias/:id` | Edita / exclui (409 se tiver lançamentos) |
| GET, POST | `/api/fontes-destinos` | Lista / cria (cartão exige fechamento, vencimento e limite) |
| PUT, DELETE | `/api/fontes-destinos/:id` | Edita / exclui |
| GET | `/api/lancamentos?inicio=&fim=&tipo=&categoriaId=&fonteDestinoId=&pagina=` | Lista com filtros, paginação e totais |
| POST | `/api/lancamentos` | Cria (com `parcelas` > 1 gera uma linha por parcela, em transação) |
| GET, PUT, DELETE | `/api/lancamentos/:id` | Detalha / edita / exclui (`?todasParcelas=true`) |
| GET | `/api/relatorios/categorias?inicio=&fim=` | RF7: por categoria + comparação com o período anterior |
| GET | `/api/relatorios/fontes-destinos?inicio=&fim=` | RF8: por fonte/destino |
| GET | `/api/relatorios/faturas?meses=3` | RF9: fatura aberta + próximas, limite usado/disponível |

Formato padrão de erro: `{ "erro": "mensagem", "campos": { "campo": "mensagem" } }`.

## Decisões do grupo

- **Unicidade de e-mail e CPF**: garantida por `UNIQUE` no banco. E-mail gravado em minúsculas e CPF só com dígitos.
- **Isolamento entre usuários**: o id do usuário vem sempre do token, e toda consulta filtra por `usuario_id`. Registro de outro usuário → `404`.
- **Exclusão protegida**: `categoria_id` e `fonte_destino_id` não têm `on delete cascade`, então o próprio banco recusa excluir o que tem lançamentos (erro `23503` → `409`).
- **Tipo fixo**: o tipo de uma categoria ou fonte/destino não muda depois de criado, para não deixar lançamentos antigos inconsistentes.
- **Parcelas**: todas as parcelas guardam a **data da compra**. A fatura de cada uma é calculada por `calcularFatura(data, cartao, parcela_atual)` em `models/faturas.js`. Os centavos que sobram da divisão vão para a 1ª parcela.
- **Limite utilizado**: soma das parcelas cuja fatura ainda não venceu.
- **Dinheiro**: `NUMERIC(12,2)` no banco.
- **Segurança**: senha com bcrypt, JWT de 1h, `.env` fora do Git, consultas parametrizadas, CORS restrito ao front-end, limite de 10 tentativas de login por minuto, RLS ligado nas tabelas do Supabase (só a API acessa).

## Ferramentas de apoio

Desenvolvido com apoio de assistente de IA (Claude Code), revisado e explicado pelos integrantes.
