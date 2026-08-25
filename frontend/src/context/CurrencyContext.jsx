// src/context/CurrencyContext.jsx
import { createContext, useContext, useState } from 'react'
import { useSettings } from './SettingsContext'

const CurrencyContext = createContext({})

export function CurrencyProvider({ children }) {
  const { settings } = useSettings()
  const [currency, setCurrency] = useState(() => localStorage.getItem('ns_currency') || 'INR')

  const toggle = () => {
    const next = currency === 'INR' ? 'PHP' : 'INR'
    setCurrency(next)
    localStorage.setItem('ns_currency', next)
  }

  const phpRate = Number(settings.phpRate) || 0.67
  const sym = currency === 'PHP' ? '₱' : '₹'

  // fmt(inr, decimals=2) — formats an INR amount in the active currency
  const fmt = (inr, decimals = 2) => {
    const n = Number(inr)
    if (inr == null || inr === '' || isNaN(n)) return sym + '0'
    if (currency === 'PHP') {
      const php = n * phpRate
      return '₱' + php.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    }
    return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  }

  // fmtP(paise) — formats a paise value (wallet amounts) in the active currency
  const fmtP = (paise) => fmt(paise == null ? 0 : paise / 100)

  return (
    <CurrencyContext.Provider value={{ currency, toggle, fmt, fmtP, sym, phpRate }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
