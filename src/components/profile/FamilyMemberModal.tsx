import { useState } from 'react'
import type { FormEvent } from 'react'
import type { FamilyMember } from '../../types/finance'
import { formatMoneyInput, parseMoney } from '../../utils/currency'
import { calculateAge, formatAgeDisplay, MONTHS_PTBR } from '../../utils/date'

interface FamilyMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (member: FamilyMember) => void
  memberToEdit?: FamilyMember | null
}

const RELATIONSHIP_OPTIONS = [
  'Cônjuge / Parceiro(a)',
  'Filho(a)',
  'Pai / Mãe',
  'Irmão(ã)',
  'Avô / Avó',
  'Outro dependente',
]

export function FamilyMemberModal({
  isOpen,
  onClose,
  onSave,
  memberToEdit,
}: FamilyMemberModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <FamilyMemberForm
        key={memberToEdit?.id ?? 'new'}
        memberToEdit={memberToEdit}
        onClose={onClose}
        onSave={onSave}
      />
    </div>
  )
}

interface FamilyMemberFormProps {
  memberToEdit?: FamilyMember | null
  onClose: () => void
  onSave: (member: FamilyMember) => void
}

function FamilyMemberForm({ memberToEdit, onClose, onSave }: FamilyMemberFormProps) {
  const currentYear = new Date().getFullYear()

  const [name, setName] = useState(memberToEdit?.name ?? '')
  const [relationship, setRelationship] = useState(memberToEdit?.relationship ?? RELATIONSHIP_OPTIONS[0])
  const [birthMonth, setBirthMonth] = useState<string>(() =>
    memberToEdit?.birthMonth ? String(memberToEdit.birthMonth) : ''
  )
  const [birthYear, setBirthYear] = useState<string>(() =>
    memberToEdit?.birthYear
      ? String(memberToEdit.birthYear)
      : memberToEdit?.age
      ? String(currentYear - memberToEdit.age)
      : ''
  )
  const [isWorking, setIsWorking] = useState(memberToEdit?.isWorking ?? false)
  const [income, setIncome] = useState(() =>
    memberToEdit?.income ? formatMoneyInput(memberToEdit.income) : ''
  )
  const [error, setError] = useState('')

  const parsedBirthYear = birthYear.trim() ? parseInt(birthYear.trim(), 10) : undefined
  const parsedBirthMonth = birthMonth ? parseInt(birthMonth, 10) : undefined
  const dynamicAge = calculateAge(parsedBirthYear, parsedBirthMonth)

  function handleIncomeBlur() {
    if (income.trim()) {
      setIncome(formatMoneyInput(income))
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Por favor, informe o nome do familiar.')
      return
    }

    if (parsedBirthYear !== undefined) {
      if (isNaN(parsedBirthYear) || parsedBirthYear < 1900 || parsedBirthYear > currentYear) {
        setError(`O ano de nascimento deve ser entre 1900 e ${currentYear}.`)
        return
      }
    }

    let parsedIncome: number | undefined
    if (isWorking) {
      parsedIncome = parseMoney(income)
      if (isNaN(parsedIncome) || parsedIncome < 0) {
        setError('Por favor, informe um valor de renda válido.')
        return
      }
    } else {
      parsedIncome = 0
    }

    onSave({
      id: memberToEdit?.id ?? `fam_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      relationship,
      birthMonth: parsedBirthMonth,
      birthYear: parsedBirthYear,
      age: dynamicAge ?? memberToEdit?.age,
      isWorking,
      income: isWorking ? parsedIncome : 0,
      createdAt: memberToEdit?.createdAt ?? new Date().toISOString(),
    })

    onClose()
  }

  return (
    <div
      className="w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#dfe8e1] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#eef3ef] pb-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-[#173d2a]">
            {memberToEdit ? 'Editar Familiar' : 'Adicionar Membro da Família'}
          </h3>
          <p className="text-xs text-[#718078] mt-0.5">
            Cadastre dependentes ou membros que compõem sua renda familiar
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
        {/* Nome */}
        <div>
          <label htmlFor="fam-name" className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
            Nome do Familiar <span className="text-rose-500">*</span>
          </label>
          <input
            id="fam-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Maria Silva, Lucas..."
            className="w-full rounded-2xl border border-[#d8e1da] bg-white px-4 py-3 text-sm text-[#173d2a] placeholder:text-[#a1afa6] outline-none focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/30 transition"
          />
        </div>

        {/* Parentesco */}
        <div>
          <label htmlFor="fam-rel" className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
            Parentesco
          </label>
          <select
            id="fam-rel"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full rounded-2xl border border-[#d8e1da] bg-white px-3 py-3 text-xs sm:text-sm text-[#173d2a] outline-none focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/30 transition cursor-pointer"
          >
            {RELATIONSHIP_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Mês e Ano de Nascimento (Atualização Anual Automática) */}
        <div className="rounded-2xl border border-[#dfe8e1] bg-[#fafcfb] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#436350]">
              Data de Nascimento
            </label>
            {dynamicAge !== null && (
              <span className="text-[11px] font-bold text-[#173d2a] bg-[#e9f4ec] px-2 py-0.5 rounded-full">
                Idade: {formatAgeDisplay(parsedBirthYear, parsedBirthMonth)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="fam-birth-month" className="block text-[11px] font-medium text-[#718078] mb-1">
                Mês de Nascimento
              </label>
              <select
                id="fam-birth-month"
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="w-full rounded-xl border border-[#d8e1da] bg-white px-3 py-2.5 text-xs sm:text-sm text-[#173d2a] outline-none focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/30 transition cursor-pointer"
              >
                <option value="">Selecione o mês</option>
                {MONTHS_PTBR.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fam-birth-year" className="block text-[11px] font-medium text-[#718078] mb-1">
                Ano de Nascimento
              </label>
              <input
                id="fam-birth-year"
                type="number"
                min="1900"
                max={currentYear}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder={`Ex: 1995, 2012...`}
                className="w-full rounded-xl border border-[#d8e1da] bg-white px-3 py-2.5 text-xs sm:text-sm text-[#173d2a] placeholder:text-[#a1afa6] outline-none focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/30 transition"
              />
            </div>
          </div>
          <p className="text-[10px] text-[#718078]">
            Com o mês e ano, a idade do seu familiar será atualizada automaticamente a cada aniversário.
          </p>
        </div>

        {/* Trabalha Atualmente? */}
        <div className="rounded-2xl border border-[#d8e1da] bg-[#fafcfb] p-3.5 space-y-2.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#436350]">
            Trabalha atualmente?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsWorking(true)}
              className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                isWorking
                  ? 'border-[#173d2a] bg-[#173d2a] text-white shadow-xs'
                  : 'border-[#d8e1da] bg-white text-[#64736a] hover:border-[#b7d7c5]'
              }`}
            >
              Sim, trabalha
            </button>
            <button
              type="button"
              onClick={() => {
                setIsWorking(false)
                setIncome('')
              }}
              className={`py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                !isWorking
                  ? 'border-[#173d2a] bg-[#173d2a] text-white shadow-xs'
                  : 'border-[#d8e1da] bg-white text-[#64736a] hover:border-[#b7d7c5]'
              }`}
            >
              Não trabalha
            </button>
          </div>
        </div>

        {/* Renda Mensal se trabalhar */}
        {isWorking && (
          <div className="animate-in fade-in duration-200">
            <label htmlFor="fam-income" className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
              Renda Mensal do Familiar (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8a998f]">
                R$
              </span>
              <input
                id="fam-income"
                type="text"
                inputMode="decimal"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                onBlur={handleIncomeBlur}
                placeholder="0,00"
                className="w-full rounded-2xl border border-[#d8e1da] bg-white pl-11 pr-4 py-3 text-base font-bold text-[#173d2a] placeholder:text-[#a1afa6] outline-none focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/30 transition"
              />
            </div>
            <p className="text-[11px] text-[#718078] mt-1">
              Essa renda será somada para cálculo da renda domiciliar total.
            </p>
          </div>
        )}

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
            {memberToEdit ? 'Salvar Familiar' : 'Adicionar Familiar'}
          </button>
        </div>
      </form>
    </div>
  )
}
