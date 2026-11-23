-- Algún producto de Divia trae un precio fuera del rango de integer de Postgres
-- (int4 llega a ~2.147e9). Ejemplo real: 57918154700 (~57.9 mil millones de colones),
-- que hacía fallar el upsert del catálogo en productos_catalogo (quedaba a medio poblar).
-- Pasamos las columnas monetarias — y stock, por si acaso — a bigint.

alter table public.productos_catalogo
  alter column precio type bigint,
  alter column precio_original type bigint,
  alter column stock type bigint;
