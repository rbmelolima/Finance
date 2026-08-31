import { useMemo, useState } from 'react'
import { getCategories } from '../../services/storage'
import type { Currency, FixedCost, Recurrence } from '../../types/finance'
import { CategoryDistributionChart } from './CategoryDistributionChart'
import { FixedCostModal } from './FixedCostModal'

interface FixedCostsPageProps {
  fixedCosts: FixedCost[]
  onSaveCost: (cost: Omit<FixedCost, 'id' | 'createdAt'> & { id?: string }) => void
  onDeleteCost: (id: string) => void
}

export function FixedCostsPage({ fixedCosts, onSaveCost, onDeleteCost }: FixedCostsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCost, setEditingCost] = useState<FixedCost | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [recurrenceFilter, setRecurrenceFilter] = useState<'all' | Recurrence>('all')
  const [currencyFilter, setCurrencyFilter] = useState<'all' | Currency>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [costToDelete, setCostToDelete] = useState<FixedCost | null>(null)

  const availableCategories = useMemo(() => {
    const allStored = getCategories()
    const usedInCosts = fixedCosts.map((c) => c.category).filter(Boolean)
    return Array.from(new Set([...allStored, ...usedInCosts]))
  }, [fixedCosts])

  // Verifica se existe algum custo em USD
  const hasUSDCosts = useMemo(() => {
    return fixedCosts.some((c) => c.currency === 'USD')
  }, [fixedCosts])

  // Cálculos de métricas consolidadas
  const metrics = useMemo(() => {
    let monthlyBRL = 0
    let monthlyUSD = 0
    let yearlyBRL = 0
    let yearlyUSD = 0

    fixedCosts.forEach((c) => {
      if (c.currency === 'BRL') {
        if (c.recurrence === 'monthly') {
          monthlyBRL += c.amount
        } else {
          yearlyBRL += c.amount
        }
      } else {
        if (c.recurrence === 'monthly') {
          monthlyUSD += c.amount
        } else {
          yearlyUSD += c.amount
        }
      }
    })

    const totalEquivalentMonthlyBRL = monthlyBRL + yearlyBRL / 12
    const totalEquivalentYearlyBRL = totalEquivalentMonthlyBRL * 12

    const totalEquivalentMonthlyUSD = monthlyUSD + yearlyUSD / 12
    const totalEquivalentYearlyUSD = totalEquivalentMonthlyUSD * 12

    return {
      monthlyBRL,
      yearlyBRL,
      totalEquivalentMonthlyBRL,
      totalEquivalentYearlyBRL,
      monthlyUSD,
      yearlyUSD,
      totalEquivalentMonthlyUSD,
      totalEquivalentYearlyUSD,
      totalCount: fixedCosts.length,
    }
  }, [fixedCosts])

  // Filtragem dos custos
  const filteredCosts = useMemo(() => {
    return fixedCosts.filter((cost) => {
      const matchesSearch =
        cost.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cost.description && cost.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cost.category && cost.category.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesRecurrence = recurrenceFilter === 'all' || cost.recurrence === recurrenceFilter
      const matchesCurrency = currencyFilter === 'all' || cost.currency === currencyFilter
      const matchesCategory = categoryFilter === 'all' || cost.category === categoryFilter

      return matchesSearch && matchesRecurrence && matchesCurrency && matchesCategory
    })
  }, [fixedCosts, searchTerm, recurrenceFilter, currencyFilter, categoryFilter])

  function formatCurrency(amount: number, currency: Currency): string {
    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  function handleOpenCreate() {
    setEditingCost(null)
    setIsModalOpen(true)
  }

  function handleOpenEdit(cost: FixedCost) {
    setEditingCost(cost)
    setIsModalOpen(true)
  }

  function confirmDelete() {
    if (costToDelete) {
      onDeleteCost(costToDelete.id)
      setCostToDelete(null)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] pb-24">
      <div className="mx-auto max-w-6xl px-6 pt-10 lg:px-10">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e5dc] bg-white/70 px-3 py-1 text-xs font-semibold text-[#5a8067]">
              Gestão de despesas
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#173d2a] sm:text-4xl">
              Custos Fixos
            </h1>
            <p className="mt-1 text-sm text-[#64736a]">
              Acompanhe suas assinaturas, contas essenciais e compromissos recorrentes categorizados.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#173d2a] px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#173d2a]/15 transition hover:-translate-y-0.5 hover:bg-[#245439] cursor-pointer"
          >
            <span className="text-lg leading-none">+</span>
            Novo Custo Fixo
          </button>
        </div>

        {/* Métricas / Cards de Resumo */}
        <div
          className={`mt-8 grid gap-4 ${
            hasUSDCosts ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'
          }`}
        >
          {/* Card Mensal BRL */}
          <div className="rounded-3xl bg-[#173d2a] p-6 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#b7d7c5]">
                Custo Mensal
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-[#b7d7c5]">
                R$ / mês
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight">
              {formatCurrency(metrics.totalEquivalentMonthlyBRL, 'BRL')}
            </p>
            <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-[#b7d7c5]">
              <span>Mensais diretos: {formatCurrency(metrics.monthlyBRL, 'BRL')}</span>
            </div>
          </div>

          {/* Card Anual (12 Meses) BRL */}
          <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#71917d]">
                Custo Anual (12 Meses)
              </span>
              <span className="rounded-full bg-[#edf5ef] px-2.5 py-0.5 text-xs font-semibold text-[#5d9873]">
                12 Meses
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-[#173d2a]">
              {formatCurrency(metrics.totalEquivalentYearlyBRL, 'BRL')}
            </p>
            <div className="mt-3 flex items-center gap-2 border-t border-[#edf2ee] pt-3 text-xs text-[#718078]">
              <span>Projeção anual de custos fixos em R$</span>
            </div>
          </div>

          {/* Card USD Condicional (Só aparece se houver custos em USD) */}
          {hasUSDCosts && (
            <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#71917d]">
                  Custos em Dólar ($)
                </span>
                <span className="rounded-full bg-[#edf5ef] px-2.5 py-0.5 text-xs font-medium text-[#5d9873]">
                  USD
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight text-[#173d2a]">
                {formatCurrency(metrics.totalEquivalentMonthlyUSD, 'USD')}
                <span className="text-xs font-normal text-[#8a998f]">/mês</span>
              </p>
              <div className="mt-3 flex items-center gap-2 border-t border-[#edf2ee] pt-3 text-xs text-[#718078]">
                <span>Anual: {formatCurrency(metrics.totalEquivalentYearlyUSD, 'USD')}/ano</span>
              </div>
            </div>
          )}

          {/* Card Total de Registros */}
          <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#71917d]">
                Custos Cadastrados
              </span>
              <span className="grid size-7 place-items-center rounded-full bg-[#edf5ef] text-xs font-bold text-[#173d2a]">
                #
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-[#173d2a]">
              {metrics.totalCount}
              <span className="text-xs font-normal text-[#8a998f]"> despesas ativas</span>
            </p>
            <div className="mt-3 flex items-center gap-3 border-t border-[#edf2ee] pt-3 text-xs text-[#718078]">
              <span>{fixedCosts.filter((c) => c.recurrence === 'monthly').length} mensais</span>
              <span>•</span>
              <span>{fixedCosts.filter((c) => c.recurrence === 'yearly').length} anuais</span>
            </div>
          </div>
        </div>

        {/* Gráfico de Distribuição por Categorias */}
        {fixedCosts.length > 0 && (
          <div className="mt-8">
            <CategoryDistributionChart fixedCosts={fixedCosts} />
          </div>
        )}

        {/* Barra de Filtros e Busca */}
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-[#dfe8e1] bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8a998f]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, categoria ou descrição..."
              className="w-full rounded-xl border border-[#e3eae4] bg-[#fbfcfb] py-2 pl-10 pr-4 text-xs text-[#173d2a] outline-none transition placeholder:text-[#a1afa6] focus:border-[#5d9873] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro por Categoria */}
            <div className="flex items-center">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border border-[#e3eae4] bg-[#fbfcfb] px-3 py-1.5 text-xs font-medium text-[#173d2a] outline-none transition focus:border-[#5d9873] cursor-pointer"
              >
                <option value="all">Todas as Categorias</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Recorrência */}
            <div className="flex rounded-xl border border-[#e3eae4] bg-[#fbfcfb] p-1 text-xs">
              <button
                onClick={() => setRecurrenceFilter('all')}
                className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                  recurrenceFilter === 'all'
                    ? 'bg-[#173d2a] text-white'
                    : 'text-[#64736a] hover:text-[#173d2a]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setRecurrenceFilter('monthly')}
                className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                  recurrenceFilter === 'monthly'
                    ? 'bg-[#173d2a] text-white'
                    : 'text-[#64736a] hover:text-[#173d2a]'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setRecurrenceFilter('yearly')}
                className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                  recurrenceFilter === 'yearly'
                    ? 'bg-[#173d2a] text-white'
                    : 'text-[#64736a] hover:text-[#173d2a]'
                }`}
              >
                Anual
              </button>
            </div>

            {/* Filtro Moeda (Oculta se não houver custos em USD) */}
            {hasUSDCosts && (
              <div className="flex rounded-xl border border-[#e3eae4] bg-[#fbfcfb] p-1 text-xs">
                <button
                  onClick={() => setCurrencyFilter('all')}
                  className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                    currencyFilter === 'all'
                      ? 'bg-[#173d2a] text-white'
                      : 'text-[#64736a] hover:text-[#173d2a]'
                  }`}
                >
                  Moedas
                </button>
                <button
                  onClick={() => setCurrencyFilter('BRL')}
                  className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                    currencyFilter === 'BRL'
                      ? 'bg-[#173d2a] text-white'
                      : 'text-[#64736a] hover:text-[#173d2a]'
                  }`}
                >
                  R$
                </button>
                <button
                  onClick={() => setCurrencyFilter('USD')}
                  className={`rounded-lg px-2.5 py-1 font-medium transition cursor-pointer ${
                    currencyFilter === 'USD'
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

        {/* Lista de Custos */}
        <div className="mt-6">
          {filteredCosts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d8e1da] bg-white/60 p-12 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#edf5ef] text-[#5d9873]">
                <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#173d2a]">
                {fixedCosts.length === 0
                  ? 'Nenhum custo fixo cadastrado ainda'
                  : 'Nenhum custo corresponde aos filtros selecionados'}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#718078]">
                {fixedCosts.length === 0
                  ? 'Cadastre suas assinaturas recorrentes, contas essenciais e mensalidades para ter clareza total dos seus gastos fixos.'
                  : 'Tente alterar os termos de busca ou limpar os filtros de categoria, recorrência ou moeda.'}
              </p>
              {fixedCosts.length === 0 && (
                <button
                  onClick={handleOpenCreate}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#173d2a] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#173d2a]/10 transition hover:bg-[#245439] cursor-pointer"
                >
                  + Cadastrar meu primeiro custo
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredCosts.map((cost) => {
                const monthlyEquivalent =
                  cost.recurrence === 'yearly' ? cost.amount / 12 : cost.amount
                const yearlyEquivalent =
                  cost.recurrence === 'monthly' ? cost.amount * 12 : cost.amount

                return (
                  <div
                    key={cost.id}
                    className="group flex flex-col justify-between gap-4 rounded-2xl border border-[#dfe8e1] bg-white p-5 transition hover:border-[#b7d7c5] hover:shadow-md sm:flex-row sm:items-center"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-[#173d2a]">{cost.name}</h4>
                        <span className="rounded-full bg-[#edf5ef] px-2.5 py-0.5 text-xs font-semibold text-[#2c6e43]">
                          {cost.category || 'Outros'}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            cost.recurrence === 'monthly'
                              ? 'bg-[#f3f6f4] text-[#64736a]'
                              : 'bg-[#fef6e7] text-[#976011]'
                          }`}
                        >
                          {cost.recurrence === 'monthly' ? 'Mensal' : 'Anual'}
                        </span>
                        {hasUSDCosts && (
                          <span className="rounded-full bg-[#f3f6f4] px-2 py-0.5 text-xs font-medium text-[#64736a]">
                            {cost.currency}
                          </span>
                        )}
                      </div>
                      {cost.description && (
                        <p className="text-xs text-[#718078]">{cost.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-6 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-bold text-[#173d2a]">
                          {formatCurrency(cost.amount, cost.currency)}
                          <span className="text-xs font-normal text-[#8a998f]">
                            {cost.recurrence === 'monthly' ? '/mês' : '/ano'}
                          </span>
                        </p>
                        <p className="text-xs text-[#5d9873]">
                          {cost.recurrence === 'monthly' ? (
                            <span>
                              Custo anual (12m):{' '}
                              <strong>{formatCurrency(yearlyEquivalent, cost.currency)}</strong>
                            </span>
                          ) : (
                            <span>
                              Equiv. mensal:{' '}
                              <strong>{formatCurrency(monthlyEquivalent, cost.currency)}/mês</strong>
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(cost)}
                          className="grid size-9 place-items-center rounded-xl border border-[#d8e1da] text-[#64736a] transition hover:bg-[#edf5ef] hover:text-[#173d2a] cursor-pointer"
                          title="Editar custo"
                        >
                          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCostToDelete(cost)}
                          className="grid size-9 place-items-center rounded-xl border border-[#d8e1da] text-[#a1afa6] transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          title="Excluir custo"
                        >
                          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      <FixedCostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveCost}
        costToEdit={editingCost}
      />

      {/* Modal de Confirmação de Exclusão */}
      {costToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#173d2a]">Confirmar Exclusão</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#718078]">
              Tem certeza que deseja remover o custo fixo{' '}
              <strong className="text-[#173d2a]">{costToDelete.name}</strong> (
              {formatCurrency(costToDelete.amount, costToDelete.currency)})? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setCostToDelete(null)}
                className="rounded-xl border border-[#d8e1da] px-4 py-2 text-xs font-semibold text-[#64736a] transition hover:bg-[#f3f6f4] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
