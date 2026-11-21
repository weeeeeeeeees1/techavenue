const SITE = 'https://techavenuecr.com'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Páginas privadas/transaccionales: sin valor SEO y no deben indexarse.
        disallow: ['/admin', '/api/', '/checkout', '/carrito', '/orden-confirmada', '/estado-pedido'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
