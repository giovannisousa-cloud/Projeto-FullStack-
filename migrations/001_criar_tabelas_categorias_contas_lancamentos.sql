-- 001: cria as tabelas categorias, contas e lancamentos do controle financeiro,
-- com chaves estrangeiras, índices, RLS e política "cada usuário só acessa seus dados".
create table if not exists public.categorias (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome        text not null,
  tipo        text not null check (tipo in ('entrada', 'saida')),
  cor         text not null default '#7180F5',
  created_at  timestamptz not null default now(),
  unique (user_id, nome, tipo)
);

create table if not exists public.contas (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome        text not null,
  tipo        text not null check (tipo in ('conta', 'cartao_credito')),
  saldo       numeric(14,2) not null default 0,
  limite      numeric(14,2),
  fechamento  smallint check (fechamento between 1 and 31),
  vencimento  smallint check (vencimento between 1 and 31),
  created_at  timestamptz not null default now(),
  unique (user_id, nome)
);

create table if not exists public.lancamentos (
  id            bigint generated always as identity primary key,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  descricao     text not null,
  tipo          text not null check (tipo in ('entrada', 'saida')),
  valor         numeric(14,2) not null check (valor > 0),
  data          date not null default current_date,
  categoria_id  bigint references public.categorias (id) on delete set null,
  conta_id      bigint references public.contas (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists categorias_user_id_idx        on public.categorias (user_id);
create index if not exists contas_user_id_idx            on public.contas (user_id);
create index if not exists lancamentos_user_id_data_idx  on public.lancamentos (user_id, data desc);
create index if not exists lancamentos_categoria_id_idx  on public.lancamentos (categoria_id);
create index if not exists lancamentos_conta_id_idx      on public.lancamentos (conta_id);

alter table public.categorias  enable row level security;
alter table public.contas      enable row level security;
alter table public.lancamentos enable row level security;

do $$
declare t text;
begin
  foreach t in array array['categorias', 'contas', 'lancamentos'] loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_dono') then
      execute format(
        'create policy %I on public.%I for all to authenticated
           using ((select auth.uid()) = user_id)
           with check ((select auth.uid()) = user_id)',
        t || '_dono', t
      );
    end if;
  end loop;
end $$;
