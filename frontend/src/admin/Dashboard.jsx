// src/admin/Dashboard.jsx
import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useSettings } from '../context/SettingsContext'
import theme from '../theme'
import { ClipboardList, CheckCircle, Clock, XCircle, IndianRupee, Users } from 'lucide-react'


export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const { settings } = useSettings()
  const sym = settings.currencySymbol || '$'

  useEffect(() => {
    api.get('/orders/stats')
      .then(r => setStats(r.data))
      .catch(() => setStats({}))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" /></div>

  const cards = [
    { label: 'Total Orders', value: stats?.total ?? 0,     icon: ClipboardList, color: theme.primary },
    { label: 'Completed',    value: stats?.completed ?? 0, icon: CheckCircle,   color: '#22c55e' },
    { label: 'Pending',      value: stats?.pending ?? 0,   icon: Clock,         color: '#f59e0b' },
    { label: 'Failed',       value: stats?.failed ?? 0,    icon: XCircle,       color: '#ef4444' },
    { label: 'Revenue',      value: `${sym}${(stats?.revenue ?? 0).toLocaleString()}`, icon: IndianRupee, color: '#60a5fa' },
    { label: 'Users',        value: stats?.users ?? 0,     icon: Users,         color: theme.primary },
  ]

  const statusColor = { Pending: '#f59e0b', Processing: '#3b82f6', Completed: '#22c55e', Failed: '#ef4444' }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Dashboard</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 28 }}>Welcome back, Admin</p>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 32 }}>
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '16px 14px' }}>
            <div style={{ marginBottom: 8 }}><Icon size={28} color={color} /></div>
            <div style={{ fontSize: 26, fontWeight: 900, color, marginBottom: 4 }}>{value}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontWeight: 800, fontSize: 15, color: '#fff' }}>
          Recent Orders
        </div>
        {!stats?.recentOrders?.length ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            No orders yet. Add games and packs to get started!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stats.recentOrders.map(o => (
              <div key={o._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{o.game?.name || o.gameName || '—'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{o.playerId || Object.values(o.playerData || {}).join(' · ') || '—'}</div>
                </div>
                <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${statusColor[o.status]}22`, color: statusColor[o.status] || '#fff' }}>
                  {o.status}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}