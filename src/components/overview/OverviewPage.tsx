import { useState } from 'react'
import { calculateCarteiraTotals, getCardTimelineStatus } from '../../services/storage'
import type { BankAccount, CreditCard, Screen } from '../../types/finance'
import { usePrivacy } from '../../context/PrivacyContext'
import { PrivacyToggle } from '../common/PrivacyToggle'
import { formatMoneyInput, parseMoney } from '../../utils/currency'
import { BankLogo } from '../common/BankLogo'
import { BankAccountModal } from './BankAccountModal'
import { CreditCardModal } from './CreditCardModal'

interface OverviewPageProps {
  bankAccounts: BankAccount[]
  creditCards: CreditCard[]
  onSaveBankAccount: (account: Omit<BankAccount, 'id' | 'createdAt'> & { id?: string }) => void
  onDeleteBankAccount: (id: string) => void
  onUpdateAccountBalance: (id: string, newBalance: number) => void
  onSaveCreditCard: (card: Omit<CreditCard, 'id' | 'createdAt'> & { id?: string }) => void
  onDeleteCreditCard: (id: string) => void
  onUpdateCardInvoice: (id: string, newInvoiceAmount: number) => void
  onNavigate: (screen: Screen) => void
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  corrente: 'Conta Corrente',
  poupanca: 'Poupança',
  investimento: 'Investimento',
  carteira: 'Carteira Digital',
  outros: 'Outro',
}

export function OverviewPage({
  bankAccounts,
  creditCards,
  onSaveBankAccount,
  onDeleteBankAccount,
  onUpdateAccountBalance,
  onSaveCreditCard,
  onDeleteCreditCard,
  onUpdateCardInvoice,
  onNavigate,
}: OverviewPageProps) {
  const { formatCurrency } = usePrivacy()
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)

  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)

  // Quick edit de saldo inline
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null)
  const [inlineBalanceValue, setInlineBalanceValue] = useState('')

  // Quick edit de fatura inline
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [inlineInvoiceValue, setInlineInvoiceValue] = useState('')

  // Modo de visualização do teto diário: 'closing' (até fechar cartão) ou 'month' (até fim do mês)
  const [budgetHorizon, setBudgetHorizon] = useState<'closing' | 'month'>('closing')

  const totals = calculateCarteiraTotals(bankAccounts, creditCards)

  const formattedMoneyInAccounts = formatCurrency(totals.totalMoneyInAccounts)
  const formattedCreditCardsToPay = formatCurrency(totals.totalCreditCardsToPay)
  const formattedNetRealBalance = formatCurrency(totals.netRealBalance)

  const formattedDailyAvailableMonth = formatCurrency(totals.dailyAvailable)

  const formattedDailyAvailableClosing = totals.dailyAvailableUntilClosing !== null
    ? formatCurrency(totals.dailyAvailableUntilClosing)
    : formattedDailyAvailableMonth

  function handleStartEditBalance(account: BankAccount) {
    setEditingBalanceId(account.id)
    setInlineBalanceValue(formatMoneyInput(account.balance))
  }

  function handleSaveInlineBalance(id: string) {
    const val = parseMoney(inlineBalanceValue)
    if (!isNaN(val)) {
      onUpdateAccountBalance(id, val)
    }
    setEditingBalanceId(null)
  }

  function handleStartEditInvoice(card: CreditCard) {
    setEditingInvoiceId(card.id)
    setInlineInvoiceValue(formatMoneyInput(card.invoiceAmount))
  }

  function handleSaveInlineInvoice(id: string) {
    const val = parseMoney(inlineInvoiceValue)
    if (!isNaN(val)) {
      onUpdateCardInvoice(id, val)
    }
    setEditingInvoiceId(null)
  }

  const isNetPositive = totals.netRealBalance > 0
  const isNetZero = totals.netRealBalance === 0

  const hasClosingCards = totals.nextClosingCard !== null && totals.daysUntilNextClosing !== null
  const activeHorizon = hasClosingCards ? budgetHorizon : 'month'

  const displayedDailyAmount =
    activeHorizon === 'closing' ? formattedDailyAvailableClosing : formattedDailyAvailableMonth

  const displayedDaysCount =
    activeHorizon === 'closing' && totals.daysUntilNextClosing
      ? totals.daysUntilNextClosing
      : totals.daysRemainingInMonth

  return (
    <main className="min-h-screen bg-[#f7f8f5]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 lg:px-10 lg:py-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e5dc] bg-white/80 px-3 py-1 text-xs font-semibold text-[#5a8067]">
              <span className="size-2 rounded-full bg-[#79ad89]" /> Carteira & Ciclo de Cartões
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-[-0.05em] text-[#173d2a]">
              Carteira
            </h1>
            <p className="mt-1 text-sm text-[#64736a]">
              Controle seu dinheiro em conta, faturas a pagar e seu teto diário de gastos até o fechamento da fatura.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <PrivacyToggle variant="pill" />
            <button
              onClick={() => {
                setEditingAccount(null)
                setIsAccountModalOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#173d2a] px-4 py-3 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#173d2a]/10 hover:bg-[#245439] transition cursor-pointer"
            >
              <span>+ Adicionar Conta</span>
            </button>
            <button
              onClick={() => {
                setEditingCard(null)
                setIsCardModalOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#d8e1da] bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-[#173d2a] hover:bg-[#edf5ef] hover:border-[#5d9873] transition cursor-pointer"
            >
              <span>+ Adicionar Cartão</span>
            </button>
          </div>
        </div>

        {/* Card Destaque: Saldo Livre Real */}
        <div className="mt-8 rounded-3xl bg-[#173d2a] p-6 sm:p-8 text-white shadow-xl shadow-[#173d2a]/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#b7d7c5]">
                Saldo Livre Real (Líquido Imediato)
              </p>
              <div className="mt-2 flex items-baseline gap-3">
                <p className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${totals.netRealBalance < 0 ? 'text-rose-300' : 'text-white'}`}>
                  {formattedNetRealBalance}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    isNetPositive
                      ? 'bg-[#5d9873]/30 text-[#d4eedd] border border-[#5d9873]/40'
                      : isNetZero
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                      : 'bg-rose-500/30 text-rose-200 border border-rose-500/40'
                  }`}
                >
                  {isNetPositive
                    ? '✓ Posição Positiva'
                    : isNetZero
                    ? '⚡ Saldo Zerado'
                    : '⚠ Faturas excedem saldo'}
                </span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-[#b7d7c5]">
                {isNetPositive
                  ? `Você tem ${formattedMoneyInAccounts} em contas e ${formattedCreditCardsToPay} a pagar em cartões.`
                  : isNetZero
                  ? 'Seu saldo em contas é exatamente igual às faturas de cartão a pagar.'
                  : `Atenção: Suas faturas de cartão (${formattedCreditCardsToPay}) superam o dinheiro disponível em conta (${formattedMoneyInAccounts}).`}
              </p>
            </div>

            {/* Mini breakdown card */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-xs border border-white/10 md:min-w-[280px]">
              <div>
                <p className="text-[11px] text-[#b7d7c5]">💰 Dinheiro em Conta</p>
                <p className="mt-1 text-base sm:text-lg font-bold text-emerald-300">
                  {formattedMoneyInAccounts}
                </p>
                <p className="text-[10px] text-[#b7d7c5]">{bankAccounts.length} {bankAccounts.length === 1 ? 'conta' : 'contas'}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#b7d7c5]">💳 Cartões a Pagar</p>
                <p className="mt-1 text-base sm:text-lg font-bold text-rose-300">
                  {formattedCreditCardsToPay}
                </p>
                <p className="text-[10px] text-[#b7d7c5]">{creditCards.length} {creditCards.length === 1 ? 'cartão' : 'cartões'}</p>
              </div>
            </div>
          </div>

          {/* Barra de comprometimento */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-center justify-between text-xs text-[#b7d7c5] mb-2">
              <span>Comprometimento do Dinheiro com Cartões</span>
              <span className="font-semibold text-white">
                {totals.commitmentRatio.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  totals.commitmentRatio > 100
                    ? 'bg-rose-400'
                    : totals.commitmentRatio > 70
                    ? 'bg-amber-400'
                    : 'bg-[#79ad89]'
                }`}
                style={{ width: `${Math.min(100, totals.commitmentRatio)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 🌟 SEÇÃO DE INSIGHTS DA CARTEIRA & FECHAMENTO DO CARTÃO 🌟 */}
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <h2 className="text-base font-bold tracking-tight text-[#173d2a]">
                Insights do seu Dinheiro & Ciclo de Gastos
              </h2>
            </div>

            {/* Toggle de Horizonte de Tempo */}
            {hasClosingCards && (
              <div className="inline-flex rounded-xl bg-[#e9f0eb] p-1 border border-[#d8e5dc]">
                <button
                  type="button"
                  onClick={() => setBudgetHorizon('closing')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    activeHorizon === 'closing'
                      ? 'bg-[#173d2a] text-white shadow-xs'
                      : 'text-[#5a8067] hover:text-[#173d2a]'
                  }`}
                >
                  ✂ Até Fechamento da Fatura
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetHorizon('month')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    activeHorizon === 'month'
                      ? 'bg-[#173d2a] text-white shadow-xs'
                      : 'text-[#5a8067] hover:text-[#173d2a]'
                  }`}
                >
                  📅 Até Fim do Mês
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Card 1: Gasto Diário Disponível (Focado no Fechamento ou Mês) */}
            <div className="rounded-3xl border border-[#b7d7c5] bg-gradient-to-br from-white to-[#edf5ef] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5a8067]">
                  🎯 Teto Diário Seguro
                </span>
                <span className="text-xs font-semibold text-[#245439] bg-[#d8e8dc] px-2.5 py-0.5 rounded-md">
                  {activeHorizon === 'closing' ? 'Até fechar fatura' : 'Até fim do mês'}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-3xl font-extrabold text-[#173d2a] tracking-tight">
                  {displayedDailyAmount}
                  <span className="text-sm font-semibold text-[#718078]"> / dia</span>
                </p>
                <p className="mt-2 text-xs leading-5 text-[#64736a]">
                  {isNetPositive ? (
                    activeHorizon === 'closing' && totals.nextClosingCard ? (
                      <>
                        Faltam <strong>{displayedDaysCount} dias</strong> até o fechamento do <strong>{totals.nextClosingCard.cardName}</strong> (dia {totals.nextClosingCard.closingDay}). Gastando até esse valor por dia, você não estoura a fatura deste ciclo.
                      </>
                    ) : (
                      <>
                        Restam <strong>{displayedDaysCount} dias</strong> em {totals.currentMonthName}. Gastando até esse valor por dia, você fecha o mês com saldo positivo e faturas 100% cobertas.
                      </>
                    )
                  ) : (
                    <>
                      Saldo livre zerado ou negativo. Evite novas compras no cartão até cobrir as faturas existentes.
                    </>
                  )}
                </p>

                {isNetPositive && (
                  <div className="mt-3 pt-3 border-t border-[#d8e5dc] flex items-center justify-between text-xs text-[#5a8067]">
                    <span>Janela calculada:</span>
                    <strong className="text-[#173d2a]">
                      {displayedDaysCount} {displayedDaysCount === 1 ? 'dia' : 'dias'} restantes
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Cobertura e Saúde das Faturas */}
            <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#718078]">
                  🛡 Cobertura de Cartões
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    totals.coverageRatio >= 1.5
                      ? 'bg-[#e9f4ec] text-[#245439]'
                      : totals.coverageRatio >= 1
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {totals.coverageRatio >= 1.5
                    ? 'Excelente'
                    : totals.coverageRatio >= 1
                    ? 'Equilibrado'
                    : 'Atenção'}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-3xl font-extrabold text-[#173d2a] tracking-tight">
                  {totals.totalCreditCardsToPay > 0
                    ? `${totals.coverageRatio.toFixed(1)}x`
                    : '100% Livre'}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#64736a]">
                  {totals.totalCreditCardsToPay > 0 ? (
                    totals.coverageRatio >= 1 ? (
                      <>
                        Seu dinheiro em conta cobre <strong>{totals.coverageRatio.toFixed(1)} vezes</strong> o total das faturas a pagar.
                      </>
                    ) : (
                      <>
                        Suas faturas consom <strong>{totals.commitmentRatio.toFixed(0)}%</strong> do seu saldo total em contas bancárias.
                      </>
                    )
                  ) : (
                    <>Você não possui faturas de cartão a pagar no momento. Folga financeira total.</>
                  )}
                </p>
                <div className="mt-3 pt-3 border-t border-[#edf2ee] flex items-center justify-between text-xs text-[#718078]">
                  <span>Comprometimento:</span>
                  <strong className="text-[#173d2a]">{totals.commitmentRatio.toFixed(0)}% do saldo</strong>
                </div>
              </div>
            </div>

            {/* Card 3: Radar de Fechamento & Vencimento */}
            <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#718078]">
                  📅 Radar do Cartão
                </span>
                <span className="text-xs font-semibold text-[#718078] bg-[#f7f8f5] px-2 py-0.5 rounded-md">
                  Próximas Datas
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {/* Fechamento */}
                {totals.nextClosingCard ? (
                  <div className="rounded-2xl bg-[#fafcfb] p-2.5 border border-[#edf2ee]">
                    <div className="flex items-center justify-between text-[11px] text-[#718078]">
                      <span>✂ Próximo Fechamento</span>
                      <strong className="text-[#5a8067]">Melhor dia de compra</strong>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#173d2a] truncate max-w-[130px]">
                        {totals.nextClosingCard.cardName}
                      </span>
                      <span className="text-xs font-bold text-[#173d2a] bg-[#e9f4ec] px-2 py-0.5 rounded-md border border-[#d8e5dc]">
                        Dia {totals.nextClosingCard.closingDay} ({totals.daysUntilNextClosing}d)
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Vencimento */}
                {totals.nextDueCard ? (
                  <div className="rounded-2xl bg-[#fafcfb] p-2.5 border border-[#edf2ee]">
                    <div className="flex items-center justify-between text-[11px] text-[#718078]">
                      <span>🗓 Próximo Vencimento</span>
                      <strong className="text-amber-700">Pagamento boleto</strong>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#173d2a] truncate max-w-[130px]">
                        {totals.nextDueCard.cardName}
                      </span>
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                        Dia {totals.nextDueCard.dueDay} ({totals.daysUntilNextDue}d)
                      </span>
                    </div>
                  </div>
                ) : null}

                {!totals.nextClosingCard && !totals.nextDueCard && (
                  <div className="rounded-2xl bg-[#fafcfb] p-3 border border-[#edf2ee] text-xs text-[#8a998f]">
                    Cadastre datas de fechamento e vencimento nos seus cartões para ativar o radar.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seções Lado a Lado: Contas vs Cartões */}
        <div className="mt-10 grid gap-8 lg:grid-cols-2 items-start">
          {/* Lado Esquerdo: Dinheiro em Conta */}
          <section className="rounded-3xl border border-[#dfe8e1] bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-[#e9f4ec] text-xl">
                  💰
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#173d2a]">Dinheiro em Conta</h2>
                  <p className="text-xs text-[#718078]">Contas bancárias e disponibilidades</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#718078]">Total Disponível</span>
                <p className="text-lg font-bold text-[#173d2a]">{formattedMoneyInAccounts}</p>
              </div>
            </div>

            {/* Lista de Contas */}
            <div className="mt-5 space-y-3">
              {bankAccounts.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border-2 border-dashed border-[#e3eae4] bg-[#fafcfb] p-6">
                  <p className="text-3xl mb-2">🏦</p>
                  <p className="text-sm font-semibold text-[#173d2a]">Nenhuma conta cadastrada</p>
                  <p className="mt-1 text-xs text-[#718078] max-w-xs mx-auto">
                    Cadastre suas contas bancárias com o saldo disponível para calcular seu balanço.
                  </p>
                  <button
                    onClick={() => {
                      setEditingAccount(null)
                      setIsAccountModalOpen(true)
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#173d2a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#245439] transition cursor-pointer"
                  >
                    + Cadastrar Conta
                  </button>
                </div>
              ) : (
                bankAccounts.map((account) => {
                  const isEditingThis = editingBalanceId === account.id
                  const formattedBalance = formatCurrency(account.balance)

                  return (
                    <div
                      key={account.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-[#e3eae4] bg-[#fafcfb] hover:border-[#b7d7c5] hover:bg-white transition shadow-2xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <BankLogo
                          slug={account.bankSlug}
                          size={44}
                          radius="0.75rem"
                          fallbackName={account.bankName}
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[#173d2a] truncate">
                              {account.accountName}
                            </h3>
                            <span className="text-[10px] font-medium text-[#5a8067] bg-[#e9f4ec] px-2 py-0.5 rounded-md shrink-0">
                              {ACCOUNT_TYPE_LABELS[account.accountType] || account.accountType}
                            </span>
                          </div>
                          <p className="text-xs text-[#718078] truncate">{account.bankName}</p>
                        </div>
                      </div>

                      {/* Saldo e Ações */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#eef3ef]">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#718078]">R$</span>
                            <input
                              type="text"
                              autoFocus
                              value={inlineBalanceValue}
                              onChange={(e) => setInlineBalanceValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlineBalance(account.id)
                                if (e.key === 'Escape') setEditingBalanceId(null)
                              }}
                              className="w-24 rounded-lg border border-[#5d9873] bg-white px-2 py-1 text-sm font-bold text-[#173d2a] outline-none"
                            />
                            <button
                              onClick={() => handleSaveInlineBalance(account.id)}
                              className="rounded-lg bg-[#173d2a] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#245439] cursor-pointer"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <div className="text-left sm:text-right">
                            <p className="text-base font-bold text-[#173d2a]">
                              {formattedBalance}
                            </p>
                            <button
                              onClick={() => handleStartEditBalance(account)}
                              className="text-[11px] text-[#5d9873] hover:text-[#173d2a] hover:underline cursor-pointer flex items-center gap-0.5 sm:ml-auto"
                            >
                              ✏ Atualizar saldo
                            </button>
                          </div>
                        )}

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingAccount(account)
                              setIsAccountModalOpen(true)
                            }}
                            className="grid size-8 place-items-center rounded-xl text-[#718078] hover:bg-[#edf5ef] hover:text-[#173d2a] transition cursor-pointer"
                            title="Editar dados da conta"
                          >
                            ⚙
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja excluir a conta "${account.accountName}"?`)) {
                                onDeleteBankAccount(account.id)
                              }
                            }}
                            className="grid size-8 place-items-center rounded-xl text-[#8a998f] hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                            title="Excluir conta"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {bankAccounts.length > 0 && (
              <button
                onClick={() => {
                  setEditingAccount(null)
                  setIsAccountModalOpen(true)
                }}
                className="mt-4 w-full py-2.5 rounded-2xl border border-dashed border-[#d8e1da] text-xs font-semibold text-[#5a8067] hover:border-[#5d9873] hover:bg-[#edf5ef] transition cursor-pointer text-center"
              >
                + Adicionar outra conta bancária
              </button>
            )}
          </section>

          {/* Lado Direito: Cartões de Crédito com Fechamento e Vencimento */}
          <section className="rounded-3xl border border-[#dfe8e1] bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-rose-50 text-xl">
                  💳
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#173d2a]">Cartões a Pagar</h2>
                  <p className="text-xs text-[#718078]">Faturas abertas, fechamento e vencimento</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#718078]">Total Faturas</span>
                <p className="text-lg font-bold text-rose-600">{formattedCreditCardsToPay}</p>
              </div>
            </div>

            {/* Lista de Cartões */}
            <div className="mt-5 space-y-3">
              {creditCards.length === 0 ? (
                <div className="py-10 text-center rounded-2xl border-2 border-dashed border-[#e3eae4] bg-[#fafcfb] p-6">
                  <p className="text-3xl mb-2">💳</p>
                  <p className="text-sm font-semibold text-[#173d2a]">Nenhum cartão cadastrado</p>
                  <p className="mt-1 text-xs text-[#718078] max-w-xs mx-auto">
                    Cadastre seus cartões de crédito, datas de fechamento e vencimento para controlar seu ciclo de compras.
                  </p>
                  <button
                    onClick={() => {
                      setEditingCard(null)
                      setIsCardModalOpen(true)
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#173d2a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#245439] transition cursor-pointer"
                  >
                    + Cadastrar Cartão
                  </button>
                </div>
              ) : (
                creditCards.map((card) => {
                  const isEditingThis = editingInvoiceId === card.id
                  const formattedInvoice = formatCurrency(card.invoiceAmount)

                  const timeline = getCardTimelineStatus(card, totals.currentDay, totals.totalDaysInMonth)

                  return (
                    <div
                      key={card.id}
                      className="group flex flex-col gap-3 p-4 rounded-2xl border border-[#e3eae4] bg-[#fafcfb] hover:border-rose-200 hover:bg-white transition shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <BankLogo
                            slug={card.bankSlug}
                            size={44}
                            radius="0.75rem"
                            fallbackName={card.bankName}
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-[#173d2a] truncate">
                                {card.cardName}
                              </h3>
                              {timeline.closingDay && (
                                <span className="text-[10px] font-semibold text-[#245439] bg-[#e9f4ec] px-2 py-0.5 rounded-md border border-[#d8e5dc]">
                                  ✂ Fecha dia {timeline.closingDay}
                                </span>
                              )}
                              {timeline.dueDay && (
                                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                                  🗓 Vence dia {timeline.dueDay}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#718078] truncate">{card.bankName}</p>
                          </div>
                        </div>

                        {/* Fatura e Ações */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#eef3ef]">
                          {isEditingThis ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-rose-600">R$</span>
                              <input
                                type="text"
                                autoFocus
                                value={inlineInvoiceValue}
                                onChange={(e) => setInlineInvoiceValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveInlineInvoice(card.id)
                                  if (e.key === 'Escape') setEditingInvoiceId(null)
                                }}
                                className="w-24 rounded-lg border border-rose-400 bg-white px-2 py-1 text-sm font-bold text-rose-700 outline-none"
                              />
                              <button
                                onClick={() => handleSaveInlineInvoice(card.id)}
                                className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
                              >
                                ✓
                              </button>
                            </div>
                          ) : (
                            <div className="text-left sm:text-right">
                              <p className="text-base font-bold text-rose-600">
                                {formattedInvoice}
                              </p>
                              <button
                                onClick={() => handleStartEditInvoice(card)}
                                className="text-[11px] text-rose-500 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-0.5 sm:ml-auto"
                              >
                                ✏ Atualizar fatura
                              </button>
                            </div>
                          )}

                          {/* Botões de Ação */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingCard(card)
                                setIsCardModalOpen(true)
                              }}
                              className="grid size-8 place-items-center rounded-xl text-[#718078] hover:bg-[#edf5ef] hover:text-[#173d2a] transition cursor-pointer"
                              title="Editar dados do cartão"
                            >
                              ⚙
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja excluir o cartão "${card.cardName}"?`)) {
                                onDeleteCreditCard(card.id)
                              }
                            }}
                            className="grid size-8 place-items-center rounded-xl text-[#8a998f] hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                            title="Excluir cartão"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Linha Informativa do Ciclo de Fechamento */}
                    {(timeline.closingDay || timeline.dueDay) && (
                      <div className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-xl bg-white border border-[#edf2ee] text-[#64736a]">
                        <span>
                          {timeline.isInvoiceClosed ? (
                            <span className="font-semibold text-amber-800 flex items-center gap-1">
                              <span>🔒</span> Fatura Fechada • Pague até dia {timeline.dueDay}
                            </span>
                          ) : (
                            <span className="font-semibold text-[#245439] flex items-center gap-1">
                              <span>🔓</span> Fatura Aberta • Fecha em {timeline.daysToClose}d (dia {timeline.closingDay})
                            </span>
                          )}
                        </span>
                        {timeline.closingDay && (
                          <span className="text-[10px] text-[#718078]">
                            Melhor compra: a partir do dia {timeline.closingDay}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {creditCards.length > 0 && (
            <button
              onClick={() => {
                setEditingCard(null)
                setIsCardModalOpen(true)
              }}
              className="mt-4 w-full py-2.5 rounded-2xl border border-dashed border-[#d8e1da] text-xs font-semibold text-[#5a8067] hover:border-[#5d9873] hover:bg-[#edf5ef] transition cursor-pointer text-center"
            >
              + Adicionar outro cartão de crédito
            </button>
          )}
        </section>
      </div>

      {/* Atalhos Rápidos */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div
          onClick={() => onNavigate('fixed-costs')}
          className="rounded-2xl border border-[#dfe8e1] bg-white p-4 hover:border-[#b7d7c5] transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5a8067]">Custos Fixos</span>
            <span className="text-sm">→</span>
          </div>
          <p className="mt-2 text-xs text-[#718078]">
            Veja seus custos mensais recorrentes para projetar seu fluxo de caixa.
          </p>
        </div>

        <div
          onClick={() => onNavigate('patrimonio')}
          className="rounded-2xl border border-[#dfe8e1] bg-white p-4 hover:border-[#b7d7c5] transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5a8067]">Patrimônio Líquido</span>
            <span className="text-sm">→</span>
          </div>
          <p className="mt-2 text-xs text-[#718078]">
            Acompanhe seus bens, investimentos e financiamentos no balanço patrimonial.
          </p>
        </div>

        <div
          onClick={() => onNavigate('dashboard')}
          className="rounded-2xl border border-[#dfe8e1] bg-white p-4 hover:border-[#b7d7c5] transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5a8067]">Painel Completo</span>
            <span className="text-sm">→</span>
          </div>
          <p className="mt-2 text-xs text-[#718078]">
            Visualize todos os indicadores consolidados no seu Dashboard.
          </p>
        </div>
      </div>
    </div>

    {/* Modais */}
    <BankAccountModal
      isOpen={isAccountModalOpen}
      onClose={() => {
        setIsAccountModalOpen(false)
        setEditingAccount(null)
      }}
      onSave={onSaveBankAccount}
      accountToEdit={editingAccount}
    />

    <CreditCardModal
      isOpen={isCardModalOpen}
      onClose={() => {
        setIsCardModalOpen(false)
        setEditingCard(null)
      }}
      onSave={onSaveCreditCard}
      cardToEdit={editingCard}
    />
  </main>
)
}
