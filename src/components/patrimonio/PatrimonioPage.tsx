import { useMemo, useState } from 'react'
import { calculatePatrimonioTotals, DEFAULT_PATRIMONIO } from '../../services/storage'
import type { PatrimonioData } from '../../types/finance'
import { usePrivacy } from '../../context/PrivacyContext'
import { PrivacyToggle } from '../common/PrivacyToggle'
import { formatMoneyInput, parseMoney } from '../../utils/currency'

interface PatrimonioPageProps {
  patrimonio: PatrimonioData
  onSavePatrimonio: (data: PatrimonioData) => void
}

function PatrimonioFieldItem({
  field,
  val,
  onChange,
  isPassivo = false,
}: {
  field: string
  val: number
  onChange: (newVal: number) => void
  isPassivo?: boolean
}) {
  const { isPrivacyMode } = usePrivacy()
  const [isFocused, setIsFocused] = useState(false)
  const [typingVal, setTypingVal] = useState('')

  const displayVal = isFocused
    ? typingVal
    : isPrivacyMode && val > 0
    ? '••••••'
    : val === 0
    ? ''
    : formatMoneyInput(val)

  function handleFocus() {
    setIsFocused(true)
    setTypingVal(val === 0 ? '' : formatMoneyInput(val))
  }

  function handleBlur() {
    setIsFocused(false)
    if (typingVal.trim()) {
      const parsed = parseMoney(typingVal)
      onChange(parsed)
    } else {
      onChange(0)
    }
  }

  return (
    <div
      className={`flex items-center justify-between gap-2.5 sm:gap-3 rounded-2xl border border-[#edf2ee] bg-[#fbfcfb] p-3 transition ${
        isPassivo ? 'hover:border-rose-300' : 'hover:border-[#b7d7c5]'
      }`}
    >
      <label className="text-xs font-medium text-[#173d2a] flex-1 truncate pr-1">{field}</label>
      <div className="relative w-32 sm:w-36 shrink-0">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-[#8a998f]">
          R$
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={displayVal}
          onFocus={handleFocus}
          onChange={(e) => {
            const typed = e.target.value
            setTypingVal(typed)
            const parsed = parseMoney(typed)
            onChange(parsed)
          }}
          onBlur={handleBlur}
          placeholder="0,00"
          className={`w-full rounded-xl border border-[#d8e1da] bg-white py-1.5 pl-7 sm:pl-8 pr-2.5 text-right text-xs font-bold text-[#173d2a] outline-none transition ${
            isPassivo
              ? 'focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
              : 'focus:border-[#5d9873] focus:ring-2 focus:ring-[#b7d7c5]/30'
          }`}
        />
      </div>
    </div>
  )
}

export function PatrimonioPage({ patrimonio, onSavePatrimonio }: PatrimonioPageProps) {
  const { formatCurrency } = usePrivacy()
  const [formData, setFormData] = useState<PatrimonioData>(patrimonio)
  const [savedFeedback, setSavedFeedback] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)

  const totals = useMemo(() => {
    return calculatePatrimonioTotals(formData)
  }, [formData])

  function handleValueChange(
    section: 'ATIVOS' | 'PASSIVOS',
    subgroup: string,
    field: string,
    numValue: number,
    nestedGroup?: string
  ) {
    setFormData((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as PatrimonioData

      if (section === 'ATIVOS') {
        if (nestedGroup) {
          // @ts-expect-error dynamic access
          next.ATIVOS[subgroup][nestedGroup][field] = numValue
        } else {
          // @ts-expect-error dynamic access
          next.ATIVOS[subgroup][field] = numValue
        }
      } else {
        // @ts-expect-error dynamic access
        next.PASSIVOS[subgroup][field] = numValue
      }

      // Atualiza o patrimônio líquido dentro do objeto
      const calculated = calculatePatrimonioTotals(next)
      next.PASSIVOS['Patrimônio Líquido']['Seu patrimônio hoje'] = calculated.patrimonioLiquido

      return next
    })
  }

  function handleSave() {
    onSavePatrimonio(formData)
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 2500)
  }

  function handleReset() {
    setFormData(DEFAULT_PATRIMONIO)
    onSavePatrimonio(DEFAULT_PATRIMONIO)
    setShowResetModal(false)
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 2500)
  }

  const ativosPercent =
    totals.totalAtivos + totals.totalPassivos > 0
      ? (totals.totalAtivos / (totals.totalAtivos + totals.totalPassivos)) * 100
      : 50

  const passivosPercent =
    totals.totalAtivos + totals.totalPassivos > 0
      ? (totals.totalPassivos / (totals.totalAtivos + totals.totalPassivos)) * 100
      : 50

  return (
    <main className="min-h-screen bg-[#f7f8f5] pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-10 lg:px-10">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e5dc] bg-white/70 px-3 py-1 text-xs font-semibold text-[#5a8067]">
              Balanço Patrimonial
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#173d2a] sm:text-4xl">
              Patrimônio
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#64736a]">
              Acompanhe a relação entre tudo o que você possui (Ativos) e seus compromissos (Passivos).
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap sm:flex-nowrap">
            <PrivacyToggle variant="pill" />
            <button
              onClick={() => setShowResetModal(true)}
              className="flex-1 sm:flex-none rounded-2xl border border-[#d8e1da] px-4 py-3 text-xs font-semibold text-[#64736a] transition hover:bg-[#f3f6f4] hover:text-[#173d2a] cursor-pointer"
            >
              Zerar Balanço
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-2xl bg-[#173d2a] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#173d2a]/15 transition hover:-translate-y-0.5 hover:bg-[#245439] cursor-pointer"
            >
              {savedFeedback ? '✓ Salvo!' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* Feedback visual de salvamento */}
        {savedFeedback && (
          <div className="mt-4 rounded-2xl border border-[#b7d7c5] bg-[#edf5ef] p-4 text-center text-sm font-semibold text-[#173d2a] shadow-sm transition">
            ✓ Dados de patrimônio atualizados e salvos com sucesso!
          </div>
        )}

        {/* Métricas Principais */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card Patrimônio Líquido */}
          <div
            className={`rounded-3xl p-6 text-white shadow-sm sm:col-span-2 lg:col-span-1 ${
              totals.patrimonioLiquido >= 0 ? 'bg-[#173d2a]' : 'bg-[#7f1d1d]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#b7d7c5]">
                Patrimônio Líquido
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-[#b7d7c5]">
                Hoje
              </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight">
              {formatCurrency(totals.patrimonioLiquido)}
            </p>
            <p className="mt-3 border-t border-white/10 pt-3 text-xs text-[#b7d7c5]">
              Ativos ({formatCurrency(totals.totalAtivos)}) − Passivos ({formatCurrency(totals.totalPassivos)})
            </p>
          </div>

          {/* Card Total de Ativos */}
          <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5d9873]">
                Total de Ativos (+)
              </span>
              <span className="rounded-full bg-[#edf5ef] px-2.5 py-0.5 text-xs font-bold text-[#2c6e43]">
                Posse & Direitos
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-[#173d2a]">
              {formatCurrency(totals.totalAtivos)}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-[#edf2ee] pt-3 text-xs text-[#718078]">
              <span>Circulante: {formatCurrency(totals.subtotals.ativoCirculante)}</span>
              <span>Bens: {formatCurrency(totals.subtotals.passivosComValor)}</span>
            </div>
          </div>

          {/* Card Total de Passivos */}
          <div className="rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                Total de Passivos (−)
              </span>
              <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                Obrigações & Dívidas
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-[#173d2a]">
              {formatCurrency(totals.totalPassivos)}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-[#edf2ee] pt-3 text-xs text-[#718078]">
              <span>Circulante: {formatCurrency(totals.subtotals.passivoCirculante)}</span>
              <span>Não Circulante: {formatCurrency(totals.subtotals.passivoNaoCirculante)}</span>
            </div>
          </div>
        </div>

        {/* Barra de Proporção Ativos vs Passivos */}
        {totals.totalAtivos + totals.totalPassivos > 0 && (
          <div className="mt-6 rounded-2xl border border-[#dfe8e1] bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs font-semibold">
              <span className="text-[#2c6e43]">
                Ativos: {ativosPercent.toFixed(1)}% ({formatCurrency(totals.totalAtivos)})
              </span>
              <span className="text-rose-700">
                Passivos: {passivosPercent.toFixed(1)}% ({formatCurrency(totals.totalPassivos)})
              </span>
            </div>
            <div className="mt-2.5 flex h-3.5 w-full overflow-hidden rounded-full bg-[#edf2ee]">
              <div
                style={{ width: `${ativosPercent}%` }}
                className="bg-[#2c6e43] transition-all duration-500"
              />
              <div
                style={{ width: `${passivosPercent}%` }}
                className="bg-rose-500 transition-all duration-500"
              />
            </div>
          </div>
        )}

        {/* Duas Colunas: Ativos vs Passivos */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* ================= COLUNA ATIVOS ================= */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-[#5d9873] pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#5d9873]">
                  Seus Recursos
                </span>
                <h2 className="text-2xl font-bold text-[#173d2a]">ATIVOS</h2>
              </div>
              <span className="rounded-2xl bg-[#edf5ef] px-3.5 py-1 text-sm font-bold text-[#2c6e43]">
                Subtotal: {formatCurrency(totals.totalAtivos)}
              </span>
            </div>

            {/* Ativo Circulante */}
            <div className="rounded-3xl border border-[#dfe8e1] bg-white p-5 sm:p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                <h3 className="font-bold text-[#173d2a]">Ativo Circulante</h3>
                <span className="text-xs font-semibold text-[#5d9873]">
                  {formatCurrency(totals.subtotals.ativoCirculante)}
                </span>
              </div>

              {/* Disponibilidades */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64736a]">
                  <span>Disponibilidades</span>
                  <span className="text-[#2c6e43]">
                    {formatCurrency(totals.subtotals.disponibilidades)}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(
                    formData.ATIVOS['Ativo Circulante'].Disponibilidades
                  ).map(([field, val]) => (
                    <PatrimonioFieldItem
                      key={field}
                      field={field}
                      val={val}
                      onChange={(newVal) =>
                        handleValueChange(
                          'ATIVOS',
                          'Ativo Circulante',
                          field,
                          newVal,
                          'Disponibilidades'
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Contas a Receber */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64736a]">
                  <span>Contas a Receber</span>
                  <span className="text-[#2c6e43]">
                    {formatCurrency(totals.subtotals.contasAReceber)}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(
                    formData.ATIVOS['Ativo Circulante']['Contas a Receber']
                  ).map(([field, val]) => (
                    <PatrimonioFieldItem
                      key={field}
                      field={field}
                      val={val}
                      onChange={(newVal) =>
                        handleValueChange(
                          'ATIVOS',
                          'Ativo Circulante',
                          field,
                          newVal,
                          'Contas a Receber'
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Investimentos */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#64736a]">
                  <span>Investimentos</span>
                  <span className="text-[#2c6e43]">
                    {formatCurrency(totals.subtotals.investimentos)}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(
                    formData.ATIVOS['Ativo Circulante'].Investimentos
                  ).map(([field, val]) => (
                    <PatrimonioFieldItem
                      key={field}
                      field={field}
                      val={val}
                      onChange={(newVal) =>
                        handleValueChange(
                          'ATIVOS',
                          'Ativo Circulante',
                          field,
                          newVal,
                          'Investimentos'
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Passivos com valor (Bens/Ativos de Longo Prazo) */}
            <div className="rounded-3xl border border-[#dfe8e1] bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                <div>
                  <h3 className="font-bold text-[#173d2a]">Passivos com valor</h3>
                  <span className="text-xs text-[#8a998f]">Veículos, Imóveis e FGTS</span>
                </div>
                <span className="text-xs font-semibold text-[#5d9873]">
                  {formatCurrency(totals.subtotals.passivosComValor)}
                </span>
              </div>

              <div className="space-y-2.5">
                {Object.entries(formData.ATIVOS['Passivos com valor']).map(([field, val]) => (
                  <PatrimonioFieldItem
                    key={field}
                    field={field}
                    val={val}
                    onChange={(newVal) =>
                      handleValueChange(
                        'ATIVOS',
                        'Passivos com valor',
                        field,
                        newVal
                      )
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ================= COLUNA PASSIVOS ================= */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-rose-500 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Suas Obrigações
                </span>
                <h2 className="text-2xl font-bold text-[#173d2a]">PASSIVOS</h2>
              </div>
              <span className="rounded-2xl bg-rose-50 px-3.5 py-1 text-sm font-bold text-rose-700">
                Subtotal: {formatCurrency(totals.totalPassivos)}
              </span>
            </div>

            {/* Passivo Circulante */}
            <div className="rounded-3xl border border-[#dfe8e1] bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                <div>
                  <h3 className="font-bold text-[#173d2a]">Passivo Circulante</h3>
                  <span className="text-xs text-[#8a998f]">Contas e dívidas de curto prazo</span>
                </div>
                <span className="text-xs font-semibold text-rose-600">
                  {formatCurrency(totals.subtotals.passivoCirculante)}
                </span>
              </div>

              <div className="space-y-2.5">
                {Object.entries(formData.PASSIVOS['Passivo Circulante']).map(([field, val]) => (
                  <PatrimonioFieldItem
                    key={field}
                    field={field}
                    val={val}
                    isPassivo={true}
                    onChange={(newVal) =>
                      handleValueChange(
                        'PASSIVOS',
                        'Passivo Circulante',
                        field,
                        newVal
                      )
                    }
                  />
                ))}
              </div>
            </div>

            {/* Não Circulante */}
            <div className="rounded-3xl border border-[#dfe8e1] bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#edf2ee] pb-3">
                <div>
                  <h3 className="font-bold text-[#173d2a]">Não Circulante</h3>
                  <span className="text-xs text-[#8a998f]">Financiamentos e longo prazo</span>
                </div>
                <span className="text-xs font-semibold text-rose-600">
                  {formatCurrency(totals.subtotals.passivoNaoCirculante)}
                </span>
              </div>

              <div className="space-y-2.5">
                {Object.entries(formData.PASSIVOS['Não Circulante']).map(([field, val]) => (
                  <PatrimonioFieldItem
                    key={field}
                    field={field}
                    val={val}
                    isPassivo={true}
                    onChange={(newVal) =>
                      handleValueChange(
                        'PASSIVOS',
                        'Não Circulante',
                        field,
                        newVal
                      )
                    }
                  />
                ))}
              </div>
            </div>

            {/* Resumo do Patrimônio Líquido */}
            <div className="rounded-3xl border-2 border-[#173d2a] bg-[#edf5ef] p-5 sm:p-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5d9873]">
                Resultado do Balanço
              </span>
              <div className="mt-2 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <h3 className="text-lg font-bold text-[#173d2a]">Seu patrimônio hoje</h3>
                <span className="text-2xl font-black text-[#173d2a]">
                  {formatCurrency(totals.patrimonioLiquido)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[#718078]">
                O patrimônio líquido reflete o valor real acumulado após a quitação de todas as
                obrigações e dívidas registradas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação para Zerar */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173d2a]/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-[#dfe8e1] bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#173d2a]">Zerar todo o Balanço?</h3>
            <p className="mt-2 text-xs leading-relaxed text-[#718078]">
              Todos os campos de Ativos e Passivos serão redefinidos para R$ 0,00. Esta ação pode
              ser revertida preenchendo novos valores.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="rounded-xl border border-[#d8e1da] px-4 py-2 text-xs font-semibold text-[#64736a] transition hover:bg-[#f3f6f4] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 cursor-pointer"
              >
                Sim, Zerar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
