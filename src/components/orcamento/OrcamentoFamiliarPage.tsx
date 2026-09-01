import { useMemo, useState } from 'react'
import type { OrcamentoCostItem, OrcamentoFamiliarData, PatrimonioData, Profile } from '../../types/finance'
import { usePrivacy } from '../../context/PrivacyContext'
import { PrivacyToggle } from '../common/PrivacyToggle'
import { formatMoneyInput, maskMoneyInput, parseMoney } from '../../utils/currency'
import { MONTHS_PTBR } from '../../utils/date'
import { OrcamentoCostModal } from './OrcamentoCostModal'

interface OrcamentoFamiliarPageProps {
  orcamentoData: OrcamentoFamiliarData
  profile: Profile | null
  patrimonio?: PatrimonioData | null
  onSaveOrcamento: (data: OrcamentoFamiliarData) => void
  onResetToMasterDefaults: () => void
}

export function OrcamentoFamiliarPage({
  orcamentoData,
  profile,
  patrimonio,
  onSaveOrcamento,
  onResetToMasterDefaults,
}: OrcamentoFamiliarPageProps) {
  const { formatCurrency } = usePrivacy()

  // Modal de Confirmação para Zerar
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

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

  // Sincronização de inputs de renda
  const [partnerNameInput, setPartnerNameInput] = useState(orcamentoData.partnerName)
  const [userIncomeStr, setUserIncomeStr] = useState(() =>
    formatMoneyInput(orcamentoData.userIncome || profile?.personalIncome || 0)
  )
  const [partnerIncomeStr, setPartnerIncomeStr] = useState(() =>
    formatMoneyInput(orcamentoData.partnerIncome || 0)
  )

  // ---------------- CÁLCULOS PRINCIPAIS ---------------- //
  const userIncome = parseMoney(userIncomeStr)
  const partnerIncome = parseMoney(partnerIncomeStr)
  const totalIncome = userIncome + partnerIncome

  // Custos Assumidos por Cada Um
  const userCostsTotal = useMemo(() => {
    return orcamentoData.userFixedCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
  }, [orcamentoData.userFixedCosts])

  const partnerCostsTotal = useMemo(() => {
    return orcamentoData.partnerFixedCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0)
  }, [orcamentoData.partnerFixedCosts])

  const totalHouseCosts = userCostsTotal + partnerCostsTotal

  // 1. Resposta 1: Quanto Sobra para Você
  const userSurplus = userIncome - userCostsTotal
  const userRecommendedAporte = Math.max(0, userSurplus * 0.2)
  const userFreeAfterAporte = userSurplus - userRecommendedAporte

  // 2. Resposta 2: Quanto Sobra para Ela
  const partnerSurplus = partnerIncome - partnerCostsTotal
  const partnerRecommendedAporte = Math.max(0, partnerSurplus * 0.2)
  const partnerFreeAfterAporte = partnerSurplus - partnerRecommendedAporte

  // 3. Resposta 3: Potencial de Aporte Mensal na Reserva de Emergência (sem dívidas)
  const houseTotalSurplus = totalIncome - totalHouseCosts
  const houseRecommendedAporte = userRecommendedAporte + partnerRecommendedAporte

  // Proporções de Renda da Casa (Ex: 80% / 20%)
  const userIncomePercent = totalIncome > 0 ? (userIncome / totalIncome) * 100 : 50
  const partnerIncomePercent = totalIncome > 0 ? (partnerIncome / totalIncome) * 100 : 50

  // Cota Justa Proporcional às Rendas
  const idealUserShare = totalHouseCosts * (userIncomePercent / 100)
  const idealPartnerShare = totalHouseCosts * (partnerIncomePercent / 100)

  // Diferença do Usuário em relação à Cota Justa Proporcional
  // Se > 0: pagou a mais que o justo (esposa deve transferir a diferença)
  // Se < 0: pagou a menos que o justo (você deve transferir a diferença)
  const userFairDifference = userCostsTotal - idealUserShare

  // Projeção da Reserva de Emergência (6 meses de custos da casa)
  const emergencyReserveTarget = totalHouseCosts * 6
  const currentEmergencyReserve =
    patrimonio?.ATIVOS['Ativo Circulante'].Disponibilidades['Reserva de emergência'] || 0
  const remainingForEmergencyReserve = Math.max(0, emergencyReserveTarget - currentEmergencyReserve)

  const monthsToCompleteWithRecommended =
    houseRecommendedAporte > 0
      ? Math.ceil(remainingForEmergencyReserve / houseRecommendedAporte)
      : null

  const monthsToCompleteWithFullSurplus =
    houseTotalSurplus > 0
      ? Math.ceil(remainingForEmergencyReserve / houseTotalSurplus)
      : null

  // ---------------- HANDLERS DE PERSISTÊNCIA ---------------- //

  function handleSaveHeaderValues() {
    onSaveOrcamento({
      ...orcamentoData,
      partnerName: partnerNameInput.trim() || 'Esposa / Parceira',
      userIncome,
      partnerIncome,
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

  function handleClearAllCosts() {
    onSaveOrcamento({
      ...orcamentoData,
      userFixedCosts: [],
      partnerFixedCosts: [],
    })
    setIsClearModalOpen(false)
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
              Visão direta: quanto sobra para você, quanto sobra para ela e o poder de aporte na Reserva de Emergência.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap sm:flex-nowrap">
            <PrivacyToggle variant="pill" />
            <button
              type="button"
              onClick={onResetToMasterDefaults}
              className="rounded-2xl border border-[#d8e1da] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#64736a] hover:bg-[#edf5ef] hover:text-[#173d2a] transition cursor-pointer shadow-2xs"
              title="Recarregar dados dos cadastros mestres"
            >
              🔄 Recarregar Mestres
            </button>
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="rounded-2xl border border-rose-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer shadow-2xs"
              title="Zerar todas as contas deste mês"
            >
              🗑️ Zerar Contas
            </button>
          </div>
        </div>

        {/* ---------------- BLOCO DE RENDIMENTOS DA CASA ---------------- */}
        <div className="mt-8 rounded-3xl border border-[#dfe8e1] bg-white p-5 sm:p-7 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3 mb-5">
            <h2 className="text-sm font-bold text-[#173d2a] flex items-center gap-2">
              <span>💰</span> Rendimentos Mensais da Casa
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#173d2a] bg-[#edf5ef] px-3 py-1 rounded-full border border-[#d8e5dc]">
                Renda Total Conjunta: {formatCurrency(totalIncome)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sua Renda */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#30483a]">
                  Sua Renda (Você)
                </label>
                <span className="text-[11px] font-extrabold text-[#173d2a] bg-[#edf5ef] px-2 py-0.5 rounded-md">
                  {userIncomePercent.toFixed(0)}% da renda da casa
                </span>
              </div>
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
                <div className="flex items-center gap-1">
                  <label className="text-xs font-semibold text-[#30483a]">
                    Renda de:
                  </label>
                  <input
                    type="text"
                    value={partnerNameInput}
                    onChange={(e) => setPartnerNameInput(e.target.value)}
                    onBlur={handleSaveHeaderValues}
                    placeholder="Esposa"
                    className="w-24 text-xs font-bold text-[#5d9873] border-b border-dashed border-[#5d9873] outline-none bg-transparent"
                    title="Clique para renomear"
                  />
                </div>
                <span className="text-[11px] font-extrabold text-[#5a8067] bg-[#edf5ef] px-2 py-0.5 rounded-md">
                  {partnerIncomePercent.toFixed(0)}% da renda da casa
                </span>
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
          </div>
        </div>

        {/* ---------------- AS 3 GRANDES RESPOSTAS: QUANTO SOBRA E APORTE NA RESERVA ---------------- */}
        <section className="mt-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Quanto Sobra para Você */}
            <div className="rounded-3xl border border-[#b7d7c5] bg-gradient-to-br from-white via-white to-[#f4f9f5] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-xl bg-[#173d2a] text-white text-sm">
                      👤
                    </span>
                    <h3 className="text-base font-bold text-[#173d2a]">
                      Sobra para Você
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#173d2a] bg-[#edf5ef] px-2 py-0.5 rounded-full">
                    {userIncomePercent.toFixed(0)}% Renda
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 text-xs text-[#64736a]">
                  <div className="flex justify-between">
                    <span>Sua Renda:</span>
                    <span className="font-bold text-[#173d2a]">{formatCurrency(userIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>(−) Suas Contas Assumidas:</span>
                    <span className="font-bold text-rose-600">− {formatCurrency(userCostsTotal)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#edf2ee] text-[11px]">
                    <span className="text-[#8a998f]">Sua Sobra Bruta:</span>
                    <span className="font-bold text-[#173d2a]">{formatCurrency(userSurplus)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#edf2ee] space-y-2.5">
                <div className="rounded-2xl bg-[#edf5ef] p-3 border border-[#d8e5dc]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                      🌱 Aporte Sugerido (20%)
                    </span>
                    <span className="text-xs font-black text-emerald-900">
                      {formatCurrency(userRecommendedAporte)}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    Destinado à Reserva / Patrimônio
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a998f] block">
                    Saldo 100% Livre (80%)
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-[#173d2a] mt-0.5">
                    {formatCurrency(userFreeAfterAporte)}
                  </p>
                  <p className="text-[11px] text-[#5d9873] mt-0.5 font-medium">
                    {userFreeAfterAporte >= 0 ? '✓ Livre para estilo de vida e gastos pessoais' : '⚠ Custos superam a renda'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Quanto Sobra para Ela */}
            <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-xl bg-[#79ad89] text-white text-sm">
                      👩
                    </span>
                    <h3 className="text-base font-bold text-[#173d2a]">
                      Sobra para {partnerNameInput}
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#5a8067] bg-[#edf5ef] px-2 py-0.5 rounded-full">
                    {partnerIncomePercent.toFixed(0)}% Renda
                  </span>
                </div>

                <div className="mt-4 space-y-2.5 text-xs text-[#64736a]">
                  <div className="flex justify-between">
                    <span>Renda Dela:</span>
                    <span className="font-bold text-[#173d2a]">{formatCurrency(partnerIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>(−) Contas Assumidas por Ela:</span>
                    <span className="font-bold text-rose-600">− {formatCurrency(partnerCostsTotal)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#edf2ee] text-[11px]">
                    <span className="text-[#8a998f]">Sobra Bruta Dela:</span>
                    <span className="font-bold text-[#173d2a]">{formatCurrency(partnerSurplus)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#edf2ee] space-y-2.5">
                <div className="rounded-2xl bg-[#edf5ef] p-3 border border-[#d8e5dc]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                      🌱 Aporte Sugerido (20%)
                    </span>
                    <span className="text-xs font-black text-emerald-900">
                      {formatCurrency(partnerRecommendedAporte)}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    Destinado à Reserva / Patrimônio
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8a998f] block">
                    Saldo 100% Livre Dela (80%)
                  </span>
                  <p className="text-2xl sm:text-3xl font-black text-[#173d2a] mt-0.5">
                    {formatCurrency(partnerFreeAfterAporte)}
                  </p>
                  <p className="text-[11px] text-[#5d9873] mt-0.5 font-medium">
                    {partnerFreeAfterAporte >= 0 ? '✓ Livre para escolhas pessoais dela' : '⚠ Custos superam a renda'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Aporte na Reserva de Emergência / Patrimônio */}
            <div className="rounded-3xl bg-[#173d2a] p-6 text-white shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-xl bg-white/20 text-white text-sm">
                      🛡️
                    </span>
                    <h3 className="text-base font-bold text-white">
                      Aporte Recomendado (20%)
                    </h3>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#b7d7c5] bg-white/10 px-2 py-0.5 rounded-full">
                    Reserva / Patrimônio
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-[#b7d7c5]">
                  <div className="flex justify-between">
                    <span>Sobra Total da Casa:</span>
                    <span className="font-bold text-white">{formatCurrency(houseTotalSurplus)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aporte Sugerido de Você:</span>
                    <span className="font-semibold text-white">{formatCurrency(userRecommendedAporte)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aporte Sugerido de {partnerNameInput}:</span>
                    <span className="font-semibold text-white">{formatCurrency(partnerRecommendedAporte)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/15 text-[11px]">
                    <span>Meta da Reserva (6 meses):</span>
                    <span className="font-bold text-white">{formatCurrency(emergencyReserveTarget)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/15">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b7d7c5] block">
                  Aporte Conjunto Sugerido (20%)
                </span>
                <p className="text-3xl font-black text-white mt-0.5">
                  {formatCurrency(houseRecommendedAporte)}
                  <span className="text-xs font-normal text-[#b7d7c5]"> /mês</span>
                </p>

                {houseRecommendedAporte > 0 && monthsToCompleteWithRecommended !== null ? (
                  <div className="mt-2 rounded-xl bg-white/10 p-2.5 text-[11px] text-[#d6ede0] space-y-1">
                    <p>
                      💡 Com <strong>20% ({formatCurrency(houseRecommendedAporte)}/mês)</strong>: conclui a Reserva em <strong>{monthsToCompleteWithRecommended} {monthsToCompleteWithRecommended === 1 ? 'mês' : 'meses'}</strong>.
                    </p>
                    {monthsToCompleteWithFullSurplus !== null && (
                      <p className="text-[10px] text-[#a4d4b7]">
                        ⚡ Se aportarem 100% da sobra ({formatCurrency(houseTotalSurplus)}/mês): conclui em <strong>{monthsToCompleteWithFullSurplus} {monthsToCompleteWithFullSurplus === 1 ? 'mês' : 'meses'}</strong>!
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#b7d7c5] mt-1">
                    Cadastre suas rendas e despesas para projetar o aporte.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ---------------- CARD DE ACERTO PROPORCIONAL (80% / 20%) ---------------- */}
          <div className="rounded-3xl border border-[#b7d7c5] bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5ef] px-3 py-1 text-xs font-bold text-[#173d2a]">
                <span>⚖️</span> Divisão Justa Proporcional ({userIncomePercent.toFixed(0)}% / {partnerIncomePercent.toFixed(0)}%)
              </div>
              <p className="text-xs text-[#64736a]">
                Como você tem <strong>{userIncomePercent.toFixed(0)}%</strong> da renda e {partnerNameInput} tem <strong>{partnerIncomePercent.toFixed(0)}%</strong>, para a conta ser justa você deve arcar com <strong>{formatCurrency(idealUserShare)}</strong> e ela com <strong>{formatCurrency(idealPartnerShare)}</strong>.
              </p>
            </div>

            <div className="rounded-2xl bg-[#fafcfb] border border-[#d8e1da] p-3.5 shrink-0 max-w-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a998f] block">
                Acerto do Casal no Mês
              </span>
              {totalHouseCosts === 0 ? (
                <p className="text-xs font-semibold text-[#8a998f] mt-0.5">Nenhuma conta cadastrada.</p>
              ) : Math.abs(userFairDifference) < 1 ? (
                <p className="text-sm font-bold text-emerald-700 mt-0.5">
                  ✓ Contas 100% equilibradas na proporção justa!
                </p>
              ) : userFairDifference > 0 ? (
                <div className="mt-0.5">
                  <p className="text-sm font-black text-[#173d2a]">
                    {partnerNameInput} transfere <span className="text-emerald-700">{formatCurrency(userFairDifference)}</span> para você
                  </p>
                  <p className="text-[10px] text-[#8a998f] mt-0.5">
                    (Para fechar exatamente em {userIncomePercent.toFixed(0)}% / {partnerIncomePercent.toFixed(0)}%)
                  </p>
                </div>
              ) : (
                <div className="mt-0.5">
                  <p className="text-sm font-black text-[#173d2a]">
                    Você transfere <span className="text-emerald-700">{formatCurrency(Math.abs(userFairDifference))}</span> para {partnerNameInput}
                  </p>
                  <p className="text-[10px] text-[#8a998f] mt-0.5">
                    (Para fechar exatamente em {userIncomePercent.toFixed(0)}% / {partnerIncomePercent.toFixed(0)}%)
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ---------------- SEÇÃO: GERENCIAMENTO DAS CONTAS DA CASA ---------------- */}
        <section className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#173d2a] flex items-center gap-2">
                <span>📋</span> Despesas da Casa no Mês
              </h2>
              <p className="text-xs text-[#8a998f]">
                Cadastre e edite as contas que cada um assume no mês.
              </p>
            </div>
            <div className="text-xs font-bold text-[#173d2a] bg-white border border-[#dfe8e1] px-4 py-2 rounded-2xl shadow-2xs">
              Custos Totais: {formatCurrency(totalHouseCosts)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna 1: Suas Contas (Você) */}
            <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#173d2a] flex items-center gap-2">
                      <span>👤</span> Suas Contas (Você)
                    </h3>
                    <span className="text-xs font-bold text-[#5d9873]">
                      Total Assumido: {formatCurrency(userCostsTotal)}
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
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {orcamentoData.userFixedCosts.map((cost) => (
                      <div
                        key={cost.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-[#edf2ee] bg-[#fafcfb] hover:border-[#d8e1da] transition"
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
                            title="Remover"
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
                      <span>👩</span> Contas de {partnerNameInput}
                    </h3>
                    <span className="text-xs font-bold text-[#5d9873]">
                      Total Assumido: {formatCurrency(partnerCostsTotal)}
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
                      Nenhuma conta cadastrada para {partnerNameInput}.
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
                      className="mt-2 text-xs font-bold text-[#5d9873] hover:underline cursor-pointer"
                    >
                      + Cadastrar primeira conta dela
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {orcamentoData.partnerFixedCosts.map((cost) => (
                      <div
                        key={cost.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-[#edf2ee] bg-[#fafcfb] hover:border-[#d8e1da] transition"
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
                            title="Remover"
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

        {/* Modal de Confirmação para Zerar Contas do Mês */}
        {isClearModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-[#e3eae4] bg-white p-6 shadow-2xl">
              <h3 className="text-base font-bold text-[#173d2a]">
                Zerar Contas do Mês Atual?
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#64736a] leading-relaxed">
                Esta ação vai limpar todas as despesas cadastradas neste orçamento mensal.
                Suas listas mestras de Custos Fixos e Contas Bancárias <strong>não</strong> serão afetadas.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(false)}
                  className="rounded-2xl border border-[#d8e1da] px-4 py-2.5 text-xs font-semibold text-[#64736a] hover:bg-[#f7f8f5] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleClearAllCosts}
                  className="rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer shadow-sm"
                >
                  Sim, Zerar Orçamento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
