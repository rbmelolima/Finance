import { useState } from 'react'
import type { FormEvent } from 'react'
import type { AccountType, BankAccount } from '../../types/finance'
import { formatMoneyInput, parseMoney } from '../../utils/currency'
import { BankLogo } from '../common/BankLogo'
import { BankSelectModal } from '../common/BankSelectModal'

interface BankAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (account: Omit<BankAccount, 'id' | 'createdAt'> & { id?: string }) => void
  accountToEdit?: BankAccount | null
}

const ACCOUNT_TYPES: { type: AccountType; label: string }[] = [
  { type: 'corrente', label: 'Conta Corrente' },
  { type: 'poupanca', label: 'Poupança' },
  { type: 'investimento', label: 'Investimentos' },
  { type: 'carteira', label: 'Carteira Digital' },
  { type: 'outros', label: 'Outros' },
]

export function BankAccountModal({
  isOpen,
  onClose,
  onSave,
  accountToEdit,
}: BankAccountModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <BankAccountForm
        key={accountToEdit?.id ?? 'new'}
        accountToEdit={accountToEdit}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  )
}

interface BankAccountFormProps {
  accountToEdit?: BankAccount | null
  onClose: () => void
  onSave: (account: Omit<BankAccount, 'id' | 'createdAt'> & { id?: string }) => void
}

function BankAccountForm({ accountToEdit, onClose, onSave }: BankAccountFormProps) {
  const [bankSlug, setBankSlug] = useState(() => accountToEdit?.bankSlug ?? 'nubank')
  const [bankName, setBankName] = useState(() => accountToEdit?.bankName ?? 'Nubank')
  const [accountName, setAccountName] = useState(() => accountToEdit?.accountName ?? 'Conta Corrente')
  const [accountType, setAccountType] = useState<AccountType>(() => accountToEdit?.accountType ?? 'corrente')
  const [balance, setBalance] = useState(() =>
    accountToEdit ? formatMoneyInput(accountToEdit.balance) : ''
  )
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const cleanBalance = parseMoney(balance)

    if (isNaN(cleanBalance)) {
      setError('Por favor, informe um valor de saldo válido.')
      return
    }

    onSave({
      id: accountToEdit?.id,
      bankSlug,
      bankName: bankName.trim() || 'Banco',
      accountName: accountName.trim() || bankName.trim() || 'Conta',
      accountType,
      balance: cleanBalance,
    })

    onClose()
  }

  function handleBalanceBlur() {
    if (balance.trim()) {
      setBalance(formatMoneyInput(balance))
    }
  }

  return (
    <>
      <div
        className="w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#dfe8e1] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eef3ef] pb-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[#173d2a]">
              {accountToEdit ? 'Editar Conta Bancária' : 'Cadastrar Conta Bancária'}
            </h3>
            <p className="text-xs text-[#718078] mt-0.5">
              Informe o banco e o saldo disponível em conta
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-[#718078] hover:bg-[#edf5ef] hover:text-[#173d2a] transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 overflow-y-auto pr-1">
          {/* Escolha do Banco com Logo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
              Banco / Instituição
            </label>
            <button
              type="button"
              onClick={() => setIsBankPickerOpen(true)}
              className="w-full flex items-center justify-between rounded-2xl border border-[#d8e1da] bg-[#f7f8f5] p-3 hover:border-[#5d9873] hover:bg-[#edf5ef] transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <BankLogo slug={bankSlug} size={36} radius="0.5rem" />
                <div className="text-left">
                  <p className="text-sm font-bold text-[#173d2a]">{bankName}</p>
                  <p className="text-[11px] text-[#718078]">Clique para alterar banco</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#5d9873] bg-white px-3 py-1.5 rounded-xl border border-[#d8e1da] shadow-2xs">
                Mudar ▾
              </span>
            </button>
          </div>

          {/* Nome/Apelido da Conta */}
          <div>
            <label htmlFor="accountName" className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
              Nome ou Apelido da Conta
            </label>
            <input
              id="accountName"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Ex: Conta Principal, Reserva, etc."
              className="w-full rounded-2xl border border-[#d8e1da] bg-white px-4 py-3 text-sm text-[#173d2a] placeholder:text-[#a1afa6] outline-none focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/30 transition"
            />
          </div>

          {/* Tipo de Conta */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
              Tipo de Conta
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ACCOUNT_TYPES.map(({ type, label }) => {
                const active = accountType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                      active
                        ? 'border-[#173d2a] bg-[#173d2a] text-white'
                        : 'border-[#d8e1da] bg-white text-[#30483a] hover:bg-[#edf5ef]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Saldo Disponível */}
          <div>
            <label htmlFor="balance" className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
              Saldo Disponível (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8a998f]">
                R$
              </span>
              <input
                id="balance"
                type="text"
                inputMode="decimal"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                onBlur={handleBalanceBlur}
                placeholder="0,00"
                className="w-full rounded-2xl border border-[#d8e1da] bg-white pl-11 pr-4 py-3 text-lg font-bold text-[#173d2a] placeholder:text-[#a1afa6] outline-none focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/30 transition"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600 flex items-center gap-1">
              <span>⚠</span> {error}
            </p>
          )}

          {/* Botões */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-[#d8e1da] py-3 text-sm font-semibold text-[#64736a] hover:bg-[#f7f8f5] transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-2xl bg-[#173d2a] py-3 text-sm font-semibold text-white shadow-lg shadow-[#173d2a]/10 hover:bg-[#245439] transition cursor-pointer"
            >
              {accountToEdit ? 'Salvar Alterações' : 'Adicionar Conta'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Busca de Banco */}
      <BankSelectModal
        isOpen={isBankPickerOpen}
        onClose={() => setIsBankPickerOpen(false)}
        selectedSlug={bankSlug}
        title="Escolha o Banco da Conta"
        onSelect={(b) => {
          setBankSlug(b.slug)
          setBankName(b.name)
          if (!accountName || accountName === 'Conta Corrente') {
            setAccountName(b.name)
          }
        }}
      />
    </>
  )
}
