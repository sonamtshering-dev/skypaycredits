import { useState } from 'react'
import { Search, XCircle, Loader2, Globe, Diamond, RotateCcw } from 'lucide-react'
import api from '../api/axios'
import theme from '../theme'

export default function Tools() {
  const [userId, setUserId]   = useState('')
  const [zoneId, setZoneId]   = useState('')
  const [loading, setLoading] = useState(false)
  const [reply, setReply]     = useState(null)
  const [error, setError]     = useState('')

  const lookup = async (e) => {
    e.preventDefault()
    if (!userId.trim() || !zoneId.trim()) return setError('Enter both User ID and Zone ID.')
    setError(''); setReply(null); setLoading(true)
    try {
      const r = await api.post('/tools/mlbb', { userId: userId.trim(), zoneId: zoneId.trim() })
      setReply(r.data.reply)
    } catch (err) {
      setError(err.response?.data?.message || 'Lookup failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setReply(null); setError(''); setUserId(''); setZoneId('') }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000',
      paddingBottom: 100,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'fixed', top: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse, rgba(76,0,176,0.14) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(155,109,255,0.7)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
            Free Tools
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>
            MLBB Checker
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            Check region &amp; double diamond eligibility instantly.
          </p>
        </div>

        {/* Input card */}
        {!reply && (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 16, padding: '20px 18px',
            marginBottom: 16,
          }}>
            <form onSubmit={lookup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Mobile Legends User ID</label>
                <input
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  placeholder="e.g. 123456789"
                  inputMode="numeric"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Zone ID (Server ID)</label>
                <input
                  value={zoneId}
                  onChange={e => setZoneId(e.target.value)}
                  placeholder="e.g. 5506"
                  inputMode="numeric"
                  style={inputStyle}
                />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>
                  Find it in-game → Profile → tap your avatar → Zone ID shown in brackets
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 12px', color: '#f87171', fontSize: 13 }}>
                  <XCircle size={14} /> {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 20px', borderRadius: 12, fontWeight: 800, fontSize: 14,
                background: loading ? 'rgba(255,255,255,0.06)' : theme.grad,
                border: 'none', color: loading ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: loading ? 'default' : 'pointer',
              }}>
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Checking…</>
                  : <><Search size={16} /> Check Player</>
                }
              </button>
            </form>
          </div>
        )}

        {/* Bot reply */}
        {reply && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(109,40,217,0.25)',
              borderRadius: 16, padding: '18px 18px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(155,109,255,0.6)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
                Result
              </div>
              {/* Render bot reply text preserving line breaks */}
              <pre style={{
                margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                fontFamily: 'inherit', fontSize: 14, lineHeight: 1.75,
                color: 'rgba(255,255,255,0.85)',
              }}>
                {reply}
              </pre>
            </div>

            <button onClick={reset} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '11px 20px', borderRadius: 12, fontWeight: 700, fontSize: 13,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
            }}>
              <RotateCcw size={14} /> Check another player
            </button>
          </div>
        )}

        {/* Info — only when idle */}
        {!reply && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
              What we check
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: <Globe size={15} color="#9b6dff" />, title: 'Region Check', desc: 'Confirms the player exists on that server and shows their nickname.' },
                { icon: <Diamond size={15} color="#facc15" />, title: 'Double Diamond', desc: 'Tells you if the first-purchase bonus (double diamonds) is still available.' },
              ].map(t => (
                <div key={t.title} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '12px 14px',
                }}>
                  <div style={{ marginTop: 1 }}>{t.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input:focus { outline: none; border-color: rgba(155,109,255,0.5) !important; background: rgba(255,255,255,0.07) !important; }
      `}</style>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
  letterSpacing: 1.2, marginBottom: 6,
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '11px 13px',
  color: '#fff', fontSize: 15, outline: 'none',
  transition: 'border-color 0.2s, background 0.2s',
}
