import type { PageProps } from '@react-pdf/renderer'

export const safeMoney = (n: number) =>
  '$' + (Number(n) || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export function getMonthLabels(start: Date, count: number) {
  const labels: string[] = []
  const date = new Date(start)
  for (let i = 0; i < count; i++) {
    const label = `${date.toLocaleString('es-MX', { month: 'short', year: 'numeric' })}`
    labels.push(label[0].toUpperCase() + label.slice(1))
    date.setMonth(date.getMonth() + 1)
  }
  return labels
}

export type PDFPageSize = PageProps['size']

// --- Type guard para tupla [number, number]
function isTupleSize(x: unknown): x is [number, number] {
  return Array.isArray(x)
    && x.length === 2
    && typeof x[0] === 'number'
    && typeof x[1] === 'number'
}

export function getPageHeightPts(size: PDFPageSize): number {
  // Portrait por defecto
  if (size === 'A4') return 842
  if (size === 'LETTER') return 792

  if (isTupleSize(size)) {
    return size[1] // height
  }

  // Fallback seguro
  return 842
}

export function getPageTopBottom() {
  // Debe igualar paddings de styles.page
  return 28 + 28
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export function styleArr(...args: any[]) {
  return args.filter(Boolean)
}
