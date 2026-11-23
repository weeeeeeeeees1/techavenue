// Descripción y características generadas a partir del NOMBRE del producto, porque Divia no
// entrega descripción. Sin IA ni servicios externos: reglas deterministas sobre el nombre,
// así que no inventa datos (solo extrae lo que el nombre ya dice) y cuesta $0.

const TIPO_POR_SUB = {
  'placas-madre': 'Tarjeta madre',
  gpu: 'Tarjeta gráfica',
  cpu: 'Procesador',
  ram: 'Memoria RAM',
  almacenamiento: 'Unidad de almacenamiento',
  'fuentes-de-poder': 'Fuente de poder',
  gabinetes: 'Gabinete',
  refrigeracion: 'Sistema de enfriamiento',
  'pastas-termicas': 'Pasta térmica',
  'power-banks': 'Power bank',
  ups: 'UPS',
  redes: 'Equipo de red',
  'smart-home': 'Dispositivo smart home',
  laptops: 'Laptop',
  tablets: 'Tablet',
  licencias: 'Licencia de software',
}

const TIPO_POR_PERIFERICO = {
  Mouse: 'Mouse',
  Teclado: 'Teclado',
  Monitor: 'Monitor',
  Headset: 'Headset',
  'Audífonos': 'Audífonos',
  Webcam: 'Webcam',
  Parlantes: 'Parlantes',
  Silla: 'Silla gamer',
  Escritorio: 'Escritorio',
  'Micrófono': 'Micrófono',
}

function tipoProducto(p) {
  if (p.tipo_periferico && TIPO_POR_PERIFERICO[p.tipo_periferico]) return TIPO_POR_PERIFERICO[p.tipo_periferico]
  if (p.subcategoria && TIPO_POR_SUB[p.subcategoria]) return TIPO_POR_SUB[p.subcategoria]
  return null
}

// Capitaliza solo la primera letra (para colores, certificaciones, etc.).
function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s
}

// Extrae características del nombre. Cada patrón es opcional; solo se agrega si matchea.
export function caracteristicasDeNombre(nombreRaw) {
  const n = ' ' + (nombreRaw || '').toUpperCase() + ' '
  const out = []
  const add = (v) => { if (v && !out.includes(v)) out.push(v) }
  let m

  if ((m = n.match(/\s(\d{2,4})\s?W\b/))) add(`Potencia: ${m[1]} W`)
  if ((m = n.match(/\b(\d+)\s?(TB|GB)\b/))) add(`Capacidad: ${m[1]} ${m[2]}`)
  if ((m = n.match(/\b(DDR[2345])\b/))) add(`Tipo de memoria: ${m[1]}`)
  if ((m = n.match(/\b(\d{3,5})\s?MHZ\b/))) add(`Frecuencia: ${m[1]} MHz`)
  if ((m = n.match(/\b(\d{2,3})\s?HZ\b/))) add(`Tasa de refresco: ${m[1]} Hz`)
  if ((m = n.match(/\b(\d{2}(?:\.\d)?)\s?(?:"|PULGADAS|PULG)\b/))) add(`Tamaño de pantalla: ${m[1]}"`)
  if ((m = n.match(/\b(4K|2K|1440P|1080P|QHD|UHD|FHD)\b/))) add(`Resolución: ${m[1]}`)
  if ((m = n.match(/\b(\d+)\s?PUERTOS?\b/))) add(`Puertos: ${m[1]}`)
  if (/\bUSB[\s-]?C\b|\bTIPO[\s-]?C\b/.test(n)) add('Conector USB-C')
  if ((m = n.match(/\b(AM4|AM5|LGA\s?\d{3,4})\b/))) add(`Socket: ${m[1].replace(/\s/g, '')}`)
  if ((m = n.match(/\b(B[45][05]0|B[67][05]0|Z[678]90|Z890|H[4567][17]0|A[456][02]0|X[678]70)\b/))) add(`Chipset: ${m[1]}`)
  if ((m = n.match(/\b(MICRO[\s-]?ATX|MINI[\s-]?ITX|MATX|ATX|ITX)\b/))) add(`Factor de forma: ${m[1].replace(/\s/g, '-')}`)
  if ((m = n.match(/80\s?PLUS\s?(BRONZE|SILVER|GOLD|PLATINUM|TITANIUM|WHITE)/))) add(`Certificación: 80 Plus ${cap(m[1])}`)
  if ((m = n.match(/\b(\d+)\s?(?:NUCLEOS|N[UÚ]CLEOS|CORES)\b/))) add(`Núcleos: ${m[1]}`)
  if (/\bARGB\b/.test(n)) add('Iluminación ARGB')
  else if (/\bRGB\b/.test(n)) add('Iluminación RGB')
  if (/CARGA\s?R[AÁ]PIDA|FAST\s?CHARGE/.test(n)) add('Carga rápida')
  if (/INAL[AÁ]MBRIC|WIRELESS|BLUETOOTH|\b2\.4G\b/.test(n)) add('Conexión inalámbrica')
  if (/MEC[AÁ]NIC/.test(n)) add('Teclado/switches mecánicos')
  if ((m = n.match(/\b(NEGRO|BLANCO|GRIS|PLATA|PLATEAD[OA]|AZUL|ROJO|VERDE|ROSAD[OA]|MORAD[OA]|AMARILLO|NARANJA|DORAD[OA])\b/))) add(`Color: ${cap(m[1])}`)

  return out.slice(0, 8)
}

// Palabras de enlace que van en minúscula aunque sean cortas (no son siglas).
const MINUSCULAS = new Set(['DE', 'Y', 'A', 'CON', 'PARA', 'EN', 'LA', 'EL', 'DEL', 'POR', 'SIN'])

// Capitaliza un tipo (preserva siglas cortas como SD, HD, UPS, USB en mayúscula).
function tituloTipo(palabras) {
  return palabras
    .map((w, i) => {
      if (i > 0 && MINUSCULAS.has(w)) return w.toLowerCase()
      if (w.length <= 3 && /^[A-ZÁÉÍÓÚÑ]+$/.test(w)) return w
      const low = w.toLowerCase()
      return i === 0 ? low.charAt(0).toUpperCase() + low.slice(1) : low
    })
    .join(' ')
}

// Tipo tomado de las primeras palabras del nombre (en español suelen ser el sustantivo del
// producto: "TARJETA MADRE…", "MONITOR…", "CASE…"), cortando en la marca o el primer código.
// Más robusto que la categoría, que a veces se equivoca (p. ej. un case "SIN FUENTE DE PODER").
function tipoDesdeNombre(nombre, marca) {
  const marca0 = (marca || '').toUpperCase().trim().split(/\s+/)[0]
  const tipo = []
  for (const w of (nombre || '').toUpperCase().split(/\s+/).filter(Boolean)) {
    if (/\d/.test(w)) break
    if (!/[A-ZÁÉÍÓÚÑ]/.test(w)) break
    if (marca0 && w === marca0) break
    tipo.push(w)
    if (tipo.length >= 4) break
  }
  return tipo.length ? tituloTipo(tipo) : null
}

// Descripción completa: una intro contextual + la lista de características.
export function descripcionAuto(p) {
  const tipo = tipoDesdeNombre(p.nombre, p.marca) || tipoProducto(p)
  const marca = (p.marca || '').trim()
  const intro = tipo
    ? `${tipo}${marca ? ' ' + marca : ''} disponible en TechAvenue Costa Rica. Garantía oficial y envío a todo el país.`
    : 'Producto disponible en TechAvenue Costa Rica con garantía oficial y envío a todo el país.'
  return { intro, caracteristicas: caracteristicasDeNombre(p.nombre) }
}
