import { useMemo, useState } from 'react'
import type { Caixinha, FixedCost, PatrimonioData } from '../../types/finance'
import { usePrivacy } from '../../context/PrivacyContext'
import { PrivacyToggle } from '../common/PrivacyToggle'
import { formatMoneyInput, maskMoneyInput, parseMoney } from '../../utils/currency'
import { MONTHS_PTBR } from '../../utils/date'
import { CaixinhaModal } from './CaixinhaModal'

interface CaixinhasPageProps {
  caixinhas: Caixinha[]
  fixedCosts: FixedCost[]
  patrimonio: PatrimonioData
  onSaveCaixinha: (caixinha: Omit<Caixinha, 'id' | 'createdAt'> & { id?: string }) => void
  onDeleteCaixinha: (id: string) => void
  onUpdateCaixinhaAmount: (id: string, newAmount: number) => void
  onUpdateEmergencyReserve: (newAmount: number) => void
}

export function CaixinhasPage({
  caixinhas,
  fixedCosts,
  patrimonio,
  onSaveCaixinha,
  onDeleteCaixinha,
  onUpdateCaixinhaAmount,
  onUpdateEmergencyReserve,
}: CaixinhasPageProps) {
  const { formatCurrency } = usePrivacy()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCaixinha, setEditingCaixinha] = useState<Caixinha | null>(null)
  const [caixinhaToDelete, setCaixinhaToDelete] = useState<Caixinha | null>(null)

  // Modal de Transação Rápida (Depositar / Resgatar)
  const [activeTransaction, setActiveTransaction] = useState<{
    type: 'deposit' | 'withdraw'
    targetId: string // 'reserve' ou ID da caixinha
    targetName: string
    currentAmount: number
  } | null>(null)
  const [transactionAmountStr, setTransactionAmountStr] = useState('')

  // 1. CUSTOS FIXOS E META DA RESERVA DE EMERGÊNCIA
  const monthlyFixedCosts = useMemo(() => {
    return fixedCosts.reduce((acc, c) => {
      const amt = Number(c.amount) || 0
      return acc + (c.recurrence === 'yearly' ? amt / 12 : amt)
    }, 0)
  }, [fixedCosts])

  // Meta da Reserva Fixa = 6 meses de custos fixos (metade dos custos fixos anuais)
  const emergencyReserveTarget = monthlyFixedCosts * 6

  // Saldo Atual da Reserva de Emergência no Balanço Patrimonial
  const emergencyReserveCurrent =
    Number(patrimonio.ATIVOS['Ativo Circulante'].Disponibilidades['Reserva de emergência']) || 0

  const emergencyProgressPercent =
    emergencyReserveTarget > 0
      ? Math.min(100, (emergencyReserveCurrent / emergencyReserveTarget) * 100)
      : emergencyReserveCurrent > 0
      ? 100
      : 0

  const emergencyMonthsCovered =
    monthlyFixedCosts > 0 ? emergencyReserveCurrent / monthlyFixedCosts : 0

  const emergencyRemaining = Math.max(0, emergencyReserveTarget - emergencyReserveCurrent)

  // 2. TOTAIS GERAIS DAS CAIXINHAS
  const customCaixinhasTotalCurrent = useMemo(() => {
    return caixinhas.reduce((acc, c) => acc + (Number(c.currentAmount) || 0), 0)
  }, [caixinhas])

  const customCaixinhasTotalTarget = useMemo(() => {
    return caixinhas.reduce((acc, c) => acc + (Number(c.targetAmount) || 0), 0)
  }, [caixinhas])

  const grandTotalSaved = emergencyReserveCurrent + customCaixinhasTotalCurrent
  const grandTotalTarget = emergencyReserveTarget + customCaixinhasTotalTarget
  const grandProgressPercent =
    grandTotalTarget > 0 ? Math.min(100, (grandTotalSaved / grandTotalTarget) * 100) : 0

  // Handler de Depósito / Resgate Rápido
  function handleExecuteTransaction() {
    if (!activeTransaction) return
    const delta = parseMoney(transactionAmountStr)
    if (delta <= 0) return

    if (activeTransaction.targetId === 'reserve') {
      const nextAmount =
        activeTransaction.type === 'deposit'
          ? emergencyReserveCurrent + delta
          : Math.max(0, emergencyReserveCurrent - delta)
      onUpdateEmergencyReserve(nextAmount)
    } else {
      const current = activeTransaction.currentAmount
      const nextAmount =
        activeTransaction.type === 'deposit'
          ? current + delta
          : Math.max(0, current - delta)
      onUpdateCaixinhaAmount(activeTransaction.targetId, nextAmount)
    }

    setActiveTransaction(null)
    setTransactionAmountStr('')
  }

  // Cálculo de Aporte Mensal Sugerido para uma caixinha
  function calculateMonthlyPace(caixinha: Caixinha): {
    monthsLeft: number
    monthlyPace: number
    formattedDeadline: string
  } | null {
    if (!caixinha.deadlineYear || !caixinha.deadlineMonth) return null

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12

    const monthsLeft =
      (caixinha.deadlineYear - currentYear) * 12 + (caixinha.deadlineMonth - currentMonth)

    const remainingAmount = Math.max(0, caixinha.targetAmount - caixinha.currentAmount)

    const safeMonths = Math.max(1, monthsLeft)
    const monthlyPace = remainingAmount / safeMonths

    const monthLabel = MONTHS_PTBR[caixinha.deadlineMonth - 1]?.label || `Mês ${caixinha.deadlineMonth}`
    const formattedDeadline = `${monthLabel}/${caixinha.deadlineYear}`

    return {
      monthsLeft,
      monthlyPace,
      formattedDeadline,
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-10 lg:px-10">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e5dc] bg-white/70 px-3 py-1 text-xs font-semibold text-[#5a8067]">
              <span className="size-2 rounded-full bg-[#79ad89]" /> Metas & Caixinhas
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#173d2a] sm:text-4xl">
              Caixinhas
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#64736a]">
              Separe seu dinheiro por objetivos, acompanhe metas de longo prazo e proteja sua vida com a reserva.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap sm:flex-nowrap">
            <PrivacyToggle variant="pill" />
            <button
              type="button"
              onClick={() => {
                setEditingCaixinha(null)
                setIsCreateModalOpen(true)
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#173d2a] px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#173d2a]/15 transition hover:-translate-y-0.5 hover:bg-[#245439] cursor-pointer"
            >
              <span className="text-lg leading-none">+</span>
              Nova Caixinha
            </button>
          </div>
        </div>

        {/* Métricas Consolidadas */}
        <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
          {/* Total Guardado */}
          <div className="rounded-3xl bg-[#173d2a] p-6 text-white shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#b7d7c5]">
              Total Acumulado em Caixinhas
            </span>
            <p className="mt-2 text-3xl font-black tracking-tight">
              {formatCurrency(grandTotalSaved)}
            </p>
            <p className="mt-1 text-xs text-[#b7d7c5]">
              Reserva ({formatCurrency(emergencyReserveCurrent)}) + Metas ({formatCurrency(customCaixinhasTotalCurrent)})
            </p>
          </div>

          {/* Meta Global */}
          <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8a998f]">
              Meta Total Planejada
            </span>
            <p className="mt-2 text-3xl font-bold text-[#173d2a]">
              {formatCurrency(grandTotalTarget)}
            </p>
            <p className="mt-1 text-xs text-[#718078]">
              {caixinhas.length + 1} {caixinhas.length + 1 === 1 ? 'objetivo ativo' : 'objetivos ativos'} (com Reserva)
            </p>
          </div>

          {/* Progresso Geral */}
          <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8a998f]">
                  Progresso Geral
                </span>
                <span className="text-xs font-extrabold text-[#245439] bg-[#e9f4ec] px-2 py-0.5 rounded-full">
                  {grandProgressPercent.toFixed(1).replace('.', ',')}%
                </span>
              </div>
              <div className="mt-3 h-2.5 w-full rounded-full bg-[#edf2ee] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#5d9873] transition-all duration-500"
                  style={{ width: `${grandProgressPercent}%` }}
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-[#718078]">
              Falta {formatCurrency(Math.max(0, grandTotalTarget - grandTotalSaved))} para atingir 100%
            </p>
          </div>
        </div>

        {/* ---------------- SEÇÃO 1: CAIXINHA FIXA DE RESERVA DE EMERGÊNCIA ---------------- */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <h2 className="text-lg font-bold text-[#173d2a]">
                Reserva de Emergência (Fixa)
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#5a8067] bg-[#edf5ef] px-3 py-1 rounded-full border border-[#d8e5dc]">
              Meta: 6 Meses de Custos Fixos (50% Anual)
            </span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#b7d7c5] bg-gradient-to-br from-white via-white to-[#f4f9f5] p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#173d2a] px-3 py-1 text-xs font-semibold text-white">
                  <span>🛡️</span> Caixinha Essencial de Proteção
                </div>
                <h3 className="text-2xl font-bold text-[#173d2a]">
                  Segurança Financeira Familiar
                </h3>
                <p className="text-xs sm:text-sm text-[#64736a] leading-relaxed">
                  Calculada automaticamente como <strong>metade dos seus custos fixos anuais</strong> (6 meses de vida a{' '}
                  <strong className="text-[#173d2a]">{formatCurrency(monthlyFixedCosts)}/mês</strong>). Conectada diretamente ao seu Balanço Patrimonial.
                </p>
              </div>

              {/* Botões de Aporte / Retirada da Reserva */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={() =>
                    setActiveTransaction({
                      type: 'deposit',
                      targetId: 'reserve',
                      targetName: 'Reserva de Emergência',
                      currentAmount: emergencyReserveCurrent,
                    })
                  }
                  className="rounded-2xl bg-[#173d2a] px-5 py-3 text-xs font-bold text-white hover:bg-[#245439] transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Depositar</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveTransaction({
                      type: 'withdraw',
                      targetId: 'reserve',
                      targetName: 'Reserva de Emergência',
                      currentAmount: emergencyReserveCurrent,
                    })
                  }
                  className="rounded-2xl border border-[#d8e1da] bg-white px-4 py-3 text-xs font-semibold text-[#173d2a] hover:bg-[#edf5ef] transition cursor-pointer"
                >
                  <span>−</span>
                  <span>Resgatar</span>
                </button>
              </div>
            </div>

            {/* Métricas e Barra de Progresso da Reserva */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#edf2ee] pt-6">
              <div>
                <span className="text-xs font-semibold text-[#8a998f] uppercase tracking-wider">
                  Valor Guardado Hoje
                </span>
                <p className="mt-1 text-2xl sm:text-3xl font-black text-[#173d2a]">
                  {formatCurrency(emergencyReserveCurrent)}
                </p>
                <p className="mt-0.5 text-xs font-medium text-[#5d9873]">
                  {emergencyMonthsCovered.toFixed(1).replace('.', ',')} {emergencyMonthsCovered === 1 ? 'mês protegido' : 'meses protegidos'}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#8a998f] uppercase tracking-wider">
                  Meta Recomendada (6 meses)
                </span>
                <p className="mt-1 text-2xl sm:text-3xl font-bold text-[#30483a]">
                  {formatCurrency(emergencyReserveTarget)}
                </p>
                <p className="mt-0.5 text-xs text-[#8a998f]">
                  6 × {formatCurrency(monthlyFixedCosts)}/mês
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#8a998f] uppercase tracking-wider">
                  Status da Cobertura
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#245439]">
                    {emergencyProgressPercent.toFixed(1).replace('.', ',')}%
                  </span>
                  <span className="text-xs text-[#64736a]">
                    {emergencyReserveCurrent >= emergencyReserveTarget
                      ? '✓ Meta Completa!'
                      : `Falta ${formatCurrency(emergencyRemaining)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra Visual */}
            <div className="mt-5">
              <div className="h-3.5 w-full rounded-full bg-[#e3eae4] overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    emergencyReserveCurrent >= emergencyReserveTarget
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                      : 'bg-[#5d9873]'
                  }`}
                  style={{ width: `${emergencyProgressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- SEÇÃO 2: CAIXINHAS PERSONALIZADAS ---------------- */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#173d2a] flex items-center gap-2">
                <span>🎯</span> Suas Caixinhas & Metas Livres
              </h2>
              <p className="text-xs text-[#8a998f]">
                Objetivos para viagens, compras, estudos e conquistas pessoais.
              </p>
            </div>

            <span className="rounded-full bg-[#f7f8f5] border border-[#e3eae4] px-3 py-1 text-xs font-semibold text-[#64736a] self-start sm:self-auto">
              {caixinhas.length} {caixinhas.length === 1 ? 'meta cadastrada' : 'metas cadastradas'}
            </span>
          </div>

          {caixinhas.length === 0 ? (
            /* Estado Vazio */
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#d8e1da] bg-white/70 p-10 text-center">
              <div className="grid size-16 place-items-center rounded-3xl bg-[#edf5ef] text-3xl text-[#5d9873] shadow-xs">
                🎯
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#173d2a]">
                Você ainda não criou nenhuma caixinha personalizada
              </h3>
              <p className="mt-1.5 max-w-md text-xs sm:text-sm text-[#64736a]">
                Crie caixinhas para guardar dinheiro com foco: Viagem de férias, troca de celular, reforma, entrada de imóvel ou carro.
              </p>

              {/* Botões de Exemplos Rápidos */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  { name: '✈️ Viagem de Férias', target: 8000 },
                  { name: '📱 Smartphone Novo', target: 4500 },
                  { name: '🚗 Troca de Carro', target: 25000 },
                  { name: '🎓 Curso / Certificação', target: 3000 },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      onSaveCaixinha({
                        name: preset.name.substring(3),
                        icon: preset.name.substring(0, 2),
                        targetAmount: preset.target,
                        currentAmount: 0,
                      })
                    }}
                    className="rounded-full border border-[#d8e5dc] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#30483a] hover:border-[#79ad89] hover:bg-[#edf5ef] transition cursor-pointer"
                  >
                    + {preset.name} ({formatCurrency(preset.target)})
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingCaixinha(null)
                  setIsCreateModalOpen(true)
                }}
                className="mt-6 rounded-2xl bg-[#173d2a] px-6 py-3 text-xs font-bold text-white hover:bg-[#245439] shadow-md shadow-[#173d2a]/10 transition cursor-pointer"
              >
                + Criar Minha Primeira Caixinha
              </button>
            </div>
          ) : (
            /* Grid de Caixinhas */
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {caixinhas.map((caixinha) => {
                const target = Number(caixinha.targetAmount) || 0
                const current = Number(caixinha.currentAmount) || 0
                const percent = target > 0 ? Math.min(100, (current / target) * 100) : 0
                const remaining = Math.max(0, target - current)
                const isCompleted = current >= target && target > 0

                const paceInfo = calculateMonthlyPace(caixinha)

                return (
                  <article
                    key={caixinha.id}
                    className="flex flex-col justify-between rounded-3xl border border-[#e3eae4] bg-white p-5 sm:p-6 shadow-xs transition hover:border-[#b7d7c5] hover:shadow-md"
                  >
                    <div>
                      {/* Top Row: Ícone, Nome e Ações */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f7f8f5] text-2xl border border-[#edf2ee]">
                            {caixinha.icon || '🎯'}
                          </span>
                          <div className="truncate">
                            <h3 className="text-base font-bold text-[#173d2a] truncate">
                              {caixinha.name}
                            </h3>
                            {caixinha.notes && (
                              <p className="text-[11px] text-[#8a998f] truncate">{caixinha.notes}</p>
                            )}
                          </div>
                        </div>

                        {/* Menu de Edição e Exclusão */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCaixinha(caixinha)
                              setIsCreateModalOpen(true)
                            }}
                            className="grid size-8 place-items-center rounded-xl text-[#8a998f] hover:bg-[#edf5ef] hover:text-[#173d2a] transition cursor-pointer"
                            title="Editar Caixinha"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => setCaixinhaToDelete(caixinha)}
                            className="grid size-8 place-items-center rounded-xl text-[#8a998f] hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                            title="Excluir Caixinha"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Valores */}
                      <div className="mt-5 space-y-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-semibold text-[#8a998f]">Guardado</span>
                          <span className="text-xs font-semibold text-[#8a998f]">Meta</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-black text-[#173d2a]">
                            {formatCurrency(current)}
                          </span>
                          <span className="text-sm font-bold text-[#64736a]">
                            {formatCurrency(target)}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                          <span className={isCompleted ? 'text-emerald-700 font-bold' : 'text-[#5d9873]'}>
                            {percent.toFixed(1).replace('.', ',')}% atingido
                          </span>
                          <span className="text-[#8a998f]">
                            {isCompleted ? '✓ Concluído!' : `Falta ${formatCurrency(remaining)}`}
                          </span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-[#edf2ee] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCompleted
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
                                : 'bg-[#173d2a]'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Ritmo Mensal / Prazo */}
                      {paceInfo && !isCompleted && (
                        <div className="mt-4 rounded-2xl bg-[#fafcfb] p-3 border border-[#edf2ee] text-xs">
                          <div className="flex items-center justify-between text-[#64736a]">
                            <span>Prazo: {paceInfo.formattedDeadline}</span>
                            <span className="font-bold text-[#173d2a]">
                              {formatCurrency(paceInfo.monthlyPace)}/mês
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] text-[#8a998f]">
                            {paceInfo.monthsLeft > 0
                              ? `Aporte sugerido para atingir em ${paceInfo.monthsLeft} meses`
                              : 'Prazo previsto atingido'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Botões de Aporte Rápido */}
                    <div className="mt-6 pt-4 border-t border-[#edf2ee] flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTransaction({
                            type: 'deposit',
                            targetId: caixinha.id,
                            targetName: caixinha.name,
                            currentAmount: current,
                          })
                        }
                        className="flex-1 rounded-2xl bg-[#edf5ef] py-2.5 text-xs font-bold text-[#173d2a] hover:bg-[#d8e5dc] transition cursor-pointer flex items-center justify-center gap-1 border border-[#b7d7c5]"
                      >
                        <span>+</span>
                        <span>Depositar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveTransaction({
                            type: 'withdraw',
                            targetId: caixinha.id,
                            targetName: caixinha.name,
                            currentAmount: current,
                          })
                        }
                        className="rounded-2xl border border-[#d8e1da] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#64736a] hover:bg-[#f7f8f5] hover:text-[#173d2a] transition cursor-pointer"
                        title="Resgatar valor"
                      >
                        <span>−</span>
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* Modal de Criação / Edição de Caixinha */}
        <CaixinhaModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false)
            setEditingCaixinha(null)
          }}
          onSave={onSaveCaixinha}
          caixinhaToEdit={editingCaixinha}
        />

        {/* Modal de Depósito / Resgate Rápido */}
        {activeTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl border border-[#e3eae4] bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                <h3 className="text-base font-bold text-[#173d2a]">
                  {activeTransaction.type === 'deposit' ? 'Depositar na Caixinha' : 'Resgatar da Caixinha'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTransaction(null)
                    setTransactionAmountStr('')
                  }}
                  className="grid size-7 place-items-center rounded-xl text-[#718078] hover:bg-[#edf5ef] transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <p className="text-xs text-[#64736a]">
                  Objetivo: <strong className="text-[#173d2a]">{activeTransaction.targetName}</strong>
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#30483a] mb-1.5">
                    Valor a {activeTransaction.type === 'deposit' ? 'Guardar' : 'Retirar'} (R$)
                  </label>
                  <div className="relative rounded-2xl border border-[#d8e1da] bg-white px-3.5 py-3 shadow-2xs focus-within:border-[#5d9873] focus-within:ring-4 focus-within:ring-[#b7d7c5]/40">
                    <span className="text-xs font-bold text-[#8a998f] mr-1.5">R$</span>
                    <input
                      type="text"
                      autoFocus
                      inputMode="numeric"
                      value={transactionAmountStr}
                      onChange={(e) => setTransactionAmountStr(maskMoneyInput(e.target.value))}
                      placeholder="0,00"
                      className="w-[85%] text-lg font-black text-[#173d2a] outline-none"
                    />
                  </div>
                </div>

                {/* Botões de Aporte Rápido */}
                <div className="flex flex-wrap gap-1.5">
                  {[50, 100, 200, 500, 1000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTransactionAmountStr(formatMoneyInput(val))}
                      className="rounded-full border border-[#d8e5dc] bg-[#f7f8f5] px-2.5 py-1 text-[11px] font-semibold text-[#30483a] hover:border-[#79ad89] hover:bg-[#edf5ef] transition cursor-pointer"
                    >
                      +{formatCurrency(val)}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#edf2ee]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTransaction(null)
                      setTransactionAmountStr('')
                    }}
                    className="rounded-2xl border border-[#d8e1da] px-4 py-2.5 text-xs font-semibold text-[#64736a] hover:bg-[#f7f8f5] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!transactionAmountStr || parseMoney(transactionAmountStr) <= 0}
                    onClick={handleExecuteTransaction}
                    className="rounded-2xl bg-[#173d2a] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#245439] transition cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmar {activeTransaction.type === 'deposit' ? 'Depósito' : 'Resgate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {caixinhaToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-3xl border border-[#e3eae4] bg-white p-6 shadow-2xl">
              <h3 className="text-base font-bold text-[#173d2a]">
                Excluir Caixinha
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#64736a] leading-relaxed">
                Tem certeza que deseja excluir a caixinha{' '}
                <strong className="text-[#173d2a]">"{caixinhaToDelete.name}"</strong> com saldo de{' '}
                <strong className="text-[#173d2a]">{formatCurrency(caixinhaToDelete.currentAmount)}</strong>? Esta ação não pode ser desfeita.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCaixinhaToDelete(null)}
                  className="rounded-2xl border border-[#d8e1da] px-4 py-2.5 text-xs font-semibold text-[#64736a] hover:bg-[#f7f8f5] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteCaixinha(caixinhaToDelete.id)
                    setCaixinhaToDelete(null)
                  }}
                  className="rounded-2xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer shadow-sm"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
