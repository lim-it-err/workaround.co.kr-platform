const LIVE_PAGE_PATHS = {
  junction: '/',
  simhub: '/sim',
  elevator: '/elevator',
  taxi: '/taxi',
  bloghub: '/blog-district',
  blogArchive: '/blog',
  writingStudio: '/studio',
  voyage: '/voyage',
  work: '/work',
  runtime: '/runtime'
}

export const STATIC_UNAVAILABLE_LIVE_PAGES = Object.freeze(['work', 'runtime', 'ops', 'signals'])

export function isStaticPageUnavailable(page) {
  return STATIC_UNAVAILABLE_LIVE_PAGES.includes(page)
}

export function normalizeBasePath(baseUrl = '/') {
  const value = String(baseUrl || '/').trim()
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

export function stripBasePath(pathname, baseUrl = '/') {
  const basePath = normalizeBasePath(baseUrl)
  const value = String(pathname || '/') || '/'
  if (basePath === '/') {
    return value.startsWith('/') ? value : `/${value}`
  }
  if (value === basePath.slice(0, -1)) {
    return '/'
  }
  if (!value.startsWith(basePath)) {
    return value.startsWith('/') ? value : `/${value}`
  }
  const relative = value.slice(basePath.length)
  return relative ? `/${relative}` : '/'
}

export function withBasePath(pathname, baseUrl = '/') {
  const basePath = normalizeBasePath(baseUrl)
  const relative = String(pathname || '/').replace(/^\/+/, '')
  return relative ? `${basePath}${relative}` : basePath
}

export function readLiveRoute(pathname, baseUrl = '/') {
  const path = stripBasePath(pathname, baseUrl).replace(/\/+$/, '') || '/'
  if (path === '/') {
    return null
  }
  if (path === '/blog') {
    return { page: 'blogArchive', slug: '' }
  }
  if (path.startsWith('/blog/')) {
    const rawSlug = path.slice('/blog/'.length)
    if (!rawSlug || rawSlug.includes('/')) {
      return { page: 'blogPost', slug: '' }
    }
    try {
      return { page: 'blogPost', slug: decodeURIComponent(rawSlug) }
    } catch (error) {
      return { page: 'blogPost', slug: '' }
    }
  }

  const match = Object.entries(LIVE_PAGE_PATHS).find(([, routePath]) => routePath === path)
  return match ? { page: match[0], slug: '' } : null
}

export function buildLivePath(page, slug = '', baseUrl = '/') {
  if (page === 'blogPost') {
    const postSlug = slug ? encodeURIComponent(slug) : '__not-found__'
    return withBasePath(`/blog/${postSlug}`, baseUrl)
  }
  return withBasePath(LIVE_PAGE_PATHS[page] || '/', baseUrl)
}
