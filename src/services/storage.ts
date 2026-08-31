import type { FixedCost, PatrimonioData, Profile } from '../types/finance'

const PROFILE_KEY = 'sfp.profile'
const FIXED_COSTS_KEY = 'sfp.fixed_costs'
const CATEGORIES_KEY = 'sfp.categories'
const PATRIMONIO_KEY = 'sfp.patrimonio'

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

export const DEFAULT_PATRIMONIO: PatrimonioData = {
  ATIVOS: {
    'Ativo Circulante': {
      Disponibilidades: {
        'Dinheiro no bolso (Notas)': 0,
        'Contas correntes e poupança': 0,
        'Reserva de emergência': 0,
      },
      'Contas a Receber': {
        Salário: 0,
        'Renda Extra': 0,
      },
      Investimentos: {
        'Renda fixa': 0,
        'Renda variável': 0,
      },
    },
    'Passivos com valor': {
      Veículos: 0,
      Imóveis: 0,
      FGTS: 0,
    },
  },
  PASSIVOS: {
    'Passivo Circulante': {
      'Cartão de Crédito': 0,
      'Contas a pagar': 0,
      'Prestações e Empréstimos': 0,
      'Outros débitos a pagar': 0,
    },
    'Não Circulante': {
      'Financiamento de Imóvel': 0,
      'Financiamento de veículo': 0,
      'Prestações e Empréstimos': 0,
    },
    'Patrimônio Líquido': {
      'Seu patrimônio hoje': 0,
    },
  },
}

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

// ---------------- PATRIMÔNIO ---------------- //

export function getPatrimonioData(): PatrimonioData {
  const saved = localStorage.getItem(PATRIMONIO_KEY)
  if (!saved) return DEFAULT_PATRIMONIO
  try {
    const parsed = JSON.parse(saved) as PatrimonioData
    // Garante que a estrutura exista mesmo se sofrer migração parcial
    return {
      ATIVOS: {
        'Ativo Circulante': {
          Disponibilidades: {
            ...DEFAULT_PATRIMONIO.ATIVOS['Ativo Circulante'].Disponibilidades,
            ...(parsed.ATIVOS?.['Ativo Circulante']?.Disponibilidades || {}),
          },
          'Contas a Receber': {
            ...DEFAULT_PATRIMONIO.ATIVOS['Ativo Circulante']['Contas a Receber'],
            ...(parsed.ATIVOS?.['Ativo Circulante']?.['Contas a Receber'] || {}),
          },
          Investimentos: {
            ...DEFAULT_PATRIMONIO.ATIVOS['Ativo Circulante'].Investimentos,
            ...(parsed.ATIVOS?.['Ativo Circulante']?.Investimentos || {}),
          },
        },
        'Passivos com valor': {
          ...DEFAULT_PATRIMONIO.ATIVOS['Passivos com valor'],
          ...(parsed.ATIVOS?.['Passivos com valor'] || {}),
        },
      },
      PASSIVOS: {
        'Passivo Circulante': {
          ...DEFAULT_PATRIMONIO.PASSIVOS['Passivo Circulante'],
          ...(parsed.PASSIVOS?.['Passivo Circulante'] || {}),
        },
        'Não Circulante': {
          ...DEFAULT_PATRIMONIO.PASSIVOS['Não Circulante'],
          ...(parsed.PASSIVOS?.['Não Circulante'] || {}),
        },
        'Patrimônio Líquido': {
          'Seu patrimônio hoje': 0,
        },
      },
    }
  } catch {
    return DEFAULT_PATRIMONIO
  }
}

export function savePatrimonioData(data: PatrimonioData): void {
  localStorage.setItem(PATRIMONIO_KEY, JSON.stringify(data))
}

export function calculatePatrimonioTotals(data: PatrimonioData) {
  const disp = Object.values(data.ATIVOS['Ativo Circulante'].Disponibilidades).reduce(
    (a, b) => a + (Number(b) || 0),
    0
  )
  const contasRec = Object.values(data.ATIVOS['Ativo Circulante']['Contas a Receber']).reduce(
    (a, b) => a + (Number(b) || 0),
    0
  )
  const invest = Object.values(data.ATIVOS['Ativo Circulante'].Investimentos).reduce(
    (a, b) => a + (Number(b) || 0),
    0
  )
  const totalCirculanteAtivo = disp + contasRec + invest

  const passivosComValor = Object.values(data.ATIVOS['Passivos com valor']).reduce(
    (a, b) => a + (Number(b) || 0),
    0
  )

  const totalAtivos = totalCirculanteAtivo + passivosComValor

  const passivoCirculante = Object.values(data.PASSIVOS['Passivo Circulante']).reduce(
    (a, b) => a + (Number(b) || 0),
    0
  )
  const passivoNaoCirculante = Object.values(data.PASSIVOS['Não Circulante']).reduce(
    (a, b) => a + (Number(b) || 0),
    0
  )

  const totalPassivos = passivoCirculante + passivoNaoCirculante
  const patrimonioLiquido = totalAtivos - totalPassivos

  return {
    subtotals: {
      disponibilidades: disp,
      contasAReceber: contasRec,
      investimentos: invest,
      ativoCirculante: totalCirculanteAtivo,
      passivosComValor,
      passivoCirculante,
      passivoNaoCirculante,
    },
    totalAtivos,
    totalPassivos,
    patrimonioLiquido,
  }
}
