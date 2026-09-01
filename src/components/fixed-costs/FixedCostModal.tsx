import type { FormEvent } from 'react'
import { useState } from 'react'
import { getCategories } from '../../services/storage'
import type { Currency, FixedCost, Recurrence } from '../../types/finance'
import { formatMoneyInput, parseMoney } from '../../utils/currency'

interface FixedCostModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (cost: Omit<FixedCost, 'id' | 'createdAt'> & { id?: string }) => void
  costToEdit?: FixedCost | null
}

export function FixedCostModal({ isOpen, onClose, onSave, costToEdit }: FixedCostModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
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
  onSave: (cost: Omit<FixedCost, 'id' | 'createdAt'> & { id?: string }) => void
}

function FixedCostForm({ costToEdit, onClose, onSave }: FixedCostFormProps) {
  const [categories, setCategories] = useState<string[]>(() => getCategories())
  const [name, setName] = useState(costToEdit?.name ?? '')
  const [description, setDescription] = useState(costToEdit?.description ?? '')
  const [category, setCategory] = useState(costToEdit?.category ?? (categories[0] || 'Assinatura'))
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [amountStr, setAmountStr] = useState(() =>
    costToEdit ? formatMoneyInput(costToEdit.amount) : ''
  )
  const [currency, setCurrency] = useState<Currency>(costToEdit?.currency ?? 'BRL')
  const [recurrence, setRecurrence] = useState<Recurrence>(costToEdit?.recurrence ?? 'monthly')
  const [error, setError] = useState<string | null>(null)

  function handleAddCustomCategory() {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    if (!categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed])
    }
    setCategory(trimmed)
    setNewCategoryName('')
    setIsCreatingCategory(false)
  }

  function handleAmountBlur() {
    if (amountStr.trim()) {
      setAmountStr(formatMoneyInput(amountStr))
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Por favor, informe o nome do custo fixo.')
      return
    }

    const parsedAmount = parseMoney(amountStr)

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor, informe um valor válido maior que zero.')
      return
    }

    const finalCategory = isCreatingCategory && newCategoryName.trim()
      ? newCategoryName.trim()
      : category.trim() || 'Outros'

    onSave({
      id: costToEdit?.id,
      name: name.trim(),
      description: description.trim() ? description.trim() : undefined,
      category: finalCategory,
      amount: parsedAmount,
      currency,
      recurrence,
    })

    onClose()
  }

  return (
    <div
      className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-2xl transition-all sm:p-8"
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

      <form onSubmit={handleSubmit} className="mt-5 space-y-4 overflow-y-auto pr-1">
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
            placeholder="Ex: Aluguel, Netflix, Adobe Cloud, Condomínio"
            className="mt-1.5 w-full rounded-2xl border border-[#d8e1da] bg-[#fbfcfb] px-4 py-3 text-sm text-[#173d2a] outline-none transition placeholder:text-[#a1afa6] focus:border-[#5d9873] focus:bg-white focus:ring-4 focus:ring-[#b7d7c5]/40"
          />
        </div>

        {/* Categoria */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#436350]">
              Categoria <span className="text-rose-500">*</span>
            </label>
            {!isCreatingCategory && (
              <button
                type="button"
                onClick={() => setIsCreatingCategory(true)}
                className="text-xs font-semibold text-[#5d9873] hover:text-[#173d2a] cursor-pointer"
              >
                + Nova categoria
              </button>
            )}
          </div>

          {isCreatingCategory ? (
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nome da nova categoria..."
                className="flex-1 rounded-2xl border border-[#5d9873] bg-white px-4 py-2.5 text-sm text-[#173d2a] outline-none focus:ring-4 focus:ring-[#b7d7c5]/40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomCategory()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomCategory}
                className="rounded-2xl bg-[#173d2a] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#245439] cursor-pointer"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingCategory(false)
                  setNewCategoryName('')
                }}
                className="rounded-2xl border border-[#d8e1da] px-3 py-2.5 text-xs font-semibold text-[#64736a] transition hover:bg-[#f3f6f4] cursor-pointer"
              >
                Voltar
              </button>
            </div>
          ) : (
            <div className="relative mt-1.5">
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setIsCreatingCategory(true)
                  } else {
                    setCategory(e.target.value)
                  }
                }}
                className="w-full appearance-none rounded-2xl border border-[#d8e1da] bg-[#fbfcfb] px-4 py-3 text-sm font-medium text-[#173d2a] outline-none transition focus:border-[#5d9873] focus:bg-white focus:ring-4 focus:ring-[#b7d7c5]/40 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__add_new__">+ Criar outra categoria...</option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#8a998f]">
                <svg viewBox="0 0 20 20" className="size-4" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </span>
            </div>
          )}
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
                inputMode="decimal"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                onBlur={handleAmountBlur}
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
