import type { FormEvent } from 'react'
import { useState } from 'react'

type Screen = 'landing' | 'login' | 'dashboard'
type Profile = { name: string; email: string }

const PROFILE_KEY = 'sfp.profile'

function getSavedProfile (): Profile | null {
  const savedProfile = localStorage.getItem(PROFILE_KEY)
  if (!savedProfile) return null

  try {
    const profile = JSON.parse(savedProfile) as Profile
    return profile.name && profile.email ? profile : null
  } catch {
    return null
  }
}

function Mark () {
  return <span className="grid size-9 place-items-center rounded-xl bg-[#b7d7c5] text-[#173d2a]"><svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M5 18.5 10 13l3 3 6-8" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 18.5h14" strokeLinecap="round" /></svg>
  </span>
}

function Logo () { return <div className="flex items-center gap-3"><Mark /><span className="text-lg font-semibold tracking-[-0.03em] text-[#173d2a]">SFP</span></div> }

function App () {
  const [ profile, setProfile ] = useState<Profile | null>(getSavedProfile)
  const [ screen, setScreen ] = useState<Screen>(() => getSavedProfile() ? 'dashboard' : 'landing')
  const [ name, setName ] = useState(() => getSavedProfile()?.name ?? '')
  const [ email, setEmail ] = useState(() => getSavedProfile()?.email ?? '')

  function enter (event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim() && email.trim()) {
      const nextProfile = { name: name.trim(), email: email.trim() }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile))
      setProfile(nextProfile)
      setScreen('dashboard')
    }
  }

  if (screen === 'login') return <Login name={ name } email={ email } setName={ setName } setEmail={ setEmail } onSubmit={ enter } onBack={ () => setScreen('landing') } />
  if (screen === 'dashboard' && profile) return <Dashboard name={ profile.name } onExit={ () => setScreen('landing') } />

  return <main className="min-h-screen overflow-hidden bg-[#f7f8f5]"><nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10"><Logo /><button onClick={ () => setScreen(profile ? 'dashboard' : 'login') } className="rounded-full px-5 py-2.5 text-sm font-semibold text-[#173d2a] transition hover:bg-[#e9f0eb]">Entrar</button></nav><section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-24 lg:pt-24"><div><div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d8e5dc] bg-white/70 px-3.5 py-2 text-xs font-semibold text-[#5a8067]"><span className="size-2 rounded-full bg-[#79ad89]" /> Um jeito mais leve de olhar para o dinheiro</div><h1 className="max-w-xl text-5xl font-semibold leading-[1.05] tracking-[-0.065em] text-[#173d2a] sm:text-6xl">Clareza para as suas <span className="text-[#5d9873]">decisões financeiras.</span></h1><p className="mt-7 max-w-lg text-lg leading-8 text-[#64736a]">Uma visão simples da sua situação atual, dos seus compromissos e do seu patrimônio — tudo no seu ritmo.</p><button onClick={ () => setScreen(profile ? 'dashboard' : 'login') } className="mt-9 rounded-2xl bg-[#173d2a] px-6 py-4 font-semibold text-white shadow-lg shadow-[#173d2a]/10 transition hover:-translate-y-0.5 hover:bg-[#245439]">{profile ? 'Ir para meu dashboard' : 'Criar meu espaço'} <span className="ml-2" aria-hidden="true">→</span></button></div><div className="relative"><div className="absolute -inset-8 rounded-[3rem] bg-[#e3efe6] blur-3xl" /><div className="relative rounded-[2rem] border border-white bg-[#edf5ef] p-4 shadow-2xl shadow-[#31513d]/10"><div className="rounded-[1.5rem] bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-[#8a998f]">Visão geral</p><p className="mt-1 text-sm font-semibold text-[#173d2a]">Agosto 2026</p></div><div className="grid size-9 place-items-center rounded-full bg-[#e9f4ec] text-[#5d9873]">⌁</div></div><div className="mt-8 rounded-2xl bg-[#173d2a] p-5 text-white"><p className="text-xs text-[#b7d7c5]">Dinheiro disponível</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">R$ 8.420,00</p><div className="mt-5 h-1.5 rounded-full bg-white/15"><div className="h-full w-[68%] rounded-full bg-[#b7d7c5]" /></div><p className="mt-2 text-xs text-[#b7d7c5]">68% do seu mês protegido</p></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#f7f8f5] p-4"><p className="text-xs text-[#8a998f]">Contas</p><p className="mt-2 font-semibold text-[#30483a]">R$ 12.500</p></div><div className="rounded-2xl bg-[#f7f8f5] p-4"><p className="text-xs text-[#8a998f]">Compromissos</p><p className="mt-2 font-semibold text-[#30483a]">R$ 4.080</p></div></div></div></div></div></section><div className="mx-auto grid max-w-6xl gap-4 border-t border-[#e3eae4] px-6 py-8 text-sm text-[#64736a] sm:grid-cols-3 lg:px-10"><p><span className="mb-2 block text-xl text-[#5d9873]">01</span>Veja o que realmente está disponível.</p><p><span className="mb-2 block text-xl text-[#5d9873]">02</span>Organize seus custos fixos.</p><p><span className="mb-2 block text-xl text-[#5d9873]">03</span>Acompanhe o seu patrimônio.</p></div></main>
}

type LoginProps = { name: string; email: string; setName: (value: string) => void; setEmail: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onBack: () => void }
function Login ({ name, email, setName, setEmail, onSubmit, onBack }: LoginProps) { return <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5 py-10"><div className="w-full max-w-[430px]"><button onClick={ onBack } className="mb-16 flex items-center gap-3 text-left" aria-label="Voltar para a página inicial"><Logo /></button><div className="mb-10"><p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#71917d]">Seu espaço financeiro</p><h1 className="text-4xl font-semibold tracking-[-0.05em] text-[#173d2a]">Vamos começar pelo seu nome.</h1><p className="mt-4 leading-7 text-[#64736a]">Sem senha e sem complicação. Esses dados ficam apenas neste dispositivo.</p></div><form onSubmit={ onSubmit } className="space-y-5"><label className="block text-sm font-medium text-[#30483a]">Nome<input required value={ name } onChange={ (event) => setName(event.target.value) } className="mt-2 w-full rounded-2xl border border-[#d8e1da] bg-white px-4 py-3.5 outline-none transition placeholder:text-[#a1afa6] focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/40" placeholder="Como você quer ser chamado?" /></label><label className="block text-sm font-medium text-[#30483a]">E-mail<input required type="email" value={ email } onChange={ (event) => setEmail(event.target.value) } className="mt-2 w-full rounded-2xl border border-[#d8e1da] bg-white px-4 py-3.5 outline-none transition placeholder:text-[#a1afa6] focus:border-[#5d9873] focus:ring-4 focus:ring-[#b7d7c5]/40" placeholder="voce@email.com" /></label><button type="submit" className="mt-3 w-full rounded-2xl bg-[#173d2a] px-5 py-4 font-semibold text-white transition hover:bg-[#245439] focus:outline-none focus:ring-4 focus:ring-[#b7d7c5]">Entrar no meu espaço <span aria-hidden="true">→</span></button></form><p className="mt-8 text-center text-xs leading-5 text-[#8a998f]">Ao entrar, você inicia um espaço financeiro local e privado.</p></div></main> }

function Dashboard ({ name, onExit }: { name: string; onExit: () => void }) { return <main className="min-h-screen bg-[#f7f8f5]"><nav className="flex items-center justify-between border-b border-[#e3eae4] bg-white/70 px-6 py-5 lg:px-10"><Logo /><button onClick={ onExit } className="text-sm font-medium text-[#718078] hover:text-[#173d2a]">Sair</button></nav><div className="mx-auto max-w-6xl px-6 py-10 lg:px-10 lg:py-14"><p className="text-sm font-medium text-[#71917d]">Bom te ver por aqui, { name }.</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-[#173d2a]">Sua visão financeira</h1><div className="mt-10 grid gap-5 md:grid-cols-3"><article className="rounded-3xl bg-[#173d2a] p-6 text-white md:col-span-2"><p className="text-sm text-[#b7d7c5]">Dinheiro disponível líquido</p><p className="mt-4 text-4xl font-semibold tracking-[-0.05em]">R$ 0,00</p><p className="mt-3 text-sm text-[#b7d7c5]">Saldo em contas menos cartões e custos fixos.</p></article><article className="rounded-3xl border border-[#dfe8e1] bg-white p-6"><p className="text-sm text-[#8a998f]">Situação atual</p><p className="mt-4 text-2xl font-semibold text-[#30483a]">Comece pelo básico</p><p className="mt-3 text-sm leading-6 text-[#718078]">Cadastre suas contas para visualizar seu primeiro snapshot.</p></article></div><div className="mt-5 grid gap-5 md:grid-cols-3"><EmptyCard title="Contas" action="Adicionar conta" /><EmptyCard title="Cartões de crédito" action="Adicionar cartão" /><EmptyCard title="Custos fixos" action="Adicionar custo" /></div></div></main> }

function EmptyCard ({ title, action }: { title: string; action: string }) { return <article className="rounded-3xl border border-[#dfe8e1] bg-white p-6"><div className="flex items-center justify-between"><h2 className="font-semibold text-[#30483a]">{ title }</h2><span className="text-2xl font-light text-[#9aae9f]">+</span></div><p className="mt-12 text-sm text-[#8a998f]">Nenhum registro ainda.</p><button className="mt-5 text-sm font-semibold text-[#5d9873] hover:text-[#173d2a]">{ action } →</button></article> }

export default App
