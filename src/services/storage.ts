import type { AppBackupData, BankAccount, CreditCard, FixedCost, PatrimonioData, Profile } from '../types/finance'

const PROFILE_KEY = 'sfp.profile'
const FIXED_COSTS_KEY = 'sfp.fixed_costs'
const CATEGORIES_KEY = 'sfp.categories'
const PATRIMONIO_KEY = 'sfp.patrimonio'
const BANK_ACCOUNTS_KEY = 'sfp.bank_accounts'
const CREDIT_CARDS_KEY = 'sfp.credit_cards'


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

// ---------------- CONTAS BANCÁRIAS (VISÃO GERAL) ---------------- //

export function getBankAccounts(): BankAccount[] {
  const saved = localStorage.getItem(BANK_ACCOUNTS_KEY)
  if (!saved) return []
  try {
    const items = JSON.parse(saved) as BankAccount[]
    if (Array.isArray(items)) {
      return items
    }
    return []
  } catch {
    return []
  }
}

export function saveBankAccounts(accounts: BankAccount[]): void {
  localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function saveBankAccountItem(
  account: Omit<BankAccount, 'id' | 'createdAt'> & { id?: string }
): BankAccount {
  const existing = getBankAccounts()
  const now = new Date().toISOString()

  if (account.id) {
    const updated = existing.map((item) =>
      item.id === account.id ? { ...item, ...account, updatedAt: now } : item
    )
    saveBankAccounts(updated)
    return updated.find((i) => i.id === account.id)!
  } else {
    const newAccount: BankAccount = {
      ...account,
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `acc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
    }
    const updated = [newAccount, ...existing]
    saveBankAccounts(updated)
    return newAccount
  }
}

export function updateBankAccountBalance(id: string, newBalance: number): void {
  const existing = getBankAccounts()
  const updated = existing.map((item) =>
    item.id === id ? { ...item, balance: Number(newBalance) || 0, updatedAt: new Date().toISOString() } : item
  )
  saveBankAccounts(updated)
}

export function deleteBankAccountItem(id: string): void {
  const existing = getBankAccounts()
  const filtered = existing.filter((item) => item.id !== id)
  saveBankAccounts(filtered)
}

// ---------------- CARTÕES DE CRÉDITO (VISÃO GERAL) ---------------- //

export function getCreditCards(): CreditCard[] {
  const saved = localStorage.getItem(CREDIT_CARDS_KEY)
  if (!saved) return []
  try {
    const items = JSON.parse(saved) as CreditCard[]
    if (Array.isArray(items)) {
      return items
    }
    return []
  } catch {
    return []
  }
}

export function saveCreditCards(cards: CreditCard[]): void {
  localStorage.setItem(CREDIT_CARDS_KEY, JSON.stringify(cards))
}

export function saveCreditCardItem(
  card: Omit<CreditCard, 'id' | 'createdAt'> & { id?: string }
): CreditCard {
  const existing = getCreditCards()
  const now = new Date().toISOString()

  if (card.id) {
    const updated = existing.map((item) =>
      item.id === card.id ? { ...item, ...card, updatedAt: now } : item
    )
    saveCreditCards(updated)
    return updated.find((i) => i.id === card.id)!
  } else {
    const newCard: CreditCard = {
      ...card,
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `card_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
    }
    const updated = [newCard, ...existing]
    saveCreditCards(updated)
    return newCard
  }
}

export function updateCreditCardInvoice(id: string, newInvoiceAmount: number): void {
  const existing = getCreditCards()
  const updated = existing.map((item) =>
    item.id === id ? { ...item, invoiceAmount: Number(newInvoiceAmount) || 0, updatedAt: new Date().toISOString() } : item
  )
  saveCreditCards(updated)
}

export function deleteCreditCardItem(id: string): void {
  const existing = getCreditCards()
  const filtered = existing.filter((item) => item.id !== id)
  saveCreditCards(filtered)
}

// ---------------- CÁLCULOS DA CARTEIRA & INSIGHTS ---------------- //

export function calculateCarteiraTotals(accounts: BankAccount[], cards: CreditCard[]) {
  const totalMoneyInAccounts = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0)
  const totalCreditCardsToPay = cards.reduce((acc, c) => acc + (Number(c.invoiceAmount) || 0), 0)
  const netRealBalance = totalMoneyInAccounts - totalCreditCardsToPay

  const commitmentRatio = totalMoneyInAccounts > 0
    ? (totalCreditCardsToPay / totalMoneyInAccounts) * 100
    : totalCreditCardsToPay > 0 ? 100 : 0

  // Dias até o final do mês
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-11
  const currentDay = now.getDate()
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate()
  // Incluindo o dia de hoje para o rateio do período restante
  const daysRemainingInMonth = Math.max(1, totalDaysInMonth - currentDay + 1)

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]
  const currentMonthName = monthNames[month]

  // Gasto diário e semanal que o usuário pode ter até zerar o saldo positivo no final do mês
  const dailyAvailable = netRealBalance > 0 ? netRealBalance / daysRemainingInMonth : 0
  const weeklyAvailable = dailyAvailable * Math.min(7, daysRemainingInMonth)

  // Cobertura de faturas (ex: 2.5x)
  const coverageRatio = totalCreditCardsToPay > 0
    ? totalMoneyInAccounts / totalCreditCardsToPay
    : totalMoneyInAccounts > 0 ? 99 : 0

  // Maior conta
  const sortedAccounts = [...accounts].sort((a, b) => (Number(b.balance) || 0) - (Number(a.balance) || 0))
  const largestAccount = sortedAccounts[0] || null

  // Maior fatura
  const sortedCards = [...cards].sort((a, b) => (Number(b.invoiceAmount) || 0) - (Number(a.invoiceAmount) || 0))
  const largestCard = sortedCards[0] || null

  // Próximo cartão a fechar a fatura
  const cardsWithClosingDay = cards
    .filter((c) => c.closingDay !== undefined && c.closingDay !== null && Number(c.closingDay) > 0)
    .map((c) => {
      const closing = Number(c.closingDay)
      let diff = closing - currentDay
      if (diff < 0) diff += totalDaysInMonth
      const daysUntilClosing = Math.max(1, diff + 1)
      return { card: c, diff, daysUntilClosing }
    })
    .sort((a, b) => a.diff - b.diff)

  const nextClosingCardInfo = cardsWithClosingDay[0] || null
  const nextClosingCard = nextClosingCardInfo ? nextClosingCardInfo.card : null
  const daysUntilNextClosing = nextClosingCardInfo ? nextClosingCardInfo.daysUntilClosing : null

  // Gasto diário permitido até o próximo fechamento da fatura
  const dailyAvailableUntilClosing =
    netRealBalance > 0 && daysUntilNextClosing && daysUntilNextClosing > 0
      ? netRealBalance / daysUntilNextClosing
      : null

  // Próximo cartão a vencer o boleto
  const cardsWithDueDay = cards
    .filter((c) => c.dueDay !== undefined && c.dueDay !== null && Number(c.invoiceAmount) > 0)
    .map((c) => {
      let diff = (c.dueDay || 0) - currentDay
      if (diff < 0) diff += totalDaysInMonth
      const daysUntilDue = Math.max(1, diff + 1)
      return { card: c, diff, daysUntilDue }
    })
    .sort((a, b) => a.diff - b.diff)

  const nextDueCardInfo = cardsWithDueDay[0] || null
  const nextDueCard = nextDueCardInfo ? nextDueCardInfo.card : null
  const daysUntilNextDue = nextDueCardInfo ? nextDueCardInfo.daysUntilDue : null

  return {
    totalMoneyInAccounts,
    totalCreditCardsToPay,
    netRealBalance,
    commitmentRatio,
    currentDay,
    totalDaysInMonth,
    daysRemainingInMonth,
    currentMonthName,
    dailyAvailable,
    weeklyAvailable,
    coverageRatio,
    largestAccount,
    largestCard,
    nextDueCard,
    daysUntilNextDue,
    nextClosingCard,
    daysUntilNextClosing,
    dailyAvailableUntilClosing,
  }
}

export function getCardTimelineStatus(
  card: CreditCard,
  currentDay: number,
  totalDaysInMonth: number
) {
  const closing = card.closingDay ? Number(card.closingDay) : undefined
  const due = card.dueDay ? Number(card.dueDay) : undefined

  let daysToClose: number | null = null
  let daysToDue: number | null = null
  let isInvoiceClosed = false

  if (closing) {
    let diffClose = closing - currentDay
    if (diffClose < 0) diffClose += totalDaysInMonth
    daysToClose = Math.max(1, diffClose + 1)

    if (due) {
      if (closing < due) {
        isInvoiceClosed = currentDay > closing && currentDay <= due
      } else {
        isInvoiceClosed = currentDay > closing || currentDay <= due
      }
    }
  }

  if (due) {
    let diffDue = due - currentDay
    if (diffDue < 0) diffDue += totalDaysInMonth
    daysToDue = Math.max(1, diffDue + 1)
  }

  return {
    closingDay: closing,
    dueDay: due,
    daysToClose,
    daysToDue,
    isInvoiceClosed,
    bestPurchaseDay: closing,
  }
}

export const calculateOverviewTotals = calculateCarteiraTotals

// ---------------- GESTÃO DE BACKUP E CONTA ---------------- //

export function exportBackupData(): AppBackupData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: getSavedProfile(),
    bankAccounts: getBankAccounts(),
    creditCards: getCreditCards(),
    fixedCosts: getFixedCosts(),
    patrimonio: getPatrimonioData(),
    categories: getCategories(),
  }
}

export function importBackupData(backupData: AppBackupData): void {
  if (!backupData || typeof backupData !== 'object') {
    throw new Error('Arquivo de backup inválido ou corrompido.')
  }

  if (backupData.profile) {
    saveProfile(backupData.profile)
  }

  if (Array.isArray(backupData.bankAccounts)) {
    saveBankAccounts(backupData.bankAccounts)
  }

  if (Array.isArray(backupData.creditCards)) {
    saveCreditCards(backupData.creditCards)
  }

  if (Array.isArray(backupData.fixedCosts)) {
    saveFixedCosts(backupData.fixedCosts)
  }

  if (backupData.patrimonio) {
    savePatrimonioData(backupData.patrimonio)
  }

  if (Array.isArray(backupData.categories)) {
    saveCategories(backupData.categories)
  }
}

export function resetFinancialData(): void {
  saveBankAccounts([])
  saveCreditCards([])
  saveFixedCosts([])
  savePatrimonioData(DEFAULT_PATRIMONIO)
  saveCategories(DEFAULT_CATEGORIES)
}

export function deleteAllAccountData(): void {
  clearProfile()
  localStorage.removeItem(FIXED_COSTS_KEY)
  localStorage.removeItem(CATEGORIES_KEY)
  localStorage.removeItem(PATRIMONIO_KEY)
  localStorage.removeItem(BANK_ACCOUNTS_KEY)
  localStorage.removeItem(CREDIT_CARDS_KEY)
}
