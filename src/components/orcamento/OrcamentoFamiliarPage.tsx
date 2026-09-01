import { useMemo, useState } from 'react'
import type { CreditCard, OrcamentoCostItem, OrcamentoFamiliarData, Profile } from '../../types/finance'
import { usePrivacy } from '../../context/PrivacyContext'
import { PrivacyToggle } from '../common/PrivacyToggle'
import { formatMoneyInput, maskMoneyInput, parseMoney } from '../../utils/currency'
import { MONTHS_PTBR } from '../../utils/date'
import { OrcamentoCostModal } from './OrcamentoCostModal'

interface OrcamentoFamiliarPageProps {
  orcamentoData: OrcamentoFamiliarData
  profile: Profile | null
  creditCards: CreditCard[]
  onSaveOrcamento: (data: OrcamentoFamiliarData) => void
  onResetToMasterDefaults: () => void
}

export function OrcamentoFamiliarPage({
  orcamentoData,
  profile,
  creditCards,
  onSaveOrcamento,
  onResetToMasterDefaults,
}: OrcamentoFamiliarPageProps) {
  const { formatCurrency } = usePrivacy()

  // Tab ativa para as 3 visões
  const [activeTab, setActiveTab] = useState<'flow' | 'balance' | 'individual'>('flow')

  // Modais de Criação / Edição de Contas
  const [costModalState, setCostModalState] = useState<{
    isOpen: boolean
    target: 'user' | 'partner'
    costToEdit?: OrcamentoCostItem | null
  }>({
    isOpen: false,
    target: 'user',
    costToEdit: null,
  })

  // Identificação do Mês Atual
  const now = new Date()
  const currentMonthName = MONTHS_PTBR[now.getMonth()]?.label || ''
  const currentYear = now.getFullYear()

  // Sincronização de inputs de renda e cartões
  const [partnerNameInput, setPartnerNameInput] = useState(orcamentoData.partnerName)
  const [userIncomeStr, setUserIncomeStr] = useState(() =>
    formatMoneyInput(orcamentoData.userIncome || profile?.personalIncome || 0)
  )
  const [partnerIncomeStr, setPartnerIncomeStr] = useState(() =>
    formatMoneyInput(orcamentoData.partnerIncome || 0)
  )
  const [userCardsStr, setUserCardsStr] = useState(() =>
    formatMoneyInput(
      orcamentoData.userCreditCardsAmount ||
        creditCards.reduce((acc, c) => acc + (Number(c.invoiceAmount) || 0), 0)
    )
  )

  // ---------------- CÁLCULOS PRINCIPAIS ---------------- //
  const userIncome = parseMoney(userIncomeStr)
  const partnerIncome = parseMoney(partnerIncomeStr)
  const totalIncome = userIncome + partnerIncome

  const userCardsAmount = parseMoney(userCardsStr)

  const userFixedCostsTotal = useMemo(() => {
    return orcamentoData.userFixedCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
  }, [orcamentoData.userFixedCosts])

  const partnerFixedCostsTotal = useMemo(() => {
    return orcamentoData.partnerFixedCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
  }, [orcamentoData.partnerFixedCosts])

  const totalFixedCosts = userFixedCostsTotal + partnerFixedCostsTotal

  // 1. Visão de Fluxo Consolidado da Casa
  const houseNetSurplus = totalIncome - totalFixedCosts - userCardsAmount

  // 2. Visão de Equilíbrio & Proporcionalidade
  const userIncomePercent = totalIncome > 0 ? (userIncome / totalIncome) * 100 : 50
  const partnerIncomePercent = totalIncome > 0 ? (partnerIncome / totalIncome) * 100 : 50

  const userPaidPercent = totalFixedCosts > 0 ? (userFixedCostsTotal / totalFixedCosts) * 100 : 50
  const partnerPaidPercent =
    totalFixedCosts > 0 ? (partnerFixedCostsTotal / totalFixedCosts) * 100 : 50

  // Quanto cada um deveria pagar se fosse proporcional à renda
  const idealUserShare = totalFixedCosts * (userIncomePercent / 100)
  const idealPartnerShare = totalFixedCosts * (partnerIncomePercent / 100)

  // Quanto cada um pagaria se fosse 50/50
  const halfShare = totalFixedCosts / 2

  // Diferença para o usuário (positivo = pagando a mais que o ideal proporcional)
  const userDifferenceFromProportional = userFixedCostsTotal - idealUserShare

  // 3. Visão Individual & Autonomia
  const userFreeBalance = userIncome - userFixedCostsTotal - userCardsAmount
  const partnerAvailableBalance = partnerIncome - partnerFixedCostsTotal

  // ---------------- HANDLERS DE PERSISTÊNCIA ---------------- //

  function handleSaveHeaderValues() {
    onSaveOrcamento({
      ...orcamentoData,
      partnerName: partnerNameInput.trim() || 'Esposa / Parceira',
      userIncome,
      partnerIncome,
      userCreditCardsAmount: userCardsAmount,
    })
  }

  function handleSaveCostItem(cost: OrcamentoCostItem, target: 'user' | 'partner') {
    const nextOrcamento = { ...orcamentoData }

    if (target === 'user') {
      const exists = nextOrcamento.userFixedCosts.some((c) => c.id === cost.id)
      if (exists) {
        nextOrcamento.userFixedCosts = nextOrcamento.userFixedCosts.map((c) =>
          c.id === cost.id ? cost : c
        )
      } else {
        nextOrcamento.userFixedCosts = [...nextOrcamento.userFixedCosts, cost]
      }
    } else {
      const exists = nextOrcamento.partnerFixedCosts.some((c) => c.id === cost.id)
      if (exists) {
        nextOrcamento.partnerFixedCosts = nextOrcamento.partnerFixedCosts.map((c) =>
          c.id === cost.id ? cost : c
        )
      } else {
        nextOrcamento.partnerFixedCosts = [...nextOrcamento.partnerFixedCosts, cost]
      }
    }

    onSaveOrcamento(nextOrcamento)
  }

  function handleDeleteCostItem(id: string, target: 'user' | 'partner') {
    const nextOrcamento = { ...orcamentoData }
    if (target === 'user') {
      nextOrcamento.userFixedCosts = nextOrcamento.userFixedCosts.filter((c) => c.id !== id)
    } else {
      nextOrcamento.partnerFixedCosts = nextOrcamento.partnerFixedCosts.filter((c) => c.id !== id)
    }
    onSaveOrcamento(nextOrcamento)
  }

  function handleInlineUpdateAmount(
    id: string,
    newAmount: number,
    target: 'user' | 'partner'
  ) {
    const nextOrcamento = { ...orcamentoData }
    if (target === 'user') {
      nextOrcamento.userFixedCosts = nextOrcamento.userFixedCosts.map((c) =>
        c.id === id ? { ...c, amount: Math.max(0, newAmount) } : c
      )
    } else {
      nextOrcamento.partnerFixedCosts = nextOrcamento.partnerFixedCosts.map((c) =>
        c.id === id ? { ...c, amount: Math.max(0, newAmount) } : c
      )
    }
    onSaveOrcamento(nextOrcamento)
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-10 lg:px-10">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e5dc] bg-white/70 px-3 py-1 text-xs font-semibold text-[#5a8067]">
              <span className="size-2 rounded-full bg-[#79ad89]" /> Mês Atual •{' '}
              {currentMonthName} / {currentYear}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#173d2a] sm:text-4xl">
              Orçamento Familiar
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#64736a]">
              Planejamento mensal do casal com divisão de contas, fluxo consolidado e autonomia individual.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap sm:flex-nowrap">
            <PrivacyToggle variant="pill" />
            <button
              type="button"
              onClick={onResetToMasterDefaults}
              className="rounded-2xl border border-[#d8e1da] bg-white px-4 py-3 text-xs font-semibold text-[#64736a] hover:bg-[#edf5ef] hover:text-[#173d2a] transition cursor-pointer shadow-2xs"
              title="Recarrega suas contas dos Custos Fixos mestres"
            >
              🔄 Recarregar Minhas Contas
            </button>
          </div>
        </div>

        {/* Bloco de Rendas e Faturas do Mês (Configuração Rápida) */}
        <div className="mt-8 rounded-3xl border border-[#dfe8e1] bg-white p-5 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3 mb-5">
            <h2 className="text-sm font-bold text-[#173d2a] flex items-center gap-2">
              <span>💰</span> Rendimentos da Casa no Mês
            </h2>
            <span className="text-[11px] text-[#8a998f]">
              Edições salvas automaticamente
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sua Renda */}
            <div>
              <label className="block text-xs font-semibold text-[#30483a] mb-1">
                Sua Renda / Salário (R$)
              </label>
              <div className="relative rounded-2xl border border-[#d8e1da] bg-[#fafcfb] px-3.5 py-2.5 focus-within:bg-white focus-within:border-[#5d9873] focus-within:ring-3 focus-within:ring-[#b7d7c5]/40 transition">
                <span className="text-xs font-bold text-[#8a998f] mr-1.5">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={userIncomeStr}
                  onChange={(e) => setUserIncomeStr(maskMoneyInput(e.target.value))}
                  onBlur={handleSaveHeaderValues}
                  placeholder="0,00"
                  className="w-[85%] text-sm font-bold text-[#173d2a] outline-none"
                />
              </div>
            </div>

            {/* Renda da Esposa / Parceira */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#30483a]">
                  Renda de:
                </label>
                <input
                  type="text"
                  value={partnerNameInput}
                  onChange={(e) => setPartnerNameInput(e.target.value)}
                  onBlur={handleSaveHeaderValues}
                  placeholder="Esposa"
                  className="w-28 text-right text-xs font-bold text-[#5d9873] border-b border-dashed border-[#5d9873] outline-none bg-transparent"
                  title="Clique para renomear"
                />
              </div>
              <div className="relative rounded-2xl border border-[#d8e1da] bg-[#fafcfb] px-3.5 py-2.5 focus-within:bg-white focus-within:border-[#5d9873] focus-within:ring-3 focus-within:ring-[#b7d7c5]/40 transition">
                <span className="text-xs font-bold text-[#8a998f] mr-1.5">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={partnerIncomeStr}
                  onChange={(e) => setPartnerIncomeStr(maskMoneyInput(e.target.value))}
                  onBlur={handleSaveHeaderValues}
                  placeholder="0,00"
                  className="w-[85%] text-sm font-bold text-[#173d2a] outline-none"
                />
              </div>
            </div>

            {/* Fatura dos Seus Cartões */}
            <div>
              <label className="block text-xs font-semibold text-[#30483a] mb-1">
                Seus Cartões no Mês (R$)
              </label>
              <div className="relative rounded-2xl border border-[#d8e1da] bg-[#fafcfb] px-3.5 py-2.5 focus-within:bg-white focus-within:border-rose-400 focus-within:ring-3 focus-within:ring-rose-100 transition">
                <span className="text-xs font-bold text-rose-500 mr-1.5">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={userCardsStr}
                  onChange={(e) => setUserCardsStr(maskMoneyInput(e.target.value))}
                  onBlur={handleSaveHeaderValues}
                  placeholder="0,00"
                  className="w-[85%] text-sm font-bold text-rose-600 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- SELETOR DAS 3 VISÕES ESTRATÉGICAS ---------------- */}
        <div className="mt-8">
          <div className="flex rounded-2xl bg-[#e9eee9] p-1.5 gap-1 max-w-xl mx-auto sm:mx-0">
            <button
              type="button"
              onClick={() => setActiveTab('flow')}
              className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'flow'
                  ? 'bg-white text-[#173d2a] shadow-xs'
                  : 'text-[#64736a] hover:text-[#173d2a]'
              }`}
            >
              <span>🏡</span> Fluxo da Casa
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('balance')}
              className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'balance'
                  ? 'bg-white text-[#173d2a] shadow-xs'
                  : 'text-[#64736a] hover:text-[#173d2a]'
              }`}
            >
              <span>⚖️</span> Divisão & Proporção
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('individual')}
              className={`flex-1 rounded-xl py-2 px-3 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'individual'
                  ? 'bg-white text-[#173d2a] shadow-xs'
                  : 'text-[#64736a] hover:text-[#173d2a]'
              }`}
            >
              <span>👤</span> Visão Individual
            </button>
          </div>

          {/* CONTEÚDO DA VISÃO 1: FLUXO CONSOLIDADO DA CASA */}
          {activeTab === 'flow' && (
            <div className="mt-5 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Renda Total */}
                <div className="rounded-3xl border border-[#dfe8e1] bg-white p-5 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8a998f]">
                    1. Renda Total da Casa
                  </span>
                  <p className="mt-1.5 text-2xl font-black text-[#173d2a]">
                    {formatCurrency(totalIncome)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#64736a]">
                    Você ({formatCurrency(userIncome)}) + {partnerNameInput} ({formatCurrency(partnerIncome)})
                  </p>
                </div>

                {/* Custos Fixos Totais */}
                <div className="rounded-3xl border border-[#dfe8e1] bg-white p-5 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8a998f]">
                    2. (−) Custos Fixos Totais
                  </span>
                  <p className="mt-1.5 text-2xl font-bold text-[#30483a]">
                    {formatCurrency(totalFixedCosts)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#64736a]">
                    Suas contas ({formatCurrency(userFixedCostsTotal)}) + Dela ({formatCurrency(partnerFixedCostsTotal)})
                  </p>
                </div>

                {/* Seus Cartões */}
                <div className="rounded-3xl border border-[#dfe8e1] bg-white p-5 shadow-xs">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8a998f]">
                    3. (−) Seus Cartões
                  </span>
                  <p className="mt-1.5 text-2xl font-bold text-rose-600">
                    {formatCurrency(userCardsAmount)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#8a998f]">
                    Gastos no seu cartão no mês
                  </p>
                </div>

                {/* Sobra Real da Casa */}
                <div className="rounded-3xl bg-[#173d2a] p-5 text-white shadow-md">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#b7d7c5]">
                    4. (=) Sobra Real da Casa
                  </span>
                  <p className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {formatCurrency(houseNetSurplus)}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#b7d7c5]">
                    Poder de poupança / Caixinhas
                  </p>
                </div>
              </div>

              {/* Dica de Caixinhas */}
              <div className="rounded-2xl bg-[#edf5ef] border border-[#d8e5dc] p-4 text-xs text-[#245439] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎯</span>
                  <span>
                    Neste mês, o casal possui <strong>{formatCurrency(Math.max(0, houseNetSurplus))}</strong> de sobra conjunta que pode ser aportada na <strong>Reserva de Emergência</strong> ou em <strong>Caixinhas de Objetivos</strong>.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO DA VISÃO 2: EQUILÍBRIO & PROPORCIONALIDADE */}
          {activeTab === 'balance' && (
            <div className="mt-5 rounded-3xl border border-[#dfe8e1] bg-white p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#edf2ee] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#173d2a]">
                    Equilíbrio na Divisão de Contas
                  </h3>
                  <p className="text-xs text-[#64736a]">
                    Compare a proporção da renda que cada um traz para a casa com a proporção das contas que cada um paga.
                  </p>
                </div>
                <div className="rounded-full bg-[#edf5ef] border border-[#d8e5dc] px-3 py-1 text-xs font-semibold text-[#173d2a] self-start sm:self-auto">
                  Custos Totais: {formatCurrency(totalFixedCosts)}
                </div>
              </div>

              {/* Gráfico de Barras Comparativo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* 1. Proporção de Renda */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#30483a]">
                    <span>Proporção de Renda da Casa</span>
                    <span>
                      Você {userIncomePercent.toFixed(0)}% vs {partnerIncomePercent.toFixed(0)}% {partnerNameInput}
                    </span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-[#edf2ee] overflow-hidden flex">
                    <div
                      style={{ width: `${userIncomePercent}%` }}
                      className="bg-[#173d2a] h-full flex items-center justify-center text-[10px] text-white font-bold"
                    >
                      {userIncomePercent > 15 ? `${userIncomePercent.toFixed(0)}%` : ''}
                    </div>
                    <div
                      style={{ width: `${partnerIncomePercent}%` }}
                      className="bg-[#79ad89] h-full flex items-center justify-center text-[10px] text-white font-bold"
                    >
                      {partnerIncomePercent > 15 ? `${partnerIncomePercent.toFixed(0)}%` : ''}
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#718078]">
                    <span>Você: {formatCurrency(userIncome)}</span>
                    <span>{partnerNameInput}: {formatCurrency(partnerIncome)}</span>
                  </div>
                </div>

                {/* 2. Proporção de Contas Pagas */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#30483a]">
                    <span>Proporção Real de Contas Pagas</span>
                    <span>
                      Você {userPaidPercent.toFixed(0)}% vs {partnerPaidPercent.toFixed(0)}% {partnerNameInput}
                    </span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-[#edf2ee] overflow-hidden flex">
                    <div
                      style={{ width: `${userPaidPercent}%` }}
                      className="bg-[#173d2a] h-full flex items-center justify-center text-[10px] text-white font-bold"
                    >
                      {userPaidPercent > 15 ? `${userPaidPercent.toFixed(0)}%` : ''}
                    </div>
                    <div
                      style={{ width: `${partnerPaidPercent}%` }}
                      className="bg-[#79ad89] h-full flex items-center justify-center text-[10px] text-white font-bold"
                    >
                      {partnerPaidPercent > 15 ? `${partnerPaidPercent.toFixed(0)}%` : ''}
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#718078]">
                    <span>Você: {formatCurrency(userFixedCostsTotal)}</span>
                    <span>{partnerNameInput}: {formatCurrency(partnerFixedCostsTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Tabela Comparativa: Proporcional vs 50/50 */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#edf2ee] text-[#8a998f] uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 font-bold">Modelo de Divisão</th>
                      <th className="py-2.5 font-bold">Sua Parcela</th>
                      <th className="py-2.5 font-bold">Parcela de {partnerNameInput}</th>
                      <th className="py-2.5 font-bold text-right">Situação Atual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf2ee] font-semibold text-[#173d2a]">
                    <tr>
                      <td className="py-3">
                        <span className="font-bold">Divisão Atual</span>
                        <p className="text-[10px] font-normal text-[#8a998f]">Soma das contas cadastradas</p>
                      </td>
                      <td className="py-3">{formatCurrency(userFixedCostsTotal)} ({userPaidPercent.toFixed(0)}%)</td>
                      <td className="py-3">{formatCurrency(partnerFixedCostsTotal)} ({partnerPaidPercent.toFixed(0)}%)</td>
                      <td className="py-3 text-right text-[#5d9873]">Em vigor</td>
                    </tr>
                    <tr>
                      <td className="py-3">
                        <span className="font-bold">Divisão Proporcional à Renda</span>
                        <p className="text-[10px] font-normal text-[#8a998f]">Quem ganha mais paga proporcionalmente mais</p>
                      </td>
                      <td className="py-3">{formatCurrency(idealUserShare)} ({userIncomePercent.toFixed(0)}%)</td>
                      <td className="py-3">{formatCurrency(idealPartnerShare)} ({partnerIncomePercent.toFixed(0)}%)</td>
                      <td className="py-3 text-right text-[#64736a]">
                        {Math.abs(userDifferenceFromProportional) < 50
                          ? 'Perfeitamente equilibrado'
                          : userDifferenceFromProportional > 0
                          ? `Você paga +${formatCurrency(userDifferenceFromProportional)}`
                          : `${partnerNameInput} paga +${formatCurrency(Math.abs(userDifferenceFromProportional))}`}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3">
                        <span className="font-bold">Divisão 50% / 50%</span>
                        <p className="text-[10px] font-normal text-[#8a998f]">Metade exata para cada um</p>
                      </td>
                      <td className="py-3">{formatCurrency(halfShare)} (50%)</td>
                      <td className="py-3">{formatCurrency(halfShare)} (50%)</td>
                      <td className="py-3 text-right text-[#64736a]">
                        Diferença de {formatCurrency(Math.abs(userFixedCostsTotal - halfShare))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CONTEÚDO DA VISÃO 3: INDIVIDUAL & AUTONOMIA */}
          {activeTab === 'individual' && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in duration-200">
              {/* Seu Espaço Pessoal */}
              <div className="rounded-3xl border border-[#b7d7c5] bg-gradient-to-br from-white to-[#f4f9f5] p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-xl bg-[#173d2a] text-white text-sm">
                      👤
                    </span>
                    <h3 className="text-base font-bold text-[#173d2a]">
                      Seu Espaço Pessoal (Você)
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#5d9873] bg-[#edf5ef] px-2.5 py-0.5 rounded-full">
                    Sua Autonomia
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64736a]">Sua Renda / Salário:</span>
                    <span className="font-bold text-[#173d2a]">{formatCurrency(userIncome)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64736a]">(−) Suas Contas Fixas:</span>
                    <span className="font-bold text-[#30483a]">− {formatCurrency(userFixedCostsTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64736a]">(−) Seus Cartões de Crédito:</span>
                    <span className="font-bold text-rose-600">− {formatCurrency(userCardsAmount)}</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#edf2ee] flex items-baseline justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#30483a]">
                    Seu Saldo Livre Real
                  </span>
                  <span className="text-2xl font-black text-[#173d2a]">
                    {formatCurrency(userFreeBalance)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#8a998f]">
                  Disponível para suas despesas pessoais ou aportes.
                </p>
              </div>

              {/* Espaço da Parceira */}
              <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-xl bg-[#79ad89] text-white text-sm">
                      👩
                    </span>
                    <h3 className="text-base font-bold text-[#173d2a]">
                      Espaço Pessoal ({partnerNameInput})
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#718078] bg-[#f7f8f5] px-2.5 py-0.5 rounded-full">
                    100% Autonomia Dela
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64736a]">Renda Dela:</span>
                    <span className="font-bold text-[#173d2a]">{formatCurrency(partnerIncome)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64736a]">(−) Contas Fixas Dela:</span>
                    <span className="font-bold text-[#30483a]">− {formatCurrency(partnerFixedCostsTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#8a998f]">
                    <span>(−) Cartões e Gastos Pessoais Dela:</span>
                    <span className="italic">Autônomo (não controlado)</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#edf2ee] flex items-baseline justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#30483a]">
                    Saldo Disponível Dela
                  </span>
                  <span className="text-2xl font-black text-[#173d2a]">
                    {formatCurrency(partnerAvailableBalance)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#8a998f]">
                  Livre para ela pagar os cartões dela e fazer escolhas pessoais sem micro-controle.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- SEÇÃO 2: GERENCIAMENTO DAS CONTAS DO MÊS ---------------- */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#173d2a] flex items-center gap-2">
                <span>📋</span> Contas e Despesas do Mês Atual
              </h2>
              <p className="text-xs text-[#8a998f]">
                Ajuste os valores previstos para este mês. Alterações feitas aqui <strong>não modificam</strong> sua tela mestra de Custos Fixos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna 1: Suas Contas (Você) */}
            <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#173d2a] flex items-center gap-2">
                      <span>👤</span> Suas Contas Fixas (Você)
                    </h3>
                    <span className="text-xs font-semibold text-[#5d9873]">
                      Total: {formatCurrency(userFixedCostsTotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCostModalState({
                        isOpen: true,
                        target: 'user',
                        costToEdit: null,
                      })
                    }
                    className="rounded-2xl bg-[#edf5ef] px-3.5 py-2 text-xs font-bold text-[#173d2a] hover:bg-[#d8e5dc] transition cursor-pointer flex items-center gap-1 border border-[#b7d7c5]"
                  >
                    <span>+</span>
                    <span>Adicionar Conta</span>
                  </button>
                </div>

                {orcamentoData.userFixedCosts.length === 0 ? (
                  <p className="py-8 text-center text-xs text-[#8a998f]">
                    Nenhuma conta sua cadastrada no orçamento deste mês.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {orcamentoData.userFixedCosts.map((cost) => (
                      <div
                        key={cost.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#fafcfb] border border-[#edf2ee] hover:border-[#d8e1da] transition"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#173d2a] truncate">
                            {cost.name}
                          </h4>
                          <span className="text-[10px] text-[#8a998f]">
                            {cost.category || 'Geral'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Edição inline do valor */}
                          <div className="relative rounded-xl border border-[#d8e1da] bg-white px-2.5 py-1.5 focus-within:border-[#5d9873] transition">
                            <span className="text-[10px] font-bold text-[#8a998f] mr-1">R$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              defaultValue={formatMoneyInput(cost.amount)}
                              onBlur={(e) => {
                                const val = parseMoney(e.target.value)
                                handleInlineUpdateAmount(cost.id, val, 'user')
                              }}
                              className="w-20 text-xs font-bold text-[#173d2a] outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setCostModalState({
                                isOpen: true,
                                target: 'user',
                                costToEdit: cost,
                              })
                            }
                            className="grid size-7 place-items-center rounded-lg text-[#8a998f] hover:bg-[#edf5ef] hover:text-[#173d2a] transition cursor-pointer"
                            title="Editar"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCostItem(cost.id, 'user')}
                            className="grid size-7 place-items-center rounded-lg text-[#8a998f] hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                            title="Remover do mês"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna 2: Contas Dela (Esposa / Parceira) */}
            <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#173d2a] flex items-center gap-2">
                      <span>👩</span> Contas Fixas ({partnerNameInput})
                    </h3>
                    <span className="text-xs font-semibold text-[#5d9873]">
                      Total: {formatCurrency(partnerFixedCostsTotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setCostModalState({
                        isOpen: true,
                        target: 'partner',
                        costToEdit: null,
                      })
                    }
                    className="rounded-2xl bg-[#edf5ef] px-3.5 py-2 text-xs font-bold text-[#173d2a] hover:bg-[#d8e5dc] transition cursor-pointer flex items-center gap-1 border border-[#b7d7c5]"
                  >
                    <span>+</span>
                    <span>Adicionar Conta Dela</span>
                  </button>
                </div>

                {orcamentoData.partnerFixedCosts.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs text-[#8a998f]">
                      Nenhuma conta de {partnerNameInput} cadastrada ainda.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setCostModalState({
                          isOpen: true,
                          target: 'partner',
                          costToEdit: null,
                        })
                      }
                      className="mt-3 text-xs font-bold text-[#5d9873] hover:underline cursor-pointer"
                    >
                      + Cadastrar primeira conta dela
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {orcamentoData.partnerFixedCosts.map((cost) => (
                      <div
                        key={cost.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#fafcfb] border border-[#edf2ee] hover:border-[#d8e1da] transition"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#173d2a] truncate">
                            {cost.name}
                          </h4>
                          <span className="text-[10px] text-[#8a998f]">
                            {cost.category || 'Geral'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Edição inline do valor */}
                          <div className="relative rounded-xl border border-[#d8e1da] bg-white px-2.5 py-1.5 focus-within:border-[#5d9873] transition">
                            <span className="text-[10px] font-bold text-[#8a998f] mr-1">R$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              defaultValue={formatMoneyInput(cost.amount)}
                              onBlur={(e) => {
                                const val = parseMoney(e.target.value)
                                handleInlineUpdateAmount(cost.id, val, 'partner')
                              }}
                              className="w-20 text-xs font-bold text-[#173d2a] outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setCostModalState({
                                isOpen: true,
                                target: 'partner',
                                costToEdit: cost,
                              })
                            }
                            className="grid size-7 place-items-center rounded-lg text-[#8a998f] hover:bg-[#edf5ef] hover:text-[#173d2a] transition cursor-pointer"
                            title="Editar"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCostItem(cost.id, 'partner')}
                            className="grid size-7 place-items-center rounded-lg text-[#8a998f] hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                            title="Remover do mês"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Modal de Criação / Edição de Despesa */}
        <OrcamentoCostModal
          isOpen={costModalState.isOpen}
          onClose={() => setCostModalState((prev) => ({ ...prev, isOpen: false }))}
          onSave={handleSaveCostItem}
          costToEdit={costModalState.costToEdit}
          target={costModalState.target}
          partnerName={partnerNameInput}
        />
      </div>
    </main>
  )
}
