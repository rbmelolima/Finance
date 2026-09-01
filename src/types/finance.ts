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
  age?: number
  relationship?: string
  isWorking: boolean
  income?: number
  createdAt?: string
}

export interface Profile {
  name: string
  email: string
  personalIncome?: number
  isCLT?: boolean
  paymentDay?: number
  familyMembers?: FamilyMember[]
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
}

export type Screen =
  | 'landing'
  | 'login'
  | 'carteira'
  | 'overview'
  | 'dashboard'
  | 'fixed-costs'
  | 'patrimonio'
  | 'profile'
