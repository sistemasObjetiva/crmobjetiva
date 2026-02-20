import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Link,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet'
import {
  fetchEasyBrokerCollection,
  getEasyBrokerDisplayName,
  resolveEasyBrokerUrl,
  type EasyBrokerResource,
  type EasyBrokerItem,
} from '../../scripts/easybroker'

type ResourceKey = EasyBrokerResource

type SectionState = {
  items: EasyBrokerItem[]
  total?: number
  totalPages?: number
  page: number
  limit: number
  loading: boolean
  error: string | null
}

const PAGE_SIZE = 50

const createInitialSectionState = (): SectionState => ({
  items: [],
  total: undefined,
  totalPages: undefined,
  page: 1,
  limit: PAGE_SIZE,
  loading: false,
  error: null,
})

const initialSections: Record<ResourceKey, SectionState> = {
  properties: createInitialSectionState(),
  leads: createInitialSectionState(),
  agents: createInitialSectionState(),
}

const getSecondaryText = (item: EasyBrokerItem) => {
  const parts = [
    item?.email,
    item?.phone,
    item?.mobile,
    item?.property_type,
    item?.status,
    item?.operation_type,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' • ') : `ID: ${String(item?.id ?? item?.public_id ?? 'N/A')}`
}

const SectionList: React.FC<{
  title: string
  count: number
  total?: number
  page: number
  totalPages?: number
  loading: boolean
  error: string | null
  emptyText: string
  resource: ResourceKey
  items: EasyBrokerItem[]
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
}> = ({
  title,
  count,
  total,
  page,
  totalPages,
  loading,
  error,
  emptyText,
  resource,
  items,
  onPrev,
  onNext,
  canPrev,
  canNext,
}) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">{title}</Typography>
          <Chip label={typeof total === 'number' ? `Total ${total}` : `Mostrando ${count}`} color="primary" size="small" />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Página {page}{typeof totalPages === 'number' ? ` de ${totalPages}` : ''}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={onPrev} disabled={!canPrev || loading}>
              Anterior
            </Button>
            <Button size="small" variant="outlined" onClick={onNext} disabled={!canNext || loading}>
              Siguiente
            </Button>
          </Box>
        </Box>
        <Divider sx={{ mb: 1 }} />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={20} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        {!loading && items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {emptyText}
          </Typography>
        ) : (
          <List dense>
            {items.map((item, idx) => {
              const itemName = getEasyBrokerDisplayName(item)
              const url = resolveEasyBrokerUrl(resource, item)
              return (
                <ListItem key={`${String(item?.id ?? item?.public_id ?? idx)}`} sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Link href={url} target="_blank" rel="noreferrer" underline="hover">
                        {itemName}
                      </Link>
                    }
                    secondary={getSecondaryText(item)}
                  />
                </ListItem>
              )
            })}
          </List>
        )}
      </CardContent>
    </Card>
  )
}

const EasyBrokerPage: React.FC = () => {
  const [sectionsState, setSectionsState] = useState<Record<ResourceKey, SectionState>>(initialSections)

  const loadSection = async (resource: ResourceKey, page: number) => {
    setSectionsState(prev => ({
      ...prev,
      [resource]: {
        ...prev[resource],
        loading: true,
        error: null,
      },
    }))

    try {
      const result = await fetchEasyBrokerCollection(resource, { page, limit: PAGE_SIZE })
      setSectionsState(prev => ({
        ...prev,
        [resource]: {
          ...prev[resource],
          items: result.items,
          total: result.total,
          totalPages: result.totalPages,
          page: result.page ?? page,
          limit: result.limit ?? PAGE_SIZE,
          loading: false,
          error: null,
        },
      }))
    } catch (err: any) {
      setSectionsState(prev => ({
        ...prev,
        [resource]: {
          ...prev[resource],
          loading: false,
          error: err?.message ?? 'No se pudieron cargar los datos',
        },
      }))
    }
  }

  useEffect(() => {
    void Promise.all([
      loadSection('properties', 1),
      loadSection('leads', 1),
      loadSection('agents', 1),
    ])
  }, [])

  const anyLoading =
    sectionsState.properties.loading || sectionsState.leads.loading || sectionsState.agents.loading

  const sections = useMemo(
    () => [
      {
        title: 'Propiedades',
        resource: 'properties' as const,
        state: sectionsState.properties,
        emptyText: 'No hay propiedades disponibles en EasyBroker.',
      },
      {
        title: 'Leads',
        resource: 'leads' as const,
        state: sectionsState.leads,
        emptyText: 'No hay leads disponibles en EasyBroker.',
      },
      {
        title: 'Asesores',
        resource: 'agents' as const,
        state: sectionsState.agents,
        emptyText: 'No hay asesores disponibles en EasyBroker.',
      },
    ],
    [sectionsState]
  )

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SettingsEthernetIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>
          EasyBroker
        </Typography>
      </Box>

      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Vista de integración. Mostramos propiedades, leads y asesores de EasyBroker con vínculo directo por registro.
      </Typography>

      {anyLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' } }}>
        {sections.map((section) => {
          const state = section.state
          const canPrev = state.page > 1
          const canNext =
            typeof state.totalPages === 'number'
              ? state.page < state.totalPages
              : typeof state.total === 'number'
                ? state.page * state.limit < state.total
                : state.items.length >= state.limit

          return (
            <SectionList
              key={section.resource}
              title={section.title}
              count={state.items.length}
              total={state.total}
              page={state.page}
              totalPages={state.totalPages}
              loading={state.loading}
              error={state.error}
              emptyText={section.emptyText}
              resource={section.resource}
              items={state.items}
              canPrev={canPrev}
              canNext={canNext}
              onPrev={() => {
                if (canPrev) {
                  void loadSection(section.resource, state.page - 1)
                }
              }}
              onNext={() => {
                if (canNext) {
                  void loadSection(section.resource, state.page + 1)
                }
              }}
            />
          )
        })}
      </Box>
    </Box>
  )
}

export default EasyBrokerPage
