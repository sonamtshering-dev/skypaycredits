// src/pages/Orders.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../api/axios'

const STATUS = {
  pending:    { label: 'Pending',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)' },
  Pending:    { label: 'Pending',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)' },
  processing: { label: 'Processing', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)' },
  Processing: { label: 'Processing', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)' },
  completed:  { label: 'Completed',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)'  },
  Completed:  { label: 'Completed',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.25)'  },
  failed:     { label: 'Failed',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)'  },
  Failed:     { label: 'Failed',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)'  },
  refunded:   { label: 'Refunded',   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
  Refunded:   { label: 'Refunded',   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
}

export default function Orders() {
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/orders/my')
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 4 }}>My Orders</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Track your recharge history</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" /></div>
          ) : orders.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
            }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📋</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No orders yet</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>
                Your recharge history will appear here
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Games</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.map(order => <OrderCard key={order._id} order={order} />)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function OrderCard({ order }) {
  const st = STATUS[order.status] || STATUS.pending
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      <div onClick={() => setOpen(v => !v)} style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 18px', cursor: 'pointer',
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
          background: 'rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          {order.game?.icon
            ? <img src={order.game.icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : '🎮'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 2 }}>
            {order.game?.name || order.gameName || 'Game'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {order.pack?.name || order.pack?.title || 'Pack'} · ID: {order.playerId || order.playerData?.userId || '—'}
            {order.playerName && ` · ${order.playerName}`}
            {(order.region || order.playerData?.regionSlug) && ` · ${order.region || order.playerData?.regionSlug}`}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: st.bg, color: st.color, border: `1px solid ${st.border}`,
          }}>{st.label}</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>

        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
            {[
              ['Order ID', '#' + (order._id?.slice(-8).toUpperCase() || '—')],
              ['Amount',   order.amount ? `${order.currency || ''} ${order.amount}` : '—'],
              ['Payment',  order.paymentStatus || '—'],
              ['Date',     new Date(order.createdAt).toLocaleString()],
              ['Provider', order.provider || '—'],
              ['Ref',      order.providerTxId || '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 2 }}>{label}</div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, wordBreak: 'break-all' }}>{val}</div>
              </div>
            ))}
          </div>
          {order.note && (
            <div style={{
              marginTop: 12, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
              color: '#fca5a5', fontSize: 13,
            }}>⚠️ {order.note}</div>
          )}
        </div>
      )}
    </div>
  )
}