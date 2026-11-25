// Normalización y categorización de productos del catálogo externo (Divia).
// Compartido por el contexto cliente (CatalogoContext) y la ingesta de servidor (lib/divia).
// Módulo puro (sin React ni APIs del navegador): se puede importar desde rutas de servidor.

// Categoriza productos por palabras clave en el nombre
// Divia no tiene subcategorías consistentes (96% son null)
function n(str) {
  return (' ' + (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() + ' ')
}

export function detectarCategoria(nombreRaw, marcaRaw) {
  const nombre = n(nombreRaw)
  const marca  = n(marcaRaw)

  const tiene = (...kw) => kw.some(k => nombre.includes(n(k).trim()))

  // ── Computadoras ────────────────────────────────────────────────
  if (tiene('laptop', 'notebook') && !tiene('soporte', 'base para laptop', 'cooler para laptop', 'mochila', 'maletín', 'funda'))
    return { categoria: 'computadoras', subcategoria: 'laptops', tipo_periferico: null }
  if (tiene('tablet', 'ipad') && !tiene('soporte para tablet'))
    return { categoria: 'computadoras', subcategoria: 'tablets', tipo_periferico: null }
  if (tiene('celular', 'smartphone', 'smart watch', 'smartwatch'))
    return { categoria: 'computadoras', subcategoria: 'tablets', tipo_periferico: null }
  if (tiene('all in one', 'all-in-one', 'mini pc', 'mini-pc', 'computadora de escritorio', 'pc de escritorio', 'computadora armada', 'pc armada'))
    return { categoria: 'computadoras', subcategoria: null, tipo_periferico: null }

  // ── Componentes — Placa madre (ANTES de RAM/almacenamiento) ──────
  // Los nombres de placas suelen incluir el tipo de RAM (DDR4/DDR5), el socket y "M.2",
  // así que si esto no va primero caían en RAM o almacenamiento. Señales: palabra explícita,
  // o socket + factor de forma (combinación casi exclusiva de placas madre).
  if (tiene('placa madre', 'tarjeta madre', 'motherboard', 'mainboard', ' mobo ') ||
      (tiene('am4', 'am5', 'lga1700', 'lga1200', 'lga1151', 'lga1156', 'lga1851', 'socket am', 'socket lga') &&
       tiene('atx', 'micro-atx', 'micro atx', 'matx', 'm-atx', 'mini-itx', 'mini itx', ' itx ')))
    return { categoria: 'componentes', subcategoria: 'placas-madre', tipo_periferico: null }

  // ── Componentes — GPU ────────────────────────────────────────────
  if (tiene('tarjeta de video', 'tarjeta grafica', 'video card', 'graphics card') ||
      tiene('rtx', 'gtx', 'geforce', 'radeon rx', 'arc a') ||
      (tiene('radeon') && !tiene('laptop')))
    return { categoria: 'componentes', subcategoria: 'gpu', tipo_periferico: null }

  // ── Componentes — CPU ────────────────────────────────────────────
  if (tiene('procesador', 'processor') ||
      tiene('core i3', 'core i5', 'core i7', 'core i9', 'core ultra') ||
      tiene('ryzen 3', 'ryzen 5', 'ryzen 7', 'ryzen 9', 'ryzen threadripper') ||
      tiene('athlon', 'pentium gold', 'celeron'))
    return { categoria: 'componentes', subcategoria: 'cpu', tipo_periferico: null }

  // ── Componentes — Gabinete / case (ANTES de RAM y fuente) ────────
  // Los nombres de cases suelen decir "SIN/CON FUENTE DE PODER" (caían en fuentes) o traen
  // palabras como "MASTERFRAME" que matchean 'ram' por substring. Anclamos al inicio del
  // nombre para no robar los ventiladores DE case (esos empiezan con "VENTILADOR…").
  if (/^\s*(case|gabinete|chasis)\b/.test(nombre) ||
      tiene('tower pc', 'mid tower', 'mini tower', 'full tower', 'case atx', 'case matx', 'case itx'))
    return { categoria: 'componentes', subcategoria: 'gabinetes', tipo_periferico: null }

  // ── Componentes — RAM ────────────────────────────────────────────
  // /\bram\b/ en vez de ' ram ': el helper recorta los espacios del keyword, así que 'ram'
  // matchearía dentro de palabras como "masterframe".
  if (tiene('memoria ram', 'ddr5', 'ddr4', 'ddr3', 'sodimm', 'so-dimm') || /\bram\b/.test(nombre))
    return { categoria: 'componentes', subcategoria: 'ram', tipo_periferico: null }

  // ── Accesorios — Externo / USB (antes de almacenamiento interno) ─
  if (tiene('disco externo', 'disco duro externo', 'ssd externo', 'hdd externo', 'disco portatil', 'hd externo', 'hd solido externo'))
    return { categoria: 'accesorios', subcategoria: null, tipo_periferico: null }
  if (tiene('memoria usb', 'pendrive', 'pen drive', 'micro sd', 'microsd', ' sd card', 'memoria flash'))
    return { categoria: 'accesorios', subcategoria: null, tipo_periferico: null }

  // ── Componentes — Almacenamiento interno ─────────────────────────
  if (tiene('disco ssd', 'ssd m.2', 'ssd 2.5', 'nvme', ' ssd ', 'disco duro interno', 'disco interno', 'hd interno') ||
      (tiene('hdd') && !tiene('externo')))
    return { categoria: 'componentes', subcategoria: 'almacenamiento', tipo_periferico: null }

  // ── Componentes — Fuente de poder ────────────────────────────────
  if (tiene('fuente de poder', 'fuente poder', 'power supply', ' psu ', 'fuente atx'))
    return { categoria: 'componentes', subcategoria: 'fuentes-de-poder', tipo_periferico: null }

  // ── Componentes — Pasta térmica ──────────────────────────────────
  if (tiene('pasta termica', 'thermal paste', 'thermal pad', 'parche termico', 'pasta conductora'))
    return { categoria: 'componentes', subcategoria: 'pastas-termicas', tipo_periferico: null }

  // ── Componentes — Refrigeración ──────────────────────────────────
  if (tiene('liquid cooling', 'water cooling', 'enfriamiento liquido', 'enfriamiento de aire', 'aio cooler', 'disipador cpu', 'cooler cpu', 'cooler procesador') ||
      (tiene('ventilador', 'abanico', ' fan ') && tiene('pc', 'case', 'cpu', 'gamer', '120mm', '140mm', '200mm', 'argb', 'rgb', 'pwm')))
    return { categoria: 'componentes', subcategoria: 'refrigeracion', tipo_periferico: null }

  // ── Periféricos — Monitor ────────────────────────────────────────
  if (tiene('monitor') && !tiene('soporte para monitor', 'brazo monitor', 'base monitor'))
    return { categoria: 'perifericos', subcategoria: null, tipo_periferico: 'Monitor' }

  // ── Periféricos — Mouse ──────────────────────────────────────────
  if (tiene('mouse pad', 'mousepad', 'pad mouse'))
    return { categoria: 'perifericos', subcategoria: null, tipo_periferico: 'Mouse' }
  if ((tiene('mouse') || tiene('raton ')) && !tiene('teclado'))
    return { categoria: 'perifericos', subcategoria: null, tipo_periferico: 'Mouse' }

  // ── Periféricos — Teclado ────────────────────────────────────────
  if (tiene('teclado', 'keyboard', 'combo teclado'))
    return { categoria: 'perifericos', subcategoria: null, tipo_periferico: 'Teclado' }

  // ── Periféricos — Headset ────────────────────────────────────────
  if (tiene('headset') || (tiene('audifono', 'audifonos', 'auricular') && tiene('gamer', 'gaming')))
    return { categoria: 'perifericos', subcategoria: null, tipo_periferico: 'Headset' }

  // ── Periféricos — Audífonos ──────────────────────────────────────
  if (tiene('audifono', 'audifonos', 'earphone', 'earbuds', 'in-ear', 'over-ear', 'auricular', 'inalambrico') && !tiene('gamer', 'gaming'))
    return { categoria: 'perifericos', subcategoria: null, tipo_periferico: 'Audífonos' }

  // ── Periféricos — Webcam ─────────────────────────────────────────
  if (tiene('webcam', 'web cam', 'camara web', 'camara usb hd'))
    return { categoria: 'perifericos', subcategoria: null, tipo_periferico: 'Webcam' }

  // ── Periféricos — Micrófono ──────────────────────────────────────
  if (tiene('microfono', 'microphone'))
    return { categoria: 'perifericos', subcategoria: null, tipo_periferico: 'Micrófono' }

  // ── Periféricos — Parlantes ──────────────────────────────────────
  if (tiene('parlante', 'bocina', ' speaker', 'barra de sonido', 'soundbar', 'barra sonido'))
    return { categoria: 'perifericos', subcategoria: null, tipo_periferico: 'Parlantes' }

  // ── Periféricos — Silla ──────────────────────────────────────────
  if (tiene('silla') && tiene('gamer', 'gaming', 'ergonomica', 'oficina'))
    return { categoria: 'perifericos', subcategoria: null, tipo_periferico: 'Silla' }

  // ── Periféricos — Escritorio ─────────────────────────────────────
  if ((tiene('escritorio', 'desk', 'mesa') && tiene('gamer', 'gaming')))
    return { categoria: 'perifericos', subcategoria: null, tipo_periferico: 'Escritorio' }

  // ── Energía — UPS ────────────────────────────────────────────────
  if (tiene(' ups ') || (tiene('respaldo') && tiene('electrico', 'bateria')) || tiene('no-break', 'nobreak'))
    return { categoria: 'energia-y-conectividad', subcategoria: 'ups', tipo_periferico: null }

  // ── Energía — Power Bank ─────────────────────────────────────────
  if (tiene('power bank', 'powerbank', 'bateria portatil', 'cargador portatil', 'banco de energia', 'banco energia'))
    return { categoria: 'energia-y-conectividad', subcategoria: 'power-banks', tipo_periferico: null }

  // ── Energía — Redes ──────────────────────────────────────────────
  if (tiene('router', ' switch ', 'access point', 'punto de acceso', 'adaptador wifi', 'tarjeta de red', 'usb wifi', 'antena wifi', 'extensor wifi', 'repetidor wifi', 'cable de red', 'cable ethernet', 'cable utp', 'cable rj45'))
    return { categoria: 'energia-y-conectividad', subcategoria: 'redes', tipo_periferico: null }

  // ── Energía — Smart Home ─────────────────────────────────────────
  if (tiene('smart home', 'foco inteligente', 'bombillo inteligente', 'smart bulb', 'smart plug', 'enchufe inteligente'))
    return { categoria: 'energia-y-conectividad', subcategoria: 'smart-home', tipo_periferico: null }

  // ── Streaming y Gaming ───────────────────────────────────────────
  if (tiene('capturadora', 'capture card', 'stream deck', 'elgato'))
    return { categoria: 'streaming-y-gaming', subcategoria: 'streaming', tipo_periferico: null }
  if ((tiene('volante') && tiene('racing', 'gamer', 'gaming')) || tiene('sim racing', 'playseat', 'fanatec', 'thrustmaster'))
    return { categoria: 'streaming-y-gaming', subcategoria: 'sim-racing', tipo_periferico: null }

  // ── Software ─────────────────────────────────────────────────────
  if (tiene('windows 10', 'windows 11', 'microsoft 365', 'office 365', 'office 2021', 'office 2019', 'licencia windows', 'licencia office', 'licencia antivirus') ||
      (tiene('licencia') && tiene('software', 'antivirus')))
    return { categoria: 'software', subcategoria: null, tipo_periferico: null }

  // ── Hogar ────────────────────────────────────────────────────────
  if (tiene('impresora', 'printer', 'multifuncional', 'escaner', 'scanner') ||
      (tiene('tinta', 'toner', 'cartucho') && !tiene('bateria')))
    return { categoria: 'hogar', subcategoria: null, tipo_periferico: null }
  if (tiene('camara de seguridad', 'camara ip', ' cctv', ' dvr ', ' nvr '))
    return { categoria: 'hogar', subcategoria: null, tipo_periferico: null }

  // ── Accesorios ───────────────────────────────────────────────────
  if (tiene('cable ', 'adaptador', 'convertidor', ' hub ', 'docking', 'dock station') ||
      tiene('soporte ', 'brazo ') ||
      tiene('mochila', 'maletin', 'maletín', 'funda laptop', 'bolso laptop') ||
      tiene('cargador', 'carga rapida') ||
      tiene('limpiador pantalla', 'spray limpia'))
    return { categoria: 'accesorios', subcategoria: null, tipo_periferico: null }

  // Sin categoría reconocida — se muestra igual bajo "Otros" en vez de ocultarse
  // (así el buscador y el link directo al producto siempre funcionan)
  return { categoria: 'otros', subcategoria: null, tipo_periferico: null }
}

export function mapearProducto(p) {
  const cats = detectarCategoria(p.nombre, p.marca)
  if (!cats) return null

  const { categoria, subcategoria, tipo_periferico } = cats
  const imageUrl = Array.isArray(p.imageUrls)
    ? p.imageUrls[0]
    : typeof p.imageUrls === 'string' ? p.imageUrls : null

  // Divia marca las ofertas en el campo total_oferta (TotalOferta), NO en isInOffer:
  // en la práctica isInOffer siempre llega en 0, pero cuando el producto tiene descuento
  // viene TotalOferta con el precio rebajado (menor que Total). Así que detectamos la
  // oferta comparando: hay oferta si TotalOferta es un número válido y menor que Total.
  const total = Math.round(p.Total || 0)
  const totalOferta = p.TotalOferta != null ? Math.round(p.TotalOferta) : null
  const enOferta = totalOferta != null && totalOferta > 0 && totalOferta < total

  return {
    id: p.id,
    sku: p.sku,
    partNumber: p.partNumber,
    nombre: p.nombre,
    detalle: p.detalle,
    marca: p.marca || '',
    precio: enOferta ? totalOferta : total,
    precio_original: enOferta ? total : null,
    stock: p.stock || 0,
    imagen: imageUrl,
    en_oferta: enOferta,
    categoria,
    subcategoria,
    tipo_periferico,
  }
}
