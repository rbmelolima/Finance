import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  deleteAllAccountData,
  exportBackupData,
  importBackupData,
  resetFinancialData,
} from '../../services/storage'
import type { AppBackupData, FamilyMember, Profile } from '../../types/finance'
import { formatCurrency, formatMoneyInput, parseMoney } from '../../utils/currency'
import { FamilyMemberModal } from './FamilyMemberModal'

interface ProfilePageProps {
  profile: Profile
  onSaveProfile: (profile: Profile) => void
  onDataRestored: () => void
  onAccountReset: () => void
  onAccountDeleted: () => void
}

export function ProfilePage({
  profile,
  onSaveProfile,
  onDataRestored,
  onAccountReset,
  onAccountDeleted,
}: ProfilePageProps) {
  // Form de Dados Pessoais
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [personalIncome, setPersonalIncome] = useState(() =>
    profile.personalIncome ? formatMoneyInput(profile.personalIncome) : ''
  )
  const [isCLT, setIsCLT] = useState(profile.isCLT ?? true)
  const [paymentDay, setPaymentDay] = useState(() =>
    profile.paymentDay ? String(profile.paymentDay) : '5'
  )

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() => profile.familyMembers || [])
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null)

  // Modais de Gestão de Dados
  const [showResetModal, setShowResetModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pendingBackupToImport, setPendingBackupToImport] = useState<AppBackupData | null>(null)

  // Feedbacks
  const [savedFeedback, setSavedFeedback] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cálculos de Renda Familiar
  const parsedPersonalIncome = parseMoney(personalIncome)
  const totalFamilyExtraIncome = familyMembers.reduce((acc, m) => acc + (m.isWorking ? (Number(m.income) || 0) : 0), 0)
  const totalHouseholdIncome = parsedPersonalIncome + totalFamilyExtraIncome
  const totalPeopleCount = 1 + familyMembers.length
  const perCapitaIncome = totalPeopleCount > 0 ? totalHouseholdIncome / totalPeopleCount : totalHouseholdIncome

  function handlePersonalIncomeBlur() {
    if (personalIncome.trim()) {
      setPersonalIncome(formatMoneyInput(personalIncome))
    }
  }

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault()
    setErrorMessage('')

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName || !trimmedEmail) {
      setErrorMessage('Por favor, informe seu nome e e-mail.')
      return
    }

    const parsedPaymentDay = isCLT && paymentDay.trim() ? parseInt(paymentDay.trim(), 10) : undefined
    if (parsedPaymentDay !== undefined && (isNaN(parsedPaymentDay) || parsedPaymentDay < 1 || parsedPaymentDay > 31)) {
      setErrorMessage('O dia de pagamento deve ser entre 1 e 31.')
      return
    }

    const updatedProfile: Profile = {
      ...profile,
      name: trimmedName,
      email: trimmedEmail,
      personalIncome: parsedPersonalIncome > 0 ? parsedPersonalIncome : undefined,
      isCLT,
      paymentDay: isCLT ? parsedPaymentDay : undefined,
      familyMembers,
      updatedAt: new Date().toISOString(),
    }

    onSaveProfile(updatedProfile)
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 3000)
  }

  // Gestão de Familiares
  function handleSaveFamilyMember(member: FamilyMember) {
    let updated: FamilyMember[]
    if (familyMembers.some((m) => m.id === member.id)) {
      updated = familyMembers.map((m) => (m.id === member.id ? member : m))
    } else {
      updated = [...familyMembers, member]
    }
    setFamilyMembers(updated)

    // Salva automaticamente o perfil com os familiares atualizados
    const updatedProfile: Profile = {
      ...profile,
      name: name.trim() || profile.name,
      email: email.trim() || profile.email,
      personalIncome: parsedPersonalIncome > 0 ? parsedPersonalIncome : undefined,
      isCLT,
      paymentDay: isCLT ? (paymentDay ? parseInt(paymentDay, 10) : undefined) : undefined,
      familyMembers: updated,
      updatedAt: new Date().toISOString(),
    }
    onSaveProfile(updatedProfile)
  }

  function handleDeleteFamilyMember(id: string) {
    const updated = familyMembers.filter((m) => m.id !== id)
    setFamilyMembers(updated)
    setMemberToDelete(null)

    const updatedProfile: Profile = {
      ...profile,
      familyMembers: updated,
      updatedAt: new Date().toISOString(),
    }
    onSaveProfile(updatedProfile)
  }

  // Backup / Export
  function handleExportBackup() {
    try {
      const backup = exportBackupData()
      const jsonString = JSON.stringify(backup, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      const dateStr = new Date().toISOString().split('T')[0]
      link.href = url
      link.download = `backup-finance-${dateStr}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
      setErrorMessage('Erro ao gerar arquivo de backup.')
    }
  }

  // Importação de Arquivo JSON
  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = JSON.parse(text) as AppBackupData

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Formato inválido')
        }

        setPendingBackupToImport(parsed)
      } catch {
        setErrorMessage('O arquivo selecionado não é um arquivo de backup JSON válido.')
      }
    }
    reader.readAsText(file)
    // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleConfirmImport() {
    if (!pendingBackupToImport) return
    try {
      importBackupData(pendingBackupToImport)
      setPendingBackupToImport(null)
      onDataRestored()
      setSavedFeedback(true)
      setTimeout(() => setSavedFeedback(false), 3000)
    } catch {
      setErrorMessage('Erro ao restaurar os dados do backup.')
    }
  }

  function handleConfirmReset() {
    resetFinancialData()
    setShowResetModal(false)
    onAccountReset()
  }

  function handleConfirmDeleteAccount() {
    deleteAllAccountData()
    setShowDeleteModal(false)
    onAccountDeleted()
  }

  return (
    <main className="min-h-screen bg-[#f7f8f5] pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-10 lg:px-10">
        {/* Cabeçalho */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e5dc] bg-white/80 px-3 py-1 text-xs font-semibold text-[#5a8067]">
              Configurações & Família
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#173d2a] sm:text-4xl">
              Perfil do Usuário
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#64736a]">
              Gerencie seus dados pessoais, renda, grupo familiar e cópias de segurança do aplicativo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportBackup}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#d8e1da] bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-[#173d2a] hover:bg-[#edf5ef] hover:border-[#5d9873] transition cursor-pointer shadow-2xs"
            >
              <span>📥</span>
              <span>Exportar Backup (JSON)</span>
            </button>
          </div>
        </div>

        {/* Feedback visual de sucesso ou erro */}
        {savedFeedback && (
          <div className="mt-4 rounded-2xl border border-[#b7d7c5] bg-[#edf5ef] p-4 text-center text-sm font-semibold text-[#173d2a] shadow-sm transition">
            ✓ Dados salvos e sincronizados com sucesso!
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center text-sm font-semibold text-rose-700 shadow-sm transition flex items-center justify-between">
            <span>⚠ {errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-rose-500 hover:text-rose-800 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* SEÇÃO 1: DADOS PESSOAIS & RENDA */}
        <section className="mt-8 rounded-3xl border border-[#dfe8e1] bg-white p-6 sm:p-8 shadow-sm">
          <div className="border-b border-[#edf2ee] pb-4 mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5d9873]">
              Identificação & Remuneração
            </span>
            <h2 className="text-xl font-bold tracking-tight text-[#173d2a]">
              Seus Dados e Renda Pessoal
            </h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nome */}
              <div>
                <label htmlFor="user-name" className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <input
                  id="user-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-[#d8e1da] bg-[#fafcfb] px-4 py-3 text-sm font-semibold text-[#173d2a] outline-none focus:border-[#5d9873] focus:bg-white focus:ring-4 focus:ring-[#b7d7c5]/30 transition"
                  placeholder="Seu nome"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="user-email" className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
                  E-mail <span className="text-rose-500">*</span>
                </label>
                <input
                  id="user-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-[#d8e1da] bg-[#fafcfb] px-4 py-3 text-sm font-semibold text-[#173d2a] outline-none focus:border-[#5d9873] focus:bg-white focus:ring-4 focus:ring-[#b7d7c5]/30 transition"
                  placeholder="voce@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t border-[#edf2ee]">
              {/* Renda Pessoal */}
              <div>
                <label htmlFor="user-income" className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
                  Renda Pessoal Mensal (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#8a998f]">
                    R$
                  </span>
                  <input
                    id="user-income"
                    type="text"
                    inputMode="decimal"
                    value={personalIncome}
                    onChange={(e) => setPersonalIncome(e.target.value)}
                    onBlur={handlePersonalIncomeBlur}
                    placeholder="0,00"
                    className="w-full rounded-2xl border border-[#d8e1da] bg-[#fafcfb] pl-11 pr-4 py-3 text-base font-bold text-[#173d2a] outline-none focus:border-[#5d9873] focus:bg-white focus:ring-4 focus:ring-[#b7d7c5]/30 transition"
                  />
                </div>
                <span className="text-[11px] text-[#718078] mt-1 block">
                  Seu salário líquido ou pró-labore
                </span>
              </div>

              {/* É CLT? */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
                  Regime de Trabalho
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCLT(true)}
                    className={`py-3 rounded-2xl text-xs font-bold transition cursor-pointer border ${
                      isCLT
                        ? 'border-[#173d2a] bg-[#173d2a] text-white shadow-xs'
                        : 'border-[#d8e1da] bg-[#fafcfb] text-[#64736a] hover:border-[#b7d7c5]'
                    }`}
                  >
                    CLT
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCLT(false)}
                    className={`py-3 rounded-2xl text-xs font-bold transition cursor-pointer border ${
                      !isCLT
                        ? 'border-[#173d2a] bg-[#173d2a] text-white shadow-xs'
                        : 'border-[#d8e1da] bg-[#fafcfb] text-[#64736a] hover:border-[#b7d7c5]'
                    }`}
                  >
                    PJ / Outro
                  </button>
                </div>
                <span className="text-[11px] text-[#718078] mt-1 block">
                  Determina ciclo de pagamento
                </span>
              </div>

              {/* Dia de Pagamento */}
              <div>
                <label htmlFor="user-payday" className="block text-xs font-semibold uppercase tracking-wider text-[#718078] mb-1.5">
                  Dia do Pagamento {isCLT && '(CLT)'}
                </label>
                <input
                  id="user-payday"
                  type="number"
                  min="1"
                  max="31"
                  disabled={!isCLT}
                  value={isCLT ? paymentDay : ''}
                  onChange={(e) => setPaymentDay(e.target.value)}
                  placeholder={isCLT ? 'Ex: 5' : 'Não se aplica'}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm font-bold text-[#173d2a] outline-none transition ${
                    isCLT
                      ? 'border-[#d8e1da] bg-[#fafcfb] focus:border-[#5d9873] focus:bg-white focus:ring-4 focus:ring-[#b7d7c5]/30'
                      : 'border-[#edf2ee] bg-gray-100/60 text-gray-400 cursor-not-allowed'
                  }`}
                />
                <span className="text-[11px] text-[#718078] mt-1 block">
                  {isCLT ? 'Ex: 5º dia útil ou dia 5/20' : 'Habilitado apenas para CLT'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto rounded-2xl bg-[#173d2a] px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#173d2a]/15 hover:bg-[#245439] transition cursor-pointer"
              >
                Salvar Dados do Perfil
              </button>
            </div>
          </form>
        </section>

        {/* SEÇÃO 2: GRUPO FAMILIAR & RENDA DOMICILIAR */}
        <section className="mt-8 rounded-3xl border border-[#dfe8e1] bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#edf2ee] pb-4 mb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5d9873]">
                Estrutura Domiciliar
              </span>
              <h2 className="text-xl font-bold tracking-tight text-[#173d2a]">
                Pessoas da Família & Dependentes
              </h2>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingMember(null)
                setIsFamilyModalOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#173d2a] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#245439] transition cursor-pointer shadow-xs"
            >
              <span>+ Adicionar Familiar</span>
            </button>
          </div>

          {/* Cards de Métricas da Família */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="rounded-2xl border border-[#e3eae4] bg-[#fafcfb] p-4">
              <span className="text-xs font-semibold text-[#718078]">Sua Renda Pessoal</span>
              <p className="text-xl font-extrabold text-[#173d2a] mt-1">
                {formatCurrency(parsedPersonalIncome)}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e3eae4] bg-[#fafcfb] p-4">
              <span className="text-xs font-semibold text-[#718078]">Renda dos Familiares</span>
              <p className="text-xl font-extrabold text-[#2c6e43] mt-1">
                {formatCurrency(totalFamilyExtraIncome)}
              </p>
              <span className="text-[10px] text-[#718078]">
                {familyMembers.filter((m) => m.isWorking).length} pessoa(s) trabalhando
              </span>
            </div>

            <div className="rounded-2xl border border-[#b7d7c5] bg-[#edf5ef] p-4">
              <span className="text-xs font-bold text-[#173d2a]">Renda Domiciliar Total</span>
              <p className="text-xl font-black text-[#173d2a] mt-1">
                {formatCurrency(totalHouseholdIncome)}
              </p>
              <span className="text-[10px] text-[#5a8067]">
                {totalPeopleCount} pessoa(s) no total
              </span>
            </div>

            <div className="rounded-2xl border border-[#e3eae4] bg-[#fafcfb] p-4">
              <span className="text-xs font-semibold text-[#718078]">Renda Per Capita</span>
              <p className="text-xl font-extrabold text-[#173d2a] mt-1">
                {formatCurrency(perCapitaIncome)}
              </p>
              <span className="text-[10px] text-[#718078]">
                Renda total / membros
              </span>
            </div>
          </div>

          {/* Lista de Membros */}
          {familyMembers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d8e1da] bg-[#fafcfb] p-8 text-center">
              <p className="text-3xl mb-2">👨‍👩‍👧‍👦</p>
              <p className="text-sm font-bold text-[#173d2a]">Nenhum familiar cadastrado</p>
              <p className="text-xs text-[#718078] mt-1 max-w-md mx-auto">
                Adicione cônjuge, filhos ou dependentes para calcular a renda per capita e visualizar a capacidade financeira de toda a casa.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingMember(null)
                  setIsFamilyModalOpen(true)
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#173d2a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#245439] transition cursor-pointer"
              >
                + Adicionar Primeiro Familiar
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-[#e3eae4] bg-[#fafcfb] hover:border-[#b7d7c5] hover:bg-white transition"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-[#173d2a] truncate">{member.name}</h4>
                      {member.relationship && (
                        <span className="text-[10px] font-semibold text-[#5a8067] bg-[#e9f4ec] px-2 py-0.5 rounded-md">
                          {member.relationship}
                        </span>
                      )}
                      {member.age !== undefined && member.age !== null && (
                        <span className="text-[10px] text-[#718078] bg-white border border-[#e3eae4] px-1.5 py-0.5 rounded-md">
                          {member.age} anos
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                      {member.isWorking ? (
                        <span className="font-bold text-[#2c6e43]">
                          💼 Trabalha • {formatCurrency(member.income || 0)}/mês
                        </span>
                      ) : (
                        <span className="text-[#8a998f]">
                          Dependente (não trabalha)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMember(member)
                        setIsFamilyModalOpen(true)
                      }}
                      className="grid size-8 place-items-center rounded-xl border border-[#d8e1da] text-[#64736a] hover:bg-[#edf5ef] hover:text-[#173d2a] transition cursor-pointer"
                      title="Editar familiar"
                    >
                      ✏
                    </button>
                    <button
                      type="button"
                      onClick={() => setMemberToDelete(member)}
                      className="grid size-8 place-items-center rounded-xl border border-[#d8e1da] text-[#a1afa6] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                      title="Remover familiar"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SEÇÃO 3: GESTÃO DE DADOS & SEGURANÇA */}
        <section className="mt-8 rounded-3xl border border-[#dfe8e1] bg-white p-6 sm:p-8 shadow-sm">
          <div className="border-b border-[#edf2ee] pb-4 mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5d9873]">
              Privacidade & Segurança
            </span>
            <h2 className="text-xl font-bold tracking-tight text-[#173d2a]">
              Gestão de Dados do Aplicativo
            </h2>
            <p className="text-xs text-[#718078] mt-0.5">
              Seus dados residem exclusivamente neste dispositivo (Local Storage). Faça backups periódicos para não perder informações.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Exportar Backup */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#e3eae4] bg-[#fafcfb] p-5">
              <div>
                <span className="text-2xl">📥</span>
                <h3 className="text-sm font-bold text-[#173d2a] mt-2">Exportar Backup</h3>
                <p className="text-xs text-[#718078] mt-1">
                  Gera um arquivo <code className="text-[11px]">.json</code> com todas as contas, cartões, custos e patrimônio.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="mt-4 w-full rounded-xl bg-[#173d2a] py-2.5 text-xs font-semibold text-white hover:bg-[#245439] transition cursor-pointer"
              >
                Baixar Arquivo JSON
              </button>
            </div>

            {/* Importar Backup */}
            <div className="flex flex-col justify-between rounded-2xl border border-[#e3eae4] bg-[#fafcfb] p-5">
              <div>
                <span className="text-2xl">📤</span>
                <h3 className="text-sm font-bold text-[#173d2a] mt-2">Importar Dados</h3>
                <p className="text-xs text-[#718078] mt-1">
                  Restaura todas as informações a partir de um arquivo de backup previamente salvo.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileSelected}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full rounded-xl border border-[#d8e1da] bg-white py-2.5 text-xs font-semibold text-[#173d2a] hover:bg-[#edf5ef] hover:border-[#5d9873] transition cursor-pointer"
              >
                Selecionar JSON
              </button>
            </div>

            {/* Zerar Dados Financeiros */}
            <div className="flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5">
              <div>
                <span className="text-2xl">🧹</span>
                <h3 className="text-sm font-bold text-amber-900 mt-2">Zerar Conta</h3>
                <p className="text-xs text-amber-800 mt-1">
                  Apaga contas, cartões, custos e balanço patrimonial, mas <strong>mantém seu perfil</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="mt-4 w-full rounded-xl border border-amber-300 bg-white py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
              >
                Zerar Dados
              </button>
            </div>

            {/* Excluir Conta Definitivamente */}
            <div className="flex flex-col justify-between rounded-2xl border border-rose-200 bg-rose-50/40 p-5">
              <div>
                <span className="text-2xl">🗑</span>
                <h3 className="text-sm font-bold text-rose-900 mt-2">Excluir Conta</h3>
                <p className="text-xs text-rose-800 mt-1">
                  Limpa <strong>completamente</strong> todos os dados e encerra a sessão no dispositivo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="mt-4 w-full rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
              >
                Excluir Conta
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Modal de Adicionar / Editar Membro da Família */}
      <FamilyMemberModal
        isOpen={isFamilyModalOpen}
        onClose={() => {
          setIsFamilyModalOpen(false)
          setEditingMember(null)
        }}
        onSave={handleSaveFamilyMember}
        memberToEdit={editingMember}
      />

      {/* Modal de Confirmação para Remover Familiar */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#173d2a]">Remover Familiar</h3>
            <p className="mt-2 text-xs text-[#718078]">
              Tem certeza que deseja remover <strong>{memberToDelete.name}</strong> da sua lista de familiares?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setMemberToDelete(null)}
                className="rounded-xl border border-[#d8e1da] px-4 py-2 text-xs font-semibold text-[#64736a] hover:bg-[#f3f6f4] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteFamilyMember(memberToDelete.id)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Importação de Backup */}
      {pendingBackupToImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[#dfe8e1] bg-white p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-[#173d2a]">Confirmar Importação de Dados</h3>
            <p className="mt-2 text-xs text-[#718078]">
              O arquivo de backup contém os seguintes registros:
            </p>
            <div className="my-4 rounded-2xl bg-[#fafcfb] border border-[#e3eae4] p-3 text-xs space-y-1 text-[#30483a]">
              <p>• <strong>Perfil:</strong> {pendingBackupToImport.profile?.name || 'Não identificado'}</p>
              <p>• <strong>Contas Bancárias:</strong> {pendingBackupToImport.bankAccounts?.length || 0} conta(s)</p>
              <p>• <strong>Cartões de Crédito:</strong> {pendingBackupToImport.creditCards?.length || 0} cartão(ões)</p>
              <p>• <strong>Custos Fixos:</strong> {pendingBackupToImport.fixedCosts?.length || 0} registro(s)</p>
              <p>• <strong>Exportado em:</strong> {pendingBackupToImport.exportedAt ? new Date(pendingBackupToImport.exportedAt).toLocaleDateString('pt-BR') : 'Data não informada'}</p>
            </div>
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              ⚠ Atenção: A importação substituirá os dados atuais deste dispositivo pelos dados do backup.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPendingBackupToImport(null)}
                className="rounded-xl border border-[#d8e1da] px-4 py-2.5 text-xs font-semibold text-[#64736a] hover:bg-[#f3f6f4] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmImport}
                className="rounded-xl bg-[#173d2a] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#245439] cursor-pointer"
              >
                Confirmar e Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Zerar Conta */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#173d2a]">Zerar Dados Financeiros?</h3>
            <p className="mt-2 text-xs text-[#718078] leading-relaxed">
              Todas as suas contas bancárias, faturas de cartão, custos fixos e balanço patrimonial serão apagados. <strong>Seu perfil e membros da família serão mantidos.</strong>
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="rounded-xl border border-[#d8e1da] px-4 py-2 text-xs font-semibold text-[#64736a] hover:bg-[#f3f6f4] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReset}
                className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 cursor-pointer shadow-xs"
              >
                Sim, Zerar Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Excluir Conta */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600 mb-1">
              <span className="text-xl">⚠</span>
              <h3 className="text-lg font-bold">Excluir Conta Definitivamente?</h3>
            </div>
            <p className="mt-2 text-xs text-[#718078] leading-relaxed">
              Esta ação removerá permanentemente seu perfil, membros da família e todos os dados financeiros deste dispositivo.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-[#d8e1da] px-4 py-2 text-xs font-semibold text-[#64736a] hover:bg-[#f3f6f4] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteAccount}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                Sim, Excluir Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
