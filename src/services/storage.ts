import type {
  AppBackupData,
  BankAccount,
  Caixinha,
  CreditCard,
  FixedCost,
  PatrimonioData,
  ProductSimulation,
  Profile,
  SelicApiResponse,
  SelicInfo,
} from '../types/finance'

const PROFILE_KEY = 'sfp.profile'
const FIXED_COSTS_KEY = 'sfp.fixed_costs'
const CATEGORIES_KEY = 'sfp.categories'
const PATRIMONIO_KEY = 'sfp.patrimonio'
const BANK_ACCOUNTS_KEY = 'sfp.bank_accounts'
const CREDIT_CARDS_KEY = 'sfp.credit_cards'
const SIMULATIONS_KEY = 'sfp.simulations'
const SELIC_CACHE_KEY = 'sfp.selic_cache'
const CAIXINHAS_KEY = 'sfp.caixinhas'



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

// ---------------- CAIXINHAS & METAS FINANCEIRAS ---------------- //

export function getCaixinhas(): Caixinha[] {
  const saved = localStorage.getItem(CAIXINHAS_KEY)
  if (!saved) return []
  try {
    const items = JSON.parse(saved) as Caixinha[]
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export function saveCaixinhas(caixinhas: Caixinha[]): void {
  localStorage.setItem(CAIXINHAS_KEY, JSON.stringify(caixinhas))
}

export function saveCaixinhaItem(
  item: Omit<Caixinha, 'id' | 'createdAt'> & { id?: string }
): Caixinha {
  const existing = getCaixinhas()
  const now = new Date().toISOString()

  if (item.id) {
    const updated = existing.map((c) =>
      c.id === item.id ? { ...c, ...item, updatedAt: now } : c
    )
    saveCaixinhas(updated)
    return updated.find((c) => c.id === item.id)!
  } else {
    const newCaixinha: Caixinha = {
      ...item,
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `cax_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
    }
    const updated = [newCaixinha, ...existing]
    saveCaixinhas(updated)
    return newCaixinha
  }
}

export function updateCaixinhaAmount(id: string, newAmount: number): void {
  const existing = getCaixinhas()
  const now = new Date().toISOString()
  const updated = existing.map((c) =>
    c.id === id ? { ...c, currentAmount: Math.max(0, Number(newAmount) || 0), updatedAt: now } : c
  )
  saveCaixinhas(updated)
}

export function deleteCaixinhaItem(id: string): void {
  const existing = getCaixinhas()
  const filtered = existing.filter((c) => c.id !== id)
  saveCaixinhas(filtered)
}

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
    simulations: getSimulations(),
    caixinhas: getCaixinhas(),
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

  if (Array.isArray(backupData.simulations)) {
    saveSimulations(backupData.simulations)
  }

  if (Array.isArray(backupData.caixinhas)) {
    saveCaixinhas(backupData.caixinhas)
  }
}

export function resetFinancialData(): void {
  saveBankAccounts([])
  saveCreditCards([])
  saveFixedCosts([])
  savePatrimonioData(DEFAULT_PATRIMONIO)
  saveCategories(DEFAULT_CATEGORIES)
  saveSimulations([])
  saveCaixinhas([])
}

export function deleteAllAccountData(): void {
  clearProfile()
  localStorage.removeItem(FIXED_COSTS_KEY)
  localStorage.removeItem(CATEGORIES_KEY)
  localStorage.removeItem(PATRIMONIO_KEY)
  localStorage.removeItem(BANK_ACCOUNTS_KEY)
  localStorage.removeItem(CREDIT_CARDS_KEY)
  localStorage.removeItem(SIMULATIONS_KEY)
  localStorage.removeItem(SELIC_CACHE_KEY)
  localStorage.removeItem(CAIXINHAS_KEY)
}

// ---------------- QUANTO CUSTA? (SIMULAÇÕES & SELIC) ---------------- //

export function getSimulations(): ProductSimulation[] {
  const saved = localStorage.getItem(SIMULATIONS_KEY)
  if (!saved) return []
  try {
    const items = JSON.parse(saved) as ProductSimulation[]
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

export function saveSimulations(items: ProductSimulation[]): void {
  localStorage.setItem(SIMULATIONS_KEY, JSON.stringify(items))
}

export function saveSimulationItem(
  item: Omit<ProductSimulation, 'id' | 'createdAt'> & { id?: string }
): ProductSimulation {
  const existing = getSimulations()
  const now = new Date().toISOString()

  if (item.id) {
    const updated = existing.map((sim) => (sim.id === item.id ? { ...sim, ...item } : sim))
    saveSimulations(updated)
    return updated.find((sim) => sim.id === item.id)!
  } else {
    const newSim: ProductSimulation = {
      ...item,
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
    }
    const updated = [newSim, ...existing].slice(0, 30) // Mantém as últimas 30 simulações
    saveSimulations(updated)
    return newSim
  }
}

export function deleteSimulationItem(id: string): void {
  const existing = getSimulations()
  const filtered = existing.filter((sim) => sim.id !== id)
  saveSimulations(filtered)
}

export function clearSimulations(): void {
  saveSimulations([])
}

export async function fetchSelicRate(): Promise<SelicInfo> {
  const fallbackSelic: SelicInfo = {
    rateAnnual: 10.5,
    rateDate: '01/09/2026',
    lastUpdated: new Date().toISOString(),
  }

  // Tenta ler do cache se tiver menos de 4 horas
  const cached = localStorage.getItem(SELIC_CACHE_KEY)
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as SelicInfo
      const ageMs = Date.now() - new Date(parsed.lastUpdated).getTime()
      if (ageMs < 4 * 60 * 60 * 1000 && parsed.rateAnnual > 0) {
        return parsed
      }
    } catch {
      // Ignora erro no cache
    }
  }

  try {
    const response = await fetch(
      'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json',
      { method: 'GET', headers: { Accept: 'application/json' } }
    )

    if (!response.ok) {
      throw new Error(`Erro na API do BCB: ${response.statusText}`)
    }

    const data = (await response.json()) as SelicApiResponse[]
    if (Array.isArray(data) && data.length > 0 && data[0].valor) {
      const rawValor = String(data[0].valor).replace(',', '.')
      const numRate = parseFloat(rawValor)
      if (!isNaN(numRate) && numRate > 0) {
        const selicInfo: SelicInfo = {
          rateAnnual: numRate,
          rateDate: data[0].data || new Date().toLocaleDateString('pt-BR'),
          lastUpdated: new Date().toISOString(),
        }
        localStorage.setItem(SELIC_CACHE_KEY, JSON.stringify(selicInfo))
        return selicInfo
      }
    }
  } catch (err) {
    console.warn('Não foi possível obter a taxa Selic em tempo real da API do BCB:', err)
  }

  if (cached) {
    try {
      return JSON.parse(cached) as SelicInfo
    } catch {
      // continua para fallback
    }
  }

  return fallbackSelic
}

export function calculateCdiYields(amount: number, selicAnnualPercent: number) {
  const safeAmount = Math.max(0, amount)
  const safeSelic = Math.max(0, selicAnnualPercent)

  // 100% CDI é historicamente próximo de (Selic Meta - 0.10%)
  const cdiAnnualRate = Math.max(0, safeSelic - 0.1) / 100
  // Taxa mensal equivalente a partir da taxa anual composta: (1 + i_ano)^(1/12) - 1
  const cdiMonthlyRate = Math.pow(1 + cdiAnnualRate, 1 / 12) - 1

  // Rendimento bruto (apenas o lucro)
  const yield1Month = safeAmount * (Math.pow(1 + cdiMonthlyRate, 1) - 1)
  const yield6Months = safeAmount * (Math.pow(1 + cdiMonthlyRate, 6) - 1)
  const yield1Year = safeAmount * cdiAnnualRate

  // Montante total bruto acumulado
  const total1Month = safeAmount + yield1Month
  const total6Months = safeAmount + yield6Months
  const total1Year = safeAmount + yield1Year

  return {
    cdiAnnualPercent: Math.max(0, safeSelic - 0.1),
    monthlyRatePercent: cdiMonthlyRate * 100,
    yield1Month,
    yield6Months,
    yield1Year,
    total1Month,
    total6Months,
    total1Year,
  }
}

