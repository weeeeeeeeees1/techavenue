import { cache } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProducto } from '@/lib/productos'
import AgregarAlCarrito from './AgregarAlCarrito'

const CATEGORIA_LABEL = {
  'componentes':            'Componentes',
  'perifericos':            'Periféricos',
  'accesorios':             'Accesorios',
  'energia-y-conectividad': 'Energía y Conectividad',
  'streaming-y-gaming':     'Streaming y Gaming',
  'computadoras':           'Computadoras',
  'hogar':                  'Hogar',
  'software':               'Software',
}

const SPECS_LABELS = {
  marca:           'Marca',
  tipo_periferico: 'Tipo',
  subcategoria:    'Subcategoría',
}

// cache(): generateMetadata y la página comparten una sola consulta por request.
const obtenerProducto = cache((id) => getProducto(id))

function idDeSlug(slug) {
  return slug.slice(slug.lastIndexOf('-') + 1)
}

function descripcion(p) {
  const base = (p.detalle || '').replace(/\s+/g, ' ').trim()
  if (base.length >= 40) return base.slice(0, 160)
  return `${p.nombre}. Comprá ${p.marca || 'tecnología'} en TechAvenue Costa Rica — garantía oficial y envío a todo el país.`.slice(0, 160)
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const p = await obtenerProducto(idDeSlug(slug))
  if (!p) return { title: 'Producto no encontrado' }

  const canonical = `/producto/${p.slug || 'p'}-${p.id}`
  const desc = descripcion(p)
  const imagenes = p.imagen ? [p.imagen] : undefined

  return {
    title: p.nombre,
    description: desc,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: p.nombre,
      description: desc,
      images: imagenes,
    },
    twitter: {
      card: 'summary_large_image',
      title: p.nombre,
      description: desc,
      images: imagenes,
    },
  }
}

export default async function ProductoPage({ params }) {
  const { slug } = await params
  const producto = await obtenerProducto(idDeSlug(slug))
  if (!producto) notFound()

  const specs = Object.entries(SPECS_LABELS)
    .filter(([key]) => producto[key])
    .map(([key, label]) => ({ label, valor: producto[key] }))

  const canonical = `https://techavenuecr.com/producto/${producto.slug || 'p'}-${producto.id}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.nombre,
    image: producto.imagen ? [producto.imagen] : undefined,
    description: descripcion(producto),
    sku: producto.sku || undefined,
    mpn: producto.part_number || undefined,
    brand: producto.marca ? { '@type': 'Brand', name: producto.marca } : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CRC',
      price: producto.precio,
      availability: producto.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: canonical,
    },
  }

  return (
    <div className="product-detail-wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="product-detail-breadcrumb">
        <Link href="/" style={{ color: 'var(--gray-400)', textDecoration: 'none' }}>Inicio</Link>
        <span>/</span>
        {producto.categoria && (
          <>
            <Link href={`/categoria/${producto.categoria}`} style={{ color: 'var(--gray-400)', textDecoration: 'none' }}>
              {CATEGORIA_LABEL[producto.categoria] || producto.categoria}
            </Link>
            <span>/</span>
          </>
        )}
        <span style={{ color: 'var(--black)', fontWeight: 600 }}>{producto.nombre}</span>
      </div>

      <div className="product-detail-grid">

        <div className="product-image-col" style={{ position: 'sticky', top: 24 }}>
          <div style={{ background: 'var(--gray-100)', borderRadius: 12, aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            {producto.en_oferta && (
              <div style={{ position: 'absolute', top: 16, left: 16, background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, zIndex: 1 }}>
                Oferta
              </div>
            )}
            {producto.imagen ? (
              <img src={producto.imagen} alt={producto.nombre} decoding="async" fetchPriority="high" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            ) : (
              <div style={{ color: 'var(--gray-400)', fontSize: 13 }}>Sin imagen</div>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1E3A8A', marginBottom: 8 }}>
            {producto.marca}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px, 3vw, 38px)', color: 'var(--black)', letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 8 }}>
            {producto.nombre}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 28 }}>SKU: {producto.sku}</div>

          <div style={{ marginBottom: 20 }}>
            {producto.precio_original && (
              <div style={{ fontSize: 13, color: 'var(--gray-400)', textDecoration: 'line-through', marginBottom: 2 }}>
                ₡{producto.precio_original.toLocaleString('es-CR')}
              </div>
            )}
            <div className="product-detail-price" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44, color: producto.en_oferta ? '#DC2626' : 'var(--black)', lineHeight: 1 }}>
              ₡{producto.precio.toLocaleString('es-CR')}
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, marginBottom: 32, background: producto.stock > 0 ? '#F0FDF4' : '#FEE2E2', color: producto.stock > 0 ? '#16A34A' : '#DC2626' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            {producto.stock > 0 ? `En stock (${producto.stock} disponibles)` : 'Agotado'}
          </div>

          <AgregarAlCarrito producto={producto} />

          <Link href="/carrito" style={{ display: 'block', width: '100%', padding: '13px 24px', background: 'transparent', color: 'var(--black)', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontWeight: 600, fontSize: 15, textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box', transition: 'border-color 0.15s' }}>
            Ver carrito →
          </Link>

          <a
            href="https://wa.me/50663409795"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#16A34A', fontWeight: 600, textDecoration: 'none', marginTop: 24 }}
          >
            <svg width="15" height="15" viewBox="0 0 32 32" fill="#16A34A">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 2.824.738 5.47 2.031 7.772L0 32l8.469-2.219A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm8.32 22.72c-.347.977-2.025 1.867-2.773 1.936-.748.07-1.469.36-4.96-1.036-4.208-1.666-6.896-5.936-7.104-6.208-.208-.272-1.664-2.213-1.664-4.224 0-2.01 1.053-3.002 1.427-3.413.373-.41.813-.513 1.083-.513.27 0 .54.003.776.014.25.012.585-.095.916.699.347.824 1.179 2.84 1.283 3.047.104.207.174.45.035.726-.139.275-.208.446-.416.687-.207.24-.437.537-.624.721-.208.204-.424.424-.183.833.241.41 1.072 1.765 2.302 2.86 1.582 1.41 2.914 1.848 3.323 2.057.41.208.649.174.89-.104.24-.277.997-1.162 1.264-1.56.267-.4.534-.333.9-.2.366.133 2.338 1.102 2.738 1.302.4.2.665.3.765.467.1.167.1.958-.247 1.91z"/>
            </svg>
            Consultar por WhatsApp
          </a>

          {specs.length > 0 && (
            <div style={{ marginTop: 40, borderTop: '1px solid var(--gray-200)', paddingTop: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray-600)', marginBottom: 20 }}>
                Especificaciones
              </div>
              <div>
                {specs.map(({ label, valor }, i) => (
                  <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 12px', background: i % 2 === 0 ? 'var(--gray-100)' : 'transparent', borderRadius: 4 }}>
                    <div style={{ fontSize: 13, color: 'var(--gray-600)', fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: 13, color: 'var(--black)', fontWeight: 600 }}>{valor}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
