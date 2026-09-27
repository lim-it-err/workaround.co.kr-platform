const HOP_BY_HOP_HEADERS = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

function apiOrigin(value) {
  if (!value) {
    throw new Error('API_ORIGIN is not configured')
  }

  const origin = new URL(value)
  if (origin.protocol !== 'https:') {
    throw new Error('API_ORIGIN must use https')
  }

  return origin
}

export async function onRequest({ request, env }) {
  try {
    const incoming = new URL(request.url)
    const target = apiOrigin(env.API_ORIGIN)
    target.pathname = incoming.pathname
    target.search = incoming.search

    const requestHeaders = new Headers(request.headers)
    requestHeaders.delete('host')
    for (const name of HOP_BY_HOP_HEADERS) {
      requestHeaders.delete(name)
    }
    requestHeaders.set('x-forwarded-host', incoming.host)
    requestHeaders.set('x-forwarded-proto', 'https')

    const upstream = await fetch(target.toString(), {
      method: request.method,
      headers: requestHeaders,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    })

    const responseHeaders = new Headers(upstream.headers)
    for (const name of HOP_BY_HOP_HEADERS) {
      responseHeaders.delete(name)
    }
    responseHeaders.set('cache-control', 'no-store')

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error('Pages API proxy failed', error instanceof Error ? error.message : error)
    return jsonError(503, 'API temporarily unavailable')
  }
}
