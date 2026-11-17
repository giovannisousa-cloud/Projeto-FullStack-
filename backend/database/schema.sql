-- Cria (ou recria) todas as tabelas do controle financeiro.
-- ATENÇÃO: apaga as tabelas antigas e todos os dados delas.

drop table if exists lancamentos, fontes_destinos, categorias, usuarios cascade;
drop table if exists contas, schema_migrations cascade;   -- tabelas da versão antiga do projeto

-- Usuários: email e cpf são UNIQUE -> é o BANCO que impede duplicados.
create table usuarios (
  id          serial primary key,
  nome        varchar(120) not null,
  email       varchar(160) not null,   -- gravado em minúsculas
  cpf         char(11)     not null,   -- gravado só com dígitos
  senha_hash  varchar(100) not null,
  criado_em   timestamp    not null default now(),
  constraint usuarios_email_unique unique (email),
  constraint usuarios_cpf_unique   unique (cpf)
);

-- Categorias: cada usuário tem as suas. Nome não se repete para o mesmo tipo.
create table categorias (
  id          serial primary key,
  usuario_id  integer     not null references usuarios(id) on delete cascade,
  nome        varchar(60) not null,
  tipo        varchar(7)  not null check (tipo in ('entrada', 'saida')),
  unique (usuario_id, nome, tipo)
);

-- Fontes/destinos: de onde o dinheiro vem ou para onde vai.
-- Cartão de crédito precisa de dia de fechamento, dia de vencimento e limite.
create table fontes_destinos (
  id              serial primary key,
  usuario_id      integer     not null references usuarios(id) on delete cascade,
  nome            varchar(60) not null,
  tipo            varchar(14) not null check (tipo in ('renda', 'conta', 'cartao_credito')),
  dia_fechamento  smallint check (dia_fechamento between 1 and 31),
  dia_vencimento  smallint check (dia_vencimento between 1 and 31),
  limite          numeric(12, 2),
  unique (usuario_id, nome),
  check (tipo <> 'cartao_credito'
         or (dia_fechamento is not null and dia_vencimento is not null and limite is not null))
);

-- Lançamentos: cada parcela de uma compra parcelada é uma linha,
-- todas com o mesmo grupo_parcelamento e a mesma data (data da compra).
-- categoria_id e fonte_destino_id NÃO têm "on delete cascade":
-- o banco recusa excluir uma categoria/fonte que tenha lançamentos.
create table lancamentos (
  id                  serial primary key,
  usuario_id          integer        not null references usuarios(id) on delete cascade,
  tipo                varchar(7)     not null check (tipo in ('entrada', 'saida')),
  descricao           varchar(120)   not null,
  valor               numeric(12, 2) not null check (valor > 0),
  data                date           not null,
  categoria_id        integer        not null references categorias(id),
  fonte_destino_id    integer        not null references fontes_destinos(id),
  parcela_atual       smallint       not null default 1,
  total_parcelas      smallint       not null default 1 check (total_parcelas between 1 and 48),
  grupo_parcelamento  uuid,
  criado_em           timestamp      not null default now()
);

create index idx_lancamentos_usuario_data on lancamentos (usuario_id, data);

-- O Supabase expõe as tabelas numa API pública. Ligando o RLS sem nenhuma
-- policy, ninguém acessa por lá: só a nossa API (que conecta direto no banco).
alter table usuarios        enable row level security;
alter table categorias      enable row level security;
alter table fontes_destinos enable row level security;
alter table lancamentos     enable row level security;
