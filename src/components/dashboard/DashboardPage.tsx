import type { FixedCost, Screen } from '../../types/finance'

interface DashboardPageProps {
  name: string
  fixedCosts: FixedCost[]
  onNavigate: (screen: Screen) => void
  onOpenNewFixedCost: () => void
}

export function DashboardPage({
  name,
  fixedCosts,
  onNavigate,
  onOpenNewFixedCost,
}: DashboardPageProps) {
  // Cálculo rápido dos custos fixos
  const totalBRL = fixedCosts
    .filter((c) => c.currency === 'BRL')
    .reduce((acc, c) => acc + (c.recurrence === 'monthly' ? c.amount : c.amount / 12), 0)

  const totalUSD = fixedCosts
    .filter((c) => c.currency === 'USD')
    .reduce((acc, c) => acc + (c.recurrence === 'monthly' ? c.amount : c.amount / 12), 0)

  const formattedBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBRL)
  const formattedUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalUSD)

  return (
    <main className="min-h-screen bg-[#f7f8f5]">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
        <p className="text-sm font-medium text-[#71917d]">Bom te ver por aqui, {name}.</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-[#173d2a]">
          Sua visão financeira
        </h1>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <article className="rounded-3xl bg-[#173d2a] p-6 text-white md:col-span-2 shadow-sm">
            <p className="text-sm text-[#b7d7c5]">Dinheiro disponível líquido</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.05em]">R$ 0,00</p>
            <p className="mt-3 text-sm text-[#b7d7c5]">
              Saldo em contas menos cartões e custos fixos previstos.
            </p>
          </article>

          <article className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm">
            <p className="text-sm text-[#8a998f]">Situação atual</p>
            <p className="mt-4 text-2xl font-semibold text-[#30483a]">Comece pelo básico</p>
            <p className="mt-3 text-sm leading-6 text-[#718078]">
              {fixedCosts.length > 0
                ? `Você já possui ${fixedCosts.length} custo(s) fixo(s) registrado(s).`
                : 'Cadastre suas contas e custos fixos para visualizar seu primeiro snapshot.'}
            </p>
          </article>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {/* Card Contas */}
          <article className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#30483a]">Contas</h2>
              <span className="text-2xl font-light text-[#9aae9f]">+</span>
            </div>
            <p className="mt-10 text-sm text-[#8a998f]">Nenhum registro ainda.</p>
            <button className="mt-5 text-sm font-semibold text-[#5d9873] hover:text-[#173d2a] cursor-pointer">
              Adicionar conta →
            </button>
          </article>

          {/* Card Cartões */}
          <article className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#30483a]">Cartões de crédito</h2>
              <span className="text-2xl font-light text-[#9aae9f]">+</span>
            </div>
            <p className="mt-10 text-sm text-[#8a998f]">Nenhum registro ainda.</p>
            <button className="mt-5 text-sm font-semibold text-[#5d9873] hover:text-[#173d2a] cursor-pointer">
              Adicionar cartão →
            </button>
          </article>

          {/* Card Custos Fixos Integrado */}
          <article className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm transition hover:border-[#b7d7c5]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#30483a]">Custos fixos</h2>
              <button
                onClick={onOpenNewFixedCost}
                className="grid size-8 place-items-center rounded-full bg-[#edf5ef] text-lg font-medium text-[#173d2a] transition hover:bg-[#d8e8dc] cursor-pointer"
                title="Cadastrar novo custo"
              >
                +
              </button>
            </div>

            {fixedCosts.length === 0 ? (
              <>
                <p className="mt-10 text-sm text-[#8a998f]">Nenhum registro ainda.</p>
                <button
                  onClick={() => onNavigate('fixed-costs')}
                  className="mt-5 text-sm font-semibold text-[#5d9873] hover:text-[#173d2a] cursor-pointer"
                >
                  Adicionar custo →
                </button>
              </>
            ) : (
              <div className="mt-4">
                <div className="space-y-1">
                  {totalBRL > 0 && (
                    <p className="text-2xl font-bold tracking-tight text-[#173d2a]">
                      {formattedBRL}
                      <span className="text-xs font-normal text-[#8a998f]"> /mês</span>
                    </p>
                  )}
                  {totalUSD > 0 && (
                    <p className="text-sm font-semibold text-[#5d9873]">
                      + {formattedUSD}
                      <span className="text-xs font-normal text-[#8a998f]"> /mês</span>
                    </p>
                  )}
                </div>
                <p className="mt-2 text-xs text-[#718078]">
                  {fixedCosts.length} despesa(s) recorrente(s) cadastrada(s).
                </p>
                <button
                  onClick={() => onNavigate('fixed-costs')}
                  className="mt-4 inline-flex items-center text-sm font-semibold text-[#5d9873] hover:text-[#173d2a] cursor-pointer"
                >
                  Ver todos os custos →
                </button>
              </div>
            )}
          </article>
        </div>
      </div>
    </main>
  )
}
