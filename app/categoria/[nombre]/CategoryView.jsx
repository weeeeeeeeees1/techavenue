'use client'
import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toSlug } from '@/lib/utils'

const ORDENAR_OPCIONES = [
  { value: 'default',    label: 'Destacados' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'nombre',     label: 'Nombre A-Z' },
]

// Pills/lista de subcategoría por categoría — "campo" es informativo (el filtro server
// ya sabe mapear perifericos->tipo_periferico y el resto->subcategoria).
const SUBCATEGORIAS = {
  'perifericos': [
    { label: 'Todos', valor: null }, { label: 'Mouse', valor: 'Mouse' }, { label: 'Teclados', valor: 'Teclado' },
    { label: 'Audífonos', valor: 'Audífonos' }, { label: 'Headsets', valor: 'Headset' }, { label: 'Webcams', valor: 'Webcam' },
    { label: 'Micrófonos', valor: 'Micrófono' }, { label: 'Parlantes', valor: 'Parlantes' }, { label: 'Monitores', valor: 'Monitor' },
    { label: 'Escritorios', valor: 'Escritorio' }, { label: 'Sillas', valor: 'Silla' },
  ],
  'componentes': [
    { label: 'Todos', valor: null }, { label: 'Procesadores', valor: 'cpu' }, { label: 'Tarjetas de Video', valor: 'gpu' },
    { label: 'Tarjetas Madre', valor: 'placas-madre' }, { label: 'Memoria RAM', valor: 'ram' }, { label: 'Almacenamiento', valor: 'almacenamiento' },
    { label: 'Fuentes de Poder', valor: 'fuentes-de-poder' }, { label: 'Gabinetes', valor: 'gabinetes' }, { label: 'Refrigeración', valor: 'refrigeracion' },
    { label: 'Pastas Térmicas', valor: 'pastas-termicas' },
  ],
  'accesorios': [
    { label: 'Todos', valor: null }, { label: 'Hubs', valor: 'hubs' }, { label: 'Bases', valor: 'bases' },
    { label: 'Soportes', valor: 'soportes' }, { label: 'Barra de Sonido', valor: 'barra-sonido' }, { label: 'Mantenimiento', valor: 'mantenimiento' },
  ],
  'energia-y-conectividad': [
    { label: 'Todos', valor: null }, { label: 'Power Banks', valor: 'power-banks' }, { label: 'UPS', valor: 'ups' },
    { label: 'Smart Home', valor: 'smart-home' }, { label: 'Redes', valor: 'redes' },
  ],
  'streaming-y-gaming': [
    { label: 'Todos', valor: null }, { label: 'Sim Racing', valor: 'sim-racing' }, { label: 'Capturadoras', valor: 'streaming' },
  ],
  'computadoras': [
    { label: 'Todos', valor: null }, { label: 'Laptops', valor: 'laptops' }, { label: 'Tablets', valor: 'tablets' },
  ],
}

const inputStyle = {
  width: '100%', padding: '8px 12px', fontSize: 13,
  border: '1.5px solid var(--gray-200)', borderRadius: 6,
  fontFamily: 'var(--font-body)', outline: 'none',
  background: 'var(--white)', color: 'var(--black)',
}
const seccionLabel = {
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: 'var(--gray-600)', marginBottom: 12,
}
const pillStyle = (activo) => ({
  padding: '7px 16px', borderRadius: 20,
  border: activo ? '1.5px solid var(--black)' : '1.5px solid var(--gray-200)',
  background: activo ? 'var(--black)' : 'var(--white)',
  color: activo ? '#fff' : 'var(--gray-800)',
  fontSize: 13, fontWeight: activo ? 600 : 400, cursor: 'pointer',
  transition: 'all 0.15s', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
})

export default function CategoryView({ categoria, nombreCategoria, productos, total, marcas, filtros, perPage }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [filtrosMobileOpen, setFiltrosMobileOpen] = useState(false)
  const [desde, setDesde] = useState(filtros.precioDesde ?? '')
  const [hasta, setHasta] = useState(filtros.precioHasta ?? '')

  const subcats = SUBCATEGORIAS[categoria] || null
  const hayFiltrosActivos =
    !!filtros.sub || !filtros.soloEnStock || filtros.soloEnOferta ||
    filtros.precioDesde != null || filtros.precioHasta != null || filtros.marcas.length > 0

  // Construye la nueva URL aplicando cambios de params. Cualquier cambio de filtro
  // vuelve a la página 1 (salvo cuando el cambio es la propia paginación).
  function urlCon(cambios) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(cambios)) {
      if (v === null || v === undefined || v === '') params.delete(k)
      else if (Array.isArray(v)) { params.delete(k); v.forEach(x => params.append(k, x)) }
      else params.set(k, String(v))
    }
    if (!('page' in cambios)) params.delete('page')
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }
  const aplicar = (cambios, scroll = false) => startTransition(() => router.push(urlCon(cambios), { scroll }))

  const setSub = (valor) => aplicar({ sub: valor })
  const setOrden = (value) => aplicar({ orden: value === 'default' ? null : value })
  const setStock = (checked) => aplicar({ stock: checked ? null : '0' })
  const setOferta = (checked) => aplicar({ oferta: checked ? '1' : null })
  const toggleMarca = (m) => {
    const actuales = searchParams.getAll('marca')
    const next = actuales.includes(m) ? actuales.filter(x => x !== m) : [...actuales, m]
    aplicar({ marca: next })
  }
  const aplicarPrecio = () => aplicar({ desde: desde === '' ? null : desde, hasta: hasta === '' ? null : hasta })
  const limpiar = () => { setDesde(''); setHasta(''); startTransition(() => router.push(pathname, { scroll: false })) }

  const paginas = Math.max(1, Math.ceil(total / perPage))
  const page = Math.min(filtros.page, paginas)
  const irAPagina = (n) => startTransition(() => router.push(urlCon({ page: n > 1 ? n : null }), { scroll: true }))

  const marcasSel = filtros.marcas

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px clamp(12px, 4vw, 32px) 96px' }}>

      <div style={{ marginBottom: 36 }}>
        {/* eslint-disable-next-line react/jsx-no-comment-textnodes */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1E3A8A', marginBottom: 8 }}>
          // {nombreCategoria}
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(36px, 5vw, 56px)', color: 'var(--black)', letterSpacing: '-0.02em', margin: 0 }}>
          {nombreCategoria}
        </h1>
      </div>

      <div className="category-layout">

        {/* ── SIDEBAR ── */}
        <div className={`category-sidebar${filtrosMobileOpen ? ' open' : ''}`}>
          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--gray-200)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--black)' }}>Filtros</div>
              {hayFiltrosActivos && (
                <button onClick={limpiar} style={{ fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                  Limpiar
                </button>
              )}
            </div>

            {subcats && (
              <div style={{ marginBottom: 24 }}>
                <div style={seccionLabel}>Subcategoría</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {subcats.map(sub => {
                    const activo = sub.valor === null ? !filtros.sub : filtros.sub === sub.valor
                    return (
                      <button
                        key={sub.label}
                        onClick={() => setSub(sub.valor)}
                        style={{
                          textAlign: 'left', padding: '7px 10px', borderRadius: 6, border: 'none',
                          background: activo ? 'var(--gray-100)' : 'none',
                          color: activo ? 'var(--black)' : 'var(--gray-600)',
                          fontSize: 13, fontWeight: activo ? 700 : 400, cursor: 'pointer',
                          fontFamily: 'var(--font-body)', transition: 'all 0.12s',
                        }}
                      >
                        {activo && <span style={{ color: '#1E3A8A', marginRight: 6 }}>→</span>}
                        {sub.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <input type="checkbox" checked={filtros.soloEnStock} onChange={e => setStock(e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                  Solo en stock
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  <input type="checkbox" checked={filtros.soloEnOferta} onChange={e => setOferta(e.target.checked)} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                  Solo en oferta
                </label>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={seccionLabel}>Rango de precio</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 4 }}>Desde</div>
                  <input type="number" value={desde} placeholder="₡0" onChange={e => setDesde(e.target.value)} onBlur={aplicarPrecio} onKeyDown={e => e.key === 'Enter' && aplicarPrecio()} style={inputStyle} min={0} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 4 }}>Hasta</div>
                  <input type="number" value={hasta} placeholder="Máx" onChange={e => setHasta(e.target.value)} onBlur={aplicarPrecio} onKeyDown={e => e.key === 'Enter' && aplicarPrecio()} style={inputStyle} min={0} />
                </div>
              </div>
            </div>

            {marcas.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={seccionLabel}>Marca</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {marcas.map(marca => (
                    <label key={marca} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox" checked={marcasSel.includes(marca)} onChange={() => toggleMarca(marca)} style={{ width: 15, height: 15, cursor: 'pointer' }} />
                      {marca}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── GRID ── */}
        <div style={{ opacity: isPending ? 0.55 : 1, transition: 'opacity 0.15s' }}>
          <button className="category-filter-toggle" onClick={() => setFiltrosMobileOpen(prev => !prev)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            {filtrosMobileOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            {hayFiltrosActivos && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>!</span>}
          </button>

          {subcats && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--gray-200)' }}>
              {subcats.map(sub => {
                const activo = sub.valor === null ? !filtros.sub : filtros.sub === sub.valor
                return (
                  <button key={sub.label} onClick={() => setSub(sub.valor)} style={pillStyle(activo)}>
                    {sub.label}
                  </button>
                )
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>
              {total} producto{total !== 1 ? 's' : ''}
            </div>
            <select value={filtros.orden} onChange={e => setOrden(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
              {ORDENAR_OPCIONES.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {productos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gray-400)' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--black)', marginBottom: 8 }}>
                {hayFiltrosActivos ? 'Sin resultados con estos filtros' : 'Productos próximamente'}
              </div>
              <div style={{ fontSize: 14, marginBottom: 24 }}>
                {hayFiltrosActivos
                  ? 'Probá desactivar "Solo en stock" o ajustar los filtros.'
                  : 'Estamos preparando el catálogo. Volvé pronto.'}
              </div>
              {hayFiltrosActivos && (
                <button onClick={limpiar} style={{ background: 'var(--black)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="catalogo-grid">
                {productos.map(p => (
                  <Link key={p.id} href={`/producto/${toSlug(p.nombre)}-${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="catalogo-card" style={{ border: '1.5px solid var(--gray-200)', borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s, box-shadow 0.15s', cursor: 'pointer', position: 'relative' }}>
                      {p.en_oferta && (
                        <div style={{ position: 'absolute', top: 10, left: 10, background: '#DC2626', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, zIndex: 1 }}>
                          Oferta
                        </div>
                      )}
                      <div style={{ background: 'var(--gray-100)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {p.imagen
                          ? <img src={p.imagen} alt={p.nombre} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 16 }} />
                          : <div style={{ color: 'var(--gray-300)', fontSize: 12 }}>Sin imagen</div>}
                      </div>
                      <div className="card-body" style={{ padding: '14px 16px' }}>
                        <div className="card-marca" style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.marca}</div>
                        <div className="card-nombre" style={{ fontSize: 14, fontWeight: 600, color: 'var(--black)', marginBottom: 8, lineHeight: 1.3 }}>{p.nombre}</div>
                        <div className="card-sku" style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 10 }}>SKU: {p.sku}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                          <div className="card-precio" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: p.en_oferta ? '#DC2626' : 'var(--black)' }}>
                            ₡{p.precio.toLocaleString('es-CR')}
                          </div>
                          <div className="card-stock" style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: p.stock > 0 ? '#F0FDF4' : '#FEE2E2', color: p.stock > 0 ? '#16A34A' : '#DC2626', flexShrink: 0 }}>
                            {p.stock > 0 ? 'En stock' : 'Agotado'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {paginas > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 40 }}>
                  <button onClick={() => irAPagina(page - 1)} disabled={page <= 1}
                    style={{ padding: '10px 18px', borderRadius: 8, border: '1.5px solid var(--gray-200)', background: 'var(--white)', fontWeight: 600, fontSize: 14, cursor: page <= 1 ? 'not-allowed' : 'pointer', color: page <= 1 ? 'var(--gray-300)' : 'var(--black)' }}>
                    ← Anterior
                  </button>
                  <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>Página {page} de {paginas}</span>
                  <button onClick={() => irAPagina(page + 1)} disabled={page >= paginas}
                    style={{ padding: '10px 18px', borderRadius: 8, border: '1.5px solid var(--gray-200)', background: 'var(--white)', fontWeight: 600, fontSize: 14, cursor: page >= paginas ? 'not-allowed' : 'pointer', color: page >= paginas ? 'var(--gray-300)' : 'var(--black)' }}>
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
