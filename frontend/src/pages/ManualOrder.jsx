// src/pages/ManualOrder.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { Shield, Zap, Mail, Star } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../api/axios'
import theme from '../theme'

export default function ManualOrder() {
  const { gameId }     = useParams()
  const [searchParams] = useSearchParams()
  const regionSlug     = searchParams.get('region')
  const { user }       = useAuth()
  const { settings }   = useSettings()
  const navigate       = useNavigate()

  const [game, setGame]       = useState(null)
  const [packs, setPacks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPack, setSelectedPack] = useState(null)
  const [fieldData, setFieldData] = useState({})
  const [email, setEmail]     = useState(user?.email || '')
  const [phone, setPhone]     = useState('')
  const [note, setNote]       = useState('')
  const [paying, setPaying]   = useState(false)
  const [error, setError]     = useState('')
  const sym = settings?.currencySymbol || '₹'

  useEffect(() => {
    Promise.all([
      api.get(`/games/${gameId}`),
      api.get(`/packs?gameId=${gameId}&region=${regionSlug || ''}`),
    ]).then(([gr, pr]) => {
      setGame(gr.data)
      setPacks(pr.data?.packs || pr.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [gameId, regionSlug])

  const customFields = game?.fields?.length ? game.fields : null

  const handlePay = async () => {
    if (!selectedPack) return setError('Please select a package')
    if (customFields) {
      if (!fieldData[customFields[0]?.name]) return setError(`${customFields[0]?.label} is required`)
    } else {
      if (!email) return setError('Email is required')
    }
    setPaying(true)
    setError('')
    try {
      const { data } = await api.post('/orders', {
        gameId,
        packId: selectedPack._id,
        playerData: customFields
          ? { ...fieldData, regionSlug: regionSlug || '', orderType: 'manual' }
          : { email, phone, note, regionSlug: regionSlug || '', orderType: 'manual' },
        regionSlug: regionSlug || '',
      })
      const pay = await api.post('/payment/create', { orderId: data.order._id })
      if (pay.data.payment_url) {
        window.location.href = pay.data.payment_url
      } else {
        setError('Payment setup failed')
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return (
    <div>
      <Navbar />
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
      <Footer />
    </div>
  )

  if (!game) return (
    <div>
      <Navbar />
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
        <p>Game not found.</p>
      </div>
      <Footer />
    </div>
  )

  const sections = {}
  packs.forEach(p => {
    const s = p.sectionName || 'Packages'
    if (!sections[s]) sections[s] = []
    sections[s].push(p)
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 80px', position: 'relative', zIndex: 1 }}>

        {/* Game Header */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          {game.icon && (
            <img src={`/uploads/games/${game.icon}`} alt={game.name}
              style={{ width: 60, height: 60, borderRadius: 14, objectFit: 'cover' }} />
          )}
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{game.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4, display: 'flex', gap: 12 }}>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}><Shield size={12} /> Safety Guarantee</span>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}><Zap size={12} /> Manual Delivery</span>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}><Mail size={12} /> Email Delivery</span>
            </div>
          </div>
        </div>

        {/* Step 1 - Contact / Player Info */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: theme.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff' }}>1</div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>{customFields ? 'PLAYER DETAILS' : 'CONTACT DETAILS'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {customFields ? (
              customFields.map(f => (
                <div key={f.name} className="form-group">
                  <label>{f.label} *</label>
                  <input className="form-input" type="text" placeholder={f.label}
                    value={fieldData[f.name] || ''}
                    onChange={e => setFieldData(prev => ({ ...prev, [f.name]: e.target.value }))} />
                </div>
              ))
            ) : (
              <>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input className="form-input" type="email" placeholder="your@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Phone Number (optional)</label>
                  <input className="form-input" type="tel" placeholder="+880 1XXXXXXXXX"
                    value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Note (optional)</label>
                  <input className="form-input" type="text" placeholder="Any special instructions..."
                    value={note} onChange={e => setNote(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Step 2 - Select Pack */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: theme.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff' }}>2</div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>SELECT PACKAGE</span>
          </div>

          {Object.entries(sections).map(([section, sectionPacks]) => (
            <div key={section} style={{ marginBottom: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 20, padding: '4px 16px', fontSize: 12, fontWeight: 800, color: theme.primary, letterSpacing: 1 }}>
                  <Star size={10} fill={theme.primary} /> {section.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {sectionPacks.map(pack => {
                  const selected = selectedPack?._id === pack._id
                  return (
                    <div key={pack._id} onClick={() => setSelectedPack(pack)}
                      style={{
                        background: selected ? 'rgba(249,115,22,0.15)' : 'var(--glass)',
                        border: selected ? `2px solid ${theme.primary}` : '1px solid var(--border)',
                        borderRadius: 12, padding: '14px 12px', cursor: 'pointer',
                        textAlign: 'center', transition: 'all 0.2s', position: 'relative',
                      }}>
                      {pack.oldPrice > 0 && pack.oldPrice > pack.price && (
                        <div style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '2px 6px' }}>
                          -{Math.round((1 - pack.price / pack.oldPrice) * 100)}%
                        </div>
                      )}
                      <div style={{ fontSize: 28, marginBottom: 6 }}>🎁</div>
                      <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{pack.title}</div>
                      {pack.oldPrice > 0 && pack.oldPrice > pack.price && (
                        <div style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'line-through' }}>
                          {sym}{pack.oldPrice}
                        </div>
                      )}
                      <div style={{ fontWeight: 900, fontSize: 16, color: selected ? theme.primary : 'var(--text)' }}>
                        {sym}{pack.price}
                      </div>
                      {selected && (
                        <div style={{ position: 'absolute', top: 8, left: 8, width: 18, height: 18, borderRadius: '50%', background: theme.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>✓</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Step 3 - Checkout */}
        {selectedPack && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: theme.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff' }}>3</div>
              <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>ORDER SUMMARY</span>
            </div>

            <div style={{ background: 'var(--glass)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text2)' }}>Package</span>
                <span style={{ fontWeight: 700 }}>{selectedPack.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text2)' }}>Email</span>
                <span style={{ fontWeight: 700 }}>{email || '—'}</span>
              </div>
              {phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text2)' }}>Phone</span>
                  <span style={{ fontWeight: 700 }}>{phone}</span>
                </div>
              )}
              <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800 }}>TOTAL</span>
                <span style={{ fontWeight: 900, fontSize: 20, color: theme.primary }}>{sym}{selectedPack.price}</span>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', marginBottom: 12 }}>
              📧 Your order will be delivered to your email after payment confirmation
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', marginBottom: 12, fontSize: 14 }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 16 }}
              onClick={handlePay} disabled={paying || (customFields ? !fieldData[customFields[0]?.name] : !email)}>
              {paying ? '⏳ Processing...' : `💳 Pay ${sym}${selectedPack.price}`}
            </button>
          </div>
        )}

      </div>
      <Footer />
    </div>
  )
}
