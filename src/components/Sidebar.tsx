import { useState } from 'react'
import type { Screen } from '../types/finance'
import { Logo } from './Logo'

interface SidebarProps {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
  userName?: string
  userEmail?: string
  onExit: () => void
  netBalance?: number
}

interface NavItem {
  id: Screen
  label: string
  icon: string
  description?: string
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'carteira',
    label: 'Carteira',
    icon: '💼',
    description: 'Contas, cartões & teto diário',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    description: 'Visão geral consolidada',
  },
  {
    id: 'fixed-costs',
    label: 'Custos Fixos',
    icon: '📋',
    description: 'Despesas mensais e anuais',
  },
  {
    id: 'patrimonio',
    label: 'Patrimônio',
    icon: '🏛',
    description: 'Balanço de ativos e passivos',
  },
]

export function Sidebar({
  currentScreen,
  onNavigate,
  userName,
  userEmail,
  onExit,
  netBalance,
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const activeScreen = currentScreen === 'overview' ? 'carteira' : currentScreen

  const userInitial = userName ? userName.trim().charAt(0).toUpperCase() : 'U'

  const formattedBalance =
    netBalance !== undefined
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netBalance)
      : null

  const isNetPositive = (netBalance ?? 0) >= 0

  function handleItemClick(screenId: Screen) {
    onNavigate(screenId)
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e3eae4] bg-white/95 px-5 py-3.5 backdrop-blur-md lg:hidden">
        <Logo onClick={() => onNavigate('carteira')} />

        <div className="flex items-center gap-2.5">
          {formattedBalance && (
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                isNetPositive
                  ? 'bg-[#e9f4ec] text-[#245439]'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {formattedBalance}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="grid size-10 place-items-center rounded-2xl border border-[#d8e1da] bg-[#f7f8f5] text-[#173d2a] hover:bg-[#edf5ef] transition cursor-pointer"
            aria-label="Abrir Menu"
          >
            <span className="text-xl leading-none">☰</span>
          </button>
        </div>
      </header>

      {/* Backdrop Mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-[#e3eae4] bg-white transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Section */}
        <div className="flex flex-col p-6">
          {/* Logo & Mobile Close Button */}
          <div className="flex items-center justify-between">
            <Logo onClick={() => handleItemClick('carteira')} />
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="grid size-8 place-items-center rounded-xl text-[#718078] hover:bg-[#edf5ef] hover:text-[#173d2a] lg:hidden cursor-pointer"
              aria-label="Fechar Menu"
            >
              ✕
            </button>
          </div>

          {/* Saldo Livre Rápido */}
          {formattedBalance && (
            <div
              onClick={() => handleItemClick('carteira')}
              className="mt-6 rounded-2xl border border-[#e3eae4] bg-[#f7f8f5] p-3.5 transition hover:border-[#b7d7c5] hover:bg-[#edf5ef] cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#718078]">
                  Saldo Livre Real
                </span>
                <span className="text-xs">⚡</span>
              </div>
              <p
                className={`mt-1 text-lg font-extrabold tracking-tight ${
                  isNetPositive ? 'text-[#173d2a]' : 'text-rose-600'
                }`}
              >
                {formattedBalance}
              </p>
              <p className="text-[10px] text-[#8a998f] mt-0.5">
                Contas bancárias − faturas
              </p>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#8a998f] mb-2">
              Menu Principal
            </p>
            {NAV_ITEMS.map((item) => {
              const isActive = activeScreen === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl text-left transition cursor-pointer ${
                    isActive
                      ? 'bg-[#173d2a] text-white shadow-md shadow-[#173d2a]/10 font-semibold'
                      : 'text-[#64736a] hover:bg-[#f7f8f5] hover:text-[#173d2a]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <div className="truncate">
                      <p className={`text-sm ${isActive ? 'text-white' : 'text-[#173d2a]'}`}>
                        {item.label}
                      </p>
                      {item.description && (
                        <p
                          className={`text-[11px] truncate ${
                            isActive ? 'text-[#b7d7c5]' : 'text-[#8a998f]'
                          }`}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isActive && (
                    <span className="size-1.5 rounded-full bg-[#79ad89] shrink-0" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Bottom User & Exit Section */}
        <div className="border-t border-[#eef3ef] p-4 bg-[#fafcfb]">
          <div className="flex items-center justify-between gap-3 rounded-2xl p-2.5 bg-white border border-[#e3eae4]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="grid size-9 place-items-center rounded-xl bg-[#173d2a] text-xs font-bold text-white shrink-0">
                {userInitial}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#173d2a] truncate">
                  {userName || 'Seu Espaço'}
                </p>
                {userEmail && (
                  <p className="text-[10px] text-[#718078] truncate">{userEmail}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onExit}
              className="grid size-8 place-items-center rounded-xl text-[#8a998f] hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer shrink-0"
              title="Sair do aplicativo"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
