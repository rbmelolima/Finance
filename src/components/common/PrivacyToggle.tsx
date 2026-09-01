import { usePrivacy } from '../../context/PrivacyContext'

interface PrivacyToggleProps {
  variant?: 'icon' | 'compact' | 'sidebar' | 'pill'
  className?: string
  showShortcutHint?: boolean
}

export function PrivacyToggle({
  variant = 'icon',
  className = '',
  showShortcutHint = true,
}: PrivacyToggleProps) {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy()

  const label = isPrivacyMode ? 'Valores ocultos (Privado)' : 'Valores visíveis'
  const actionHint = isPrivacyMode
    ? 'Mostrar valores monetários'
    : 'Ocultar valores monetários'
  const tooltip = `${actionHint}${showShortcutHint ? ' (Atalho: P ou Alt+P)' : ''}`

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={togglePrivacyMode}
        title={tooltip}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl text-left transition cursor-pointer group ${
          isPrivacyMode
            ? 'bg-[#edf5ef] text-[#173d2a] font-semibold border border-[#b7d7c5]'
            : 'text-[#64736a] hover:bg-[#f7f8f5] hover:text-[#173d2a]'
        } ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg shrink-0 transition-transform group-hover:scale-110">
            {isPrivacyMode ? '🙈' : '👁️'}
          </span>
          <div className="truncate">
            <p className="text-sm font-medium text-[#173d2a]">
              {isPrivacyMode ? 'Modo Privado: Ativado' : 'Modo Privado'}
            </p>
            <p className="text-[11px] truncate text-[#8a998f]">
              {isPrivacyMode ? 'Valores protegidos' : 'Clique para ocultar'}
            </p>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isPrivacyMode
              ? 'bg-[#173d2a] text-white'
              : 'bg-[#edf2ee] text-[#64736a] group-hover:bg-[#e3eae4]'
          }`}
        >
          {isPrivacyMode ? 'ON' : 'OFF'}
        </span>
      </button>
    )
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={togglePrivacyMode}
        title={tooltip}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer shadow-2xs border ${
          isPrivacyMode
            ? 'bg-[#173d2a] text-white border-[#173d2a]'
            : 'bg-white text-[#30483a] border-[#d8e1da] hover:bg-[#edf5ef] hover:border-[#b7d7c5]'
        } ${className}`}
      >
        <span className="text-sm">{isPrivacyMode ? '🙈' : '👁️'}</span>
        <span>{isPrivacyMode ? 'Valores Ocultos' : 'Ocultar Valores'}</span>
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={togglePrivacyMode}
        title={tooltip}
        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
          isPrivacyMode
            ? 'border-[#b7d7c5] bg-[#edf5ef] text-[#173d2a] font-semibold'
            : 'border-[#d8e1da] bg-[#f7f8f5] text-[#64736a] hover:bg-[#edf5ef] hover:text-[#173d2a]'
        } ${className}`}
      >
        <span className="text-xs">{isPrivacyMode ? '🙈' : '👁️'}</span>
        <span className="text-[11px]">{isPrivacyMode ? 'Oculto' : 'Visível'}</span>
      </button>
    )
  }

  // Variant: 'icon' (padrão)
  return (
    <button
      type="button"
      onClick={togglePrivacyMode}
      title={tooltip}
      aria-label={label}
      className={`relative grid size-10 place-items-center rounded-2xl border transition cursor-pointer ${
        isPrivacyMode
          ? 'border-[#79ad89] bg-[#173d2a] text-white shadow-xs'
          : 'border-[#d8e1da] bg-[#f7f8f5] text-[#173d2a] hover:bg-[#edf5ef] hover:border-[#b7d7c5]'
      } ${className}`}
    >
      <span className="text-base leading-none select-none transition-transform hover:scale-110">
        {isPrivacyMode ? '🙈' : '👁️'}
      </span>
      {isPrivacyMode && (
        <span className="absolute -top-1 -right-1 flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
        </span>
      )}
    </button>
  )
}
