import { useState } from 'react'
import type { FormEvent } from 'react'
import type { CreditCard } from '../../types/finance'
import { formatMoneyInput, parseMoney } from '../../utils/currency'
import { BankLogo } from '../common/BankLogo'
import { BankSelectModal } from '../common/BankSelectModal'

interface CreditCardModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (card: Omit<CreditCard, 'id' | 'createdAt'> & { id?: string }) => void
  cardToEdit?: CreditCard | null
}

export function CreditCardModal({
  isOpen,
  onClose,
  onSave,
  cardToEdit,
}: CreditCardModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <CreditCardForm
        key={cardToEdit?.id ?? 'new'}
        cardToEdit={cardToEdit}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  )
}

interface CreditCardFormProps {
  cardToEdit?: CreditCard | null
  onClose: () => void
  onSave: (card: Omit<CreditCard, 'id' | 'createdAt'> & { id?: string }) => void
}

function CreditCardForm({ cardToEdit, onClose, onSave }: CreditCardFormProps) {
  const [bankSlug, setBankSlug] = useState(() => cardToEdit?.bankSlug ?? 'nubank')
  const [bankName, setBankName] = useState(() => cardToEdit?.bankName ?? 'Nubank')
  const [cardName, setCardName] = useState(() => cardToEdit?.cardName ?? 'Cartão Principal')
  const [invoiceAmount, setInvoiceAmount] = useState(() =>
    cardToEdit ? formatMoneyInput(cardToEdit.invoiceAmount) : ''
  )
  const [closingDay, setClosingDay] = useState(() =>
    cardToEdit?.closingDay ? String(cardToEdit.closingDay) : '3'
  )
  const [dueDay, setDueDay] = useState(() =>
    cardToEdit?.dueDay ? String(cardToEdit.dueDay) : '10'
  )
  const [limit, setLimit] = useState(() =>
    cardToEdit?.limit ? formatMoneyInput(cardToEdit.limit) : ''
  )
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const cleanInvoice = parseMoney(invoiceAmount)

    if (isNaN(cleanInvoice)) {
      setError('Por favor, informe o valor da fatura a pagar.')
      return
    }

    const parsedClosingDay = closingDay ? parseInt(closingDay, 10) : undefined
    if (parsedClosingDay && (parsedClosingDay < 1 || parsedClosingDay > 31)) {
      setError('O dia de fechamento deve estar entre 1 e 31.')
      return
    }

    const parsedDueDay = dueDay ? parseInt(dueDay, 10) : undefined
    if (parsedDueDay && (parsedDueDay < 1 || parsedDueDay > 31)) {
      setError('O dia de vencimento deve estar entre 1 e 31.')
      return
    }

    const parsedLimit = limit ? parseMoney(limit) : undefined

    onSave({
      id: cardToEdit?.id,
      bankSlug,
      bankName: bankName.trim() || 'Cartão',
      cardName: cardName.trim() || `${bankName} Crédito`,
      invoiceAmount: cleanInvoice,
      closingDay: parsedClosingDay,
      dueDay: parsedDueDay,
      limit: parsedLimit,
    })

    onClose()
  }

  function handleInvoiceBlur() {
    if (invoiceAmount.trim()) {
      setInvoiceAmount(formatMoneyInput(invoiceAmount))
    }
  }

  function handleLimitBlur() {
    if (limit.trim()) {
      setLimit(formatMoneyInput(limit))
    }
  }

  return (
    <>
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#dfe8e1] overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eef3ef] pb-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[#173d2a]">
              {cardToEdit ? 'Editar Cartão de Crédito' : 'Cadastrar Cartão de Crédito'}
            </h3>
            <p className="text-xs text-[#718078] mt-0.5">
              Fechamento da fatura, vencimento e valor a pagar
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
          {/* Emissor / Banco com Logo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
              Emissor / Banco
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
                  <p className="text-[11px] text-[#718078]">Clique para alterar emissor</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#5d9873] bg-white px-3 py-1.5 rounded-xl border border-[#d8e1da] shadow-2xs">
                Mudar ▾
              </span>
            </button>
          </div>

          {/* Nome/Identificador do Cartão */}
          <div>
            <label htmlFor="cardName" className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
              Nome do Cartão
            </label>
            <input
              id="cardName"
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Ex: Nubank Ultravioleta, Itaú Black..."
              className="w-full rounded-2xl border border-[#d8e1da] bg-white px-4 py-3 text-sm text-[#173d2a] placeholder:text-[#a1afa6] outline-none focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/30 transition"
            />
          </div>

          {/* Fatura Atual a Pagar */}
          <div>
            <label htmlFor="invoiceAmount" className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
              Valor da Fatura Atual (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-rose-600">
                R$
              </span>
              <input
                id="invoiceAmount"
                type="text"
                inputMode="decimal"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                onBlur={handleInvoiceBlur}
                placeholder="0,00"
                className="w-full rounded-2xl border border-[#d8e1da] bg-white pl-11 pr-4 py-3 text-lg font-bold text-rose-700 placeholder:text-[#a1afa6] outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition"
              />
            </div>
          </div>

          {/* Ciclo do Cartão: Fechamento vs Vencimento */}
          <div className="rounded-2xl bg-[#fafcfb] border border-[#e3eae4] p-3.5 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#5a8067]">
              Ciclo da Fatura
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="closingDay" className="block text-xs font-semibold text-[#173d2a] mb-1">
                  Dia de Fechamento
                </label>
                <input
                  id="closingDay"
                  type="number"
                  min="1"
                  max="31"
                  value={closingDay}
                  onChange={(e) => setClosingDay(e.target.value)}
                  placeholder="Ex: 3"
                  className="w-full rounded-xl border border-[#d8e1da] bg-white px-3 py-2 text-sm font-bold text-[#173d2a] outline-none focus:border-[#5d9873] focus:ring-2 focus:ring-[#b7d7c5]/30 transition"
                />
                <span className="text-[10px] text-[#718078] mt-0.5 block">
                  Melhor dia de compra
                </span>
              </div>

              <div>
                <label htmlFor="dueDay" className="block text-xs font-semibold text-[#173d2a] mb-1">
                  Dia de Vencimento
                </label>
                <input
                  id="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value)}
                  placeholder="Ex: 10"
                  className="w-full rounded-xl border border-[#d8e1da] bg-white px-3 py-2 text-sm font-bold text-[#173d2a] outline-none focus:border-[#5d9873] focus:ring-2 focus:ring-[#b7d7c5]/30 transition"
                />
                <span className="text-[10px] text-[#718078] mt-0.5 block">
                  Pagamento do boleto
                </span>
              </div>
            </div>
          </div>

          {/* Limite Opcional */}
          <div>
            <label htmlFor="limit" className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
              Limite Total (Opcional)
            </label>
            <input
              id="limit"
              type="text"
              inputMode="decimal"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              onBlur={handleLimitBlur}
              placeholder="0,00"
              className="w-full rounded-2xl border border-[#d8e1da] bg-white px-4 py-2.5 text-sm text-[#173d2a] placeholder:text-[#a1afa6] outline-none focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/30 transition"
            />
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
              {cardToEdit ? 'Salvar Alterações' : 'Adicionar Cartão'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Busca de Banco / Emissor */}
      <BankSelectModal
        isOpen={isBankPickerOpen}
        onClose={() => setIsBankPickerOpen(false)}
        selectedSlug={bankSlug}
        title="Escolha o Emissor do Cartão"
        onSelect={(b) => {
          setBankSlug(b.slug)
          setBankName(b.name)
          if (!cardName || cardName === 'Cartão Principal') {
            setCardName(`${b.name} Crédito`)
          }
        }}
      />
    </>
  )
}
