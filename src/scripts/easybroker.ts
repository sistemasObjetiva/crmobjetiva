import { supabase } from '../config/supabase'

export type EasyBrokerResource = 'properties' | 'leads' | 'agents'

export type EasyBrokerItem = Record<string, any>

export interface EasyBrokerListResult {
  items: EasyBrokerItem[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}

export interface EasyBrokerDashboardData {
  properties: EasyBrokerListResult
  leads: EasyBrokerListResult
  agents: EasyBrokerListResult
}

export interface FetchEasyBrokerCollectionParams {
  page?: number
  limit?: number
}

const EASYBROKER_APP_BASE = 'https://app.easybroker.com'

export function resolveEasyBrokerUrl(resource: EasyBrokerResource, item: EasyBrokerItem): string {
  const directUrl =
    item?.public_url ??
    item?.url ??
    item?.link ??
    item?.permalink ??
    item?.share_url ??
    item?.portal_url

  if (typeof directUrl === 'string' && directUrl.trim().length > 0) {
    return directUrl
  }

  const id = String(item?.id ?? item?.public_id ?? item?.slug ?? '').trim()

  if (resource === 'properties') {
    return id ? `${EASYBROKER_APP_BASE}/properties?search=${encodeURIComponent(id)}` : `${EASYBROKER_APP_BASE}/properties`
  }

  if (resource === 'leads') {
    return id
      ? `${EASYBROKER_APP_BASE}/contact_requests?search=${encodeURIComponent(id)}`
      : `${EASYBROKER_APP_BASE}/contact_requests`
  }

  return id ? `${EASYBROKER_APP_BASE}/agents?search=${encodeURIComponent(id)}` : `${EASYBROKER_APP_BASE}/agents`
}

export async function fetchEasyBrokerCollection(
  resource: EasyBrokerResource,
  params: FetchEasyBrokerCollectionParams = {}
): Promise<EasyBrokerListResult> {
  const page = params.page ?? 1
  const limit = params.limit ?? 50

  const { data, error } = await supabase.functions.invoke('easybroker-list', {
    body: {
      resource,
      page,
      limit,
    },
  })

  if (error) {
    let details = ''
    const response = (error as any)?.context as Response | undefined

    if (response) {
      const status = response.status
      const statusText = response.statusText || ''
      try {
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const body = await response.json()
          const msg = body?.error || body?.message || JSON.stringify(body)
          details = `HTTP ${status} ${statusText} - ${msg}`.trim()
        } else {
          const text = await response.text()
          details = `HTTP ${status} ${statusText} - ${text}`.trim()
        }
      } catch {
        details = `HTTP ${status} ${statusText}`.trim()
      }
    }

    const baseMessage = error.message || `No se pudo obtener ${resource} de EasyBroker`
    throw new Error(details ? `${baseMessage}. ${details}` : baseMessage)
  }

  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : []

  return {
    items,
    total: typeof data?.total === 'number' ? data.total : undefined,
    page: typeof data?.page === 'number' ? data.page : undefined,
    limit: typeof data?.limit === 'number' ? data.limit : undefined,
    totalPages: typeof data?.totalPages === 'number' ? data.totalPages : undefined,
  }
}

export async function fetchEasyBrokerDashboardData(limit = 50): Promise<EasyBrokerDashboardData> {
  const [properties, leads, agents] = await Promise.all([
    fetchEasyBrokerCollection('properties', { page: 1, limit }),
    fetchEasyBrokerCollection('leads', { page: 1, limit }),
    fetchEasyBrokerCollection('agents', { page: 1, limit }),
  ])

  return {
    properties,
    leads,
    agents,
  }
}

export function getEasyBrokerDisplayName(item: EasyBrokerItem): string {
  return (
    item?.title ??
    item?.name ??
    item?.full_name ??
    item?.email ??
    item?.public_id ??
    item?.id ??
    'Sin nombre'
  )
}
