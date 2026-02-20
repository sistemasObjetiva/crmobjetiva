import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

type EasyBrokerResource = 'properties' | 'leads' | 'agents'

type RequestBody = {
  resource: EasyBrokerResource
  page?: number
  limit?: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const validResources: EasyBrokerResource[] = ['properties', 'leads', 'agents']

const upstreamPathByResource: Record<EasyBrokerResource, string> = {
  properties: 'properties',
  leads: 'contact_requests',
  agents: 'users',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const apiKey = Deno.env.get('EASYBROKER_API_KEY')
    if (!apiKey) {
      console.error('[easybroker-list] Missing EASYBROKER_API_KEY secret')
      return new Response(
        JSON.stringify({ error: 'Missing secret EASYBROKER_API_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let body: RequestBody
    try {
      body = (await req.json()) as RequestBody
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { resource, page = 1, limit = 50 } = body

    if (!resource || !validResources.includes(resource)) {
      return new Response(
        JSON.stringify({ error: 'Invalid resource. Use: properties | leads | agents' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Number(limit), 1), 50)
      : 50
    const safePage = Number.isFinite(page) ? Math.max(Number(page), 1) : 1

    const upstreamPath = upstreamPathByResource[resource]
    const easybrokerUrl = new URL(`https://api.easybroker.com/v1/${upstreamPath}`)
    easybrokerUrl.searchParams.set('page', String(safePage))
    easybrokerUrl.searchParams.set('limit', String(safeLimit))

    const ebRes = await fetch(easybrokerUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Authorization': apiKey,
      },
    })

    const contentType = ebRes.headers.get('content-type') || ''
    const rawText = await ebRes.text()

    console.log('[easybroker-list] upstream response', {
      resource,
      upstreamPath,
      status: ebRes.status,
      contentType,
    })

    if (!ebRes.ok) {
      console.error('[easybroker-list] upstream non-2xx', {
        resource,
        upstreamPath,
        status: ebRes.status,
        contentType,
        details: rawText.slice(0, 300),
      })
      return new Response(
        JSON.stringify({
          error: `EasyBroker request failed (${ebRes.status})`,
          contentType,
          details: rawText.slice(0, 1200),
        }),
        { status: ebRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!contentType.includes('application/json')) {
      console.error('[easybroker-list] upstream non-json', {
        resource,
        upstreamPath,
        contentType,
        details: rawText.slice(0, 300),
      })
      return new Response(
        JSON.stringify({
          error: 'EasyBroker returned non-JSON response',
          contentType,
          details: rawText.slice(0, 1200),
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let payload: any
    try {
      payload = JSON.parse(rawText)
    } catch {
      console.error('[easybroker-list] invalid upstream json', {
        resource,
        upstreamPath,
        contentType,
        details: rawText.slice(0, 300),
      })
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON received from EasyBroker',
          contentType,
          details: rawText.slice(0, 1200),
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const items = Array.isArray(payload?.content)
      ? payload.content
      : Array.isArray(payload?.data)
        ? payload.data
        : []

    const pagination = payload?.pagination ?? {}
    const total =
      typeof pagination?.total_items === 'number'
        ? pagination.total_items
        : typeof pagination?.total === 'number'
          ? pagination.total
          : typeof payload?.total === 'number'
            ? payload.total
            : undefined

    const totalPages =
      typeof pagination?.total_pages === 'number'
        ? pagination.total_pages
        : total && safeLimit
          ? Math.ceil(total / safeLimit)
          : undefined

    return new Response(
      JSON.stringify({
        items,
        total,
        totalPages,
        page: safePage,
        limit: safeLimit,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[easybroker-list] unhandled error', error)
    return new Response(
      JSON.stringify({
        error: (error as Error).message || 'Unexpected error',
        stack: (error as Error).stack,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
