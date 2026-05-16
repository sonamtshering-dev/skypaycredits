import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'
import theme from '../theme'


const SettingsContext = createContext({})

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    siteName: 'RechargeShop',
    primaryColor: theme.primaryDark,
    currencySymbol: '₹',
    whatsapp: '',
    maintenanceMode: false,
  })
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    api.get('/settings').then(r => {
      setSettings(r.data)
      if (r.data.primaryColor) {
        document.documentElement.style.setProperty('--primary', r.data.primaryColor)
      }
      if (r.data.siteName) document.title = r.data.siteName
    }).catch(() => {}).finally(() => setSettingsLoaded(true))
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, setSettings, settingsLoaded }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)