import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Plus, Send, ChevronLeft } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const statusColor = { open: '#facc15', replied: '#4ade80', closed: '#6b7280' }
const statusLabel = { open: 'Open', replied: 'Replied', closed: 'Closed' }

export default function SupportWidget() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [open, setOpen]       = useState(false)
  const [view, setView]       = useState('list') // 'list' | 'thread' | 'new'
  const [tickets, setTickets] = useState([])
  const [active, setActive]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [subject, setSubject] = useState('')
  const [text, setText]       = useState('')
  const [replyText, setReplyText] = useState('')
  const [error, setError]     = useState('')
  const bottomRef = useRef(null)

  const loadTickets = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await api.get('/tickets/my')
      setTickets(res.data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { if (open && user) loadTickets() }, [open])

  useEffect(() => {
    if (active && bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [active])

  const openTicket = (t) => { setActive(t); setView('thread'); setReplyText('') }

  const createTicket = async () => {
    if (!subject.trim() || !text.trim()) { setError('Fill in subject and message'); return }
    setSending(true); setError('')
    try {
      const res = await api.post('/tickets', { subject: subject.trim(), text: text.trim() })
      setTickets(prev => [res.data, ...prev])
      setSubject(''); setText('')
      setActive(res.data); setView('thread')
    } catch (e) { setError(e.response?.data?.message || 'Failed to create ticket') }
    finally { setSending(false) }
  }

  const sendReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await api.post(`/tickets/${active._id}/message`, { text: replyText.trim() })
      setActive(res.data)
      setTickets(prev => prev.map(t => t._id === res.data._id ? res.data : t))
      setReplyText('')
    } catch (e) { setError(e.response?.data?.message || 'Failed to send') }
    finally { setSending(false) }
  }

  if (!user) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) { setView('list'); setActive(null) } }}
        style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 9998,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg,#7c3aed,#4c00b0)',
          border: '2px solid rgba(124,58,237,0.5)',
          boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#fff', transition: 'transform 0.15s',
        }}
        title="Support"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 88, left: 24, zIndex: 9998,
          width: 340, maxHeight: 520,
          background: '#0a061a', border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 20, display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
          animation: 'supSlideUp 0.2s ease',
        }}>
          <style>{`@keyframes supSlideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }`}</style>

          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
            {view !== 'list' && (
              <button onClick={() => { setView('list'); setActive(null); setError('') }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={18} />
              </button>
            )}
            <span style={{ fontWeight: 800, fontSize: 14, color: '#fff', flex: 1 }}>
              {view === 'list' ? 'Support' : view === 'new' ? 'New Ticket' : active?.subject}
            </span>
            {view === 'list' && (
              <button onClick={() => { setView('new'); setError('') }}
                style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#c4b5fd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Plus size={12} /> New
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>

            {/* LIST */}
            {view === 'list' && (
              loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading…</div>
              ) : tickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <MessageCircle size={32} style={{ color: 'rgba(124,58,237,0.4)', marginBottom: 10 }} />
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No tickets yet</div>
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 4 }}>Create one if you need help</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tickets.map(t => (
                    <button key={t._id} onClick={() => openTicket(t)} style={{
                      width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
                      padding: '10px 12px', cursor: 'pointer',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, flex: 1 }}>{t.subject}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: statusColor[t.status], background: `${statusColor[t.status]}18`, border: `1px solid ${statusColor[t.status]}33`, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>{statusLabel[t.status]}</span>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 4 }}>
                        {t.messages.length} message{t.messages.length !== 1 ? 's' : ''} · {new Date(t.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}

            {/* NEW TICKET */}
            {view === 'new' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '8px 12px', color: '#f87171', fontSize: 12 }}>{error}</div>}
                <input
                  placeholder="Subject"
                  value={subject} onChange={e => setSubject(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
                <textarea
                  placeholder="Describe your issue…"
                  value={text} onChange={e => setText(e.target.value)}
                  rows={4}
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
                <button onClick={createTicket} disabled={sending} style={{
                  width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg,#7c3aed,#4c00b0)',
                  color: '#fff', fontWeight: 700, fontSize: 13, cursor: sending ? 'wait' : 'pointer',
                  opacity: sending ? 0.7 : 1,
                }}>{sending ? 'Sending…' : 'Submit Ticket'}</button>
              </div>
            )}

            {/* THREAD */}
            {view === 'thread' && active && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {active.messages.map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.sender === 'customer' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: m.sender === 'customer' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${m.sender === 'customer' ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: m.sender === 'customer' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    padding: '8px 12px',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: m.sender === 'customer' ? '#c4b5fd' : '#4ade80', marginBottom: 3 }}>
                      {m.sender === 'customer' ? 'You' : 'Support'}
                    </div>
                    <div style={{ color: '#e5e7eb', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
                <div ref={bottomRef} />
                {active.status === 'closed' && (
                  <div style={{ textAlign: 'center', padding: '8px', color: 'rgba(255,255,255,0.3)', fontSize: 12, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>Ticket closed</div>
                )}
                {error && <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div>}
              </div>
            )}
          </div>

          {/* Reply box */}
          {view === 'thread' && active && active.status !== 'closed' && (
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 8 }}>
              <input
                placeholder="Reply…"
                value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
              />
              <button onClick={sendReply} disabled={sending || !replyText.trim()} style={{
                width: 36, height: 36, borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#7c3aed,#4c00b0)',
                color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: (!replyText.trim() || sending) ? 0.5 : 1,
                flexShrink: 0,
              }}><Send size={14} /></button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
