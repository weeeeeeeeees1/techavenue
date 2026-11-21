import { createClient } from '@supabase/supabase-js'
import { toSlug } from '@/lib/utils'

const SITE = 'https://techavenuecr.com'

// Páginas estáticas indexables (se excluyen las privadas/transaccionales: admin, checkout, carrito, etc.)
const RUTAS_ESTATICAS = [
  '', '/productos', '/destacados', '/mas-vendidos', '/novedades', '/promociones',
  '/contacto', '/centro-ayuda', '/garantias', '/quienes-somos',
  '/terminos-servicio', '/politica-privacidad', '/politica-devoluciones', '/politica-cookies',
]

const CATEGORIAS = [
  'componentes', 'perifericos', 'accesorios', 'energia-y-conectividad',
  'streaming-y-gaming', 'computadoras', 'hogar', 'software',
]

// Regenerar como mucho una vez por hora (el catálogo cambia poco de minuto a minuto).
export const revalidate = 3600

export default async function sitemap() {
  const ahora = new Date()

  const entradas = [
    ...RUTAS_ESTATICAS.map(r => ({
      url: `${SITE}${r}`,
      lastModified: ahora,
      changeFrequency: 'weekly',
      priority: r === '' ? 1 : 0.7,
    })),
    ...CATEGORIAS.map(c => ({
      url: `${SITE}/categoria/${c}`,
      lastModified: ahora,
      changeFrequency: 'daily',
      priority: 0.8,
    })),
  ]

  // Productos desde el caché del catálogo. Resiliente: si Supabase falla o no hay caché,
  // el sitemap estático (rutas + categorías) sigue siendo válido.
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY) {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)
      const { data } = await supabase
        .from('cache_catalogo_externo')
        .select('datos')
        .eq('clave', 'catalogo-divia-v2')
        .single()
      const productos = data?.datos?.data || []
      for (const p of productos) {
        if (!p?.id || !p?.nombre) continue
        entradas.push({
          url: `${SITE}/producto/${toSlug(p.nombre)}-${p.id}`,
          lastModified: ahora,
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      }
    }
  } catch {
    // Ignorar: el sitemap estático se devuelve igual.
  }

  return entradas
}
