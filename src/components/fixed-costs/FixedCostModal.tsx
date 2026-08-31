import type { FormEvent } from 'react'
import { useState } from 'react'
import type { Currency, FixedCost, Recurrence } from '../../types/finance'

interface FixedCostModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    id?: string
    name: string
    description?: string
    amount: number
    currency: Currency
    recurrence: Recurrence
  }) => void
  costToEdit?: FixedCost | null
}

export function FixedCostModal({ isOpen, onClose, onSave, costToEdit }: FixedCostModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-sm">
      <FixedCostForm
        key={costToEdit?.id ?? 'new'}
        costToEdit={costToEdit}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  )
}

interface FixedCostFormProps {
  costToEdit?: FixedCost | null
  onClose: () => void
  onSave: (data: {
    id?: string
    name: string
    description?: string
    amount: number
    currency: Currency
    recurrence: Recurrence
  }) => void
}

function FixedCostForm({ costToEdit, onClose, onSave }: FixedCostFormProps) {
  const [name, setName] = useState(costToEdit?.name ?? '')
  const [description, setDescription] = useState(costToEdit?.description ?? '')
  const [amountStr, setAmountStr] = useState(
    costToEdit ? costToEdit.amount.toString().replace('.', ',') : ''
  )
  const [currency, setCurrency] = useState<Currency>(costToEdit?.currency ?? 'BRL')
  const [recurrence, setRecurrence] = useState<Recurrence>(costToEdit?.recurrence ?? 'monthly')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Por favor, informe o nome do custo fixo.')
      return
    }

    const cleanAmount = amountStr.replace(/\./g, '').replace(',', '.')
    const parsedAmount = parseFloat(cleanAmount)

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor, informe um valor válido maior que zero.')
      return
    }

    onSave({
      id: costToEdit?.id,
      name: name.trim(),
      description: description.trim() ? description.trim() : undefined,
      amount: parsedAmount,
      currency,
      recurrence,
    })

    onClose()
  }

  return (
    <div
      className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-2xl transition-all sm:p-8"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d9873]">
            {costToEdit ? 'Editar registro' : 'Novo registro'}
          </span>
          <h2 className="text-2xl font-semibold text-[#173d2a]">
            {costToEdit ? 'Editar Custo Fixo' : 'Cadastrar Custo Fixo'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="grid size-9 place-items-center rounded-full text-[#8a998f] transition hover:bg-[#edf5ef] hover:text-[#173d2a] cursor-pointer"
          aria-label="Fechar"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Nome */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#436350]">
            Nome do Custo <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Aluguel, Netflix, Adobe Cloud, Internet"
            className="mt-1.5 w-full rounded-2xl border border-[#d8e1da] bg-[#fbfcfb] px-4 py-3 text-sm text-[#173d2a] outline-none transition placeholder:text-[#a1afa6] focus:border-[#5d9873] focus:bg-white focus:ring-4 focus:ring-[#b7d7c5]/40"
          />
        </div>

        {/* Descritivo (Opcional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#436350]">
            Descritivo <span className="text-xs font-normal text-[#8a998f]">(Opcional)</span>
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes adicionais, forma de pagamento ou notas..."
            className="mt-1.5 w-full resize-none rounded-2xl border border-[#d8e1da] bg-[#fbfcfb] px-4 py-3 text-sm text-[#173d2a] outline-none transition placeholder:text-[#a1afa6] focus:border-[#5d9873] focus:bg-white focus:ring-4 focus:ring-[#b7d7c5]/40"
          />
        </div>

        {/* Moeda e Valor */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#436350]">
              Moeda
            </label>
            <div className="mt-1.5 flex rounded-2xl border border-[#d8e1da] bg-[#fbfcfb] p-1">
              <button
                type="button"
                onClick={() => setCurrency('BRL')}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                  currency === 'BRL'
                    ? 'bg-[#173d2a] text-white shadow-sm'
                    : 'text-[#64736a] hover:text-[#173d2a]'
                }`}
              >
                R$ (BRL)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-[#173d2a] text-white shadow-sm'
                    : 'text-[#64736a] hover:text-[#173d2a]'
                }`}
              >
                $ (USD)
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#436350]">
              Valor <span className="text-rose-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-semibold text-[#71917d]">
                {currency === 'BRL' ? 'R$' : '$'}
              </span>
              <input
                type="text"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-2xl border border-[#d8e1da] bg-[#fbfcfb] py-3 pl-12 pr-4 text-sm font-semibold text-[#173d2a] outline-none transition placeholder:text-[#a1afa6] focus:border-[#5d9873] focus:bg-white focus:ring-4 focus:ring-[#b7d7c5]/40"
              />
            </div>
          </div>
        </div>

        {/* Recorrência */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#436350]">
            Recorrência
          </label>
          <div className="mt-1.5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRecurrence('monthly')}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-sm font-semibold transition cursor-pointer ${
                recurrence === 'monthly'
                  ? 'border-[#5d9873] bg-[#edf5ef] text-[#173d2a]'
                  : 'border-[#d8e1da] bg-white text-[#64736a] hover:border-[#b7d7c5]'
              }`}
            >
              <span
                className={`size-2.5 rounded-full ${
                  recurrence === 'monthly' ? 'bg-[#5d9873]' : 'bg-[#d8e1da]'
                }`}
              />
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setRecurrence('yearly')}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-sm font-semibold transition cursor-pointer ${
                recurrence === 'yearly'
                  ? 'border-[#5d9873] bg-[#edf5ef] text-[#173d2a]'
                  : 'border-[#d8e1da] bg-white text-[#64736a] hover:border-[#b7d7c5]'
              }`}
            >
              <span
                className={`size-2.5 rounded-full ${
                  recurrence === 'yearly' ? 'bg-[#5d9873]' : 'bg-[#d8e1da]'
                }`}
              />
              Anual
            </button>
          </div>
        </div>

        {/* Botões */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[#d8e1da] px-5 py-3 text-sm font-semibold text-[#64736a] transition hover:bg-[#f3f6f4] hover:text-[#173d2a] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-[#173d2a] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[#173d2a]/15 transition hover:bg-[#245439] cursor-pointer"
          >
            {costToEdit ? 'Salvar Alterações' : 'Cadastrar Custo'}
          </button>
        </div>
      </form>
    </div>
  )
}
