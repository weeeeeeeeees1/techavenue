// Sincroniza el catálogo de Divia hacia Supabase desde un GitHub Action, fuera del
// límite de 60s de las funciones serverless en el plan Hobby de Vercel. Reutiliza
// exactamente la misma lógica que el botón de admin (actualizarCatalogoCache en
// lib/divia.js: login, fetch paginado, categorización con lib/catalogo.js, upsert por
// lotes a productos_catalogo y borrado de lo retirado). El Action empaqueta este
// archivo con esbuild (resolviendo el alias @/ de jsconfig) y lo corre con Node.
import { createClient } from '@supabase/supabase-js'
import { actualizarCatalogoCache } from '@/lib/divia'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) {
    console.error('Faltan los secrets NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY.')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const t0 = Date.now()
  try {
    const r = await actualizarCatalogoCache(supabase)
    console.log(`✓ Catálogo sincronizado: ${r.productos} productos en ${Math.round((Date.now() - t0) / 1000)}s (actualizado_en=${r.actualizado_en})`)
    process.exit(0)
  } catch (err) {
    console.error(`✗ Falló la sincronización tras ${Math.round((Date.now() - t0) / 1000)}s:`, err?.message || err)
    process.exit(1)
  }
}

main()
