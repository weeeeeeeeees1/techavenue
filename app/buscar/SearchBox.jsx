'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Caja de búsqueda (lo único interactivo de /buscar). Navega a /buscar?q=... y deja
// que el servidor haga la búsqueda y renderice los resultados.
export default function SearchBox({ query = '' }) {
  const router = useRouter()
  const [valor, setValor] = useState(query)

  const buscar = () => {
    if (valor.trim()) router.push('/buscar?q=' + encodeURIComponent(valor.trim()))
  }

  return (
    <div style={{ display: 'flex', gap: 10, maxWidth: 640 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }}
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={valor}
          onChange={e => setValor(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') buscar() }}
          type="text"
          placeholder="Nombre, marca o categoría..."
          style={{
            width: '100%', padding: '14px 16px 14px 46px', fontSize: 15,
            border: '1.5px solid var(--gray-200)', borderRadius: 8,
            outline: 'none', fontFamily: 'var(--font-body)',
            color: 'var(--black)', background: 'var(--white)',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--black)'}
          onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
        />
      </div>
      <button
        onClick={buscar}
        style={{
          background: 'var(--black)', color: '#fff', border: 'none',
          borderRadius: 8, padding: '0 24px', fontWeight: 600, fontSize: 14,
          cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
        }}
      >
        Buscar →
      </button>
    </div>
  )
}
