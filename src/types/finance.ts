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

export type Screen = 'landing' | 'login' | 'dashboard' | 'fixed-costs'

export interface Profile {
  name: string
  email: string
}
