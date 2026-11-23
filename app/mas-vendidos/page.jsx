import Link from 'next/link'
import { getMasVendidos, getProductosPorSkus } from '@/lib/productos'
import ProductCard from '@/components/ProductCard'

export const metadata = {
  title: 'Los más Vendidos',
  description: 'El ranking de los productos más vendidos en TechAvenue Costa Rica.',
  alternates: { canonical: '/mas-vendidos' },
}

export default async function MasVendidosPage() {
  const ranking = await getMasVendidos(24)
  const map = await getProductosPorSkus(ranking.map(r => r.sku))
  const lista = ranking
    .map(r => {
      const p = map.get(String(r.sku))
      return p ? { p, ventas: r.ventas } : null
    })
    .filter(Boolean)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px 96px' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#16A34A', marginBottom: 8 }}>
          Ranking
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--black)', letterSpacing: '-0.02em', margin: 0 }}>
            Los más Vendidos
          </h1>
          <span style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 8 }}>{lista.length} producto{lista.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {lista.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gray-400)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--black)', marginBottom: 8 }}>Aún no hay datos de ventas</div>
          <div style={{ fontSize: 14 }}>Los productos más vendidos aparecerán aquí automáticamente.</div>
          <Link href="/productos" style={{ display: 'inline-block', marginTop: 24, background: 'var(--black)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Ver catálogo completo
          </Link>
        </div>
      ) : (
        <div className="catalogo-grid">
          {lista.map(({ p, ventas }, i) => <ProductCard key={p.id} p={p} rank={i + 1} ventas={ventas} />)}
        </div>
      )}
    </div>
  )
}
