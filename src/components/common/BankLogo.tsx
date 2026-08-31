import { getBank } from 'react-bancos'

interface BankLogoProps {
  slug?: string
  size?: number | string
  className?: string
  radius?: number | string
  fallbackName?: string
}

export function BankLogo({
  slug,
  size = 40,
  className = '',
  radius = '0.75rem',
  fallbackName,
}: BankLogoProps) {
  const bank = slug ? getBank(slug) : undefined

  if (bank && bank.Icon) {
    const IconComponent = bank.Icon
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 overflow-hidden shadow-xs ${className}`}
        style={{
          width: typeof size === 'number' ? `${size}px` : size,
          height: typeof size === 'number' ? `${size}px` : size,
          borderRadius: radius,
        }}
      >
        <IconComponent size={size} radius={radius} />
      </div>
    )
  }

  // Fallback se não encontrar o banco ou slug for vazio
  const initial = (fallbackName || slug || 'B').trim().charAt(0).toUpperCase()

  return (
    <div
      className={`inline-flex items-center justify-center font-bold text-white bg-[#173d2a] shrink-0 shadow-xs select-none ${className}`}
      style={{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        borderRadius: radius,
        fontSize: typeof size === 'number' ? `${Math.max(12, typeof size === 'number' ? size * 0.45 : 16)}px` : '1rem',
      }}
    >
      {initial}
    </div>
  )
}
