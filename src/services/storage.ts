import type { FixedCost, Profile } from '../types/finance'

const PROFILE_KEY = 'sfp.profile'
const FIXED_COSTS_KEY = 'sfp.fixed_costs'

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

export function getFixedCosts(): FixedCost[] {
  const saved = localStorage.getItem(FIXED_COSTS_KEY)
  if (!saved) return []
  try {
    const items = JSON.parse(saved) as FixedCost[]
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export function saveFixedCosts(costs: FixedCost[]): void {
  localStorage.setItem(FIXED_COSTS_KEY, JSON.stringify(costs))
}

export function saveFixedCostItem(cost: Omit<FixedCost, 'id' | 'createdAt'> & { id?: string }): FixedCost {
  const existing = getFixedCosts()
  const now = new Date().toISOString()

  if (cost.id) {
    const updated = existing.map((item) =>
      item.id === cost.id
        ? { ...item, ...cost, updatedAt: now }
        : item
    )
    saveFixedCosts(updated)
    return updated.find((i) => i.id === cost.id)!
  } else {
    const newCost: FixedCost = {
      ...cost,
      id: crypto.randomUUID ? crypto.randomUUID() : `fc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
