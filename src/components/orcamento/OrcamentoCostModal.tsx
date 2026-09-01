import { useState, type FormEvent } from 'react'
import type { OrcamentoCostItem } from '../../types/finance'
import { DEFAULT_CATEGORIES } from '../../services/storage'
import { formatMoneyInput, maskMoneyInput, parseMoney } from '../../utils/currency'

interface OrcamentoCostModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (cost: OrcamentoCostItem, target: 'user' | 'partner') => void
  costToEdit?: OrcamentoCostItem | null
  target: 'user' | 'partner'
  partnerName?: string
}

export function OrcamentoCostModal({
  isOpen,
  onClose,
  onSave,
  costToEdit,
  target,
  partnerName = 'Esposa / Parceira',
}: OrcamentoCostModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <OrcamentoCostForm
        key={costToEdit?.id ?? 'new'}
        costToEdit={costToEdit}
        target={target}
        partnerName={partnerName}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  )
}

interface OrcamentoCostFormProps {
  costToEdit?: OrcamentoCostItem | null
  target: 'user' | 'partner'
  partnerName: string
  onClose: () => void
  onSave: (cost: OrcamentoCostItem, target: 'user' | 'partner') => void
}

function OrcamentoCostForm({
  costToEdit,
  target,
  partnerName,
  onClose,
  onSave,
}: OrcamentoCostFormProps) {
  const [name, setName] = useState(costToEdit?.name ?? '')
  const [amountStr, setAmountStr] = useState(() =>
    costToEdit?.amount ? formatMoneyInput(costToEdit.amount) : ''
  )
  const [category, setCategory] = useState(costToEdit?.category ?? 'Habitação')
  const [errors, setErrors] = useState<{ name?: string; amount?: string }>({})

  function validate() {
    const errs: { name?: string; amount?: string } = {}
    if (!name.trim()) {
      errs.name = 'Informe o nome da despesa.'
    }
    const amt = parseMoney(amountStr)
    if (amt <= 0) {
      errs.amount = 'O valor deve ser maior que zero.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const amt = parseMoney(amountStr)

    onSave(
      {
        id: costToEdit?.id ?? (crypto.randomUUID ? crypto.randomUUID() : `cost_${Date.now()}`),
        name: name.trim(),
        amount: amt,
        category,
      },
      target
    )

    onClose()
  }

  const targetTitle = target === 'user' ? 'Suas Contas (Você)' : `Contas de ${partnerName}`

  return (
    <div className="w-full max-w-md rounded-3xl border border-[#e3eae4] bg-white p-6 sm:p-8 shadow-2xl transition-all">
      <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
        <div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#5d9873] bg-[#edf5ef] px-2.5 py-0.5 rounded-full mb-1">
            {targetTitle}
          </span>
          <h2 className="text-lg font-bold text-[#173d2a]">
            {costToEdit ? 'Editar Despesa do Mês' : 'Adicionar Despesa no Orçamento'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-8 place-items-center rounded-xl text-[#718078] hover:bg-[#edf5ef] hover:text-[#173d2a] transition cursor-pointer"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="orc-cost-name" className="block text-xs font-semibold text-[#30483a]">
            Nome da Conta / Despesa
          </label>
          <input
            id="orc-cost-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            placeholder="Ex: Condomínio, Supermercado, Internet..."
            className={`mt-1.5 w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-[#173d2a] outline-none transition placeholder:text-[#a1afa6] ${
              errors.name
                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                : 'border-[#d8e1da] focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/40'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-xs font-medium text-rose-600">⚠ {errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="orc-cost-amount" className="block text-xs font-semibold text-[#30483a]">
            Valor Previsto no Mês (R$)
          </label>
          <div
            className={`mt-1.5 relative rounded-2xl border bg-white px-3.5 py-3 shadow-2xs transition focus-within:border-[#5d9873] focus-within:ring-4 focus-within:ring-[#b7d7c5]/40 ${
              errors.amount ? 'border-rose-400' : 'border-[#d8e1da]'
            }`}
          >
            <span className="text-xs font-bold text-[#8a998f] mr-1.5">R$</span>
            <input
              id="orc-cost-amount"
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={(e) => {
                setAmountStr(maskMoneyInput(e.target.value))
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }))
              }}
              placeholder="0,00"
              className="w-[85%] text-sm font-bold text-[#173d2a] outline-none"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-xs font-medium text-rose-600">⚠ {errors.amount}</p>
          )}
        </div>

        <div>
          <label htmlFor="orc-cost-cat" className="block text-xs font-semibold text-[#30483a]">
            Categoria
          </label>
          <select
            id="orc-cost-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-[#d8e1da] bg-white px-4 py-3 text-sm font-semibold text-[#173d2a] outline-none focus:border-[#5d9873] transition"
          >
            {DEFAULT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#edf2ee]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[#d8e1da] px-5 py-2.5 text-xs font-semibold text-[#64736a] hover:bg-[#f7f8f5] hover:text-[#173d2a] transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-[#173d2a] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#245439] shadow-md shadow-[#173d2a]/10 transition cursor-pointer"
          >
            {costToEdit ? 'Salvar Alteração' : 'Adicionar ao Orçamento'}
          </button>
        </div>
      </form>
    </div>
  )
}
