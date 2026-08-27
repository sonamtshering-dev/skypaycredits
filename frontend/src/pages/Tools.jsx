import { useState } from 'react'
import { Search, Loader2, RotateCcw, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import api from '../api/axios'
import theme from '../theme'
import Navbar from '../components/Navbar'

export default function Tools() {
  const [userId, setUserId]   = useState('')
  const [zoneId, setZoneId]   = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData]       = useState(null)
  const [error, setError]     = useState('')

  const lookup = async (e) => {
    e.preventDefault()
    if (!userId.trim() || !zoneId.trim()) return setError('Enter both User ID and Zone ID.')
    setError(''); setData(null); setLoading(true)
    try {
      const r = await api.post('/tools/mlbb', { userId: userId.trim(), zoneId: zoneId.trim() })
      setData(r.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Lookup failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setData(null); setError(''); setUserId(''); setZoneId('') }

  const eligible = data?.packs?.filter(p => p.claimable).length ?? 0
  const total    = data?.packs?.length ?? 0

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: '#0c0c12', paddingBottom: 90 }}>
        <div style={{ maxWidth: 420, margin: '0 auto', padding: '20px 16px 0' }}>

          {/* Header */}
          <div style={{ marginBottom: 22 }}>
            <p style={{ fontSize: 11, color: 'rgba(155,109,255,0.6)', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 6px' }}>Free Tools</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px' }}>MLBB Checker</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Check player region and double diamond eligibility</p>
          </div>

          {/* Form */}
          {!data && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
              <form onSubmit={lookup}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={lbl}>User ID</label>
                    <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="100893609" inputMode="numeric" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Zone ID</label>
                    <input value={zoneId} onChange={e => setZoneId(e.target.value)} placeholder="2521" inputMode="numeric" style={inp} />
                  </div>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '0 0 12px' }}>
                  Zone ID: MLBB → Profile → tap your avatar
                </p>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '9px 11px', color: '#f87171', fontSize: 13, marginBottom: 10 }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none',
                  background: loading ? 'rgba(255,255,255,0.07)' : theme.grad,
                  color: loading ? 'rgba(255,255,255,0.35)' : '#fff',
                  cursor: loading ? 'default' : 'pointer',
                }}>
                  {loading
                    ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Verifying…</>
                    : <><Search size={15} /> Check Player</>}
                </button>
              </form>
            </div>
          )}

          {/* Results */}
          {data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Player */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Player Info</span>
                  <CheckCircle size={15} color="#4ade80" />
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.4px', marginBottom: 4 }}>
                  {data.username || '—'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>{data.region || '—'}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Chip label="User ID" value={data.userId} />
                  <Chip label="Zone ID" value={data.zoneId} />
                </div>
              </div>

              {/* Double Diamond */}
              {data.packs?.length > 0 && (
                <div style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Double Diamond Packs</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                      background: eligible === 0 ? 'rgba(239,68,68,0.1)' : eligible === total ? 'rgba(74,222,128,0.1)' : 'rgba(250,204,21,0.1)',
                      border: `1px solid ${eligible === 0 ? 'rgba(239,68,68,0.2)' : eligible === total ? 'rgba(74,222,128,0.2)' : 'rgba(250,204,21,0.2)'}`,
                      color: eligible === 0 ? '#f87171' : eligible === total ? '#4ade80' : '#facc15',
                    }}>
                      {eligible === total ? 'All eligible' : eligible === 0 ? 'None eligible' : `${eligible}/${total} eligible`}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {data.packs.map(pack => {
                      const [buy, bonus] = pack.size.split('+')
                      return (
                        <div key={pack.size} style={{
                          borderRadius: 10, padding: '11px 12px',
                          background: pack.claimable ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${pack.claimable ? 'rgba(74,222,128,0.18)' : 'rgba(255,255,255,0.06)'}`,
                        }}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{buy} + {bonus} gems</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: pack.claimable ? '#4ade80' : '#f87171' }}>
                            {pack.claimable
                              ? <><CheckCircle size={13} /> Eligible</>
                              : <><XCircle size={13} /> Used</>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <button onClick={reset} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '11px', borderRadius: 10, fontWeight: 600, fontSize: 13, border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              }}>
                <RotateCcw size={13} /> Check another
              </button>
            </div>
          )}

          {/* Idle hints */}
          {!data && !loading && (
            <div style={{ marginTop: 6 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>What we check</p>
              {[
                { title: 'Region Check', desc: 'Player nickname and server region.' },
                { title: 'Double Diamond', desc: 'Which first-purchase bonus packs are still available.' },
              ].map(t => (
                <div key={t.title} style={{ padding: '11px 13px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{t.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } input::placeholder { color: rgba(255,255,255,0.18) !important; } input:focus { outline: none; border-color: rgba(155,109,255,0.4) !important; }`}</style>
    </>
  )
}

function Chip({ label, value }) {
  return (
    <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '7px 10px' }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>{value}</div>
    </div>
  )
}

const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14, padding: '14px',
}
const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 5 }
const inp = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8, padding: '10px 10px', color: '#fff', fontSize: 15, outline: 'none',
}
