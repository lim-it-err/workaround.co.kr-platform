// The standalone '/' build has no host portal; integrated builds end in /advisor/.
export function platformHomePath(baseUrl = '/') {
  const base = String(baseUrl)
  if (!base.startsWith('/') || base.startsWith('//') || /[?#\\]/.test(base)) return null
  const normalized = base.endsWith('/') ? base : `${base}/`
  return normalized.endsWith('/advisor/') ? normalized.slice(0, -'advisor/'.length) : null
}
