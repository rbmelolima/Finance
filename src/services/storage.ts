import type { FixedCost, Profile } from '../types/finance'

const PROFILE_KEY = 'sfp.profile'
const FIXED_COSTS_KEY = 'sfp.fixed_costs'
const CATEGORIES_KEY = 'sfp.categories'

export const DEFAULT_CATEGORIES = [
  'Habitação',
  'Transporte',
  'Assinatura',
  'Serviços',
  'Alimentação',
  'Saúde',
  'Educação',
  'Outros',
]

export function getSavedProfile(): Profile | null {
  const saved = localStorage.getItem(PROFILE_KEY)
  if (!saved) return null
  try {
    const profile = JSON.parse(saved) as Profile
    return profile.name && profile.email ? profile : null
  } catch {
    return null
  }
}

export function saveProfile(profile: Profile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY)
}

export function getCategories(): string[] {
  const saved = localStorage.getItem(CATEGORIES_KEY)
  if (!saved) return DEFAULT_CATEGORIES
  try {
    const parsed = JSON.parse(saved) as string[]
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Garantir união de padrão com personalizados
      const set = new Set([...DEFAULT_CATEGORIES, ...parsed])
      return Array.from(set)
    }
    return DEFAULT_CATEGORIES
  } catch {
    return DEFAULT_CATEGORIES
  }
}

export function saveCategories(categories: string[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}

export function addCategory(newCategory: string): string[] {
  const trimmed = newCategory.trim()
  if (!trimmed) return getCategories()
  const current = getCategories()
  if (!current.includes(trimmed)) {
    const updated = [...current, trimmed]
    saveCategories(updated)
    return updated
  }
  return current
}

export function getFixedCosts(): FixedCost[] {
  const saved = localStorage.getItem(FIXED_COSTS_KEY)
  if (!saved) return []
  try {
    const items = JSON.parse(saved) as FixedCost[]
    if (Array.isArray(items)) {
      return items.map((item) => ({
        ...item,
        category: item.category || 'Outros',
      }))
    }
    return []
  } catch {
    return []
  }
}

export function saveFixedCosts(costs: FixedCost[]): void {
  localStorage.setItem(FIXED_COSTS_KEY, JSON.stringify(costs))
}

export function saveFixedCostItem(
  cost: Omit<FixedCost, 'id' | 'createdAt'> & { id?: string }
): FixedCost {
  const existing = getFixedCosts()
  const now = new Date().toISOString()
  const category = cost.category?.trim() || 'Outros'

  // Garante que a categoria seja salva na lista global se for nova
  addCategory(category)

  if (cost.id) {
    const updated = existing.map((item) =>
      item.id === cost.id ? { ...item, ...cost, category, updatedAt: now } : item
    )
    saveFixedCosts(updated)
    return updated.find((i) => i.id === cost.id)!
  } else {
    const newCost: FixedCost = {
      ...cost,
      category,
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `fc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
    }
    const updated = [newCost, ...existing]
    saveFixedCosts(updated)
    return newCost
  }
}

export function deleteFixedCostItem(id: string): void {
  const existing = getFixedCosts()
  const filtered = existing.filter((item) => item.id !== id)
  saveFixedCosts(filtered)
}
