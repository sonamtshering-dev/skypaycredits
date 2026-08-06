// src/admin/Dashboard.jsx
import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useSettings } from '../context/SettingsContext'
import theme from '../theme'
import { ClipboardList, CheckCircle, Clock, XCircle, IndianRupee, Users, RefreshCw, Smile } from 'lucide-react'


export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const { settings } = useSettings()
  const sym = settings.currencySymbol || '$'

  const [smileBal, setSmileBal]       = useState(null)
  const [smileLoading, setSmileLoading] = useState(false)
  const [smileError, setSmileError]   = useState('')

  const fetchSmileBalance = () => {
    setSmileLoading(true); setSmileError('')
    api.get('/smile/balance?url=https://www.smile.one/br')
      .then(r => setSmileBal(r.data.balance))
      .catch(e => setSmileError(e.response?.data?.message || 'Failed to fetch balance'))
      .finally(() => setSmileLoading(false))
  }

  useEffect(() => {
    api.get('/orders/stats')
      .then(r => setStats(r.data))
      .catch(() => setStats({}))
      .finally(() => setLoading(false))
    fetchSmileBalance()
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

      {/* Smile.One Balance */}
      <div style={{ marginBottom: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smile size={17} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Smile.One Balance</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Brazil (BR) account</div>
            </div>
          </div>
          <button onClick={fetchSmileBalance} disabled={smileLoading} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            <RefreshCw size={13} style={{ animation: smileLoading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
        {smileLoading ? (
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Fetching balance…</div>
        ) : smileError ? (
          <div style={{ color: '#f87171', fontSize: 13 }}>{smileError}</div>
        ) : smileBal !== null ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: '#fb923c' }}>{Number(smileBal).toLocaleString()}</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>SmileCoins</span>
          </div>
        ) : null}
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