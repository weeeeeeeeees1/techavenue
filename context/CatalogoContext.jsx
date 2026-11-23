'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { mapearProducto } from '@/lib/catalogo'

const CatalogoContext = createContext({ productos: [], loading: true })

const CACHE_KEY = 'ta_catalog_v4'
const CACHE_TTL = 15 * 60 * 1000 // 15 min

function slimForCache(p) {
  return {
    id: p.id, sku: p.sku, partNumber: p.partNumber,
    nombre: p.nombre, marca: p.marca,
    precio: p.precio, precio_original: p.precio_original,
    stock: p.stock, imagen: p.imagen, en_oferta: p.en_oferta,
    categoria: p.categoria, subcategoria: p.subcategoria,
    tipo_periferico: p.tipo_periferico,
  }
}

export function CatalogoProvider({ children }) {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mostrar caché de localStorage instantáneamente si existe y es fresca
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const { ts, data } = JSON.parse(raw)
        if (Date.now() - ts < CACHE_TTL) {
          setProductos(data)
          setLoading(false)
        }
      }
    } catch {}

    // Siempre refrescar del API en background
    fetch('/api/catalogo-externo')
      .then(r => r.json())
      .then(({ datos }) => {
        const mapeados = (datos?.data || []).map(mapearProducto).filter(Boolean)
        setProductos(mapeados)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: mapeados.map(slimForCache) }))
        } catch {}
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <CatalogoContext.Provider value={{ productos, loading }}>
      {children}
    </CatalogoContext.Provider>
  )
}

export function useCatalogo() {
  return useContext(CatalogoContext)
}
