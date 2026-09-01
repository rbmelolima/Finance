import type { FormEvent } from 'react'
import { useState } from 'react'

import { DashboardPage } from './components/dashboard/DashboardPage'
import { FixedCostsPage } from './components/fixed-costs/FixedCostsPage'
import { FixedCostModal } from './components/fixed-costs/FixedCostModal'
import { Logo } from './components/Logo'
import { OverviewPage } from './components/overview/OverviewPage'
import { PatrimonioPage } from './components/patrimonio/PatrimonioPage'
import { ProfilePage } from './components/profile/ProfilePage'
import { QuantoCustaPage } from './components/quanto-custa/QuantoCustaPage'
import { Sidebar } from './components/Sidebar'

import {
  calculateCarteiraTotals,
  deleteBankAccountItem,
  deleteCreditCardItem,
  deleteFixedCostItem,
  getBankAccounts,
  getCreditCards,
  getFixedCosts,
  getPatrimonioData,
  getSavedProfile,
  saveBankAccountItem,
  saveCreditCardItem,
  saveFixedCostItem,
  savePatrimonioData,
  saveProfile,
  updateBankAccountBalance,
  updateCreditCardInvoice,
} from './services/storage'
import type { BankAccount, CreditCard, FixedCost, PatrimonioData, Profile, Screen } from './types/finance'

function App() {
  const [profile, setProfile] = useState<Profile | null>(getSavedProfile)
  const [screen, setScreen] = useState<Screen>(() => (getSavedProfile() ? 'dashboard' : 'landing'))
  const [name, setName] = useState(() => getSavedProfile()?.name ?? '')
  const [email, setEmail] = useState(() => getSavedProfile()?.email ?? '')
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(getBankAccounts)
  const [creditCards, setCreditCards] = useState<CreditCard[]>(getCreditCards)
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(getFixedCosts)
  const [patrimonio, setPatrimonio] = useState<PatrimonioData>(getPatrimonioData)
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false)

  const carteiraTotals = calculateCarteiraTotals(bankAccounts, creditCards)

  function handleLogin(newName: string, newEmail: string) {
    const trimmedName = newName.trim()
    const trimmedEmail = newEmail.trim()
    if (trimmedName && trimmedEmail) {
      const nextProfile = { name: trimmedName, email: trimmedEmail }
      saveProfile(nextProfile)
      setProfile(nextProfile)
      setName(trimmedName)
      setEmail(trimmedEmail)
      setScreen('dashboard')
    }
  }

  function handleExit() {
    setIsQuickCreateOpen(false)
    setScreen('landing')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  function handleEnterApp() {
    const saved = getSavedProfile()
    if (saved && saved.name && saved.email) {
      setProfile(saved)
      setName(saved.name)
      setEmail(saved.email)
      setScreen('dashboard')
    } else {
      setScreen('login')
    }
  }

  // Handlers de Contas Bancárias
  function handleSaveBankAccount(account: Omit<BankAccount, 'id' | 'createdAt'> & { id?: string }) {
    saveBankAccountItem(account)
    setBankAccounts(getBankAccounts())
  }

  function handleDeleteBankAccount(id: string) {
    deleteBankAccountItem(id)
    setBankAccounts(getBankAccounts())
  }

  function handleUpdateAccountBalance(id: string, newBalance: number) {
    updateBankAccountBalance(id, newBalance)
    setBankAccounts(getBankAccounts())
  }

  // Handlers de Cartões de Crédito
  function handleSaveCreditCard(card: Omit<CreditCard, 'id' | 'createdAt'> & { id?: string }) {
    saveCreditCardItem(card)
    setCreditCards(getCreditCards())
  }

  function handleDeleteCreditCard(id: string) {
    deleteCreditCardItem(id)
    setCreditCards(getCreditCards())
  }

  function handleUpdateCardInvoice(id: string, newInvoiceAmount: number) {
    updateCreditCardInvoice(id, newInvoiceAmount)
    setCreditCards(getCreditCards())
  }

  function handleSaveCost(cost: Omit<FixedCost, 'id' | 'createdAt'> & { id?: string }) {
    saveFixedCostItem(cost)
    setFixedCosts(getFixedCosts())
  }

  function handleDeleteCost(id: string) {
    deleteFixedCostItem(id)
    setFixedCosts(getFixedCosts())
  }

  function handleSavePatrimonio(newData: PatrimonioData) {
    savePatrimonioData(newData)
    setPatrimonio(newData)
  }

  function handleSaveProfile(updatedProfile: Profile) {
    saveProfile(updatedProfile)
    setProfile(updatedProfile)
    setName(updatedProfile.name)
    setEmail(updatedProfile.email)
  }

  function handleDataRestored() {
    const freshProfile = getSavedProfile()
    setProfile(freshProfile)
    if (freshProfile) {
      setName(freshProfile.name)
      setEmail(freshProfile.email)
    }
    setBankAccounts(getBankAccounts())
    setCreditCards(getCreditCards())
    setFixedCosts(getFixedCosts())
    setPatrimonio(getPatrimonioData())
  }

  function handleAccountReset() {
    setBankAccounts(getBankAccounts())
    setCreditCards(getCreditCards())
    setFixedCosts(getFixedCosts())
    setPatrimonio(getPatrimonioData())
  }

  function handleAccountDeleted() {
    setProfile(null)
    setName('')
    setEmail('')
    setBankAccounts([])
    setCreditCards([])
    setFixedCosts([])
    setPatrimonio(getPatrimonioData())
    setScreen('landing')
  }


  // Telas não autenticadas
  if (screen === 'login') {
    return (
      <Login
        initialName={name}
        initialEmail={email}
        onLogin={handleLogin}
        onBack={() => setScreen('landing')}
      />
    )
  }

  if (screen === 'landing') {
    const savedProfile = getSavedProfile()
    return (
      <Landing
        savedProfile={savedProfile}
        onEnterApp={handleEnterApp}
        onNewProfile={() => {
          setName('')
          setEmail('')
          setScreen('login')
        }}
      />
    )
  }

  // Telas autenticadas com Menu Lateral (Sidebar)
  return (
    <div className="min-h-screen bg-[#f7f8f5]">
      <Sidebar
        currentScreen={screen}
        onNavigate={setScreen}
        userName={profile?.name}
        userEmail={profile?.email}
        onExit={handleExit}
        netBalance={carteiraTotals.netRealBalance}
      />

      <div className="min-h-screen flex flex-col flex-1 lg:pl-72 transition-all">
        {(screen === 'carteira' || screen === 'overview') && (
          <OverviewPage
            bankAccounts={bankAccounts}
            creditCards={creditCards}
            onSaveBankAccount={handleSaveBankAccount}
            onDeleteBankAccount={handleDeleteBankAccount}
            onUpdateAccountBalance={handleUpdateAccountBalance}
            onSaveCreditCard={handleSaveCreditCard}
            onDeleteCreditCard={handleDeleteCreditCard}
            onUpdateCardInvoice={handleUpdateCardInvoice}
            onNavigate={setScreen}
          />
        )}

        {screen === 'dashboard' && profile && (
          <DashboardPage
            name={profile.name}
            fixedCosts={fixedCosts}
            patrimonio={patrimonio}
            bankAccounts={bankAccounts}
            creditCards={creditCards}
            onNavigate={setScreen}
            onOpenNewFixedCost={() => setIsQuickCreateOpen(true)}
          />
        )}

        {screen === 'fixed-costs' && (
          <FixedCostsPage
            fixedCosts={fixedCosts}
            onSaveCost={handleSaveCost}
            onDeleteCost={handleDeleteCost}
          />
        )}

        {screen === 'quanto-custa' && (
          <QuantoCustaPage
            profile={profile}
            fixedCosts={fixedCosts}
            onSaveProfile={handleSaveProfile}
          />
        )}

        {screen === 'patrimonio' && (
          <PatrimonioPage
            patrimonio={patrimonio}
            onSavePatrimonio={handleSavePatrimonio}
          />
        )}


        {screen === 'profile' && profile && (
          <ProfilePage
            profile={profile}
            onSaveProfile={handleSaveProfile}
            onDataRestored={handleDataRestored}
            onAccountReset={handleAccountReset}
            onAccountDeleted={handleAccountDeleted}
          />
        )}

        {/* Modal Rápido de Criação acionado pelo Dashboard */}
        <FixedCostModal
          isOpen={isQuickCreateOpen}
          onClose={() => setIsQuickCreateOpen(false)}
          onSave={handleSaveCost}
        />
      </div>
    </div>
  )
}



function Landing({
  savedProfile,
  onEnterApp,
  onNewProfile,
}: {
  savedProfile: Profile | null
  onEnterApp: () => void
  onNewProfile: () => void
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f5]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <Logo />
        <div className="flex items-center gap-3">
          {savedProfile && (
            <button
              onClick={onNewProfile}
              className="text-xs font-semibold text-[#64736a] hover:text-[#173d2a] px-3 py-2 cursor-pointer transition hidden sm:inline-block"
            >
              Entrar com outra conta
            </button>
          )}
          <button
            onClick={onEnterApp}
            className="rounded-full bg-[#173d2a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#245439] cursor-pointer"
          >
            {savedProfile ? 'Entrar' : 'Entrar'}
          </button>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-24 lg:pt-24">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d8e5dc] bg-white/70 px-3.5 py-2 text-xs font-semibold text-[#5a8067]">
            <span className="size-2 rounded-full bg-[#79ad89]" /> Um jeito mais leve de olhar para o dinheiro
          </div>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-0.065em] text-[#173d2a] sm:text-6xl">
            Clareza para as suas <span className="text-[#5d9873]">decisões financeiras.</span>
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-[#64736a]">
            Uma visão simples da sua situação atual, dos seus custos fixos e do seu patrimônio — tudo no seu ritmo.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={onEnterApp}
              className="rounded-2xl bg-[#173d2a] px-6 py-4 font-semibold text-white shadow-lg shadow-[#173d2a]/10 transition hover:-translate-y-0.5 hover:bg-[#245439] cursor-pointer"
            >
              {savedProfile ? `Continuar como ${savedProfile.name}` : 'Criar meu espaço'}{' '}
              <span className="ml-2" aria-hidden="true">
                →
              </span>
            </button>
            {savedProfile && (
              <button
                onClick={onNewProfile}
                className="text-sm font-medium text-[#64736a] hover:text-[#173d2a] underline underline-offset-4 cursor-pointer"
              >
                Não é você? Trocar de conta
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 rounded-[3rem] bg-[#e3efe6] blur-3xl" />
          <div className="relative rounded-[2rem] border border-white bg-[#edf5ef] p-4 shadow-2xl shadow-[#31513d]/10">
            <div className="rounded-[1.5rem] bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#8a998f]">Visão geral</p>
                  <p className="mt-1 text-sm font-semibold text-[#173d2a]">Agosto 2026</p>
                </div>
                <div className="grid size-9 place-items-center rounded-full bg-[#e9f4ec] text-[#5d9873]">
                  ⌁
                </div>
              </div>
              <div className="mt-8 rounded-2xl bg-[#173d2a] p-5 text-white">
                <p className="text-xs text-[#b7d7c5]">Dinheiro disponível</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">R$ 8.420,00</p>
                <div className="mt-5 h-1.5 rounded-full bg-white/15">
                  <div className="h-full w-[68%] rounded-full bg-[#b7d7c5]" />
                </div>
                <p className="mt-2 text-xs text-[#b7d7c5]">68% do seu mês protegido</p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#f7f8f5] p-4">
                  <p className="text-xs text-[#8a998f]">Contas</p>
                  <p className="mt-2 font-semibold text-[#30483a]">R$ 12.500,00</p>
                </div>
                <div className="rounded-2xl bg-[#f7f8f5] p-4">
                  <p className="text-xs text-[#8a998f]">Custos Fixos</p>
                  <p className="mt-2 font-semibold text-[#30483a]">R$ 4.080,00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-4 border-t border-[#e3eae4] px-6 py-8 text-sm text-[#64736a] sm:grid-cols-3 lg:px-10">
        <p>
          <span className="mb-2 block text-xl text-[#5d9873]">01</span>Veja o que realmente está disponível.
        </p>
        <p>
          <span className="mb-2 block text-xl text-[#5d9873]">02</span>Organize e controle seus custos fixos.
        </p>
        <p>
          <span className="mb-2 block text-xl text-[#5d9873]">03</span>Acompanhe o seu patrimônio com clareza.
        </p>
      </div>
    </main>
  )
}

type LoginProps = {
  initialName: string
  initialEmail: string
  onLogin: (name: string, email: string) => void
  onBack: () => void
}

function Login({ initialName, initialEmail, onLogin, onBack }: LoginProps) {
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({})

  function validate(currentName: string, currentEmail: string) {
    const errs: { name?: string; email?: string } = {}
    const trimmedName = currentName.trim()
    const trimmedEmail = currentEmail.trim()

    if (!trimmedName) {
      errs.name = 'Por favor, digite seu nome.'
    }

    if (!trimmedEmail) {
      errs.email = 'Por favor, digite seu e-mail.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Por favor, insira um e-mail válido (exemplo: voce@email.com).'
    }

    return errs
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched({ name: true, email: true })

    const validationErrors = validate(name, email)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    onLogin(name.trim(), email.trim())
  }

  const isFormIncomplete = !name.trim() || !email.trim()

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5 py-10">
      <div className="w-full max-w-[430px]">
        <button
          onClick={onBack}
          className="mb-16 flex items-center gap-3 text-left cursor-pointer hover:opacity-80 transition"
          aria-label="Voltar"
        >
          <Logo />
        </button>
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#71917d]">
            Seu espaço financeiro
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[#173d2a]">
            Vamos começar pelo seu nome.
          </h1>
          <p className="mt-4 leading-7 text-[#64736a]">
            Sem senha e sem complicação. Seus dados ficam salvos localmente neste dispositivo.
          </p>
        </div>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="login-name" className="block text-sm font-medium text-[#30483a]">
              Nome
            </label>
            <input
              id="login-name"
              value={name}
              onChange={(event) => {
                const val = event.target.value
                setName(val)
                if (touched.name || errors.name) {
                  const errs = validate(val, email)
                  setErrors((prev) => ({ ...prev, name: errs.name }))
                }
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, name: true }))
                const errs = validate(name, email)
                setErrors((prev) => ({ ...prev, name: errs.name }))
              }}
              className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3.5 outline-none transition placeholder:text-[#a1afa6] ${
                errors.name
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-[#d8e1da] focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/40'
              }`}
              placeholder="Como você quer ser chamado?"
            />
            {errors.name && (
              <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                <span>⚠</span> {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-[#30483a]">
              E-mail
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => {
                const val = event.target.value
                setEmail(val)
                if (touched.email || errors.email) {
                  const errs = validate(name, val)
                  setErrors((prev) => ({ ...prev, email: errs.email }))
                }
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, email: true }))
                const errs = validate(name, email)
                setErrors((prev) => ({ ...prev, email: errs.email }))
              }}
              className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3.5 outline-none transition placeholder:text-[#a1afa6] ${
                errors.email
                  ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                  : 'border-[#d8e1da] focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/40'
              }`}
              placeholder="voce@email.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                <span>⚠</span> {errors.email}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isFormIncomplete}
            className={`mt-3 w-full rounded-2xl px-5 py-4 font-semibold text-white transition focus:outline-none focus:ring-4 focus:ring-[#b7d7c5] ${
              isFormIncomplete
                ? 'bg-[#173d2a]/50 cursor-not-allowed'
                : 'bg-[#173d2a] hover:bg-[#245439] cursor-pointer shadow-lg shadow-[#173d2a]/10'
            }`}
          >
            Entrar no meu espaço <span aria-hidden="true">→</span>
          </button>
        </form>
        <p className="mt-8 text-center text-xs leading-5 text-[#8a998f]">
          Ao entrar, você inicia um espaço financeiro local e privado.
        </p>
      </div>
    </main>
  )
}

export default App
