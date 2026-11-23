import Link from 'next/link'
import { toSlug } from '@/lib/utils'

// Tarjeta de producto compartida (server component). El hover vive en .catalogo-card:hover.
// Props opcionales: nuevo (badge "Nuevo"), rank (#N, badge más-vendidos), ventas (reemplaza
// el badge de stock por "N ventas").
export default function ProductCard({ p, nuevo = false, rank = null, ventas = null }) {
  const esRanking = rank != null
  return (
    <Link href={`/producto/${toSlug(p.nombre)}-${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div className="catalogo-card" style={{ border: '1.5px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative', transition: 'border-color 0.15s, box-shadow 0.15s' }}>
        {esRanking && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: rank <= 3 ? '#F9BE16' : '#F3F4F6', color: rank <= 3 ? '#0d0d0d' : 'var(--gray-600)', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 20, zIndex: 1 }}>
            #{rank}
          </div>
        )}
        {nuevo && (
          <div style={{ position: 'absolute', top: 10, left: 10, background: '#7C3AED', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, zIndex: 1 }}>Nuevo</div>
        )}
        {p.en_oferta && (
          <div style={{ position: 'absolute', ...(esRanking ? { top: 10, right: 10 } : { top: nuevo ? 36 : 10, left: 10 }), background: '#DC2626', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, zIndex: 1 }}>Oferta</div>
        )}
        <div style={{ background: 'var(--gray-100)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {p.imagen
            ? <img src={p.imagen} alt={p.nombre} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 16 }} />
            : <div style={{ color: 'var(--gray-300)', fontSize: 12 }}>Sin imagen</div>}
        </div>
        <div className="card-body" style={{ padding: '14px 16px' }}>
          <div className="card-marca" style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.marca}</div>
          <div className="card-nombre" style={{ fontSize: 14, fontWeight: 600, color: 'var(--black)', marginBottom: 10, lineHeight: 1.3 }}>{p.nombre}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {p.precio_original && <div style={{ fontSize: 11, color: 'var(--gray-400)', textDecoration: 'line-through' }}>₡{p.precio_original.toLocaleString('es-CR')}</div>}
              <div className="card-precio" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: p.en_oferta ? '#DC2626' : 'var(--black)' }}>₡{p.precio?.toLocaleString('es-CR')}</div>
            </div>
            {ventas != null ? (
              <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: '#F0FDF4', color: '#16A34A' }}>{ventas} venta{ventas !== 1 ? 's' : ''}</div>
            ) : (
              <div className="card-stock" style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: p.stock > 0 ? '#F0FDF4' : '#FEE2E2', color: p.stock > 0 ? '#16A34A' : '#DC2626' }}>
                {p.stock > 0 ? 'En stock' : 'Agotado'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
