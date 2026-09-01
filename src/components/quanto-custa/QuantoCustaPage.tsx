import { useEffect, useMemo, useState } from 'react'
import type { FixedCost, ProductSimulation, Profile, SelicInfo } from '../../types/finance'
import { usePrivacy } from '../../context/PrivacyContext'
import { PrivacyToggle } from '../common/PrivacyToggle'
import { formatMoneyInput, maskMoneyInput, parseMoney } from '../../utils/currency'
import {
  calculateCdiYields,
  deleteSimulationItem,
  fetchSelicRate,
  getSimulations,
  saveSimulationItem,
} from '../../services/storage'

interface QuantoCustaPageProps {
  profile: Profile | null
  fixedCosts: FixedCost[]
  onSaveProfile: (profile: Profile) => void
}

export function QuantoCustaPage({
  profile,
  fixedCosts,
  onSaveProfile,
}: QuantoCustaPageProps) {
  const { formatCurrency } = usePrivacy()
  // Configuração Base (Renda e Horas de Trabalho)
  const [incomeStr, setIncomeStr] = useState(() =>
    profile?.personalIncome ? formatMoneyInput(profile.personalIncome) : '5.000,00'
  )
  const [workHours, setWorkHours] = useState<number>(() => profile?.workHoursPerMonth || 160)
  const [isEditingBase, setIsEditingBase] = useState(false)

  // Custo Fixo e Sobra
  const totalMonthlyFixedCosts = useMemo(() => {
    return fixedCosts.reduce((acc, cost) => {
      const amount = Number(cost.amount) || 0
      return acc + (cost.recurrence === 'yearly' ? amount / 12 : amount)
    }, 0)
  }, [fixedCosts])

  const [useAutoFixedCosts, setUseAutoFixedCosts] = useState(true)
  const [customFixedCostStr, setCustomFixedCostStr] = useState(() =>
    formatMoneyInput(totalMonthlyFixedCosts)
  )

  // Simulação do Produto Atual
  const [productName, setProductName] = useState('')
  const [productPriceStr, setProductPriceStr] = useState('')
  const [simulations, setSimulations] = useState<ProductSimulation[]>(getSimulations)
  const [saveSuccessFeedback, setSaveSuccessFeedback] = useState(false)

  // Taxa Selic em Tempo Real
  const [selicInfo, setSelicInfo] = useState<SelicInfo | null>(null)
  const [isLoadingSelic, setIsLoadingSelic] = useState(true)

  useEffect(() => {
    let isMounted = true
    fetchSelicRate()
      .then((info) => {
        if (isMounted) {
          setSelicInfo(info)
          setIsLoadingSelic(false)
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingSelic(false)
      })
    return () => {
      isMounted = false
    }
  }, [])


  // Cálculos Básicos
  const monthlySalary = parseMoney(incomeStr)
  const activeFixedCosts = useAutoFixedCosts
    ? totalMonthlyFixedCosts
    : parseMoney(customFixedCostStr)

  const freeBalance = Math.max(0, monthlySalary - activeFixedCosts)
  const safeWorkHours = Math.max(1, workHours || 1)

  // Valor da hora de trabalho bruta: Salário / Horas
  const grossHourlyRate = monthlySalary > 0 ? monthlySalary / safeWorkHours : 0

  // Valor da hora líquida de esforço livre: Sobra Livre / Horas
  const netFreeHourlyRate = freeBalance > 0 ? freeBalance / safeWorkHours : 0

  // Produto Simulado
  const productPrice = parseMoney(productPriceStr)

  // Cálculo de horas para o produto
  const grossHoursRequired = grossHourlyRate > 0 && productPrice > 0 ? productPrice / grossHourlyRate : 0
  const grossDaysRequired = grossHoursRequired / 8 // Base de 8h/dia útil

  const netFreeHoursRequired =
    netFreeHourlyRate > 0 && productPrice > 0 ? productPrice / netFreeHourlyRate : 0
  const netFreeDaysRequired = netFreeHoursRequired / 8

  // Impacto Percentual
  const percentOfSalary = monthlySalary > 0 && productPrice > 0 ? (productPrice / monthlySalary) * 100 : 0
  const percentOfFreeBalance = freeBalance > 0 && productPrice > 0 ? (productPrice / freeBalance) * 100 : 0

  // Rendimentos do CDI
  const currentSelicRate = selicInfo?.rateAnnual ?? 14.0
  const cdiYields = calculateCdiYields(productPrice, currentSelicRate)

  // Salvar configurações de renda e horas
  function handleSaveBaseConfig() {
    if (profile) {
      const updated: Profile = {
        ...profile,
        personalIncome: monthlySalary > 0 ? monthlySalary : undefined,
        workHoursPerMonth: safeWorkHours,
        updatedAt: new Date().toISOString(),
      }
      onSaveProfile(updated)
    }
    setIsEditingBase(false)
  }

  // Salvar Simulação
  function handleSaveSimulation() {
    if (!productPrice || productPrice <= 0) return

    const trimmedName = productName.trim() || 'Item sem nome'

    const saved = saveSimulationItem({
      name: trimmedName,
      price: productPrice,
      grossHours: grossHoursRequired,
      netFreeHours: netFreeHoursRequired,
      monthlySalary,
      workHoursPerMonth: safeWorkHours,
      fixedCostsAmount: activeFixedCosts,
      freeBalanceAmount: freeBalance,
      selicRate: currentSelicRate,
      yield1Month: cdiYields.yield1Month,
      yield6Months: cdiYields.yield6Months,
      yield1Year: cdiYields.yield1Year,
    })

    setSimulations(getSimulations())
    setSaveSuccessFeedback(true)
    setTimeout(() => setSaveSuccessFeedback(false), 3000)
    return saved
  }

  function handleDeleteSimulation(id: string) {
    deleteSimulationItem(id)
    setSimulations(getSimulations())
  }

  function handleLoadSimulation(sim: ProductSimulation) {
    setProductName(sim.name)
    setProductPriceStr(formatMoneyInput(sim.price))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handlePresetItem(name: string, price: number) {
    setProductName(name)
    setProductPriceStr(formatMoneyInput(price))
  }

  function formatHoursDisplay(hours: number): string {
    if (hours <= 0) return '0h'
    if (hours < 1) {
      const minutes = Math.round(hours * 60)
      return `${minutes} min`
    }
    if (hours < 24) {
      const wholeHours = Math.floor(hours)
      const minutes = Math.round((hours - wholeHours) * 60)
      if (minutes === 0) {
        return `${wholeHours}h`
      }
      return `${wholeHours}h ${minutes}m`
    }

    // Passou de 24h: mede em dias úteis de trabalho (jornada de 8h/dia)
    const days = hours / 8
    const roundedDays = Math.round(days * 10) / 10
    const isInteger = roundedDays % 1 === 0

    if (isInteger) {
      return `${roundedDays} ${roundedDays === 1 ? 'dia' : 'dias'}`
    }
    return `${roundedDays.toFixed(1).replace('.', ',')} dias`
  }


  return (
    <main className="min-h-screen bg-[#f7f8f5] px-4 py-6 sm:px-6 md:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header Principal */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e3eae4] pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-[#173d2a] text-lg text-white shadow-sm">
                ⏱️
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#173d2a] sm:text-3xl">
                  Quanto Custa?
                </h1>
                <p className="text-xs sm:text-sm text-[#64736a]">
                  Descubra o valor real dos produtos em horas de vida e seu custo de oportunidade no CDI.
                </p>
              </div>
            </div>
          </div>

          {/* Badge Selic e Botão Privacidade */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap self-start sm:self-auto">
            <PrivacyToggle variant="pill" />

            <div className="flex items-center gap-2 rounded-2xl border border-[#d8e5dc] bg-white px-3.5 py-2 text-xs shadow-xs">
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="font-semibold text-[#173d2a]">
                  Selic Hoje:{' '}
                  {isLoadingSelic ? (
                    <span className="text-[#8a998f]">carregando...</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">
                      {currentSelicRate.toFixed(2).replace('.', ',')}% a.a.
                    </span>
                  )}
                </span>
                {selicInfo?.rateDate && (
                  <span className="ml-1 text-[10px] text-[#8a998f]">({selicInfo.rateDate})</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Linha de Base: Salário, Horas e Custo Fixo */}
        <section className="rounded-3xl border border-[#e3eae4] bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#edf2ee] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#173d2a] flex items-center gap-2">
                <span>⚙️</span> Sua Base de Cálculo
              </h2>
              <p className="text-xs text-[#8a998f]">
                Usada para converter qualquer preço em horas de trabalho e esforço real.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isEditingBase) {
                  handleSaveBaseConfig()
                } else {
                  setIsEditingBase(true)
                }
              }}
              className="self-start sm:self-auto rounded-xl border border-[#d8e1da] bg-[#f7f8f5] px-3 py-1.5 text-xs font-semibold text-[#173d2a] hover:bg-[#edf5ef] transition cursor-pointer"
            >
              {isEditingBase ? '💾 Salvar Alterações' : '✏️ Ajustar Renda & Horas'}
            </button>
          </div>

          {isEditingBase ? (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Input Salário */}
              <div>
                <label className="block text-xs font-semibold text-[#30483a]">
                  Renda Mensal Líquida (R$)
                </label>
                <div className="mt-1.5 relative rounded-2xl border border-[#d8e1da] bg-white px-3.5 py-2.5 shadow-2xs focus-within:border-[#5d9873] focus-within:ring-2 focus-within:ring-[#b7d7c5]/40">
                  <span className="text-xs text-[#8a998f] mr-1">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={incomeStr}
                    onChange={(e) => setIncomeStr(maskMoneyInput(e.target.value))}
                    className="w-[85%] text-sm font-semibold text-[#173d2a] outline-none"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Horas de Trabalho */}
              <div>
                <label className="block text-xs font-semibold text-[#30483a]">
                  Horas Trabalhadas no Mês
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={workHours}
                    onChange={(e) => setWorkHours(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-24 rounded-2xl border border-[#d8e1da] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#173d2a] outline-none focus:border-[#5d9873] focus:ring-2 focus:ring-[#b7d7c5]/40"
                  />
                  <div className="flex gap-1">
                    {[160, 176, 200, 220].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setWorkHours(h)}
                        className={`rounded-xl px-2 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                          workHours === h
                            ? 'bg-[#173d2a] text-white'
                            : 'bg-[#f7f8f5] text-[#64736a] hover:bg-[#edf5ef]'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custos Fixos */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#30483a]">
                    Custo Fixo Mensal (R$)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (useAutoFixedCosts) {
                        setCustomFixedCostStr(formatMoneyInput(totalMonthlyFixedCosts))
                      }
                      setUseAutoFixedCosts(!useAutoFixedCosts)
                    }}
                    className="text-[10px] font-semibold text-[#5d9873] hover:underline cursor-pointer"
                  >
                    {useAutoFixedCosts ? 'Personalizar valor' : 'Usar app automático'}
                  </button>
                </div>
                <div className="mt-1.5 relative rounded-2xl border border-[#d8e1da] bg-white px-3.5 py-2.5 shadow-2xs">
                  <span className="text-xs text-[#8a998f] mr-1">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={useAutoFixedCosts}
                    value={useAutoFixedCosts ? formatMoneyInput(totalMonthlyFixedCosts) : customFixedCostStr}
                    onChange={(e) => setCustomFixedCostStr(maskMoneyInput(e.target.value))}
                    className={`w-[85%] text-sm font-semibold outline-none ${
                      useAutoFixedCosts ? 'bg-transparent text-[#64736a]' : 'text-[#173d2a]'
                    }`}
                  />
                </div>

              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
              <div className="rounded-2xl bg-[#f7f8f5] p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a998f]">
                  Renda Mensal
                </p>
                <p className="mt-1 text-base sm:text-lg font-bold text-[#173d2a]">
                  {formatCurrency(monthlySalary)}
                </p>
                <p className="text-[10px] text-[#64736a]">{workHours}h / mês</p>
              </div>

              <div className="rounded-2xl bg-[#f7f8f5] p-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8a998f]">
                  Custo Fixo
                </p>
                <p className="mt-1 text-base sm:text-lg font-bold text-amber-900">
                  {formatCurrency(activeFixedCosts)}
                </p>
                <p className="text-[10px] text-[#64736a]">
                  {useAutoFixedCosts ? 'Do app' : 'Personalizado'}
                </p>
              </div>

              <div className="rounded-2xl bg-[#edf5ef] p-3.5 border border-[#d8e5dc]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#30483a]">
                  Hora Bruta
                </p>
                <p className="mt-1 text-base sm:text-lg font-extrabold text-[#173d2a]">
                  {formatCurrency(grossHourlyRate)}
                  <span className="text-xs font-normal text-[#5d9873]"> /h</span>
                </p>
                <p className="text-[10px] text-[#64736a]">Salário ÷ {workHours}h</p>
              </div>

              <div className="rounded-2xl bg-[#e9f4ec] p-3.5 border border-[#b7d7c5]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#173d2a]">
                    Hora Livre Real
                  </p>
                  <span className="text-xs" title="O valor real da hora que sobra para você gastar">✨</span>
                </div>
                <p className="mt-1 text-base sm:text-lg font-extrabold text-[#173d2a]">
                  {formatCurrency(netFreeHourlyRate)}
                  <span className="text-xs font-normal text-[#173d2a]"> /h</span>
                </p>
                <p className="text-[10px] text-[#5d9873]">
                  Sobra ({formatCurrency(freeBalance)}) ÷ {workHours}h
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Seção Principal: Simulador do Produto */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Formulário de Simulação */}
          <div className="rounded-3xl border border-[#e3eae4] bg-white p-5 sm:p-7 shadow-xs lg:col-span-5">
            <h2 className="text-lg font-bold text-[#173d2a] flex items-center gap-2">
              <span>🛍️</span> O que você quer comprar?
            </h2>
            <p className="mt-1 text-xs text-[#64736a]">
              Coloque o nome e o valor do item para descobrir quanto tempo de vida ele vai custar.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSaveSimulation()
              }}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#30483a]">
                  Nome do Produto / Desejo
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: iPhone 16, Jantar especial, Viagem..."
                  className="mt-1.5 w-full rounded-2xl border border-[#d8e1da] bg-white px-4 py-3 text-sm font-medium text-[#173d2a] outline-none transition placeholder:text-[#a1afa6] focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#30483a]">
                  Valor do Produto (R$)
                </label>
                <div className="mt-1.5 relative rounded-2xl border border-[#d8e1da] bg-white px-4 py-3 shadow-2xs focus-within:border-[#5d9873] focus-within:ring-4 focus-within:ring-[#b7d7c5]/40">
                  <span className="text-sm font-bold text-[#64736a] mr-1.5">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={productPriceStr}
                    onChange={(e) => setProductPriceStr(maskMoneyInput(e.target.value))}
                    placeholder="0,00"
                    className="w-[85%] text-lg font-extrabold text-[#173d2a] outline-none placeholder:text-[#a1afa6]"
                  />
                </div>
              </div>

              {/* Botões de Exemplos Rápidos */}
              <div>
                <p className="text-[11px] font-semibold text-[#8a998f] uppercase tracking-wider mb-2">
                  Exemplos rápidos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Café & Lanche', price: 35 },
                    { name: 'Jantar a dois', price: 220 },
                    { name: 'Tênis de Corrida', price: 650 },
                    { name: 'Smartphone Novo', price: 4200 },
                    { name: 'Viagem de Férias', price: 8500 },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handlePresetItem(preset.name, preset.price)}
                      className="rounded-full border border-[#d8e5dc] bg-[#f7f8f5] px-3 py-1 text-[11px] font-medium text-[#30483a] hover:border-[#79ad89] hover:bg-[#edf5ef] transition cursor-pointer"
                    >
                      {preset.name} ({formatCurrency(preset.price)})
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveSimulation}
                  disabled={!productPrice || productPrice <= 0}
                  className={`w-full rounded-2xl py-3.5 px-4 font-semibold text-white transition cursor-pointer flex items-center justify-center gap-2 ${
                    productPrice > 0
                      ? 'bg-[#173d2a] hover:bg-[#245439] shadow-md shadow-[#173d2a]/10'
                      : 'bg-[#173d2a]/40 cursor-not-allowed'
                  }`}
                >
                  <span>Salvar no Histórico</span>
                  <span>📌</span>
                </button>
                {saveSuccessFeedback && (
                  <p className="mt-2 text-center text-xs font-semibold text-emerald-600 animate-fade-in">
                    ✓ Simulação salva no histórico abaixo!
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Cartões de Resultado */}
          <div className="space-y-6 lg:col-span-7">
            {productPrice > 0 ? (
              <>
                {/* 1. O Custo em Horas Brutas e Horas de Descanso/Sobra */}
                <div className="overflow-hidden rounded-3xl border border-[#d8e5dc] bg-white shadow-xs">
                  <div className="bg-[#173d2a] p-6 text-white">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-[#b7d7c5]">
                        Resultado do Tempo de Trabalho
                      </span>
                      <span className="text-xl">⏱️</span>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-[#b7d7c5]">
                        O produto <span className="font-bold text-white">"{productName || 'selecionado'}"</span> custa:
                      </p>
                      <div className="mt-1 flex flex-wrap items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                          {formatHoursDisplay(grossHoursRequired)}
                        </span>
                        <span className="text-sm sm:text-base text-[#b7d7c5]">
                          {grossHoursRequired >= 24
                            ? `de trabalho (${Math.round(grossHoursRequired)}h no total em jornada de 8h)`
                            : `de trabalho bruto (${grossDaysRequired.toFixed(1).replace('.', ',')} dias de 8h)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* O GRANDE PULO DO GATO: HORAS DE DESCANSO / SOBRA REAL */}
                  <div className="border-t border-[#edf2ee] bg-[#edf5ef] p-6">
                    <div className="flex items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-[#173d2a] text-lg text-white">
                        🛋️
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#173d2a] uppercase tracking-wider">
                            O Pulo do Gato: Tempo de Esforço Real
                          </h3>
                        </div>

                        {freeBalance > 0 ? (
                          <>
                            <p className="mt-2 text-xs sm:text-sm text-[#30483a] leading-relaxed">
                              Descontando seu custo fixo de{' '}
                              <strong className="text-[#173d2a]">{formatCurrency(activeFixedCosts)}</strong>, o
                              que sobra no seu mês é{' '}
                              <strong className="text-emerald-800">{formatCurrency(freeBalance)}</strong>.
                            </p>

                            <div className="mt-3 rounded-2xl bg-white p-4 border border-[#d8e5dc]">
                              <p className="text-xs font-semibold text-[#64736a]">
                                Em esforço livre / horas de descanso sacrificadas:
                              </p>
                              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                                <span className="text-3xl sm:text-4xl font-black text-[#173d2a]">
                                  {formatHoursDisplay(netFreeHoursRequired)}
                                </span>
                                <span className="text-xs sm:text-sm text-[#5d9873] font-medium">
                                  {netFreeHoursRequired >= 24
                                    ? `de pura sobra líquida (${Math.round(netFreeHoursRequired)}h de esforço total)`
                                    : `(${netFreeDaysRequired.toFixed(1).replace('.', ',')} dias úteis de pura sobra líquida)`}
                                </span>
                              </div>
                              <p className="mt-2 text-[11px] text-[#8a998f]">
                                💡 Isso significa que este item custa{' '}
                                <strong className="text-[#173d2a]">
                                  {(netFreeHoursRequired / Math.max(0.1, grossHoursRequired)).toFixed(1).replace('.', ',')}x mais
                                </strong>{' '}
                                tempo de esforço real do que a conta bruta aparenta!
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="mt-2 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                            ⚠️ Seus custos fixos consom 100% ou mais da sua renda mensal. Qualquer gasto novo
                            representa endividamento ou sacrifício direto de contas essenciais.
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Barras de Impacto no Mês */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#d8e5dc]/60">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-[#30483a] mb-1">
                          <span>Impacto no Salário</span>
                          <span>{percentOfSalary.toFixed(1).replace('.', ',')}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#d8e5dc]">
                          <div
                            className="h-full rounded-full bg-[#5d9873] transition-all duration-500"
                            style={{ width: `${Math.min(100, percentOfSalary)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-[#30483a] mb-1">
                          <span>Impacto na Sobra Livre</span>
                          <span>{percentOfFreeBalance.toFixed(1).replace('.', ',')}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#d8e5dc]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percentOfFreeBalance > 100 ? 'bg-rose-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(100, percentOfFreeBalance)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. CUSTO DE OPORTUNIDADE: RENDIMENTO NO CDI */}
                <div className="rounded-3xl border border-[#d8e5dc] bg-white p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-9 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 text-lg">
                        📈
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-[#173d2a]">
                          E se você investisse esses {formatCurrency(productPrice)}?
                        </h3>
                        <p className="text-xs text-[#64736a]">
                          Custo de oportunidade aplicado a 100% do CDI ({currentSelicRate.toFixed(2).replace('.', ',')}% a.a.)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 1 Mês */}
                    <div className="rounded-2xl bg-[#f7f8f5] p-4 border border-[#e3eae4]">
                      <p className="text-xs font-semibold text-[#8a998f] uppercase tracking-wider">
                        Em 1 Mês
                      </p>
                      <p className="mt-1.5 text-lg font-black text-emerald-700">
                        +{formatCurrency(cdiYields.yield1Month)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#64736a]">
                        Total: {formatCurrency(cdiYields.total1Month)}
                      </p>
                    </div>

                    {/* 6 Meses */}
                    <div className="rounded-2xl bg-[#edf5ef] p-4 border border-[#d8e5dc]">
                      <p className="text-xs font-semibold text-[#5a8067] uppercase tracking-wider">
                        Em 6 Meses
                      </p>
                      <p className="mt-1.5 text-lg font-black text-emerald-700">
                        +{formatCurrency(cdiYields.yield6Months)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#64736a]">
                        Total: {formatCurrency(cdiYields.total6Months)}
                      </p>
                    </div>

                    {/* 1 Ano */}
                    <div className="rounded-2xl bg-[#e9f4ec] p-4 border border-[#b7d7c5]">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#245439] uppercase tracking-wider">
                          Em 1 Ano
                        </p>
                        <span className="text-[10px] font-bold text-emerald-800 bg-white/70 px-2 py-0.5 rounded-full">
                          12 meses
                        </span>
                      </div>
                      <p className="mt-1.5 text-xl font-black text-emerald-800">
                        +{formatCurrency(cdiYields.yield1Year)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#173d2a] font-medium">
                        Total: {formatCurrency(cdiYields.total1Year)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#fafcfb] p-3.5 border border-[#edf2ee] text-xs text-[#64736a] flex items-center gap-2">
                    <span className="text-base shrink-0">💡</span>
                    <span>
                      Em 1 ano, este dinheiro geraria sozinho{' '}
                      <strong className="text-[#173d2a]">{formatCurrency(cdiYields.yield1Year)}</strong> sem
                      você precisar trabalhar nenhum minuto a mais.
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* Estado Vazio */
              <div className="flex min-h-[380px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#d8e1da] bg-white/60 p-8 text-center">
                <div className="grid size-16 place-items-center rounded-3xl bg-[#edf5ef] text-3xl text-[#5d9873] shadow-xs">
                  ⏱️
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#173d2a]">
                  Digite o valor do produto para ver a mágica
                </h3>
                <p className="mt-2 max-w-md text-xs sm:text-sm text-[#64736a]">
                  Descubra quantas horas de trabalho bruto e de esforço real você precisa trocar por esse item, além de quanto ele renderia no CDI.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Histórico de Simulações Salvas */}
        {simulations.length > 0 && (
          <section className="rounded-3xl border border-[#e3eae4] bg-white p-5 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
              <div>
                <h2 className="text-lg font-bold text-[#173d2a] flex items-center gap-2">
                  <span>📋</span> Simulações Recentes & Comparações
                </h2>
                <p className="text-xs text-[#64736a]">
                  Itens que você já analisou anteriormente salvos no seu dispositivo.
                </p>
              </div>
              <span className="rounded-full bg-[#f7f8f5] px-3 py-1 text-xs font-semibold text-[#64736a]">
                {simulations.length} {simulations.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {simulations.map((sim) => (
                <div
                  key={sim.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#e3eae4] bg-[#fafcfb] p-4.5 transition hover:border-[#b7d7c5] hover:bg-white hover:shadow-sm group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#173d2a] truncate">{sim.name}</h3>
                      <button
                        type="button"
                        onClick={() => handleDeleteSimulation(sim.id)}
                        className="text-xs text-[#8a998f] hover:text-rose-600 transition cursor-pointer p-1"
                        title="Remover do histórico"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="mt-1 text-lg font-extrabold text-[#173d2a]">
                      {formatCurrency(sim.price)}
                    </p>

                    <div className="mt-3 space-y-1.5 border-t border-[#edf2ee] pt-2.5 text-xs">
                      <div className="flex items-center justify-between text-[#64736a]">
                        <span>Tempo de trabalho:</span>
                        <strong className="text-[#173d2a] font-semibold">
                          {formatHoursDisplay(sim.grossHours)}
                          {sim.grossHours >= 24 && (
                            <span className="ml-1 text-[11px] font-normal text-[#8a998f]">
                              ({Math.round(sim.grossHours)}h)
                            </span>
                          )}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[#30483a]">
                        <span>Tempo de esforço real:</span>
                        <strong className="text-emerald-800 font-bold">
                          {formatHoursDisplay(sim.netFreeHours)}
                          {sim.netFreeHours >= 24 && (
                            <span className="ml-1 text-[11px] font-normal text-[#5d9873]">
                              ({Math.round(sim.netFreeHours)}h)
                            </span>
                          )}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[#8a998f] text-[11px]">
                        <span>Rend. 1 ano CDI:</span>
                        <span className="text-emerald-700 font-semibold">
                          +{formatCurrency(sim.yield1Year)}
                        </span>
                      </div>
                    </div>

                  </div>

                  <div className="mt-4 pt-3 border-t border-[#edf2ee] flex items-center justify-between">
                    <span className="text-[10px] text-[#8a998f]">
                      {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLoadSimulation(sim)}
                      className="text-xs font-semibold text-[#5d9873] hover:text-[#173d2a] hover:underline cursor-pointer"
                    >
                      Recalcular ↻
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
