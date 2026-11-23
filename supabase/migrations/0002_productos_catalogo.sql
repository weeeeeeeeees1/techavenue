-- Fase 1 del rediseño del catálogo: una tabla real e indexada de productos.
--
-- La ingesta (lib/divia.js) la llena en cada refresco del catálogo (cron/admin), ADEMÁS del
-- blob JSON existente (cache_catalogo_externo), que se mantiene como respaldo durante la
-- transición. Ninguna página la consume todavía — eso llega en fases posteriores.
--
-- Las lecturas se harán desde rutas del servidor con el service role (SUPABASE_SECRET_KEY),
-- igual que el resto del catálogo, por eso RLS queda activo SIN políticas públicas.

create table if not exists public.productos_catalogo (
  id              bigint primary key,            -- id del producto en Divia
  sku             text,
  part_number     text,
  nombre          text not null,
  detalle         text,
  marca           text not null default '',
  precio          integer not null default 0,    -- en colones, ya calculado (oferta vs normal)
  precio_original integer,                        -- precio sin oferta, si aplica
  stock           integer not null default 0,
  imagen          text,
  en_oferta       boolean not null default false,
  categoria       text not null default 'otros',
  subcategoria    text,
  tipo_periferico text,
  slug            text,                           -- toSlug(nombre), para URLs
  actualizado_en  timestamptz not null default now()
);

create index if not exists idx_prodcat_categoria on public.productos_catalogo (categoria);
create index if not exists idx_prodcat_cat_sub   on public.productos_catalogo (categoria, subcategoria);
create index if not exists idx_prodcat_tipo      on public.productos_catalogo (tipo_periferico);
create index if not exists idx_prodcat_oferta    on public.productos_catalogo (en_oferta) where en_oferta;
create index if not exists idx_prodcat_slug      on public.productos_catalogo (slug);

-- Búsqueda de texto (español) sobre nombre + marca, para la Fase 2 (buscador en el servidor).
create index if not exists idx_prodcat_busqueda  on public.productos_catalogo
  using gin (to_tsvector('spanish', coalesce(nombre, '') || ' ' || coalesce(marca, '')));

alter table public.productos_catalogo enable row level security;
-- Sin políticas públicas: solo el service role (rutas del servidor) puede leer o escribir.
