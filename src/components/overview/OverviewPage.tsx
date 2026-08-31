import { useState } from 'react'
import { calculateCarteiraTotals } from '../../services/storage'
import type { BankAccount, CreditCard, Screen } from '../../types/finance'
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

  const totals = calculateCarteiraTotals(bankAccounts, creditCards)

  const formattedMoneyInAccounts = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(totals.totalMoneyInAccounts)

  const formattedCreditCardsToPay = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(totals.totalCreditCardsToPay)

  const formattedNetRealBalance = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(totals.netRealBalance)

  const formattedDailyAvailable = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(totals.dailyAvailable)

  const formattedWeeklyAvailable = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(totals.weeklyAvailable)

  function handleStartEditBalance(account: BankAccount) {
    setEditingBalanceId(account.id)
    setInlineBalanceValue(String(account.balance))
  }

  function handleSaveInlineBalance(id: string) {
    const val = parseFloat(inlineBalanceValue.replace(',', '.'))
    if (!isNaN(val)) {
      onUpdateAccountBalance(id, val)
    }
    setEditingBalanceId(null)
  }

  function handleStartEditInvoice(card: CreditCard) {
    setEditingInvoiceId(card.id)
    setInlineInvoiceValue(String(card.invoiceAmount))
  }

  function handleSaveInlineInvoice(id: string) {
    const val = parseFloat(inlineInvoiceValue.replace(',', '.'))
    if (!isNaN(val)) {
      onUpdateCardInvoice(id, val)
    }
    setEditingInvoiceId(null)
  }

  const isNetPositive = totals.netRealBalance > 0
  const isNetZero = totals.netRealBalance === 0

  return (
    <main className="min-h-screen bg-[#f7f8f5]">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e5dc] bg-white/80 px-3 py-1 text-xs font-semibold text-[#5a8067]">
              <span className="size-2 rounded-full bg-[#79ad89]" /> Carteira & Balanço Imediato
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-[-0.05em] text-[#173d2a]">
              Carteira
            </h1>
            <p className="mt-1 text-sm text-[#64736a]">
              Controle seu dinheiro em conta vs. cartões a pagar e descubra seu teto diário de gastos.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
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

        {/* 🌟 SEÇÃO DE INSIGHTS DA CARTEIRA 🌟 */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <h2 className="text-base font-bold tracking-tight text-[#173d2a]">
                Insights do seu Dinheiro
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#5a8067] bg-[#edf5ef] px-3 py-1 rounded-full border border-[#d8e5dc]">
              {totals.currentMonthName} ({totals.daysRemainingInMonth} {totals.daysRemainingInMonth === 1 ? 'dia restante' : 'dias restantes'})
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Card 1: Gasto Diário Disponível até Zerar */}
            <div className="rounded-3xl border border-[#b7d7c5] bg-gradient-to-br from-white to-[#edf5ef] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5a8067]">
                  🎯 Teto Diário Disponível
                </span>
                <span className="text-xs font-semibold text-[#245439] bg-[#d8e8dc] px-2 py-0.5 rounded-md">
                  Até o fim do mês
                </span>
              </div>

              <div className="mt-3">
                <p className="text-3xl font-extrabold text-[#173d2a] tracking-tight">
                  {formattedDailyAvailable}
                  <span className="text-sm font-semibold text-[#718078]"> / dia</span>
                </p>
                <p className="mt-2 text-xs leading-5 text-[#64736a]">
                  {isNetPositive ? (
                    <>
                      Restam <strong>{totals.daysRemainingInMonth} dias</strong> em {totals.currentMonthName}. Gastando até este valor diário, você chega ao final do mês sem dívidas de cartão.
                    </>
                  ) : (
                    <>
                      Saldo livre zerado ou negativo. Evite novos gastos até equilibrar o dinheiro em conta com as faturas.
                    </>
                  )}
                </p>
                {isNetPositive && (
                  <div className="mt-3 pt-3 border-t border-[#d8e5dc] flex items-center justify-between text-xs text-[#5a8067]">
                    <span>Projeção semanal:</span>
                    <strong className="text-[#173d2a]">{formattedWeeklyAvailable}/semana</strong>
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
                        Seu dinheiro em conta cobre <strong>{totals.coverageRatio.toFixed(1)} vezes</strong> o valor total das faturas de cartão.
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
                  <span>Faturas comprometem:</span>
                  <strong className="text-[#173d2a]">{totals.commitmentRatio.toFixed(0)}% do saldo</strong>
                </div>
              </div>
            </div>

            {/* Card 3: Distribuição & Próximo Vencimento */}
            <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#718078]">
                  📅 Atenção & Vencimentos
                </span>
                <span className="text-xs font-semibold text-[#718078] bg-[#f7f8f5] px-2 py-0.5 rounded-md">
                  Radar
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {totals.nextDueCard ? (
                  <div className="rounded-2xl bg-[#fafcfb] p-3 border border-[#edf2ee]">
                    <p className="text-[11px] font-semibold text-[#8a998f]">Próximo Vencimento</p>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BankLogo slug={totals.nextDueCard.bankSlug} size={20} radius="4px" />
                        <span className="text-xs font-bold text-[#173d2a] truncate max-w-[120px]">
                          {totals.nextDueCard.cardName}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                        Dia {totals.nextDueCard.dueDay}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#fafcfb] p-3 border border-[#edf2ee] text-xs text-[#8a998f]">
                    Nenhum vencimento de fatura registrado.
                  </div>
                )}

                {totals.largestAccount ? (
                  <div className="rounded-2xl bg-[#fafcfb] p-3 border border-[#edf2ee]">
                    <p className="text-[11px] font-semibold text-[#8a998f]">Maior Saldo em Conta</p>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BankLogo slug={totals.largestAccount.bankSlug} size={20} radius="4px" />
                        <span className="text-xs font-bold text-[#173d2a] truncate max-w-[120px]">
                          {totals.largestAccount.accountName}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#173d2a]">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.largestAccount.balance)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#fafcfb] p-3 border border-[#edf2ee] text-xs text-[#8a998f]">
                    Cadastre suas contas para ver a distribuição.
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
                  const formattedBalance = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(account.balance)

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

          {/* Lado Direito: Cartões de Crédito */}
          <section className="rounded-3xl border border-[#dfe8e1] bg-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-rose-50 text-xl">
                  💳
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#173d2a]">Cartões a Pagar</h2>
                  <p className="text-xs text-[#718078]">Faturas abertas e obrigações de cartão</p>
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
                    Cadastre seus cartões de crédito e faturas atuais para deduzir das suas disponibilidades.
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
                  const formattedInvoice = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(card.invoiceAmount)

                  return (
                    <div
                      key={card.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-[#e3eae4] bg-[#fafcfb] hover:border-rose-200 hover:bg-white transition shadow-2xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <BankLogo
                          slug={card.bankSlug}
                          size={44}
                          radius="0.75rem"
                          fallbackName={card.bankName}
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-[#173d2a] truncate">
                              {card.cardName}
                            </h3>
                            {card.dueDay && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md shrink-0 border border-amber-200/50">
                                Vence dia {card.dueDay}
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

        {/* Atalhos e Dicas Rápidas */}
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
