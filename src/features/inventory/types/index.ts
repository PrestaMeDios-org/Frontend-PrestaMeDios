// ─── Inventory / Catalog domain types ─────────────────────────────────────────
export interface Equipment {
  id: string
  name: string
  category: string
  available: boolean
  maintenance: boolean
  image: string
  specs: string
  maxDays: number
  code: string
  brand: string
  quantity: number
  available_count: number
  altaGama?: boolean
  sede?: "Ushuaia" | "Río Grande" | string
  locker?: number
  careRules?: string[]
  videoUrl?: string
}

export interface Category {
  id: string
  label: string
  color: string
}
