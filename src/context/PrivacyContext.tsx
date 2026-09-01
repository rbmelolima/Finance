import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Currency } from '../types/finance'
import {
  formatCurrency as baseFormatCurrency,
  formatMoneyInput as baseFormatMoneyInput,
} from '../utils/currency'

const PRIVACY_MODE_KEY = 'sfp.privacy_mode'

interface PrivacyContextType {
  isPrivacyMode: boolean
  togglePrivacyMode: () => void
  setPrivacyMode: (value: boolean) => void
  formatCurrency: (amount: number | null | undefined, currency?: Currency) => string
  formatMoneyInput: (value: number | string | null | undefined) => string
  maskText: (text: string | number) => string
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined)

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isPrivacyMode, setIsPrivacyModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PRIVACY_MODE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const setPrivacyMode = useCallback((val: boolean) => {
    setIsPrivacyModeState(val)
    try {
      localStorage.setItem(PRIVACY_MODE_KEY, String(val))
    } catch {
      // Ignora erro de storage
    }
  }, [])

  const togglePrivacyMode = useCallback(() => {
    setPrivacyMode(!isPrivacyMode)
  }, [isPrivacyMode, setPrivacyMode])

  // Atalho de teclado: Alt + P ou tecla P fora de inputs
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase()
      const isInputFocused =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        (document.activeElement as HTMLElement)?.isContentEditable

      // Alt + P funciona mesmo com foco se não conflitar, ou pressionar 'p' / 'P' quando não estiver digitando
      if (
        (e.altKey && (e.key === 'p' || e.key === 'P' || e.key === 'π')) ||
        (!isInputFocused && !e.ctrlKey && !e.metaKey && (e.key === 'p' || e.key === 'P'))
      ) {
        e.preventDefault()
        togglePrivacyMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePrivacyMode])

  const formatCurrency = useCallback(
    (amount: number | null | undefined, currency: Currency = 'BRL') => {
      return baseFormatCurrency(amount, currency, isPrivacyMode)
    },
    [isPrivacyMode]
  )

  const formatMoneyInput = useCallback(
    (value: number | string | null | undefined) => {
      return baseFormatMoneyInput(value, isPrivacyMode)
    },
    [isPrivacyMode]
  )

  const maskText = useCallback(
    (text: string | number) => {
      if (!isPrivacyMode) return String(text)
      return '••••••'
    },
    [isPrivacyMode]
  )

  const value = useMemo(
    () => ({
      isPrivacyMode,
      togglePrivacyMode,
      setPrivacyMode,
      formatCurrency,
      formatMoneyInput,
      maskText,
    }),
    [isPrivacyMode, togglePrivacyMode, setPrivacyMode, formatCurrency, formatMoneyInput, maskText]
  )

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePrivacy(): PrivacyContextType {
  const context = useContext(PrivacyContext)
  if (!context) {
    // Fallback gracioso caso chamado fora do provider
    return {
      isPrivacyMode: false,
      togglePrivacyMode: () => {},
      setPrivacyMode: () => {},
      formatCurrency: baseFormatCurrency,
      formatMoneyInput: baseFormatMoneyInput,
      maskText: (t) => String(t),
    }
  }
  return context
}
