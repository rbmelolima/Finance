import { calculateOverviewTotals, calculatePatrimonioTotals } from '../../services/storage'
import type { BankAccount, CreditCard, FixedCost, PatrimonioData, Screen } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'

interface DashboardPageProps {
  name: string
  fixedCosts: FixedCost[]
  patrimonio: PatrimonioData
  bankAccounts?: BankAccount[]
  creditCards?: CreditCard[]
  onNavigate: (screen: Screen) => void
  onOpenNewFixedCost: () => void
}

const CATEGORY_COLORS: string[] = [
  '#173d2a',
  '#5d9873',
  '#2a9d8f',
  '#e76f51',
  '#f4a261',
  '#457b9d',
  '#7b2cbf',
  '#d62828',
]

export function DashboardPage({
  name,
  fixedCosts,
  patrimonio,
  bankAccounts = [],
  creditCards = [],
  onNavigate,
  onOpenNewFixedCost,
}: DashboardPageProps) {
  const hasUSD = fixedCosts.some((c) => c.currency === 'USD')

  // Custos fixos
  const monthlyBRL = fixedCosts
    .filter((c) => c.currency === 'BRL')
    .reduce((acc, c) => acc + (c.recurrence === 'monthly' ? c.amount : c.amount / 12), 0)

  const yearlyBRL = monthlyBRL * 12

  const monthlyUSD = fixedCosts
    .filter((c) => c.currency === 'USD')
    .reduce((acc, c) => acc + (c.recurrence === 'monthly' ? c.amount : c.amount / 12), 0)

  const yearlyUSD = monthlyUSD * 12

  const formattedMonthlyBRL = formatCurrency(monthlyBRL, 'BRL')
  const formattedYearlyBRL = formatCurrency(yearlyBRL, 'BRL')

  const formattedMonthlyUSD = formatCurrency(monthlyUSD, 'USD')
  const formattedYearlyUSD = formatCurrency(yearlyUSD, 'USD')

  // Totais da Carteira (Contas vs Cartões)
  const carteiraTotals = calculateOverviewTotals(bankAccounts || [], creditCards || [])
  const formattedNetRealBalance = formatCurrency(carteiraTotals.netRealBalance)
  const formattedAccountsMoney = formatCurrency(carteiraTotals.totalMoneyInAccounts)
  const formattedCardsAmount = formatCurrency(carteiraTotals.totalCreditCardsToPay)
  const formattedDailyAvailable = formatCurrency(carteiraTotals.dailyAvailable)

  // Totais do Patrimônio
  const patrimonioTotals = calculatePatrimonioTotals(patrimonio)
  const formattedPatrimonioLiquido = formatCurrency(patrimonioTotals.patrimonioLiquido)
  const formattedAtivos = formatCurrency(patrimonioTotals.totalAtivos)
  const formattedPassivos = formatCurrency(patrimonioTotals.totalPassivos)

  // Distribuição rápida de categorias
  const categorySummary = (() => {
    if (fixedCosts.length === 0) return []
    const totals: Record<string, number> = {}
    let total = 0
    fixedCosts.forEach((c) => {
      const val = c.recurrence === 'yearly' ? c.amount / 12 : c.amount
      totals[c.category] = (totals[c.category] || 0) + val
      total += val
    })
    return Object.entries(totals)
      .map(([name, val], idx) => ({
        name,
        amount: val,
        percentage: total > 0 ? (val / total) * 100 : 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4)
  })()

  return (
    <main className="min-h-screen bg-[#f7f8f5]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 lg:px-10 lg:py-14">
        <p className="text-xs sm:text-sm font-medium text-[#71917d]">Bom te ver por aqui, {name}.</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-[-0.05em] text-[#173d2a]">
          Sua visão financeira
        </h1>

        <div className="mt-8 sm:mt-10 grid gap-5 md:grid-cols-3">
          {/* Card Carteira Principal (Saldo Livre Imediato) */}
          <article className="rounded-3xl bg-[#173d2a] p-6 text-white md:col-span-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <p className="text-sm font-semibold text-[#b7d7c5]">Carteira: Saldo Livre Hoje</p>
              </div>
              <button
                onClick={() => onNavigate('carteira')}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#b7d7c5] hover:bg-white/20 transition cursor-pointer"
              >
                Abrir Carteira →
              </button>
            </div>
            <p className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-[-0.05em]">
              {formattedNetRealBalance}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-4 border-t border-white/10 pt-4 text-xs text-[#b7d7c5]">
              <span>Dinheiro em Conta: <strong className="text-white">{formattedAccountsMoney}</strong></span>
              <span>•</span>
              <span>Faturas a Pagar: <strong className="text-white">{formattedCardsAmount}</strong></span>
              <span>•</span>
              <span>Teto Diário: <strong className="text-white">{formattedDailyAvailable}/dia</strong> ({carteiraTotals.daysRemainingInMonth}d)</span>
            </div>
          </article>

          {/* Card Patrimônio Líquido */}
          <article className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#8a998f]">Patrimônio Líquido Total</p>
              <button
                onClick={() => onNavigate('patrimonio')}
                className="text-xs font-semibold text-[#5d9873] hover:text-[#173d2a] cursor-pointer"
              >
                Ver balanço →
              </button>
            </div>
            <p className="mt-4 text-2xl font-bold text-[#173d2a]">
              {formattedPatrimonioLiquido}
            </p>
            <div className="mt-3 space-y-1 text-xs text-[#718078]">
              <p>Ativos: {formattedAtivos}</p>
              <p>Passivos: {formattedPassivos}</p>
            </div>
          </article>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Card Contas Bancárias */}
          <article className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm transition hover:border-[#b7d7c5]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#30483a]">Contas Bancárias</h2>
              <button
                onClick={() => onNavigate('carteira')}
                className="grid size-8 place-items-center rounded-full bg-[#edf5ef] text-lg font-medium text-[#173d2a] transition hover:bg-[#d8e8dc] cursor-pointer"
                title="Acessar Contas Bancárias"
              >
                →
              </button>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold tracking-tight text-[#173d2a]">
                {formattedAccountsMoney}
              </p>
              <p className="mt-1 text-xs text-[#718078]">
                {(bankAccounts || []).length} { (bankAccounts || []).length === 1 ? 'conta cadastrada' : 'contas cadastradas'}
              </p>
              <button
                onClick={() => onNavigate('carteira')}
                className="mt-4 inline-flex items-center text-sm font-semibold text-[#5d9873] hover:text-[#173d2a] cursor-pointer"
              >
                Gerenciar contas e saldos →
              </button>
            </div>
          </article>

          {/* Card Cartões de Crédito */}
          <article className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm transition hover:border-rose-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#30483a]">Cartões a Pagar</h2>
              <button
                onClick={() => onNavigate('carteira')}
                className="grid size-8 place-items-center rounded-full bg-rose-50 text-lg font-medium text-rose-700 transition hover:bg-rose-100 cursor-pointer"
                title="Acessar Cartões de Crédito"
              >
                →
              </button>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold tracking-tight text-rose-600">
                {formattedCardsAmount}
              </p>
              <p className="mt-1 text-xs text-[#718078]">
                {(creditCards || []).length} { (creditCards || []).length === 1 ? 'cartão cadastrado' : 'cartões cadastrados'}
              </p>
              <button
                onClick={() => onNavigate('carteira')}
                className="mt-4 inline-flex items-center text-sm font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
              >
                Gerenciar faturas de cartão →
              </button>
            </div>
          </article>

          {/* Card Custos Fixos Integrado */}
          <article className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm transition hover:border-[#b7d7c5] md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#30483a]">Custos fixos</h2>
              <button
                onClick={onOpenNewFixedCost}
                className="grid size-8 place-items-center rounded-full bg-[#edf5ef] text-lg font-medium text-[#173d2a] transition hover:bg-[#d8e8dc] cursor-pointer"
                title="Cadastrar novo custo"
              >
                +
              </button>
            </div>

            {fixedCosts.length === 0 ? (
              <>
                <p className="mt-10 text-sm text-[#8a998f]">Nenhum registro ainda.</p>
                <button
                  onClick={() => onNavigate('fixed-costs')}
                  className="mt-5 text-sm font-semibold text-[#5d9873] hover:text-[#173d2a] cursor-pointer"
                >
                  Adicionar custo →
                </button>
              </>
            ) : (
              <div className="mt-4">
                <div className="space-y-1">
                  <p className="text-2xl font-bold tracking-tight text-[#173d2a]">
                    {formattedMonthlyBRL}
                    <span className="text-xs font-normal text-[#8a998f]"> /mês</span>
                  </p>
                  <p className="text-xs font-semibold text-[#5d9873]">
                    Custo anual (12m): {formattedYearlyBRL}
                  </p>
                  {hasUSD && monthlyUSD > 0 && (
                    <p className="pt-1 text-xs font-medium text-[#718078]">
                      + {formattedMonthlyUSD}/mês ({formattedYearlyUSD}/ano)
                    </p>
                  )}
                </div>

                {/* Mini barra e categorias */}
                {categorySummary.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-[#edf2ee] pt-3">
                    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-[#edf2ee]">
                      {categorySummary.map((c) => (
                        <div
                          key={c.name}
                          style={{
                            width: `${c.percentage}%`,
                            backgroundColor: c.color,
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#718078]">
                      {categorySummary.map((c) => (
                        <span key={c.name} className="flex items-center gap-1">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name} ({c.percentage.toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onNavigate('fixed-costs')}
                  className="mt-4 inline-flex items-center text-sm font-semibold text-[#5d9873] hover:text-[#173d2a] cursor-pointer"
                >
                  Ver gráficos e detalhes →
                </button>
              </div>
            )}
          </article>
        </div>

        {/* Banner / Atalho Quanto Custa? */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-[#d8e5dc] bg-gradient-to-r from-[#173d2a] to-[#245439] p-6 sm:p-7 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-2xl">
              ⏱️
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
                <span>Novo</span> • Simulador de Compras
              </div>
              <h2 className="mt-1 text-lg sm:text-xl font-bold">
                Quanto Custa? Descubra o preço em horas da sua vida
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#b7d7c5] max-w-xl">
                Saiba exatamente quantas horas de trabalho e de esforço livre você precisa trocar por qualquer produto, e veja o rendimento se investisse no CDI.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('quanto-custa')}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#173d2a] hover:bg-[#edf5ef] transition cursor-pointer shadow-md shrink-0 w-full sm:w-auto text-center"
          >
            Simular compra agora →
          </button>
        </div>
      </div>
    </main>
  )
}

