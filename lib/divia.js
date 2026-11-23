import { mapearProducto } from '@/lib/catalogo'
import { toSlug } from '@/lib/utils'

const BASE_URL = process.env.CATALOGO_EXTERNO_URL || 'https://divia.serverupagency.com/api'
const AUTH_CLAVE = 'divia-auth-token'
const LIMIT_POR_PAGINA = 1000
// Renovar el token un día antes de que venza (dura 30 días) para no arriesgarnos a que expire a mitad de un fetch
const MARGEN_SEGURIDAD_MS = 24 * 60 * 60 * 1000

async function login() {
  const username = process.env.CATALOGO_EXTERNO_USER
  const password = process.env.CATALOGO_EXTERNO_PASS
  if (!username || !password) {
    throw new Error('CATALOGO_EXTERNO_USER / CATALOGO_EXTERNO_PASS no están configurados')
  }

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Login a Divia falló: ${res.status}`)

  const data = await res.json()
  return {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

async function obtenerTokenGuardado(supabase) {
  const { data } = await supabase
    .from('cache_catalogo_externo')
    .select('datos')
    .eq('clave', AUTH_CLAVE)
    .single()
  return data?.datos || null
}

async function guardarToken(supabase, token) {
  await supabase.from('cache_catalogo_externo').upsert(
    { clave: AUTH_CLAVE, datos: token, actualizado_en: new Date().toISOString() },
    { onConflict: 'clave' }
  )
}

async function obtenerTokenValido(supabase, { forzarNuevo = false } = {}) {
  if (!forzarNuevo) {
    const guardado = await obtenerTokenGuardado(supabase)
    if (guardado?.access_token && guardado.expires_at > Date.now() + MARGEN_SEGURIDAD_MS) {
      return guardado.access_token
    }
  }
  const nuevo = await login()
  await guardarToken(supabase, nuevo)
  return nuevo.access_token
}

function limpiarProducto(p) {
  return {
    id: p.id,
    sku: p.sku,
    partNumber: p.part_number,
    nombre: p.nombre,
    detalle: p.detalle,
    stock: p.stock,
    peso: p.peso,
    imageUrls: p.image_urls,
    marca: p.marca,
    subcategoria: p.subcategoria,
    precio: p.precio,
    precioConvertido: p.precio_convertido,
    PrecioNacional: p.precio_nacional,
    precioOferta: p.precio_oferta,
    isInOffer: p.isInOffer,
    IVA: p.IVA,
    simboloLocal: p.simbolo_local,
    new: p.new,
    Total: p.Total,
    TotalOferta: p.total_oferta,
  }
}

async function fetchPagina(token, page) {
  const url = `${BASE_URL}/productos/?page=${page}&limit=${LIMIT_POR_PAGINA}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (res.status === 401) {
    const err = new Error('Token de Divia rechazado (401)')
    err.status = 401
    throw err
  }
  if (!res.ok) throw new Error(`Divia respondió con error ${res.status} (página ${page})`)
  return res.json()
}

async function fetchCatalogoCompleto(token) {
  const t0 = Date.now()
  const primera = await fetchPagina(token, 1)
  console.log(`[divia] pagina 1/${primera.pages} en ${Date.now() - t0}ms`)
  const totalPaginas = primera.pages || 1
  const productosRaw = [...(primera.data || [])]

  if (totalPaginas > 1) {
    const t1 = Date.now()
    const restoPaginas = await Promise.all(
      Array.from({ length: totalPaginas - 1 }, (_, i) => fetchPagina(token, i + 2))
    )
    console.log(`[divia] resto de ${totalPaginas - 1} paginas en ${Date.now() - t1}ms`)
    for (const pag of restoPaginas) productosRaw.push(...(pag.data || []))
  }

  console.log(`[divia] total fetch: ${Date.now() - t0}ms, productos: ${productosRaw.length}`)
  return {
    client: primera.client,
    count: productosRaw.length,
    data: productosRaw.map(limpiarProducto),
  }
}

// Obtiene el catálogo completo de Divia, haciendo login (o reutilizando token vigente)
// y reintentando una vez con login forzado si el token guardado resulta rechazado.
export async function obtenerCatalogoDivia(supabase) {
  const token = await obtenerTokenValido(supabase)
  try {
    return await fetchCatalogoCompleto(token)
  } catch (err) {
    if (err.status !== 401) throw err
    const tokenNuevo = await obtenerTokenValido(supabase, { forzarNuevo: true })
    return fetchCatalogoCompleto(tokenNuevo)
  }
}

const CACHE_CLAVE = 'catalogo-divia-v2'

// Convierte un producto ya normalizado (mapearProducto) en una fila de productos_catalogo.
function aFila(p, actualizadoEn) {
  return {
    id: p.id,
    sku: p.sku ?? null,
    part_number: p.partNumber ?? null,
    nombre: p.nombre,
    detalle: p.detalle ?? null,
    marca: p.marca || '',
    precio: p.precio ?? 0,
    precio_original: p.precio_original ?? null,
    stock: p.stock ?? 0,
    imagen: p.imagen ?? null,
    en_oferta: !!p.en_oferta,
    categoria: p.categoria,
    subcategoria: p.subcategoria ?? null,
    tipo_periferico: p.tipo_periferico ?? null,
    slug: toSlug(p.nombre),
    actualizado_en: actualizadoEn,
  }
}

// Fase 1 del rediseño del catálogo: además del blob JSON, mantenemos una tabla real e
// indexada (productos_catalogo). Categorizamos en el servidor (mapearProducto), hacemos
// upsert por lotes y borramos lo que ya no viene de Divia.
async function sincronizarTablaProductos(supabase, productosRaw, actualizadoEn) {
  const filas = (productosRaw || [])
    .map(mapearProducto)
    .filter(Boolean)
    .map(p => aFila(p, actualizadoEn))
    .filter(f => f.id != null)

  // Lotes grandes a propósito: en el plan Hobby las funciones se cortan a los ~60s y el fetch
  // de Divia ya consume ~20-25s. Con pocas llamadas (~3 de ≈3 MB) el sync termina con margen;
  // con lotes de 1000 (12 llamadas) la función se cortaba a la mitad y dejaba la tabla incompleta.
  const LOTE = 4000
  for (let i = 0; i < filas.length; i += LOTE) {
    const { error } = await supabase
      .from('productos_catalogo')
      .upsert(filas.slice(i, i + LOTE), { onConflict: 'id' })
    if (error) throw new Error(error.message)
  }

  // Borra lo que no se tocó en esta corrida (productos retirados de Divia).
  const { error: errDel } = await supabase
    .from('productos_catalogo')
    .delete()
    .lt('actualizado_en', actualizadoEn)
  if (errDel) throw new Error(errDel.message)

  return filas.length
}

// Trae el catálogo completo de Divia y lo guarda en el caché de Supabase.
// Usado tanto por el botón de admin como por el cron programado.
export async function actualizarCatalogoCache(supabase) {
  const ahora = new Date().toISOString()
  try {
    const datos = await obtenerCatalogoDivia(supabase)
    const { error } = await supabase.from('cache_catalogo_externo').upsert(
      { clave: CACHE_CLAVE, datos, actualizado_en: ahora },
      { onConflict: 'clave' }
    )
    if (error) throw new Error(`Error guardando en Supabase: ${error.message}`)

    // Best-effort: poblar productos_catalogo. Si la migración 0002 aún no se aplicó, esto
    // falla pero NO rompe el refresco del catálogo — el blob JSON sigue siendo la fuente.
    try {
      await sincronizarTablaProductos(supabase, datos.data, ahora)
    } catch (e) {
      console.error('[catalogo] no se pudo sincronizar productos_catalogo (¿migración 0002 aplicada?):', e.message)
    }

    return { ok: true, productos: datos.data?.length ?? 0, actualizado_en: ahora }
  } catch (err) {
    // Al menos marcamos el caché como vencido para que el próximo intento (admin o cron) reintente
    await supabase
      .from('cache_catalogo_externo')
      .update({ actualizado_en: new Date(0).toISOString() })
      .eq('clave', CACHE_CLAVE)
    throw err
  }
}
