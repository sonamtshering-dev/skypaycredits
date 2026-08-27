import { useState } from 'react'
import { Search, XCircle, Loader2, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../api/axios'
import theme from '../theme'
import Navbar from '../components/Navbar'

const PACK_SIZES = ['50+50', '150+150', '250+250', '500+500']

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

  const eligibleCount = data?.packs?.filter(p => p.claimable).length ?? 0
  const totalCount    = data?.packs?.length ?? 0
  const allEligible   = totalCount > 0 && eligibleCount === totalCount
  const noneEligible  = totalCount > 0 && eligibleCount === 0

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: '#080810', paddingBottom: 90 }}>

        {/* Glow */}
        <div style={{
          position: 'fixed', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 500, height: 320,
          background: 'radial-gradient(ellipse, rgba(109,40,217,0.18) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 440, margin: '0 auto', padding: '16px 16px 0' }}>

          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(155,109,255,0.65)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 5 }}>Free Tools</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: 'linear-gradient(135deg, #6d28d9, #4c00b0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>💎</div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>MLBB Checker</h1>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}>Region · Double Diamond eligibility</p>
              </div>
            </div>
          </div>

          {/* Form */}
          {!data && (
            <div style={{
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 18, padding: '18px 16px', marginBottom: 16,
            }}>
              <form onSubmit={lookup} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>User ID</label>
                    <input value={userId} onChange={e => setUserId(e.target.value)}
                      placeholder="100893609" inputMode="numeric" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Zone ID</label>
                    <input value={zoneId} onChange={e => setZoneId(e.target.value)}
                      placeholder="2521" inputMode="numeric" style={inputStyle} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', paddingLeft: 2 }}>
                  Zone ID: open MLBB → Profile → tap your avatar
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, padding: '9px 12px', color: '#f87171', fontSize: 13 }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '13px 20px', borderRadius: 12, fontWeight: 800, fontSize: 14,
                  background: loading ? 'rgba(255,255,255,0.06)' : theme.grad,
                  border: 'none', color: loading ? 'rgba(255,255,255,0.3)' : '#fff',
                  cursor: loading ? 'default' : 'pointer',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(109,40,217,0.4)',
                  transition: 'all 0.2s',
                }}>
                  {loading
                    ? <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Checking with bot…</>
                    : <><Search size={15} /> Check Player</>}
                </button>
              </form>
            </div>
          )}

          {/* Results */}
          {data && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Player card */}
              <div style={cardStyle}>
                {/* Name hero */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(109,40,217,0.2), rgba(76,0,176,0.1))',
                  borderRadius: 12, padding: '14px 16px', marginBottom: 12,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: 'linear-gradient(135deg, #6d28d9, #9b6dff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 900, color: '#fff',
                    boxShadow: '0 4px 16px rgba(109,40,217,0.5)',
                  }}>
                    {(data.username || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.4px', lineHeight: 1.1 }}>
                      {data.username || '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      {data.region || '—'}
                    </div>
                  </div>
                  <CheckCircle size={18} color="#4ade80" />
                </div>

                {/* ID row */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <IdChip label="User ID" value={data.userId} />
                  <IdChip label="Zone ID" value={data.zoneId} />
                </div>
              </div>

              {/* Double Diamond card */}
              {data.packs?.length > 0 && (
                <div style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>💎</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.8)' }}>Double Diamond</span>
                    </div>
                    <StatusBadge eligible={eligibleCount} total={totalCount} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {data.packs.map(pack => <PackCard key={pack.size} pack={pack} />)}
                  </div>

                  <div style={{
                    marginTop: 10, padding: '10px 12px',
                    background: allEligible
                      ? 'rgba(74,222,128,0.06)'
                      : noneEligible
                        ? 'rgba(239,68,68,0.06)'
                        : 'rgba(250,204,21,0.06)',
                    borderRadius: 10,
                    fontSize: 12, lineHeight: 1.5,
                    color: allEligible
                      ? 'rgba(74,222,128,0.75)'
                      : noneEligible
                        ? 'rgba(248,113,113,0.75)'
                        : 'rgba(250,204,21,0.75)',
                  }}>
                    {allEligible
                      ? 'Fresh account — all 4 double diamond packs are available.'
                      : noneEligible
                        ? 'All double diamond bonuses have already been used.'
                        : `${eligibleCount} of ${totalCount} packs still available on this account.`}
                  </div>
                </div>
              )}

              <button onClick={reset} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: 13,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
              }}>
                <RotateCcw size={14} /> Check another player
              </button>
            </div>
          )}

          {/* Idle info */}
          {!data && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>What we check</div>
              {[
                { emoji: '🌏', title: 'Region Check', desc: 'Nickname and server region from Moonton.' },
                { emoji: '💎', title: 'Double Diamond', desc: 'Eligibility status for all 4 first-purchase bonus packs.' },
              ].map(t => (
                <div key={t.title} style={{
                  display: 'flex', gap: 12,
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12, padding: '12px 14px',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginBottom: 3 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input::placeholder { color: rgba(255,255,255,0.18) !important; }
        input:focus { outline: none; border-color: rgba(155,109,255,0.45) !important; background: rgba(255,255,255,0.07) !important; }
      `}</style>
    </>
  )
}

function PackCard({ pack }) {
  const parts  = pack.size.split('+')
  const buy    = parts[0]
  const bonus  = parts[1]
  return (
    <div style={{
      borderRadius: 12, padding: '12px',
      background: pack.claimable ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${pack.claimable ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)'}`,
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
        💎 {buy} gems
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', color: pack.claimable ? '#4ade80' : 'rgba(255,255,255,0.2)', marginBottom: 6 }}>
        +{bonus}
      </div>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 700,
        color: pack.claimable ? '#4ade80' : '#f87171',
      }}>
        {pack.claimable
          ? <><CheckCircle size={11} /> Eligible</>
          : <><XCircle size={11} /> Used</>}
      </div>
    </div>
  )
}

function IdChip({ label, value }) {
  return (
    <div style={{
      flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10,
      padding: '8px 10px', border: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.3px' }}>{value}</div>
    </div>
  )
}

function StatusBadge({ eligible, total }) {
  const all  = eligible === total
  const none = eligible === 0
  const bg   = all ? 'rgba(74,222,128,0.1)' : none ? 'rgba(239,68,68,0.1)' : 'rgba(250,204,21,0.1)'
  const bc   = all ? 'rgba(74,222,128,0.25)' : none ? 'rgba(239,68,68,0.25)' : 'rgba(250,204,21,0.25)'
  const col  = all ? '#4ade80' : none ? '#f87171' : '#facc15'
  const txt  = all ? 'ALL ELIGIBLE' : none ? 'NOT ELIGIBLE' : `${eligible}/${total} ELIGIBLE`
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, letterSpacing: 0.8,
      padding: '4px 10px', borderRadius: 20,
      background: bg, border: `1px solid ${bc}`, color: col,
    }}>{txt}</span>
  )
}


const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16, padding: '14px 14px',
}

const labelStyle = {
  display: 'block', fontSize: 10, fontWeight: 800,
  color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
  letterSpacing: 1.2, marginBottom: 6,
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 10, padding: '10px 11px', color: '#fff', fontSize: 15, outline: 'none',
  transition: 'border-color 0.2s, background 0.2s',
}
