// src/admin/AdminOrders.jsx
import { useState, useEffect } from 'react'
import api from '../api/axios'
import theme from '../theme'

const S = {
  Pending:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  Processing: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)'  },
  Completed:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)'   },
  Failed:     { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'   },
  Refunded:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
}

export default function AdminOrders() {
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('')
  const [search, setSearch]     = useState('')
  const [acting, setActing]     = useState(null)
  const [expanded, setExpanded] = useState(null)

  const load = () => {
    api.get('/orders')
      .then(r => setOrders(Array.isArray(r.data) ? r.data : (r.data.orders || [])))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const updateStatus = async (id, status) => {
    if (!confirm(`Mark order as ${status}?`)) return
    setActing(id)
    try {
      await api.put(`/orders/${id}`, { status })
      load()
    } catch (e) { alert(e.response?.data?.message || 'Failed') }
    finally { setActing(null) }
  }

  const filtered = orders.filter(o => {
    const matchStatus = filter ? o.status === filter : true
    const matchSearch = search
      ? o.gameName?.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(o.playerData || {}).toLowerCase().includes(search.toLowerCase()) ||
        o._id?.slice(-8).toLowerCase().includes(search.toLowerCase()) ||
        o.userId?.email?.toLowerCase().includes(search.toLowerCase())
      : true
    return matchStatus && matchSearch
  })

  const inp = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }

  // Count by status
  const counts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc }, {})

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 2 }}>Orders</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{orders.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input style={{ ...inp, minWidth: 200 }} placeholder="Search game / player / email / ID…" value={search} onChange={e => setSearch(e.target.value)} />
          <select style={inp} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Status</option>
            {['Pending','Processing','Completed','Failed','Refunded'].map(s => (
              <option key={s} value={s}>{s} {counts[s] ? `(${counts[s]})` : ''}</option>
            ))}
          </select>

        </div>
      </div>

      {/* Status summary pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([status, count]) => {
          const sc = S[status] || S.Pending
          return (
            <div key={status} onClick={() => setFilter(filter === status ? '' : status)} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: filter === status ? sc.bg : 'rgba(255,255,255,0.05)',
              color: filter === status ? sc.color : 'rgba(255,255,255,0.5)',
              border: `1px solid ${filter === status ? sc.border : 'rgba(255,255,255,0.1)'}`,
            }}>{status} · {count}</div>
          )
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>No orders found</div>}
          {filtered.map(order => {
            const sc = S[order.status] || S.Pending
            const isOpen = expanded === order._id
            const player = order.playerData || {}
            const user = order.userId || {}

            return (
              <div key={order._id} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, overflow: 'hidden' }}>

                {/* Main row */}
                <div onClick={() => setExpanded(isOpen ? null : order._id)} style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>{order.gameName || '—'}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                      {order.packName || '—'} · {player.userId || '—'} {player.zoneId ? `· ${player.zoneId}` : ''} {player.regionSlug ? `· ${player.regionSlug}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: theme.primary, fontWeight: 800, fontSize: 14 }}>৳{order.price || '—'}</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, flexShrink: 0 }}>{order.status}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px 20px', marginBottom: 14 }}>
                      {[
                        ['Order ID', '#' + order._id?.slice(-8).toUpperCase()],
                        ['Amount', `৳${order.price || '—'}`],
                        ['Payment', order.paymentStatus || '—'],

                        ['Date', new Date(order.createdAt).toLocaleString()],

                        ['Player ID', player.userId || '—'],
                        ['Zone / Server', player.zoneId || '—'],
                        ['Region', player.regionSlug || '—'],
                      ].map(([label, val]) => (
                        <div key={label}>
                          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 2 }}>{label}</div>
                          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, wordBreak: 'break-all' }}>{val}</div>
                        </div>
                      ))}
                    </div>

                    {/* Customer info */}
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Customer</div>
                      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Name</div>
                          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user.name || '—'}</div>
                        </div>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Email</div>
                          <div style={{ color: theme.primary, fontSize: 13, fontWeight: 600 }}>{user.email || '—'}</div>
                        </div>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Phone</div>
                          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{user.phone || '—'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>

                      {order.status === 'Pending' && (
                        <button onClick={() => updateStatus(order._id, 'Completed')} disabled={acting === order._id} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', cursor: 'pointer' }}>
                          ✓ Mark Completed
                        </button>
                      )}
                      {['Pending','Processing','Failed'].includes(order.status) && (
                        <button onClick={() => updateStatus(order._id, 'Refunded')} disabled={acting === order._id} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', cursor: 'pointer' }}>
                          ↩ Refund
                        </button>
                      )}
                      {order.status !== 'Failed' && order.status !== 'Completed' && (
                        <button onClick={() => updateStatus(order._id, 'Failed')} disabled={acting === order._id} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', cursor: 'pointer' }}>
                          ✕ Mark Failed
                        </button>
                      )}
                      {order.status !== 'Completed' && (
                        <button onClick={() => updateStatus(order._id, 'Completed')} disabled={acting === order._id} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', cursor: 'pointer' }}>
                          ✓ Complete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}