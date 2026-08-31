import type { Screen } from '../types/finance'
import { Logo } from './Logo'

interface NavbarProps {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
  userName?: string
  onExit: () => void
}

export function Navbar({ currentScreen, onNavigate, userName, onExit }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e3eae4] bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-10">
        <div className="flex items-center gap-8">
          <Logo onClick={() => onNavigate('carteira')} />

          <nav className="hidden items-center gap-1 sm:flex">
            <button
              onClick={() => onNavigate('carteira')}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition cursor-pointer ${
                currentScreen === 'carteira' || currentScreen === 'overview'
                  ? 'bg-[#edf5ef] text-[#173d2a] font-semibold'
                  : 'text-[#64736a] hover:bg-[#f3f6f4] hover:text-[#173d2a]'
              }`}
            >
              Carteira
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition cursor-pointer ${
                currentScreen === 'dashboard'
                  ? 'bg-[#edf5ef] text-[#173d2a] font-semibold'
                  : 'text-[#64736a] hover:bg-[#f3f6f4] hover:text-[#173d2a]'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('fixed-costs')}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition cursor-pointer ${
                currentScreen === 'fixed-costs'
                  ? 'bg-[#edf5ef] text-[#173d2a] font-semibold'
                  : 'text-[#64736a] hover:bg-[#f3f6f4] hover:text-[#173d2a]'
              }`}
            >
              Custos Fixos
            </button>
            <button
              onClick={() => onNavigate('patrimonio')}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition cursor-pointer ${
                currentScreen === 'patrimonio'
                  ? 'bg-[#edf5ef] text-[#173d2a] font-semibold'
                  : 'text-[#64736a] hover:bg-[#f3f6f4] hover:text-[#173d2a]'
              }`}
            >
              Patrimônio
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {userName && (
            <span className="hidden text-xs font-medium text-[#71917d] md:inline-block">
              Olá, <strong className="text-[#173d2a]">{userName}</strong>
            </span>
          )}
          <button
            onClick={onExit}
            className="rounded-xl border border-[#d8e1da] px-3.5 py-1.5 text-xs font-semibold text-[#64736a] transition hover:bg-[#f3f6f4] hover:text-[#173d2a] cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex border-t border-[#edf2ee] px-2 py-2 sm:hidden overflow-x-auto">
        <button
          onClick={() => onNavigate('carteira')}
          className={`flex-1 py-1.5 px-2 text-center text-xs font-medium whitespace-nowrap ${
            currentScreen === 'carteira' || currentScreen === 'overview' ? 'font-semibold text-[#173d2a]' : 'text-[#64736a]'
          }`}
        >
          Carteira
        </button>
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex-1 py-1.5 px-2 text-center text-xs font-medium whitespace-nowrap ${
            currentScreen === 'dashboard' ? 'font-semibold text-[#173d2a]' : 'text-[#64736a]'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onNavigate('fixed-costs')}
          className={`flex-1 py-1.5 px-2 text-center text-xs font-medium whitespace-nowrap ${
            currentScreen === 'fixed-costs' ? 'font-semibold text-[#173d2a]' : 'text-[#64736a]'
          }`}
        >
          Custos Fixos
        </button>
        <button
          onClick={() => onNavigate('patrimonio')}
          className={`flex-1 py-1.5 px-2 text-center text-xs font-medium whitespace-nowrap ${
            currentScreen === 'patrimonio' ? 'font-semibold text-[#173d2a]' : 'text-[#64736a]'
          }`}
        >
          Patrimônio
        </button>
      </div>
    </header>
  )
}
