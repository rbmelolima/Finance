import { useMemo, useState } from 'react'
import type { Currency, FixedCost } from '../../types/finance'

interface CategoryDistributionChartProps {
  fixedCosts: FixedCost[]
  defaultCurrency?: Currency
}

const CATEGORY_COLORS: string[] = [
  '#173d2a', // Deep Forest
  '#5d9873', // Sage / Emerald
  '#2a9d8f', // Teal
  '#e76f51', // Coral
  '#f4a261', // Warm Amber
  '#457b9d', // Steel Blue
  '#7b2cbf', // Royal Purple
  '#d62828', // Crimson
  '#588157', // Moss Green
  '#6c757d', // Slate Gray
]

export function CategoryDistributionChart({
  fixedCosts,
  defaultCurrency = 'BRL',
}: CategoryDistributionChartProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(defaultCurrency)
  const [viewPeriod, setViewPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const hasBRL = useMemo(() => fixedCosts.some((c) => c.currency === 'BRL'), [fixedCosts])
  const hasUSD = useMemo(() => fixedCosts.some((c) => c.currency === 'USD'), [fixedCosts])

  // Ajusta a moeda selecionada caso a atual não tenha itens
  const activeCurrency = useMemo(() => {
    if (selectedCurrency === 'USD' && !hasUSD) return 'BRL'
    if (selectedCurrency === 'BRL' && !hasBRL && hasUSD) return 'USD'
    return selectedCurrency
  }, [selectedCurrency, hasBRL, hasUSD])

  const categoryData = useMemo(() => {
    const costsInCurrency = fixedCosts.filter((c) => c.currency === activeCurrency)
    const categoryTotals: Record<string, { monthly: number; count: number }> = {}
    let totalMonthly = 0

    costsInCurrency.forEach((cost) => {
      const monthlyAmount =
        cost.recurrence === 'yearly' ? cost.amount / 12 : cost.amount
      const category = cost.category || 'Outros'

      if (!categoryTotals[category]) {
        categoryTotals[category] = { monthly: 0, count: 0 }
      }
      categoryTotals[category].monthly += monthlyAmount
      categoryTotals[category].count += 1
      totalMonthly += monthlyAmount
    })

    const categoriesList = Object.entries(categoryTotals).map(
      ([name, { monthly, count }], index) => {
        const percentage = totalMonthly > 0 ? (monthly / totalMonthly) * 100 : 0
        const yearly = monthly * 12
        const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length]

        return {
          name,
          monthly,
          yearly,
          percentage,
          count,
          color,
        }
      }
    )

    // Ordena por maior porcentagem/gasto
    categoriesList.sort((a, b) => b.monthly - a.monthly)

    // Pré-calcula os offsets percentuais acumulados de forma imutável
    let runningOffset = 0
    const itemsWithOffset = categoriesList.map((item) => {
      const offsetPercent = runningOffset
      runningOffset += item.percentage
      return {
        ...item,
        offsetPercent,
      }
    })

    return {
      items: itemsWithOffset,
      totalMonthly,
      totalYearly: totalMonthly * 12,
    }
  }, [fixedCosts, activeCurrency])

  function formatMoney(amount: number): string {
    if (activeCurrency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  if (categoryData.items.length === 0) {
    return null
  }

  // Cálculos para o Donut Chart em SVG
  const radius = 70
  const circumference = 2 * Math.PI * radius

  const activeItem = hoveredCategory
    ? categoryData.items.find((i) => i.name === hoveredCategory)
    : null

  return (
    <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm sm:p-8">
      {/* Top Header com Título e Controles */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#edf2ee] pb-5 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d9873]">
            Visão Gráfica
          </span>
          <h3 className="text-xl font-bold tracking-tight text-[#173d2a]">
            Distribuição por Categorias
          </h3>
          <p className="mt-1 text-xs text-[#718078]">
            Proporção de gastos de cada categoria em relação ao total.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Período (Mensal / Anual) */}
          <div className="flex rounded-xl border border-[#e3eae4] bg-[#fbfcfb] p-1 text-xs">
            <button
              onClick={() => setViewPeriod('monthly')}
              className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                viewPeriod === 'monthly'
                  ? 'bg-[#173d2a] text-white'
                  : 'text-[#64736a] hover:text-[#173d2a]'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setViewPeriod('yearly')}
              className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                viewPeriod === 'yearly'
                  ? 'bg-[#173d2a] text-white'
                  : 'text-[#64736a] hover:text-[#173d2a]'
              }`}
            >
              Anual (12m)
            </button>
          </div>

          {/* Seletor de Moeda se houver ambas */}
          {hasBRL && hasUSD && (
            <div className="flex rounded-xl border border-[#e3eae4] bg-[#fbfcfb] p-1 text-xs">
              <button
                onClick={() => setSelectedCurrency('BRL')}
                className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                  activeCurrency === 'BRL'
                    ? 'bg-[#173d2a] text-white'
                    : 'text-[#64736a] hover:text-[#173d2a]'
                }`}
              >
                R$
              </button>
              <button
                onClick={() => setSelectedCurrency('USD')}
                className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
                  activeCurrency === 'USD'
                    ? 'bg-[#173d2a] text-white'
                    : 'text-[#64736a] hover:text-[#173d2a]'
                }`}
              >
                $
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Distribuição Contínua */}
      <div className="mt-6">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#edf2ee]">
          {categoryData.items.map((cat) => (
            <div
              key={cat.name}
              style={{
                width: `${cat.percentage}%`,
                backgroundColor: cat.color,
              }}
              title={`${cat.name}: ${cat.percentage.toFixed(1)}% (${formatMoney(
                viewPeriod === 'monthly' ? cat.monthly : cat.yearly
              )})`}
              onMouseEnter={() => setHoveredCategory(cat.name)}
              onMouseLeave={() => setHoveredCategory(null)}
              className="h-full transition-all duration-300 hover:opacity-85 cursor-pointer"
            />
          ))}
        </div>
      </div>

      {/* Grid Principal: Donut Chart + Lista Detalhada */}
      <div className="mt-8 grid items-center gap-8 lg:grid-cols-12">
        {/* Gráfico Donut SVG */}
        <div className="flex flex-col items-center justify-center lg:col-span-5">
          <div className="relative flex size-56 items-center justify-center">
            <svg
              viewBox="0 0 180 180"
              className="size-full -rotate-90 transform"
              aria-label="Gráfico de Rosca por Categorias"
            >
              {categoryData.items.map((cat) => {
                const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`
                const strokeDashoffset = -((cat.offsetPercent / 100) * circumference)

                const isHovered = hoveredCategory === cat.name
                const isAnyHovered = hoveredCategory !== null

                return (
                  <circle
                    key={cat.name}
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="transparent"
                    stroke={cat.color}
                    strokeWidth={isHovered ? 28 : 22}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      opacity: isAnyHovered && !isHovered ? 0.35 : 1,
                    }}
                    onMouseEnter={() => setHoveredCategory(cat.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  />
                )
              })}
            </svg>

            {/* Centro do Donut com informações contextuais */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              {activeItem ? (
                <>
                  <span className="text-xs font-semibold text-[#64736a] line-clamp-1 max-w-[130px]">
                    {activeItem.name}
                  </span>
                  <span className="text-2xl font-black tracking-tight text-[#173d2a]">
                    {activeItem.percentage.toFixed(1)}%
                  </span>
                  <span className="text-xs font-medium text-[#5d9873]">
                    {formatMoney(viewPeriod === 'monthly' ? activeItem.monthly : activeItem.yearly)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium uppercase tracking-wider text-[#8a998f]">
                    {viewPeriod === 'monthly' ? 'Total Mensal' : 'Total 12m'}
                  </span>
                  <span className="text-xl font-extrabold tracking-tight text-[#173d2a]">
                    {formatMoney(
                      viewPeriod === 'monthly'
                        ? categoryData.totalMonthly
                        : categoryData.totalYearly
                    )}
                  </span>
                  <span className="text-xs font-medium text-[#71917d]">
                    {categoryData.items.length} categoria(s)
                  </span>
                </>
              )}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-[#8a998f]">
            Passe o mouse sobre as fatias para inspecionar
          </p>
        </div>

        {/* Lista e Ranking Percentual das Categorias */}
        <div className="space-y-3 lg:col-span-7">
          {categoryData.items.map((cat) => {
            const isHovered = hoveredCategory === cat.name

            return (
              <div
                key={cat.name}
                onMouseEnter={() => setHoveredCategory(cat.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`flex flex-col gap-2 rounded-2xl border p-3.5 transition cursor-pointer ${
                  isHovered
                    ? 'border-[#5d9873] bg-[#edf5ef]/60 shadow-sm'
                    : 'border-[#edf2ee] bg-[#fbfcfb] hover:border-[#d8e1da]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="size-3.5 rounded-md shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-semibold text-[#173d2a]">{cat.name}</span>
                    <span className="text-xs text-[#8a998f]">
                      ({cat.count} {cat.count === 1 ? 'item' : 'itens'})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <span className="rounded-full bg-[#173d2a] px-2.5 py-0.5 text-xs font-bold text-white">
                      {cat.percentage.toFixed(1)}%
                    </span>
                    <span className="text-sm font-bold text-[#173d2a]">
                      {formatMoney(viewPeriod === 'monthly' ? cat.monthly : cat.yearly)}
                      <span className="text-xs font-normal text-[#8a998f]">
                        {viewPeriod === 'monthly' ? '/mês' : '/ano'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Mini barra de progresso individual */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#edf2ee]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
