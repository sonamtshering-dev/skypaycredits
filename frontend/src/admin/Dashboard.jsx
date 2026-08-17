// src/admin/Dashboard.jsx
import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useSettings } from '../context/SettingsContext'
import theme from '../theme'
import { ClipboardList, CheckCircle, Clock, XCircle, IndianRupee, Users, RefreshCw, Wallet } from 'lucide-react'


export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)
  const { settings } = useSettings()
  const sym = settings.currencySymbol || '$'

  const [s1Bal, setS1Bal]         = useState(null)
  const [s1Loading, setS1Loading] = useState(false)
  const [s1Error, setS1Error]     = useState('')

  const [s2Bal, setS2Bal]         = useState(null)
  const [s2Loading, setS2Loading] = useState(false)
  const [s2Error, setS2Error]     = useState('')

  const fetchS1Balance = () => {
    setS1Loading(true); setS1Error('')
    api.get('/smile/balance')
      .then(r => setS1Bal(r.data.balance))
      .catch(e => setS1Error(e.response?.data?.message || 'Failed'))
      .finally(() => setS1Loading(false))
  }

  const fetchS2Balance = () => {
    setS2Loading(true); setS2Error('')
    api.get('/fazercards/balance')
      .then(r => setS2Bal(r.data.balance))
      .catch(e => setS2Error(e.response?.data?.message || 'Failed'))
      .finally(() => setS2Loading(false))
  }

  useEffect(() => {
    api.get('/orders/stats')
      .then(r => setStats(r.data))
      .catch(() => setStats({}))
      .finally(() => setLoading(false))
    fetchS1Balance()
    fetchS2Balance()
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

      {/* Supplier Balances */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 28 }}>
        {/* Supplier 2 — Smile */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={17} color="#fff" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Supplier 2</div>
            </div>
            <button onClick={fetchS1Balance} disabled={s1Loading} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              <RefreshCw size={12} style={{ animation: s1Loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
          {s1Loading ? (
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Fetching…</div>
          ) : s1Error ? (
            <div style={{ color: '#f87171', fontSize: 12 }}>{s1Error}</div>
          ) : s1Bal !== null ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: '#fb923c' }}>{Number(s1Bal).toLocaleString()}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>points</span>
            </div>
          ) : null}
        </div>

        {/* Supplier 3 — FazerCards */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={17} color="#fff" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Supplier 3</div>
            </div>
            <button onClick={fetchS2Balance} disabled={s2Loading} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              <RefreshCw size={12} style={{ animation: s2Loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
          {s2Loading ? (
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Fetching…</div>
          ) : s2Error ? (
            <div style={{ color: '#f87171', fontSize: 12 }}>{s2Error}</div>
          ) : s2Bal !== null ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: '#a78bfa' }}>{Number(s2Bal).toLocaleString()}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>USD</span>
            </div>
          ) : null}
        </div>
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