type EasyBrokerResource = 'properties' | 'leads' | 'agents'

interface RequestBody {
  resource: EasyBrokerResource
  limit?: number
  page?: number
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const EASYBROKER_API_KEY = Deno.env.get('EASYBROKER_API_KEY')
    if (!EASYBROKER_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing EASYBROKER_API_KEY secret' }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json()) as RequestBody
    const resource = body.resource
    const limit = Number(body.limit ?? 100)
    const page = Number(body.page ?? 1)

    if (!resource || !['properties', 'leads', 'agents'].includes(resource)) {
      return new Response(JSON.stringify({ error: 'Invalid resource' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const endpoint = `https://api.easybroker.com/v1/${resource}?page=${page}&limit=${limit}`
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': EASYBROKER_API_KEY,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      return new Response(JSON.stringify({ error: `EasyBroker error: ${response.status}`, details: text }), {
        status: response.status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const raw = await response.json()
    const items = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw?.data) ? raw.data : []

    return new Response(
      JSON.stringify({
        items,
        total: typeof raw?.pagination?.total_items === 'number' ? raw.pagination.total_items : undefined,
        page,
        limit,
      }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
