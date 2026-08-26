import { useState, useEffect, useRef } from 'react'
import { Send, ChevronLeft } from 'lucide-react'
import api from '../api/axios'
import theme from '../theme'

const statusColor = { open: '#facc15', replied: '#4ade80', closed: '#6b7280' }
const statusLabel = { open: 'Open', replied: 'Replied', closed: 'Closed' }

export default function AdminSupport() {
  const [tickets, setTickets]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [active, setActive]     = useState(null)
  const [filter, setFilter]     = useState('')
  const [replyText, setReplyText] = useState('')
  const [sending, setSending]   = useState(false)
  const [error, setError]       = useState('')
  const bottomRef = useRef(null)

  const load = async (s = filter) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (s) params.set('status', s)
      const res = await api.get(`/tickets?${params}`)
      setTickets(res.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load(filter) }, [filter])

  useEffect(() => {
    if (active && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [active])

  const openTicket = (t) => { setActive(t); setReplyText(''); setError('') }

  const sendReply = async () => {
    if (!replyText.trim()) return
    setSending(true); setError('')
    try {
      const res = await api.post(`/tickets/${active._id}/reply`, { text: replyText.trim() })
      setActive(res.data)
      setTickets(prev => prev.map(t => t._id === res.data._id ? res.data : t))
      setReplyText('')
    } catch (e) { setError(e.response?.data?.message || 'Failed') }
    finally { setSending(false) }
  }

  const setStatus = async (status) => {
    try {
      const res = await api.put(`/tickets/${active._id}/status`, { status })
      setActive(res.data)
      setTickets(prev => prev.map(t => t._id === res.data._id ? res.data : t))
    } catch (e) { setError(e.response?.data?.message || 'Failed') }
  }

  const unread = tickets.filter(t => t.status !== 'closed').length

  return (
    <>
      <style>{`
        .sa-wrap {
          display: flex;
          gap: 16px;
          height: calc(100vh - 100px);
          min-height: 400px;
        }
        .sa-list {
          width: 300px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
        }
        .sa-thread {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          overflow: hidden;
        }
        .sa-back { display: none; }

        @media (max-width: 768px) {
          .sa-wrap {
            flex-direction: column;
            height: auto;
            gap: 0;
          }
          .sa-list {
            width: 100%;
            border-radius: 14px;
            /* shown by default */
          }
          .sa-thread {
            width: 100%;
            border-radius: 14px;
            min-height: 70vh;
            /* hidden by default on mobile */
            display: none;
          }
          /* when a ticket is open on mobile */
          .sa-wrap.sa-has-active .sa-list   { display: none; }
          .sa-wrap.sa-has-active .sa-thread { display: flex; }
          .sa-back { display: flex !important; }
        }
      `}</style>

      <div className={`sa-wrap${active ? ' sa-has-active' : ''}`}>

        {/* ── LIST ── */}
        <div className="sa-list">
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Support</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{unread} open · {tickets.length} total</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              {[['', 'All'], ['open', 'Open'], ['replied', 'Replied'], ['closed', 'Closed']].map(([val, label]) => (
                <button key={val} onClick={() => setFilter(val)} style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: filter === val ? theme.grad : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${filter === val ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
                  color: filter === val ? '#fff' : 'rgba(255,255,255,0.5)',
                }}>{label}</button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading…</div>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No tickets</div>
            ) : tickets.map(t => (
              <button key={t._id} onClick={() => openTicket(t)} style={{
                width: '100%', textAlign: 'left', padding: '12px 16px', cursor: 'pointer',
                background: active?._id === t._id ? 'rgba(124,58,237,0.12)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                borderLeft: `3px solid ${active?._id === t._id ? '#7c3aed' : 'transparent'}`,
                border: 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: statusColor[t.status], flexShrink: 0 }}>{statusLabel[t.status].toUpperCase()}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 3 }}>
                  {t.userId?.name || t.userId?.email || 'Unknown'} · {t.messages.length} msg
                </div>
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 2 }}>
                  {new Date(t.updatedAt).toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── THREAD ── */}
        <div className="sa-thread">
          {!active ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              Select a ticket to view
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button className="sa-back" onClick={() => setActive(null)} style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer', padding: 0, alignItems: 'center',
                }}><ChevronLeft size={22} /></button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{active.subject}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 1 }}>
                    {active.userId?.name || active.userId?.email} · #{active._id.slice(-6)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor[active.status], background: `${statusColor[active.status]}18`, border: `1px solid ${statusColor[active.status]}33`, borderRadius: 20, padding: '3px 10px' }}>
                    {statusLabel[active.status]}
                  </span>
                  {active.status !== 'closed' ? (
                    <button onClick={() => setStatus('closed')} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', cursor: 'pointer' }}>Close</button>
                  ) : (
                    <button onClick={() => setStatus('open')} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80', cursor: 'pointer' }}>Reopen</button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {active.messages.map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.sender === 'admin' ? 'flex-end' : 'flex-start',
                    maxWidth: '78%',
                    background: m.sender === 'admin' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${m.sender === 'admin' ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: m.sender === 'admin' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    padding: '10px 14px',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: m.sender === 'admin' ? '#c4b5fd' : '#94a3b8', marginBottom: 4 }}>
                      {m.sender === 'admin' ? 'Support Team' : (active.userId?.name || 'Customer')}
                    </div>
                    <div style={{ color: '#e5e7eb', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 5 }}>{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Reply */}
              {error && <div style={{ padding: '0 16px 4px', color: '#f87171', fontSize: 12 }}>{error}</div>}
              {active.status !== 'closed' ? (
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <textarea
                    placeholder="Type your reply…"
                    value={replyText} onChange={e => setReplyText(e.target.value)}
                    rows={2}
                    onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) sendReply() }}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                  />
                  <button onClick={sendReply} disabled={sending || !replyText.trim()} style={{
                    padding: '10px 16px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg,#7c3aed,#4c00b0)',
                    color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                    opacity: (!replyText.trim() || sending) ? 0.5 : 1,
                  }}><Send size={14} /> Send</button>
                </div>
              ) : (
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                  Ticket closed — reopen to reply
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </>
  )
}
