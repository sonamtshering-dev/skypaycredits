import { useState } from 'react'
import { Search, XCircle, Loader2, Globe, Diamond, RotateCcw, CheckCircle } from 'lucide-react'
import api from '../api/axios'
import theme from '../theme'

const ZONE_LABELS = {
  '5505': 'MY/SG/BN', '5506': 'Philippines', '5509': 'Indonesia',
  '5510': 'Thailand',  '5517': 'Vietnam',     '5500': 'Americas',
  '5508': 'Europe',    '5519': 'South Asia',  '5521': 'India',
  '5522': 'MENA',      '5561': 'N. Africa',   '2521': 'Indonesia (VIP)',
}

const PACK_LABELS = {
  '50+50':   { buy: 50,  bonus: 50  },
  '150+150': { buy: 150, bonus: 150 },
  '250+250': { buy: 250, bonus: 250 },
  '500+500': { buy: 500, bonus: 500 },
}

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

  const allEligible = data?.packs?.length > 0 && data.packs.every(p => p.claimable)
  const anyEligible = data?.packs?.some(p => p.claimable)

  return (
    <div style={{ minHeight: '100vh', background: '#000', paddingBottom: 100, position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse, rgba(76,0,176,0.13) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(155,109,255,0.7)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Free Tools</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>MLBB Checker</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            Check player info &amp; double diamond eligibility.
          </p>
        </div>

        {/* Input */}
        {!data && (
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '20px 18px', marginBottom: 16 }}>
            <form onSubmit={lookup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>User ID</label>
                <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="e.g. 100893609" inputMode="numeric" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Zone ID</label>
                <input value={zoneId} onChange={e => setZoneId(e.target.value)} placeholder="e.g. 2521" inputMode="numeric" style={inputStyle} />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>
                  Find in-game → Profile → tap avatar → Zone ID in brackets
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
                  ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Checking with bot…</>
                  : <><Search size={16} /> Check Player</>}
              </button>
            </form>
          </div>
        )}

        {/* Results */}
        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Region card */}
            <div style={cardStyle}>
              <div style={cardHeader}>
                <div style={iconBox('#9b6dff')}><Globe size={16} color="#9b6dff" /></div>
                <span style={cardLabel}>Player Info</span>
                <CheckCircle size={14} color="#4ade80" style={{ marginLeft: 'auto' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <Row label="Nickname" value={data.username || '—'} highlight />
                <Row label="Region" value={data.region || ZONE_LABELS[data.zoneId] || `Zone ${data.zoneId}`} />
                <Row label="User ID" value={data.userId} />
                <Row label="Zone ID" value={data.zoneId} />
              </div>
            </div>

            {/* Double Diamond card */}
            {data.packs?.length > 0 && (
              <div style={cardStyle}>
                <div style={cardHeader}>
                  <div style={iconBox('#facc15')}><Diamond size={16} color="#facc15" /></div>
                  <span style={cardLabel}>Double Diamond</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 800, letterSpacing: 1,
                    padding: '3px 10px', borderRadius: 20,
                    background: anyEligible ? 'rgba(250,204,21,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${anyEligible ? 'rgba(250,204,21,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    color: anyEligible ? '#facc15' : '#f87171',
                  }}>
                    {allEligible ? 'ALL ELIGIBLE' : anyEligible ? 'PARTIAL' : 'NOT ELIGIBLE'}
                  </span>
                </div>

                {/* Pack grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                  {data.packs.map(pack => {
                    const info = PACK_LABELS[pack.size]
                    return (
                      <div key={pack.size} style={{
                        background: pack.claimable ? 'rgba(250,204,21,0.06)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${pack.claimable ? 'rgba(250,204,21,0.2)' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 12, padding: '12px 14px',
                      }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                          💎 {info ? `${info.buy} gems` : pack.size}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: pack.claimable ? '#facc15' : 'rgba(255,255,255,0.3)', letterSpacing: '-0.5px', marginBottom: 6 }}>
                          {info ? `+${info.bonus}` : '—'}
                        </div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 700,
                          color: pack.claimable ? '#4ade80' : '#f87171',
                        }}>
                          {pack.claimable ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          {pack.claimable ? 'Eligible' : 'Used'}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10, lineHeight: 1.5 }}>
                  {allEligible
                    ? 'This account has never purchased — all double diamond packs are available.'
                    : anyEligible
                      ? 'Some packs are still claimable on this account.'
                      : 'This account has already used all double diamond bonuses.'}
                </div>
              </div>
            )}

            {/* Raw fallback if no packs parsed */}
            {(!data.packs || data.packs.length === 0) && data.ddRaw && (
              <div style={cardStyle}>
                <div style={cardHeader}>
                  <div style={iconBox('#facc15')}><Diamond size={16} color="#facc15" /></div>
                  <span style={cardLabel}>Double Diamond</span>
                </div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)' }}>
                  {data.ddRaw}
                </pre>
              </div>
            )}

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

        {/* Info cards — idle only */}
        {!data && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>What we check</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: <Globe size={15} color="#9b6dff" />, title: 'Region Check', desc: 'Shows player nickname and server region.' },
                { icon: <Diamond size={15} color="#facc15" />, title: 'Double Diamond', desc: 'Shows eligibility for all 4 first-purchase diamond bonus packs.' },
              ].map(t => (
                <div key={t.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px' }}>
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

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      <span style={{ fontSize: highlight ? 15 : 13, fontWeight: highlight ? 800 : 600, color: highlight ? '#fff' : 'rgba(255,255,255,0.7)', letterSpacing: highlight ? '-0.3px' : 0 }}>{value}</span>
    </div>
  )
}

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 16, padding: '16px 18px',
}
const cardHeader = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }
const cardLabel  = { fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }

function iconBox(color) {
  return {
    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
    background: `rgba(255,255,255,0.05)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '11px 13px', color: '#fff', fontSize: 15, outline: 'none',
  transition: 'border-color 0.2s, background 0.2s',
}
