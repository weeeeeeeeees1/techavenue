import { createClient } from '@supabase/supabase-js'

// Acceso a datos del catálogo DESDE EL SERVIDOR (tabla productos_catalogo, poblada por la
// ingesta de Divia en lib/divia.js). Siempre con el service role: estas funciones solo
// corren en rutas/páginas de servidor, nunca en el cliente.
//
// Fase 2 del rediseño del catálogo: reemplaza el filtrado/paginado en el navegador sobre
// el blob de 9 MB por consultas indexadas en Postgres. Todavía ninguna página las usa —
// eso llega en la Fase 3.

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)
}

const COLUMNAS =
  'id, sku, part_number, nombre, detalle, marca, precio, precio_original, stock, imagen, en_oferta, categoria, subcategoria, tipo_periferico, slug'

// Periféricos filtran la subcategoría por tipo_periferico; el resto por subcategoria
// (mismo criterio que usaba el filtrado en el cliente).
function campoSub(categoria) {
  return categoria === 'perifericos' ? 'tipo_periferico' : 'subcategoria'
}

// Un producto por su id. La URL es /producto/<slug>-<id> y se resuelve por el id final.
export async function getProducto(id) {
  const idNum = Number(id)
  if (!Number.isFinite(idNum)) return null
  const { data, error } = await getSupabase()
    .from('productos_catalogo')
    .select(COLUMNAS)
    .eq('id', idNum)
    .maybeSingle()
  if (error) {
    console.error('getProducto:', error.message)
    return null
  }
  return data
}

// Listado de una categoría con filtros, orden y paginación resueltos en el servidor.
// Devuelve { productos, total, page, perPage } — total permite paginar sin traer todo.
export async function getProductosPorCategoria(categoria, opts = {}) {
  const {
    sub = null,
    marcas = [],
    soloEnStock = true,
    soloEnOferta = false,
    precioDesde = null,
    precioHasta = null,
    orden = 'default',
    page = 1,
    perPage = 24,
  } = opts

  let q = getSupabase()
    .from('productos_catalogo')
    .select(COLUMNAS, { count: 'exact' })
    .eq('categoria', categoria)

  if (sub) q = q.eq(campoSub(categoria), sub)
  if (soloEnStock) q = q.gt('stock', 0)
  if (soloEnOferta) q = q.eq('en_oferta', true)
  if (precioDesde != null) q = q.gte('precio', precioDesde)
  if (precioHasta != null) q = q.lte('precio', precioHasta)
  if (Array.isArray(marcas) && marcas.length) q = q.in('marca', marcas)

  if (orden === 'precio-asc') q = q.order('precio', { ascending: true })
  else if (orden === 'precio-desc') q = q.order('precio', { ascending: false })
  else if (orden === 'nombre') q = q.order('nombre', { ascending: true })
  else q = q.order('stock', { ascending: false }).order('id', { ascending: true }) // en stock primero, estable

  const desde = Math.max(0, (page - 1) * perPage)
  q = q.range(desde, desde + perPage - 1)

  const { data, count, error } = await q
  if (error) throw new Error(error.message)
  return { productos: data || [], total: count ?? 0, page, perPage }
}

// Marcas disponibles en una categoría (para el panel de filtros). PostgREST no hace
// SELECT DISTINCT, así que traemos solo la columna marca y deduplicamos en memoria.
export async function getMarcasPorCategoria(categoria) {
  const { data, error } = await getSupabase()
    .from('productos_catalogo')
    .select('marca')
    .eq('categoria', categoria)
    .gt('stock', 0)
    .range(0, 20000)
  if (error) {
    console.error('getMarcasPorCategoria:', error.message)
    return []
  }
  return [...new Set((data || []).map(r => r.marca).filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

// Búsqueda de texto por nombre (full-text en español: tolera varias palabras y acentos, y
// es segura ante entradas raras porque websearch_to_tsquery parsea la consulta del usuario).
export async function buscarProductos(query, opts = {}) {
  const { page = 1, perPage = 24, soloEnStock = false } = opts
  const texto = (query || '').trim()
  if (!texto) return { productos: [], total: 0, page, perPage }

  let q = getSupabase()
    .from('productos_catalogo')
    .select(COLUMNAS, { count: 'exact' })
    .textSearch('nombre', texto, { type: 'websearch', config: 'spanish' })

  if (soloEnStock) q = q.gt('stock', 0)

  const desde = Math.max(0, (page - 1) * perPage)
  q = q.range(desde, desde + perPage - 1)

  const { data, count, error } = await q
  if (error) throw new Error(error.message)
  return { productos: data || [], total: count ?? 0, page, perPage }
}
