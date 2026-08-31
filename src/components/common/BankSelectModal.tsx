import { useMemo, useState } from 'react'
import { banksData, searchBanks, type BankData } from 'react-bancos'
import { BankLogo } from './BankLogo'

interface BankSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (bank: { slug: string; name: string; color?: string | null }) => void
  selectedSlug?: string
  title?: string
}

const POPULAR_SLUGS = [
  'nubank',
  'itau',
  'bradesco',
  'bancodobrasil',
  'santander',
  'caixa',
  'inter',
  'c6bank',
  'btgpactual',
  'mercadopago',
  'picpay',
  'xp',
  'pagbank',
  'neon',
  'sicredi',
  'sicoob',
  'nomad',
  'wise',
]

export function BankSelectModal({
  isOpen,
  onClose,
  onSelect,
  selectedSlug,
  title = 'Selecionar Instituição / Banco',
}: BankSelectModalProps) {
  const [query, setQuery] = useState('')

  const popularBanks = useMemo(() => {
    return POPULAR_SLUGS.map((slug) => banksData.find((b) => b.slug === slug)).filter(
      Boolean
    ) as BankData[]
  }, [])

  const filteredBanks = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      return banksData
    }
    return searchBanks(trimmed)
  }, [query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-[#dfe8e1]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eef3ef] px-6 py-5">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[#173d2a]">{title}</h3>
            <p className="text-xs text-[#718078] mt-0.5">
              Escolha uma instituição para vincular o logo oficial
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-[#718078] hover:bg-[#edf5ef] hover:text-[#173d2a] transition cursor-pointer"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Search bar */}
        <div className="p-5 pb-3 border-b border-[#eef3ef] bg-[#fafcfb]">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8a998f]">
              🔍
            </span>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome (ex: Nubank, Itaú, Inter)..."
              className="w-full rounded-2xl border border-[#d8e1da] bg-white pl-11 pr-4 py-3 text-sm text-[#173d2a] placeholder:text-[#a1afa6] outline-none focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/30 transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8a998f] hover:text-[#173d2a] p-1.5"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Atalhos Populares quando não houver busca */}
          {!query.trim() && (
            <div className="mt-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a998f] mb-2">
                Mais Usados
              </p>
              <div className="flex flex-wrap gap-2">
                {popularBanks.map((bank) => {
                  const isSelected = selectedSlug === bank.slug
                  return (
                    <button
                      key={bank.slug}
                      type="button"
                      onClick={() => {
                        onSelect({ slug: bank.slug, name: bank.name, color: bank.color })
                        onClose()
                      }}
                      className={`inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition cursor-pointer border ${
                        isSelected
                          ? 'border-[#173d2a] bg-[#173d2a] text-white'
                          : 'border-[#e0ebe2] bg-white text-[#30483a] hover:border-[#5d9873] hover:bg-[#edf5ef]'
                      }`}
                    >
                      <BankLogo slug={bank.slug} size={18} radius="4px" />
                      <span>{bank.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bank list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 max-h-[380px]">
          {filteredBanks.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-2">🏦</p>
              <p className="text-sm font-semibold text-[#30483a]">Nenhuma instituição encontrada</p>
              <p className="text-xs text-[#8a998f] mt-1">
                Tente buscar por outro termo ou nome alternativo.
              </p>
            </div>
          ) : (
            filteredBanks.map((bank) => {
              const isSelected = selectedSlug === bank.slug
              return (
                <button
                  key={bank.slug}
                  type="button"
                  onClick={() => {
                    onSelect({ slug: bank.slug, name: bank.name, color: bank.color })
                    onClose()
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition cursor-pointer text-left border ${
                    isSelected
                      ? 'border-[#5d9873] bg-[#edf5ef]'
                      : 'border-transparent hover:border-[#e3eae4] hover:bg-[#f7f8f5]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <BankLogo slug={bank.slug} size={36} radius="0.5rem" />
                    <div className="truncate">
                      <p className="text-sm font-semibold text-[#173d2a] truncate">{bank.name}</p>
                      <p className="text-[11px] text-[#718078] truncate">
                        {bank.compe ? `Código COMPE: ${bank.compe}` : bank.slug}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-xs font-bold text-[#245439] bg-[#b7d7c5]/50 px-2.5 py-1 rounded-full shrink-0 ml-2">
                      Selecionado
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#eef3ef] px-6 py-3.5 bg-[#f7f8f5] flex items-center justify-between text-xs text-[#718078]">
          <span>{filteredBanks.length} instituições encontradas</span>
          <button
            type="button"
            onClick={onClose}
            className="font-semibold text-[#64736a] hover:text-[#173d2a] cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
