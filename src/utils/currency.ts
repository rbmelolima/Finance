import type { Currency } from '../types/finance'

/**
 * Formata um valor numérico para exibição monetária com 2 casas decimais obrigatórias.
 * Ex: 1250.5 -> "R$ 1.250,50" (BRL) ou "$1,250.50" (USD)
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: Currency = 'BRL',
  isPrivate: boolean = false
): string {
  if (isPrivate) {
    return currency === 'USD' ? '$ ••••••' : 'R$ ••••••'
  }

  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0

  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount)
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount)
}

/**
 * Formata um número para o padrão de input (duas casas decimais sem símbolo de moeda).
 * Ex: 1250.5 -> "1.250,50" ou 0 -> "0,00"
 */
export function formatMoneyInput(
  value: number | string | null | undefined,
  isPrivate: boolean = false
): string {
  if (isPrivate) {
    return '••••••'
  }

  if (value === null || value === undefined || value === '') {
    return '0,00'
  }

  let num: number
  if (typeof value === 'number') {
    num = isNaN(value) ? 0 : value
  } else {
    num = parseMoney(value)
  }

  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Converte uma string formatada (com pontos de milhar e vírgula decimal) em float numérico.
 * Ex: "1.250,50" -> 1250.5, "1250,50" -> 1250.5, "1250.50" -> 1250.5, "0,00" -> 0
 */
export function parseMoney(valueStr: string | null | undefined): number {
  if (!valueStr) return 0
  const trimmed = String(valueStr).trim()
  if (!trimmed) return 0

  // Se já for número em formato padrão JavaScript simples (sem pontos de milhar)
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const directNum = parseFloat(trimmed)
    return isNaN(directNum) ? 0 : directNum
  }

  // Remove símbolos de moeda e espaços
  let cleaned = trimmed.replace(/[R$\s]/g, '')

  // Trata formato pt-BR: remove pontos de milhar e troca vírgula por ponto
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  }

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Formata valor digitado dinamicamente para manter o formato monetário pt-BR com 2 casas decimais.
 */
export function maskMoneyInput(rawDigits: string): string {
  // Mantém apenas dígitos
  const digitsOnly = rawDigits.replace(/\D/g, '')
  if (!digitsOnly) return '0,00'

  const num = parseInt(digitsOnly, 10) / 100
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
