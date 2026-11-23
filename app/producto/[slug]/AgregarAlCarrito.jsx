'use client'
import { useState } from 'react'
import { useCarrito } from '@/context/CartContext'
import { useToast } from '@/components/Toast'

// Isla cliente: el único trozo interactivo de la página de producto (el resto se
// renderiza en el servidor). Recibe el producto ya cargado como prop.
export default function AgregarAlCarrito({ producto }) {
  const { agregar } = useCarrito()
  const { mostrar } = useToast()
  const [agregado, setAgregado] = useState(false)

  const handleAgregar = () => {
    agregar(producto)
    mostrar(`${producto.nombre} agregado al carrito`)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2200)
  }

  return (
    <button
      onClick={handleAgregar}
      disabled={producto.stock === 0 || agregado}
      style={{
        display: 'block',
        width: '100%',
        padding: '14px 24px',
        background: agregado ? '#16A34A' : producto.stock === 0 ? 'var(--gray-200)' : 'var(--black)',
        color: producto.stock === 0 ? 'var(--gray-400)' : 'var(--white)',
        border: 'none',
        borderRadius: 8,
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 15,
        cursor: producto.stock === 0 || agregado ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
        marginBottom: 12,
      }}
    >
      {agregado ? '+ Agregado al carrito' : producto.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
    </button>
  )
}
