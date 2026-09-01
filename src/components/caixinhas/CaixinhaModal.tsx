import { useState, type FormEvent } from 'react'
import type { Caixinha } from '../../types/finance'
import { formatMoneyInput, maskMoneyInput, parseMoney } from '../../utils/currency'
import { MONTHS_PTBR } from '../../utils/date'

interface CaixinhaModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (caixinha: Omit<Caixinha, 'id' | 'createdAt'> & { id?: string }) => void
  caixinhaToEdit?: Caixinha | null
}

const PRESET_ICONS = [
  '🎯',
  '✈️',
  '🚗',
  '🏠',
  '💻',
  '📱',
  '🎓',
  '💍',
  '🏖️',
  '🛡️',
  '💰',
  '🎁',
  '🚲',
  '🎸',
  '👶',
  '⚡',
]

export function CaixinhaModal({
  isOpen,
  onClose,
  onSave,
  caixinhaToEdit,
}: CaixinhaModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <CaixinhaForm
        key={caixinhaToEdit?.id ?? 'new'}
        caixinhaToEdit={caixinhaToEdit}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  )
}

interface CaixinhaFormProps {
  caixinhaToEdit?: Caixinha | null
  onClose: () => void
  onSave: (caixinha: Omit<Caixinha, 'id' | 'createdAt'> & { id?: string }) => void
}

function CaixinhaForm({ caixinhaToEdit, onClose, onSave }: CaixinhaFormProps) {
  const currentYear = new Date().getFullYear()

  const [name, setName] = useState(caixinhaToEdit?.name ?? '')
  const [icon, setIcon] = useState(caixinhaToEdit?.icon ?? '🎯')
  const [targetAmountStr, setTargetAmountStr] = useState(() =>
    caixinhaToEdit?.targetAmount ? formatMoneyInput(caixinhaToEdit.targetAmount) : ''
  )
  const [currentAmountStr, setCurrentAmountStr] = useState(() =>
    caixinhaToEdit?.currentAmount ? formatMoneyInput(caixinhaToEdit.currentAmount) : '0,00'
  )
  const [hasDeadline, setHasDeadline] = useState(
    Boolean(caixinhaToEdit?.deadlineYear && caixinhaToEdit?.deadlineMonth)
  )
  const [deadlineMonth, setDeadlineMonth] = useState<number>(() =>
    caixinhaToEdit?.deadlineMonth ? caixinhaToEdit.deadlineMonth : new Date().getMonth() + 1
  )
  const [deadlineYear, setDeadlineYear] = useState<number>(() =>
    caixinhaToEdit?.deadlineYear ? caixinhaToEdit.deadlineYear : currentYear + 1
  )
  const [notes, setNotes] = useState(caixinhaToEdit?.notes ?? '')

  const [errors, setErrors] = useState<{ name?: string; targetAmount?: string }>({})

  function validate() {
    const errs: { name?: string; targetAmount?: string } = {}
    if (!name.trim()) {
      errs.name = 'Informe um nome para a caixinha.'
    }
    const target = parseMoney(targetAmountStr)
    if (target <= 0) {
      errs.targetAmount = 'O valor alvo deve ser maior que zero.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const targetAmount = parseMoney(targetAmountStr)
    const currentAmount = parseMoney(currentAmountStr)

    onSave({
      ...(caixinhaToEdit?.id ? { id: caixinhaToEdit.id } : {}),
      name: name.trim(),
      icon,
      targetAmount,
      currentAmount,
      deadlineMonth: hasDeadline ? Number(deadlineMonth) : undefined,
      deadlineYear: hasDeadline ? Number(deadlineYear) : undefined,
      notes: notes.trim() || undefined,
    })

    onClose()
  }

  return (
    <div className="w-full max-w-lg rounded-3xl border border-[#e3eae4] bg-white p-6 sm:p-8 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-[#edf2ee] pb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#edf5ef] text-xl">
            {icon}
          </span>
          <div>
            <h2 className="text-lg font-bold text-[#173d2a]">
              {caixinhaToEdit ? 'Editar Caixinha' : 'Nova Caixinha / Meta'}
            </h2>
            <p className="text-xs text-[#8a998f]">
              Defina seu objetivo financeiro e acompanhe seus aportes.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid size-8 place-items-center rounded-xl text-[#718078] hover:bg-[#edf5ef] hover:text-[#173d2a] transition cursor-pointer"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* Seletor de Ícone */}
        <div>
          <label className="block text-xs font-semibold text-[#30483a] mb-2">
            Escolha um Ícone
          </label>
          <div className="flex flex-wrap gap-1.5 p-2 rounded-2xl bg-[#f7f8f5] border border-[#e3eae4]">
            {PRESET_ICONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`grid size-9 place-items-center rounded-xl text-lg transition cursor-pointer ${
                  icon === emoji
                    ? 'bg-white shadow-xs scale-110 border border-[#b7d7c5]'
                    : 'hover:bg-white/60 text-[#64736a]'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Nome do Objetivo */}
        <div>
          <label htmlFor="caixinha-name" className="block text-xs font-semibold text-[#30483a]">
            Nome da Caixinha / Meta
          </label>
          <input
            id="caixinha-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            placeholder="Ex: Viagem Europa, Troca de Carro, Reforma..."
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

        {/* Valores: Alvo e Guardado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Valor Alvo */}
          <div>
            <label htmlFor="caixinha-target" className="block text-xs font-semibold text-[#30483a]">
              Valor Alvo / Meta (R$)
            </label>
            <div
              className={`mt-1.5 relative rounded-2xl border bg-white px-3.5 py-3 shadow-2xs transition focus-within:border-[#5d9873] focus-within:ring-4 focus-within:ring-[#b7d7c5]/40 ${
                errors.targetAmount ? 'border-rose-400' : 'border-[#d8e1da]'
              }`}
            >
              <span className="text-xs font-bold text-[#8a998f] mr-1.5">R$</span>
              <input
                id="caixinha-target"
                type="text"
                inputMode="numeric"
                value={targetAmountStr}
                onChange={(e) => {
                  setTargetAmountStr(maskMoneyInput(e.target.value))
                  if (errors.targetAmount) {
                    setErrors((prev) => ({ ...prev, targetAmount: undefined }))
                  }
                }}
                placeholder="0,00"
                className="w-[85%] text-sm font-bold text-[#173d2a] outline-none"
              />
            </div>
            {errors.targetAmount && (
              <p className="mt-1 text-xs font-medium text-rose-600">⚠ {errors.targetAmount}</p>
            )}
          </div>

          {/* Valor Já Guardado */}
          <div>
            <label htmlFor="caixinha-current" className="block text-xs font-semibold text-[#30483a]">
              Valor Inicial Guardado (R$)
            </label>
            <div className="mt-1.5 relative rounded-2xl border border-[#d8e1da] bg-white px-3.5 py-3 shadow-2xs focus-within:border-[#5d9873] focus-within:ring-4 focus-within:ring-[#b7d7c5]/40">
              <span className="text-xs font-bold text-[#8a998f] mr-1.5">R$</span>
              <input
                id="caixinha-current"
                type="text"
                inputMode="numeric"
                value={currentAmountStr}
                onChange={(e) => setCurrentAmountStr(maskMoneyInput(e.target.value))}
                placeholder="0,00"
                className="w-[85%] text-sm font-bold text-[#173d2a] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Prazo / Data Limite */}
        <div className="rounded-2xl border border-[#e3eae4] bg-[#fafcfb] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#173d2a] flex items-center gap-1.5">
              <span>🗓️</span> Definir Prazo para Conclusão?
            </label>
            <input
              type="checkbox"
              checked={hasDeadline}
              onChange={(e) => setHasDeadline(e.target.checked)}
              className="size-4 rounded accent-[#173d2a] cursor-pointer"
            />
          </div>

          {hasDeadline && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#edf2ee] animate-in fade-in duration-200">
              <div>
                <label className="block text-[11px] font-semibold text-[#64736a] mb-1">
                  Mês Alvo
                </label>
                <select
                  value={deadlineMonth}
                  onChange={(e) => setDeadlineMonth(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-[#d8e1da] bg-white px-3 py-2 text-xs font-semibold text-[#173d2a] outline-none focus:border-[#5d9873]"
                >
                  {MONTHS_PTBR.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.value} - {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64736a] mb-1">
                  Ano Alvo
                </label>
                <select
                  value={deadlineYear}
                  onChange={(e) => setDeadlineYear(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-[#d8e1da] bg-white px-3 py-2 text-xs font-semibold text-[#173d2a] outline-none focus:border-[#5d9873]"
                >
                  {Array.from({ length: 15 }, (_, i) => currentYear + i).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Anotações Adicionais */}
        <div>
          <label htmlFor="caixinha-notes" className="block text-xs font-semibold text-[#30483a]">
            Anotações / Detalhes (Opcional)
          </label>
          <input
            id="caixinha-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Investido em CDB 100% CDI com liquidez diária"
            className="mt-1.5 w-full rounded-2xl border border-[#d8e1da] bg-white px-4 py-2.5 text-xs text-[#173d2a] outline-none focus:border-[#5d9873] focus:ring-2 focus:ring-[#b7d7c5]/30 transition"
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#edf2ee]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[#d8e1da] px-5 py-3 text-xs font-semibold text-[#64736a] hover:bg-[#f7f8f5] hover:text-[#173d2a] transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-[#173d2a] px-6 py-3 text-xs font-bold text-white hover:bg-[#245439] shadow-md shadow-[#173d2a]/10 transition cursor-pointer"
          >
            {caixinhaToEdit ? 'Salvar Alterações' : 'Criar Caixinha'}
          </button>
        </div>
      </form>
    </div>
  )
}
