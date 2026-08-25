// src/pages/ManualOrder.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { useCurrency } from '../context/CurrencyContext'
import { Shield, Zap, Mail, Star, Wallet } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../api/axios'
import theme from '../theme'

export default function ManualOrder() {
  const { gameId }     = useParams()
  const [searchParams] = useSearchParams()
  const regionSlug     = searchParams.get('region')
  const { user, isReseller, walletBalance, walletStatus, refreshWallet } = useAuth()
  const { settings }   = useSettings()
  const { fmt, fmtP }  = useCurrency()
  const navigate       = useNavigate()

  const [game, setGame]       = useState(null)
  const [packs, setPacks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPack, setSelectedPack] = useState(null)
  const [fieldData, setFieldData] = useState({})
  const [email, setEmail]     = useState(user?.email || '')
  const [phone, setPhone]     = useState('')
  const [note, setNote]       = useState('')
  const [paying, setPaying]     = useState(false)
  const [error, setError]       = useState('')
  const [paySuccess, setPaySuccess] = useState(null) // { packName, amount }
  const [payMethod, setPayMethod]   = useState('upi')

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

  function buildOrderPayload() {
    return {
      gameId,
      packId: selectedPack._id,
      playerData: customFields
        ? { ...fieldData, regionSlug: regionSlug || '', orderType: 'manual' }
        : { email, phone, note, regionSlug: regionSlug || '', orderType: 'manual' },
      regionSlug: regionSlug || '',
    }
  }

  function validateFields() {
    if (!selectedPack) { setError('Please select a package'); return false }
    if (customFields) {
      if (!fieldData[customFields[0]?.name]) { setError(`${customFields[0]?.label} is required`); return false }
    } else {
      if (!email) { setError('Email is required'); return false }
    }
    return true
  }

  const handlePay = async () => {
    if (!validateFields()) return
    setPaying(true); setError('')
    try {
      const { data } = await api.post('/orders', buildOrderPayload())
      const pay = await api.post('/payment/create', { orderId: data._id })
      if (pay.data.payment_url) {
        window.location.href = pay.data.payment_url
      } else {
        setError('Payment setup failed')
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong')
    } finally { setPaying(false) }
  }

  const handleWalletPay = async () => {
    if (!validateFields()) return
    setPaying(true); setError('')
    try {
      const dp = (isReseller && selectedPack.resellerPrice > 0) ? selectedPack.resellerPrice : selectedPack.price
      await api.post('/orders', { ...buildOrderPayload(), paymentMethod: 'wallet' })
      await refreshWallet()
      setPaySuccess({ packName: selectedPack.title, amount: dp })
      setTimeout(() => navigate('/orders'), 3000)
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong')
    } finally { setPaying(false) }
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
            <img src={game.icon} alt={game.name}
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
                      {(() => {
                        const dp = (isReseller && pack.resellerPrice > 0) ? pack.resellerPrice : pack.price
                        const showDiscount = !isReseller && pack.oldPrice > 0 && pack.oldPrice > pack.price
                        return (<>
                          {showDiscount && (
                            <div style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '2px 6px' }}>
                              -{Math.round((1 - pack.price / pack.oldPrice) * 100)}%
                            </div>
                          )}
                          <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center' }}>
                            {pack.image
                              ? <img src={pack.image} alt={pack.title} style={{ width: 44, height: 44, objectFit: 'contain' }} />
                              : <span style={{ fontSize: 28 }}>🎁</span>}
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{pack.title}</div>
                          {isReseller && pack.resellerPrice > 0 ? (
                            <div style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'line-through' }}>{fmt(pack.price, 0)}</div>
                          ) : (showDiscount && (
                            <div style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'line-through' }}>{fmt(pack.oldPrice, 0)}</div>
                          ))}
                          <div style={{ fontWeight: 900, fontSize: 16, color: selected ? theme.primary : 'var(--text)' }}>
                            {fmt(dp, 0)}
                          </div>
                          {isReseller && pack.resellerPrice > 0 && (
                            <div style={{ fontSize: 10, color: '#a5b4fc', fontWeight: 700 }}>Reseller Price</div>
                          )}
                        </>)
                      })()}
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
              {customFields ? (
                customFields.map(f => fieldData[f.name] ? (
                  <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text2)' }}>{f.label}</span>
                    <span style={{ fontWeight: 700 }}>{fieldData[f.name]}</span>
                  </div>
                ) : null)
              ) : (
                <>
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
                </>
              )}
              <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
              {(() => {
                const dp = (isReseller && selectedPack.resellerPrice > 0) ? selectedPack.resellerPrice : selectedPack.price
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800 }}>TOTAL</span>
                    <span style={{ fontWeight: 900, fontSize: 20, color: theme.primary }}>{fmt(dp, 0)}</span>
                  </div>
                )
              })()}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', marginBottom: 12 }}>
              {customFields
                ? 'Your order will be processed manually after payment confirmation'
                : '📧 Your order will be delivered to your email after payment confirmation'}
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', marginBottom: 12, fontSize: 14 }}>
                {error}
              </div>
            )}

            {paySuccess ? (
              <div style={{
                textAlign: 'center', padding: '28px 20px',
                background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14,
              }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div style={{ fontWeight: 900, fontSize: 20, color: '#fff', marginBottom: 6 }}>Order Placed!</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 }}>{paySuccess.packName} · {fmt(paySuccess.amount, 0)}</div>
                <div style={{ color: '#4ade80', fontSize: 13, marginBottom: 20 }}>Paid from wallet · Balance updated</div>
                <button className="btn btn-primary" onClick={() => navigate('/orders')} style={{ padding: '10px 28px' }}>
                  View Orders
                </button>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 12 }}>Redirecting in 3 seconds…</div>
              </div>
            ) : (
              (() => {
                const dp         = (isReseller && selectedPack.resellerPrice > 0) ? selectedPack.resellerPrice : selectedPack.price
                const pricePaise = Math.round(dp * 100)
                const walletOk   = walletStatus !== 'blocked' && walletBalance >= pricePaise
                const fieldOk    = customFields ? !!fieldData[customFields[0]?.name] : !!email
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Section divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2 }}>Payment Method</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Wallet option */}
                      <button type="button" onClick={() => walletOk && setPayMethod('wallet')} disabled={!walletOk} style={{
                        width: '100%', padding: '16px 18px', borderRadius: 16,
                        cursor: walletOk ? 'pointer' : 'not-allowed',
                        background: payMethod === 'wallet'
                          ? 'linear-gradient(135deg, rgba(109,40,217,0.22) 0%, rgba(76,0,176,0.14) 100%)'
                          : 'rgba(255,255,255,0.035)',
                        border: `1.5px solid ${payMethod === 'wallet' ? 'rgba(139,92,246,0.55)' : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: payMethod === 'wallet' ? '0 0 20px rgba(109,40,217,0.18), inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
                        display: 'flex', alignItems: 'center', gap: 14,
                        opacity: walletOk ? 1 : 0.4, transition: 'all 0.2s',
                        backdropFilter: 'blur(10px)',
                      }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                          background: payMethod === 'wallet' ? 'linear-gradient(135deg,#7c3aed,#4c00b0)' : 'rgba(255,255,255,0.07)',
                          border: `1px solid ${payMethod === 'wallet' ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: payMethod === 'wallet' ? '0 4px 12px rgba(109,40,217,0.35)' : 'none',
                        }}>
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={payMethod === 'wallet' ? '#e9d5ff' : 'rgba(255,255,255,0.45)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: payMethod === 'wallet' ? '#e9d5ff' : 'rgba(255,255,255,0.75)' }}>Wallet</div>
                          <div style={{ fontSize: 12, color: payMethod === 'wallet' ? '#a78bfa' : 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                            {walletStatus === 'blocked' ? 'Wallet blocked' : `${fmtP(walletBalance)} available`}
                          </div>
                        </div>
                        {walletOk && payMethod !== 'wallet' && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>Instant</span>
                        )}
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: payMethod === 'wallet' ? 'linear-gradient(135deg,#7c3aed,#4c00b0)' : 'transparent',
                          border: `2px solid ${payMethod === 'wallet' ? '#a78bfa' : 'rgba(255,255,255,0.2)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}>
                          {payMethod === 'wallet' && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </button>

                      {/* UPI option */}
                      <button type="button" onClick={() => setPayMethod('upi')} style={{
                        width: '100%', padding: '16px 18px', borderRadius: 16, cursor: 'pointer',
                        background: payMethod === 'upi'
                          ? 'linear-gradient(135deg, rgba(249,115,22,0.14) 0%, rgba(234,88,12,0.08) 100%)'
                          : 'rgba(255,255,255,0.035)',
                        border: `1.5px solid ${payMethod === 'upi' ? 'rgba(249,115,22,0.45)' : 'rgba(255,255,255,0.08)'}`,
                        boxShadow: payMethod === 'upi' ? '0 0 20px rgba(249,115,22,0.15), inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
                        display: 'flex', alignItems: 'center', gap: 14,
                        transition: 'all 0.2s', backdropFilter: 'blur(10px)',
                      }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                          background: payMethod === 'upi' ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'rgba(255,255,255,0.07)',
                          border: `1px solid ${payMethod === 'upi' ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: payMethod === 'upi' ? '0 4px 12px rgba(249,115,22,0.3)' : 'none',
                        }}>
                          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={payMethod === 'upi' ? '#fff' : 'rgba(255,255,255,0.45)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/>
                            <line x1="6" y1="15" x2="10" y2="15"/><line x1="13" y1="15" x2="16" y2="15"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: payMethod === 'upi' ? '#fed7aa' : 'rgba(255,255,255,0.75)' }}>UPI / Online Payment</div>
                          <div style={{ fontSize: 12, color: payMethod === 'upi' ? '#fb923c' : 'rgba(255,255,255,0.35)', marginTop: 2 }}>UPI · Cards · Net banking</div>
                        </div>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                          background: payMethod === 'upi' ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'transparent',
                          border: `2px solid ${payMethod === 'upi' ? '#f97316' : 'rgba(255,255,255,0.2)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s',
                        }}>
                          {payMethod === 'upi' && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                      </button>
                    </div>

                    <button className="btn btn-primary" style={{ width: '100%', padding: 15, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      onClick={payMethod === 'wallet' ? handleWalletPay : handlePay}
                      disabled={paying || !fieldOk}>
                      {paying ? 'Processing…' : payMethod === 'wallet' ? `Pay ${fmt(dp, 0)} from Wallet` : `Pay ${fmt(dp, 0)}`}
                    </button>
                  </div>
                )
              })()
            )}
          </div>
        )}

      </div>
      <Footer />
    </div>
  )
}
