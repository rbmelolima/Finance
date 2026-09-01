export type Currency = 'BRL' | 'USD'

export type Recurrence = 'monthly' | 'yearly'

export interface FixedCost {
  id: string
  name: string
  description?: string
  category: string
  amount: number
  currency: Currency
  recurrence: Recurrence
  createdAt: string
  updatedAt?: string
}

export interface AtivosCirculante {
  Disponibilidades: {
    'Dinheiro no bolso (Notas)': number
    'Contas correntes e poupança': number
    'Reserva de emergência': number
  }
  'Contas a Receber': {
    Salário: number
    'Renda Extra': number
  }
  Investimentos: {
    'Renda fixa': number
    'Renda variável': number
  }
}

export interface AtivosPassivosComValor {
  Veículos: number
  Imóveis: number
  FGTS: number
}

export interface AtivosData {
  'Ativo Circulante': AtivosCirculante
  'Passivos com valor': AtivosPassivosComValor
}

export interface PassivosCirculante {
  'Cartão de Crédito': number
  'Contas a pagar': number
  'Prestações e Empréstimos': number
  'Outros débitos a pagar': number
}

export interface PassivosNaoCirculante {
  'Financiamento de Imóvel': number
  'Financiamento de veículo': number
  'Prestações e Empréstimos': number
}

export interface PassivosData {
  'Passivo Circulante': PassivosCirculante
  'Não Circulante': PassivosNaoCirculante
  'Patrimônio Líquido': {
    'Seu patrimônio hoje': number
  }
}

export interface PatrimonioData {
  ATIVOS: AtivosData
  PASSIVOS: PassivosData
}

export type AccountType = 'corrente' | 'poupanca' | 'investimento' | 'carteira' | 'outros'

export interface BankAccount {
  id: string
  bankSlug: string
  bankName: string
  accountName: string
  accountType: AccountType
  balance: number
  color?: string
  createdAt: string
  updatedAt?: string
}

export interface CreditCard {
  id: string
  bankSlug: string
  bankName: string
  cardName: string
  invoiceAmount: number
  dueDay?: number
  closingDay?: number
  limit?: number
  color?: string
  createdAt: string
  updatedAt?: string
}

export interface FamilyMember {
  id: string
  name: string
  birthMonth?: number // 1 a 12
  birthYear?: number // Ex: 1995
  age?: number // Mantido para compatibilidade retroativa
  relationship?: string
  isWorking: boolean
  income?: number
  createdAt?: string
}

export type CLTPaymentModel =
  | 'fifth_business_day' // Salário integral até o 5º dia útil
  | 'advance_and_balance' // Adiantamento (Vale) + Saldo restante
  | 'last_business_day' // Salário integral no último dia útil

export type CLTBalanceDayType = 'fifth_business_day' | 'last_business_day'

export interface CLTConfig {
  paymentModel: CLTPaymentModel
  advanceDay?: number // ex: 15 ou 20
  advancePercent?: number // ex: 40%
  balanceDayType?: CLTBalanceDayType // 'fifth_business_day' ou 'last_business_day'
}

export interface Profile {
  name: string
  email: string
  personalIncome?: number
  workHoursPerMonth?: number // Ex: 160h, 220h
  isCLT?: boolean
  cltConfig?: CLTConfig
  paymentDay?: number // para regime PJ / Outro
  familyMembers?: FamilyMember[]
  updatedAt?: string
}

export interface ProductSimulation {
  id: string
  name: string
  price: number
  grossHours: number
  netFreeHours: number
  monthlySalary: number
  workHoursPerMonth: number
  fixedCostsAmount: number
  freeBalanceAmount: number
  selicRate: number
  yield1Month: number
  yield6Months: number
  yield1Year: number
  createdAt: string
}

export interface SelicApiResponse {
  data: string
  valor: string
}

export interface SelicInfo {
  rateAnnual: number // Ex: 14.00
  rateDate: string // Ex: "16/09/2026"
  lastUpdated: string
}

export interface Caixinha {
  id: string
  name: string
  icon?: string // Emoji (ex: 🎯, ✈️, 🚗, 🏠, 💻, 🎓, 💍, 🏖️, 📱, 🛡️)
  targetAmount: number
  currentAmount: number
  deadlineMonth?: number // 1 a 12
  deadlineYear?: number // Ex: 2027
  category?: string
  color?: string
  notes?: string
  createdAt: string
  updatedAt?: string
}

export interface OrcamentoCostItem {
  id: string
  name: string
  amount: number
  category?: string
}

export interface OrcamentoFamiliarData {
  monthKey: string // Ex: "2026-09"
  userIncome: number
  partnerName: string
  partnerIncome: number
  userFixedCosts: OrcamentoCostItem[]
  partnerFixedCosts: OrcamentoCostItem[]
  userCreditCardsAmount: number
  notes?: string
  updatedAt?: string
}

export interface AppBackupData {
  version: number
  exportedAt: string
  profile: Profile | null
  bankAccounts: BankAccount[]
  creditCards: CreditCard[]
  fixedCosts: FixedCost[]
  patrimonio: PatrimonioData
  categories: string[]
  simulations?: ProductSimulation[]
  caixinhas?: Caixinha[]
  orcamentoFamiliar?: OrcamentoFamiliarData
}

export type Screen =
  | 'landing'
  | 'login'
  | 'carteira'
  | 'overview'
  | 'dashboard'
  | 'fixed-costs'
  | 'orcamento-familiar'
  | 'caixinhas'
  | 'patrimonio'
  | 'profile'
  | 'quanto-custa'

