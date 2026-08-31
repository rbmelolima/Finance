import type { FormEvent } from 'react'
import { useState } from 'react'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { FixedCostsPage } from './components/fixed-costs/FixedCostsPage'
import { FixedCostModal } from './components/fixed-costs/FixedCostModal'
import { Logo } from './components/Logo'
import { Navbar } from './components/Navbar'
import { PatrimonioPage } from './components/patrimonio/PatrimonioPage'
import {
  clearProfile,
  deleteFixedCostItem,
  getFixedCosts,
  getPatrimonioData,
  getSavedProfile,
  saveFixedCostItem,
  savePatrimonioData,
  saveProfile,
} from './services/storage'
import type { FixedCost, PatrimonioData, Profile, Screen } from './types/finance'

function App() {
  const [profile, setProfile] = useState<Profile | null>(getSavedProfile)
  const [screen, setScreen] = useState<Screen>(() => (getSavedProfile() ? 'dashboard' : 'landing'))
  const [name, setName] = useState(() => getSavedProfile()?.name ?? '')
  const [email, setEmail] = useState(() => getSavedProfile()?.email ?? '')
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(getFixedCosts)
  const [patrimonio, setPatrimonio] = useState<PatrimonioData>(getPatrimonioData)
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false)

  function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim() && email.trim()) {
      const nextProfile = { name: name.trim(), email: email.trim() }
      saveProfile(nextProfile)
      setProfile(nextProfile)
      setScreen('dashboard')
    }
  }

  function handleExit() {
    clearProfile()
    setProfile(null)
    setScreen('landing')
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

  // Telas não autenticadas
  if (screen === 'login') {
    return (
      <Login
        name={name}
        email={email}
        setName={setName}
        setEmail={setEmail}
        onSubmit={enter}
        onBack={() => setScreen('landing')}
      />
    )
  }

  if (screen === 'landing') {
    return (
      <Landing
        profile={profile}
        onEnterApp={() => setScreen(profile ? 'dashboard' : 'login')}
      />
    )
  }

  // Telas autenticadas
  return (
    <div className="min-h-screen bg-[#f7f8f5]">
      <Navbar
        currentScreen={screen}
        onNavigate={setScreen}
        userName={profile?.name}
        onExit={handleExit}
      />

      {screen === 'dashboard' && profile && (
        <DashboardPage
          name={profile.name}
          fixedCosts={fixedCosts}
          patrimonio={patrimonio}
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

      {screen === 'patrimonio' && (
        <PatrimonioPage
          patrimonio={patrimonio}
          onSavePatrimonio={handleSavePatrimonio}
        />
      )}

      {/* Modal Rápido de Criação acionado pelo Dashboard */}
      <FixedCostModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onSave={handleSaveCost}
      />
    </div>
  )
}

function Landing({
  profile,
  onEnterApp,
}: {
  profile: Profile | null
  onEnterApp: () => void
}) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f5]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <Logo />
        <button
          onClick={onEnterApp}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-[#173d2a] transition hover:bg-[#e9f0eb] cursor-pointer"
        >
          {profile ? 'Entrar no Dashboard' : 'Entrar'}
        </button>
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
          <button
            onClick={onEnterApp}
            className="mt-9 rounded-2xl bg-[#173d2a] px-6 py-4 font-semibold text-white shadow-lg shadow-[#173d2a]/10 transition hover:-translate-y-0.5 hover:bg-[#245439] cursor-pointer"
          >
            {profile ? 'Ir para meu dashboard' : 'Criar meu espaço'}{' '}
            <span className="ml-2" aria-hidden="true">
              →
            </span>
          </button>
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
                  <p className="mt-2 font-semibold text-[#30483a]">R$ 12.500</p>
                </div>
                <div className="rounded-2xl bg-[#f7f8f5] p-4">
                  <p className="text-xs text-[#8a998f]">Custos Fixos</p>
                  <p className="mt-2 font-semibold text-[#30483a]">R$ 4.080</p>
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
  name: string
  email: string
  setName: (value: string) => void
  setEmail: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onBack: () => void
}

function Login({ name, email, setName, setEmail, onSubmit, onBack }: LoginProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5 py-10">
      <div className="w-full max-w-[430px]">
        <button onClick={onBack} className="mb-16 flex items-center gap-3 text-left cursor-pointer" aria-label="Voltar">
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
        <form onSubmit={onSubmit} className="space-y-5">
          <label className="block text-sm font-medium text-[#30483a]">
            Nome
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#d8e1da] bg-white px-4 py-3.5 outline-none transition placeholder:text-[#a1afa6] focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/40"
              placeholder="Como você quer ser chamado?"
            />
          </label>
          <label className="block text-sm font-medium text-[#30483a]">
            E-mail
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[#d8e1da] bg-white px-4 py-3.5 outline-none transition placeholder:text-[#a1afa6] focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/40"
              placeholder="voce@email.com"
            />
          </label>
          <button
            type="submit"
            className="mt-3 w-full rounded-2xl bg-[#173d2a] px-5 py-4 font-semibold text-white transition hover:bg-[#245439] focus:outline-none focus:ring-4 focus:ring-[#b7d7c5] cursor-pointer"
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
