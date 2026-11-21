export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { obtenerIp, rateLimit } from '@/lib/security'

export async function GET(request) {
  const ip = obtenerIp(request)
  if (!rateLimit(`estado-pedido:${ip}`, { limite: 20, ventanaMs: 10 * 60 * 1000 })) {
    return Response.json({ error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }, { status: 429 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const orden = searchParams.get('orden')
    const email = (searchParams.get('email') || '').trim().toLowerCase()

    if (!orden || !email) {
      return Response.json({ error: 'Numero de orden y correo requeridos' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    )

    const { data, error } = await supabase
      .from('pedidos')
      .select('numero_orden, nombre, apellido, total, estado, created_at, correo')
      .eq('numero_orden', orden)
      .single()

    // Mismo resultado si la orden no existe o si el correo no coincide: así no se
    // puede enumerar qué órdenes existen solo con el número.
    if (error || !data || (data.correo || '').trim().toLowerCase() !== email) {
      return Response.json({ pedido: null })
    }

    const { correo, ...pedido } = data
    return Response.json({ pedido })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error al buscar pedido' }, { status: 500 })
  }
}
