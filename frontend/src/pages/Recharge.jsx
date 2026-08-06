// src/pages/Recharge.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, Smartphone, ArrowRight, Shield, Zap, Globe, Gem, Ticket, Star, Lock, Gamepad2 } from 'lucide-react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../api/axios'
import theme from '../theme'


export default function Recharge() {
  const { gameId }     = useParams()
  const [searchParams] = useSearchParams()
  const regionSlug     = searchParams.get('region')
  const { user }       = useAuth()
  const { settings }   = useSettings()
  const navigate       = useNavigate()

  const [game, setGame]     = useState(null)
  const [region, setRegion] = useState(null)
  const [packs, setPacks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  const [playerData, setPlayerData] = useState({})
  const [verifying, setVerifying]   = useState(false)
  const [verified, setVerified]     = useState(false)
  const [username, setUsername]     = useState('')
  const [selectedPack, setSelectedPack] = useState(null)

  const packSectionRef   = useRef(null)
  const checkoutRef      = useRef(null)
  const verifyTimerRef   = useRef(null)

  const [servers, setServers]       = useState([])
  const [verifyError, setVerifyError]     = useState('')
  const [paying, setPaying]               = useState(false)
  const [couponCode, setCouponCode]       = useState('')
  const [couponApplied, setCouponApplied] = useState(null)
  const [couponError, setCouponError]     = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [payData, setPayData]     = useState(null)
  const [payStatus, setPayStatus] = useState('')

  const rawFields = region?.fields?.length ? region.fields : game?.fields
  const fields = (rawFields && rawFields.length > 0) ? rawFields : [
    { name: 'userId', label: 'User ID' },
    { name: 'zoneId', label: 'Zone ID' },
  ]

  useEffect(() => {
    Promise.all([
      api.get(`/games/${gameId}`),
      api.get(`/packs?gameId=${gameId}&region=${regionSlug || ''}`),
    ]).then(([gr, pr]) => {
      const g = gr.data
      setGame(g)
      const foundRegion = regionSlug && g.regions?.length
        ? g.regions.find(r => r.slug === regionSlug && r.active)
        : null
      setRegion(foundRegion || null)
      setPacks(pr.data)

      // Fetch server list if region has one
      if (foundRegion?.hasServerList) {
        api.get(`/recharge/servers/${gameId}?region=${regionSlug}`)
          .then(r => setServers(r.data?.servers || []))
          .catch(() => setServers([]))
      }
    }).catch(() => setError('Game not found'))
    .finally(() => setLoading(false))
  }, [gameId, regionSlug])

  const doVerify = async (pd) => {
    if (!pd[fields[0]?.name]) return
    setVerifying(true); setVerifyError('')
    try {
      const { data } = await api.post('/recharge/verify-player', {
        gameId,
        regionSlug: regionSlug || '',
        playerData: {
          userId:     pd[fields[0]?.name] || '',
          zoneId:     pd[fields[1]?.name] || '',
          serverId:   pd[fields[2]?.name] || '',
          regionSlug: regionSlug || '',
        }
      })
      setVerified(true)
      setUsername(data.username || '')
      setVerifyError('')
    } catch (err) {
      setVerified(false)
      if (err.response?.status !== 401) {
        setVerifyError(typeof err.response?.data?.message === 'string' ? err.response.data.message : 'Player not found. Check your ID and Zone ID.')
      }
    } finally { setVerifying(false) }
  }

  const scheduleVerify = (nextPd) => {
    if (verifyTimerRef.current) clearTimeout(verifyTimerRef.current)
    const userId = nextPd[fields[0]?.name]
    if (!userId || userId.length < 4) { setVerified(false); setUsername(''); setVerifyError(''); return }
    if (!user) return
    setVerified(false); setUsername(''); setVerifyError('')
    verifyTimerRef.current = setTimeout(() => doVerify(nextPd), 1500)
  }

  const handlePay = async () => {
    if (!playerData[fields[0]?.name]) return setError('Enter your Player ID')
    if (!selectedPack) return setError('Select a pack')
    if (!user) { navigate('/auth'); return }
    setPaying(true); setError('')
    try {
      const { data: ord } = await api.post('/orders', {
        gameId, packId: selectedPack._id,
        playerData: {
          userId:     playerData[fields[0]?.name] || '',
          zoneId:     playerData[fields[1]?.name] || '',
          serverId:   playerData[fields[2]?.name] || '',
          regionSlug: regionSlug || '',
        },
        couponCode: couponApplied?.code || '',
      })
      const { data: pay } = await api.post('/payment/create', {
        orderId: ord._id, amount: ord.price, customerName: user?.name || 'Customer',
      })
      setPayData(pay)
    } catch (err) {
      setError(typeof err.response?.data?.message === 'string' ? err.response.data.message : (err.message || 'Failed to create order'))
    } finally { setPaying(false) }
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    if (!selectedPack) return setCouponError('Select a pack first')
    setCouponLoading(true); setCouponError(''); setCouponApplied(null)
    try {
      const { data } = await api.post('/coupons/validate', {
        code: couponCode.trim(), price: selectedPack.price, gameId,
      })
      setCouponApplied(data)
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon')
    } finally { setCouponLoading(false) }
  }

  const removeCoupon = () => { setCouponApplied(null); setCouponCode(''); setCouponError('') }

  const finalPrice = couponApplied ? couponApplied.finalPrice : selectedPack?.price

  const pollStatus = useCallback((paymentId) => {
    const iv = setInterval(async () => {
      try {
        const { data } = await api.get(`/payment/status/${paymentId}`)
        if (data.status === 'paid') {
          clearInterval(iv); setPayStatus('paid')
          setTimeout(() => navigate('/orders'), 2500)
        } else if (data.status === 'failed' || data.status === 'expired') {
          clearInterval(iv); setPayStatus('failed')
        }
      } catch {}
    }, 4000)
    return iv
  }, [navigate])

  useEffect(() => {
    if (payData?.payment_url) {
      window.open(payData.payment_url, '_blank')
    }
  }, [payData?.payment_url])

  useEffect(() => {
    if (payData?.payment_id) {
      const iv = pollStatus(payData.payment_id)
      return () => clearInterval(iv)
    }
  }, [payData?.payment_id])

  const activeProvider   = region?.provider || packs[0]?.provider || ''
  const isFintopup       = activeProvider === 'fintopup'

  const sym = settings.currencySymbol || '$'

  if (loading) return <><Navbar /><div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" /></div></>
  if (!game)   return <><Navbar /><div style={{ textAlign: 'center', padding: 80, color: 'rgba(255,255,255,0.3)' }}>Game not found</div></>

  const displayName = region ? `${game.name} — ${region.name}` : game.name

  // Payment overlay
  if (payData) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ paddingTop: 40, paddingBottom: 64, maxWidth: 480, position: 'relative', zIndex: 1 }}>
          <div style={{
            background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.11)', borderRadius: 20,
            padding: 32, textAlign: 'center',
          }}>
            {payStatus === 'paid' ? (
              <>
                <div style={{ marginBottom: 16 }}><CheckCircle size={64} color="#22c55e" /></div>
                <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 8 }}>Payment Successful!</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Recharge is being processed automatically</div>
                <div style={{ fontSize: 13, color: theme.primary }}>Redirecting to orders…</div>
              </>
            ) : payStatus === 'failed' ? (
              <>
                <div style={{ marginBottom: 16 }}><XCircle size={64} color="#ef4444" /></div>
                <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 20 }}>Payment Failed</div>
                <button className="btn btn-primary" onClick={() => { setPayData(null); setPayStatus('') }}>Try Again</button>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 900, fontSize: 20, color: '#fff', marginBottom: 8 }}>Complete Payment</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
                  Amount: <span style={{ color: '#fff', fontSize: 28, fontWeight: 900 }}>{sym}{finalPrice || selectedPack?.price}</span>
                </div>
                {(payData.payment_url || payData.upi_intent) && (
                  <a href={payData.payment_url || payData.upi_intent} style={{
                    display: 'block', width: '100%', padding: '14px 0', borderRadius: 12,
                    background: theme.grad, color: '#fff', fontWeight: 800, fontSize: 16,
                    textDecoration: 'none', marginBottom: 16, textAlign: 'center',
                  }}>
                    <Smartphone size={16} style={{ marginRight: 8 }} /> Pay via UPI App <ArrowRight size={16} style={{ marginLeft: 8 }} />
                  </a>
                )}
                {payData.qr_code && (
                  <div style={{ marginBottom: 20 }}>
                    <img
                      src={payData.qr_code.startsWith('data:') ? payData.qr_code : `data:image/png;base64,${payData.qr_code}`}
                      alt="QR Code"
                      style={{ width: 200, height: 200, borderRadius: 12, background: '#fff', padding: 8 }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Scan with any UPI app</div>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                  <div style={{ width: 14, height: 14, border: '2px solid #a78bfa', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  Waiting for payment…
                </div>
              </>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: 24, paddingBottom: 80, maxWidth: 700, position: 'relative', zIndex: 1 }}>

        {/* Game header */}
        <div style={{
          display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24,
          background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '16px 20px',
        }}>
          {(game.icon || game.banner) ? (
            <img src={game.icon || game.banner} alt={game.name}
              style={{ width: 70, height: 70, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 70, height: 70, borderRadius: 14, background: theme.alpha(0.2), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Gamepad2 size={32} color="rgba(249,115,22,0.8)" /></div>
          )}
          <div>
            <div style={{ fontWeight: 900, fontSize: 20, color: '#fff', marginBottom: 6 }}>{displayName}</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><Shield size={12} /> Safety Guarantee</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={12} /> Instant Delivery</span>
              {region && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={12} /> {region.name} Region</span>}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#f87171', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Section 1: Player ID */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg,#ef4444,#dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 15,
            }}>1</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {fields.map(f => f.label).join(' & ')}
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 20,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: fields.length > 1 ? 'repeat(auto-fit, minmax(160px, 1fr))' : '1fr', gap: 12 }}>
              {fields.map(field => (
                field.name === 'zoneId' && servers.length > 0 ? (
                  <select
                    key={field.name}
                    className="form-input"
                    value={playerData[field.name] || ''}
                    onChange={e => {
                      const next = { ...playerData, [field.name]: e.target.value }
                      setPlayerData(next)
                      scheduleVerify(next)
                    }}
                  >
                    <option value="">Select {field.label}</option>
                    {servers.map(s => (
                      <option key={s.serverId} value={s.serverId}>{s.serverName}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    key={field.name}
                    className="form-input"
                    placeholder={field.label}
                    value={playerData[field.name] || ''}
                    onChange={e => {
                      const next = { ...playerData, [field.name]: e.target.value }
                      setPlayerData(next)
                      scheduleVerify(next)
                    }}
                  />
                )
              ))}
            </div>

            {verifying && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                Verifying player…
              </div>
            )}
            {!verifying && verified && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#4ade80' }}>
                <CheckCircle size={15} />
                {username
                  ? <span>{username}</span>
                  : <span>ID: {playerData[fields[0]?.name]}{playerData[fields[1]?.name] ? ` · ${playerData[fields[1]?.name]}` : ''}</span>
                }
              </div>
            )}
            {!verifying && verifyError && (
              <div style={{ marginTop: 12, fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                <XCircle size={13} /> {verifyError}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Select Pack */}
        <div ref={packSectionRef} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg,#ef4444,#dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 15,
            }}>2</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Select Package
            </div>
          </div>

          {packs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16, color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
              No packs available for this region yet.
            </div>
          ) : (() => {
            // Group packs by sectionName
            const sections = []
            const seen = []
            packs.forEach(pack => {
              const sec = pack.sectionName || ''
              if (!seen.includes(sec)) { seen.push(sec); sections.push(sec) }
            })
            return sections.map(sec => (
              <div key={sec || '__default'} style={{ marginBottom: 8 }}>
                {sec && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                  }}>
                    <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.07)' }} />
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      fontSize: 11, fontWeight: 800, color: '#fbbf24',
                      textTransform: 'uppercase', letterSpacing: 1,
                      background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
                      padding: '3px 12px', borderRadius: 20,
                    }}><Star size={10} fill="#fbbf24" /> {sec}</span>
                    <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.07)' }} />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                  {packs.filter(p => (p.sectionName || '') === sec).map(pack => (
                    <PackCard
                      key={pack._id} pack={pack} sym={sym}
                      selected={selectedPack?._id === pack._id}
                      onClick={() => {
                        setSelectedPack(pack)
                        setTimeout(() => {
                          checkoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }, 150)
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          })()}
        </div>

        {/* Section 3: Order Summary — appears when pack selected */}
        {selectedPack && (
          <div ref={checkoutRef} style={{ marginTop: 8, marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 900, fontSize: 15,
              }}>3</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Coupon & Summary
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden', marginBottom: 16,
            }}>
              {[
              ['Account ID', (playerData[fields[0]?.name] || '—') + (playerData[fields[1]?.name] ? ` / ${playerData[fields[1]?.name]}` : '')],
              ...(username ? [['Player Name', username]] : []),
              ['Pack', selectedPack.title],
              ['Original Price', `${sym}${selectedPack.price}`]
            ].map(([label, val]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>{label}</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{val}</span>
                </div>
              ))}
              {couponApplied && (
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(34,197,94,0.06)',
                }}>
                  <span style={{ color: '#4ade80', fontSize: 14, display: 'flex', alignItems: 'center', gap: 5 }}><Ticket size={13} /> Coupon ({couponApplied.code})</span>
                  <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 14 }}>-{sym}{couponApplied.discount}</span>
                </div>
              )}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 20px', background: theme.alpha(0.08),
                borderTop: `1px solid ${theme.alpha(0.2)}`,
              }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: 1 }}>TOTAL</span>
                <span style={{ color: theme.primary, fontWeight: 900, fontSize: 22 }}>{sym}{finalPrice}</span>
              </div>
            </div>

            {/* Coupon Input */}
            {!couponApplied ? (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                      padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none',
                    }}
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                  />
                  <button onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} style={{
                    padding: '11px 18px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                    background: theme.grad, border: 'none', color: '#fff',
                    cursor: couponLoading || !couponCode.trim() ? 'not-allowed' : 'pointer',
                    opacity: couponLoading || !couponCode.trim() ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                  }}>{couponLoading ? '…' : 'Apply'}</button>
                </div>
                {couponError && <div style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>{couponError}</div>}
              </div>
            ) : (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 14,
              }}>
                <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 700 }}>✓ {couponApplied.message}</span>
                <button onClick={removeCoupon} style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                  fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1,
                }}>×</button>
              </div>
            )}

            {settings.purchasesEnabled === false ? (
              <div style={{
                width: '100%', padding: '16px', borderRadius: 14, textAlign: 'center',
                fontWeight: 800, fontSize: 15, color: '#f87171',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              }}>
                Purchases are temporarily disabled. Please check back soon.
              </div>
            ) : (
              <button
                onClick={handlePay}
                disabled={!playerData[fields[0]?.name] || paying}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14, cursor: 'pointer',
                  fontWeight: 900, fontSize: 17, letterSpacing: 0.5,
                  background: theme.grad,
                  border: '1px solid rgba(249,115,22,0.3)', color: '#fff',
                  opacity: (!playerData[fields[0]?.name] || paying) ? 0.5 : 1,
                  boxShadow: '0 0 30px rgba(249,115,22,0.4)',
                }}
              >
                {paying ? 'Processing…' : !user ? <><Lock size={14} style={{ marginRight: 6 }} />Login to Checkout</> : <>Proceed to Checkout <ArrowRight size={14} style={{ marginLeft: 6 }} /></>}
              </button>
            )}
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Lock size={11} /> Secure payment
            </div>
          </div>
        )}

      </div>
      <Footer />
    </>
  )
}

function PackCard({ pack, sym, selected, onClick }) {
  const [hovered, setHovered] = useState(false)
  const discount = pack.oldPrice > pack.price
    ? Math.round((1 - pack.price / pack.oldPrice) * 100)
    : 0

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16, cursor: 'pointer', position: 'relative', overflow: 'hidden',
        background: selected
          ? 'linear-gradient(145deg,rgba(249,115,22,0.25),rgba(234,106,16,0.2))'
          : hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
        border: `2px solid ${selected ? theme.primary : hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.09)'}`,
        transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
        boxShadow: selected ? '0 0 24px rgba(249,115,22,0.4)' : hovered ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
        padding: '14px 12px 12px',
      }}
    >
      {/* Discount badge - top right like screenshot */}
      {discount > 0 && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'linear-gradient(135deg,#ef4444,#dc2626)',
          color: '#fff', fontSize: 10, fontWeight: 900,
          padding: '3px 7px', borderRadius: 20,
          boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
        }}>-{discount}%</div>
      )}

      {/* Pack image or floating diamond emoji */}
      <div style={{
        textAlign: 'center', marginBottom: 6, marginTop: 4,
        animation: hovered ? 'floatUp 0.6s ease-in-out infinite alternate' : 'floatDown 0.6s ease-in-out infinite alternate',
        filter: selected ? 'drop-shadow(0 0 8px rgba(249,115,22,0.8))' : 'none',
        transition: 'filter 0.2s',
      }}>
        {pack.image ? (
          <img src={pack.image} alt={pack.title} style={{
            width: pack.diamonds >= 1000 ? 52 : 40,
            height: pack.diamonds >= 1000 ? 52 : 40,
            objectFit: 'contain', display: 'inline-block',
          }} />
        ) : (
          <Gem size={pack.diamonds >= 1000 ? 32 : pack.diamonds >= 300 ? 28 : 24} color="#a78bfa" />
        )}
      </div>

      {/* Price row — big price + old price struck */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexWrap: 'wrap' }}>
          <span style={{
            fontWeight: 900, fontSize: 16,
            color: selected ? theme.primary : '#fff',
            transition: 'color 0.15s',
            wordBreak: 'break-all',
          }}>{sym}{Number(pack.price).toFixed(0)}</span>
          {pack.oldPrice > pack.price && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through' }}>
              {sym}{pack.oldPrice}
            </span>
          )}
        </div>
      </div>

      {/* Pack title — set by admin */}
      <div style={{ fontWeight: 900, color: '#fff', fontSize: 13, marginBottom: 2, lineHeight: 1.3 }}>
        {pack.title}
      </div>

      {/* Bonus */}
      {pack.bonus > 0 && (
        <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, marginBottom: 2 }}>
          +{pack.bonus} Bonus
        </div>
      )}

      {/* Selected checkmark */}
      {selected && (
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          width: 18, height: 18, borderRadius: '50%',
          background: theme.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#fff', fontWeight: 900,
        }}>✓</div>
      )}

      <style>{`
        @keyframes floatUp   { from { transform: translateY(0px); } to { transform: translateY(-5px); } }
        @keyframes floatDown { from { transform: translateY(-5px); } to { transform: translateY(0px); } }
      `}</style>
    </div>
  )
}