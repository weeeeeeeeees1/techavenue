import { getProductosPorCategoria, getMarcasPorCategoria } from '@/lib/productos'
import CategoryView from './CategoryView'

const NOMBRES = {
  'componentes':            'Componentes',
  'perifericos':            'Periféricos',
  'accesorios':             'Accesorios',
  'energia-y-conectividad': 'Energía y Conectividad',
  'streaming-y-gaming':     'Streaming y Gaming',
  'computadoras':           'Computadoras',
  'hogar':                  'Hogar',
  'software':               'Software',
}

const PER_PAGE = 48

function nombreBonito(nombre) {
  return NOMBRES[nombre] || nombre.charAt(0).toUpperCase() + nombre.slice(1).replace(/-/g, ' ')
}

export async function generateMetadata({ params }) {
  const { nombre } = await params
  const titulo = nombreBonito(nombre)
  return {
    // El template del layout raíz añade "— TechAvenue CR", así que acá solo el nombre.
    title: titulo,
    description: `Comprá ${titulo} en TechAvenue Costa Rica. Garantía oficial, envío a todo el país.`,
    alternates: { canonical: `/categoria/${nombre}` },
  }
}

function primero(v) {
  return Array.isArray(v) ? v[0] : v
}

function parseFiltros(sp) {
  const marca = sp.marca
  const marcas = marca ? (Array.isArray(marca) ? marca : [marca]) : []
  const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null }
  const desde = primero(sp.desde)
  const hasta = primero(sp.hasta)
  return {
    sub: primero(sp.sub) || null,
    marcas,
    soloEnStock: primero(sp.stock) !== '0',   // por defecto true; stock=0 lo desactiva
    soloEnOferta: primero(sp.oferta) === '1',
    precioDesde: desde != null ? toNum(desde) : null,
    precioHasta: hasta != null ? toNum(hasta) : null,
    orden: primero(sp.orden) || 'default',
    page: Math.max(1, parseInt(primero(sp.page) || '1', 10) || 1),
  }
}

export default async function Page({ params, searchParams }) {
  const { nombre } = await params
  const sp = await searchParams
  const filtros = parseFiltros(sp)

  const [{ productos, total }, marcas] = await Promise.all([
    getProductosPorCategoria(nombre, { ...filtros, perPage: PER_PAGE }),
    getMarcasPorCategoria(nombre),
  ])

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://techavenuecr.com/' },
      { '@type': 'ListItem', position: 2, name: nombreBonito(nombre), item: `https://techavenuecr.com/categoria/${nombre}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <CategoryView
        categoria={nombre}
        nombreCategoria={nombreBonito(nombre)}
        productos={productos}
        total={total}
        marcas={marcas}
        filtros={filtros}
        perPage={PER_PAGE}
      />
    </>
  )
}
