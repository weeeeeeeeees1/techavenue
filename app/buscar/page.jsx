import Link from 'next/link'
import { buscarProductos } from '@/lib/productos'
import ProductCard from '@/components/ProductCard'
import SearchBox from './SearchBox'

const SUGERENCIAS = ['GPU', 'CPU', 'RAM DDR5', 'Placas Madre', 'SSD NVMe', 'Periféricos', 'Gabinetes']
const PER_PAGE = 48

function primero(v) {
  return Array.isArray(v) ? v[0] : v
}

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams
  const q = (primero(sp.q) || '').toString().trim()
  return {
    title: q ? `Resultados para "${q}"` : 'Buscar productos',
    description: q
      ? `Resultados de búsqueda para "${q}" en TechAvenue Costa Rica.`
      : 'Buscá productos en TechAvenue Costa Rica.',
    robots: { index: false, follow: true },   // las páginas de resultados no se indexan
  }
}

export default async function BuscarPage({ searchParams }) {
  const sp = await searchParams
  const query = (primero(sp.q) || '').toString().trim()
  const page = Math.max(1, parseInt(primero(sp.page) || '1', 10) || 1)

  let productos = []
  let total = 0
  if (query) {
    const r = await buscarProductos(query, { page, perPage: PER_PAGE, soloEnStock: true })
    productos = r.productos
    total = r.total
  }
  const paginas = Math.max(1, Math.ceil(total / PER_PAGE))
  const linkPagina = (n) => `/buscar?q=${encodeURIComponent(query)}${n > 1 ? `&page=${n}` : ''}`

  const btn = { padding: '10px 18px', borderRadius: 8, border: '1.5px solid var(--gray-200)', background: 'var(--white)', fontWeight: 600, fontSize: 14, textDecoration: 'none', color: 'var(--black)' }
  const btnOff = { ...btn, color: 'var(--gray-300)', cursor: 'not-allowed' }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px clamp(16px, 4vw, 32px) 96px' }}>

      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1E3A8A', marginBottom: 10 }}>
          Búsqueda
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--black)', letterSpacing: '-0.02em', marginBottom: 24, lineHeight: 1 }}>
          {query ? <>Resultados para <span style={{ color: '#1E3A8A' }}>&quot;{query}&quot;</span></> : 'Buscar productos'}
        </h1>
        <SearchBox key={query} query={query} />
      </div>

      {query ? (
        total === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--black)', marginBottom: 8 }}>Sin resultados para &quot;{query}&quot;</div>
            <div style={{ fontSize: 14 }}>Intentá con otro término, marca o categoría.</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 24 }}>
              {total} producto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
            </div>
            <div className="catalogo-grid">
              {productos.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
            {paginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 40 }}>
                {page > 1 ? <Link href={linkPagina(page - 1)} style={btn}>← Anterior</Link> : <span style={btnOff}>← Anterior</span>}
                <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Página {page} de {paginas}</span>
                {page < paginas ? <Link href={linkPagina(page + 1)} style={btn}>Siguiente →</Link> : <span style={btnOff}>Siguiente →</span>}
              </div>
            )}
          </div>
        )
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray-600)', marginBottom: 4 }}>
            Sugerencias
          </div>
          {SUGERENCIAS.map(s => (
            <Link
              key={s}
              href={`/buscar?q=${encodeURIComponent(s)}`}
              className="buscar-sugerencia"
              style={{ textAlign: 'left', padding: '12px 16px', fontSize: 14, color: 'var(--gray-800)', textDecoration: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              {s}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
