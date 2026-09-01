export const MONTHS_PTBR = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

export function calculateAge(birthYear?: number, birthMonth?: number): number | null {
  if (!birthYear || isNaN(birthYear) || birthYear < 1900) return null

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-indexed (1..12)

  if (birthYear > currentYear) return null

  let age = currentYear - birthYear

  if (birthMonth && birthMonth >= 1 && birthMonth <= 12) {
    if (currentMonth < birthMonth) {
      age -= 1
    }
  }

  return Math.max(0, age)
}

export function formatAgeDisplay(
  birthYear?: number,
  birthMonth?: number,
  fallbackAge?: number
): string | null {
  const calculated = calculateAge(birthYear, birthMonth)
  if (calculated !== null) {
    if (calculated === 0) {
      return '< 1 ano'
    }
    return calculated === 1 ? '1 ano' : `${calculated} anos`
  }

  if (fallbackAge !== undefined && fallbackAge !== null && !isNaN(fallbackAge)) {
    return fallbackAge === 1 ? '1 ano' : `${fallbackAge} anos`
  }

  return null
}
