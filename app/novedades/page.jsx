import Link from 'next/link'
import { getFeaturedSkus, getProductosPorSkus } from '@/lib/productos'
import ProductCard from '@/components/ProductCard'

export const metadata = {
  title: 'Novedades',
  description: 'Los productos recién llegados a TechAvenue Costa Rica.',
  alternates: { canonical: '/novedades' },
}

export default async function NovedadesPage() {
  const skus = await getFeaturedSkus('novedades')
  const map = await getProductosPorSkus(skus)
  const lista = skus.map(s => map.get(s)).filter(Boolean)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px 96px' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7C3AED', marginBottom: 8 }}>
          Recién llegados
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--black)', letterSpacing: '-0.02em', margin: 0 }}>
            Novedades
          </h1>
          <span style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 8 }}>{lista.length} producto{lista.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {lista.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gray-400)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--black)', marginBottom: 8 }}>Novedades próximamente</div>
          <div style={{ fontSize: 14 }}>Estamos trayendo nuevos productos. Volvé pronto.</div>
          <Link href="/productos" style={{ display: 'inline-block', marginTop: 24, background: 'var(--black)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Ver catálogo completo
          </Link>
        </div>
      ) : (
        <div className="catalogo-grid">
          {lista.map(p => <ProductCard key={p.id} p={p} nuevo />)}
        </div>
      )}
    </div>
  )
}
