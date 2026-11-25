import Link from 'next/link'
import { getFeaturedSkus, getProductosPorSkus, getProductosEnOferta } from '@/lib/productos'
import ProductCard from '@/components/ProductCard'

export const metadata = {
  title: 'Promociones',
  description: 'Ofertas y promociones activas en TechAvenue Costa Rica.',
  alternates: { canonical: '/promociones' },
}

export default async function PromocionesPage() {
  // La página combina dos fuentes y deduplica por id:
  //  1) Lo que el admin agrega a mano (tabla "promociones", en su orden).
  //  2) Todos los productos con descuento real de Divia (en_oferta), automáticamente.
  // Así cualquier oferta aparece sola, sin que el cliente la agregue producto por producto.
  const [skus, ofertas] = await Promise.all([
    getFeaturedSkus('promociones'),
    getProductosEnOferta(200),
  ])
  const map = await getProductosPorSkus(skus)
  const curados = skus.map(s => map.get(s)).filter(Boolean)
  const idsCurados = new Set(curados.map(p => p.id))
  const automaticos = ofertas.filter(p => !idsCurados.has(p.id))
  const lista = [...curados, ...automaticos]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px 96px' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#DC2626', marginBottom: 8 }}>
          Ofertas
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--black)', letterSpacing: '-0.02em', margin: 0 }}>
            Promociones
          </h1>
          <span style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 8 }}>{lista.length} producto{lista.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {lista.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gray-400)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--black)', marginBottom: 8 }}>Sin promociones activas</div>
          <div style={{ fontSize: 14 }}>Volvé pronto para ver nuestras próximas ofertas.</div>
          <Link href="/productos" style={{ display: 'inline-block', marginTop: 24, background: 'var(--black)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Ver catálogo completo
          </Link>
        </div>
      ) : (
        <div className="catalogo-grid">
          {lista.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  )
}
