// src/pages/Wallet.jsx
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Wallet, ArrowUpCircle, Clock, CheckCircle, XCircle, RefreshCw, Copy } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { id: 'balance',  label: 'Balance' },
  { id: 'topup',    label: 'Add Money' },
  { id: 'history',  label: 'History' },
]

const TOPUP_AMOUNTS = [5000, 10000, 20000, 50000, 100000] // paise

function fmt(paise) {
  return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })
}

function txIcon(type) {
  if (type === 'topup' || type === 'credit' || type === 'refund' || type === 'redeem') return '+'
  return '−'
}

function txColor(type) {
  if (type === 'topup' || type === 'credit' || type === 'refund' || type === 'redeem') return '#4ade80'
  return '#f87171'
}

function txLabel(type) {
  return { topup: 'Topup', credit: 'Credit', debit: 'Debit', redeem: 'Redeem', refund: 'Refund' }[type] || type
}

const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 18, padding: 24, marginBottom: 16,
}

const inp = {
  width: '100%', background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12, padding: '12px 16px',
  color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box',
}

export default function WalletPage() {
  const { user, walletBalance, walletStatus, refreshWallet, isReseller } = useAuth()
  const [params] = useSearchParams()
  const [tab, setTab]             = useState(params.get('topup') === 'success' ? 'history' : 'balance')
  const [topupSuccess, setTopupSuccess] = useState(params.get('topup') === 'success')

  // Topup state
  const [amount, setAmount]       = useState('')
  const [topupLoading, setTopupLoading] = useState(false)
  const [topupErr, setTopupErr]   = useState('')
  const [topupResult, setTopupResult] = useState(null) // { payment_url, qr_code, upi_intent, payment_id }

  // Redeem code state
  const [code, setCode]           = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemMsg, setRedeemMsg] = useState('')
  const [redeemErr, setRedeemErr] = useState('')

  // History state
  const [txs, setTxs]             = useState([])
  const [txPage, setTxPage]       = useState(1)
  const [txTotal, setTxTotal]     = useState(0)
  const [txLoading, setTxLoading] = useState(false)

  const amountPaise = Math.round(parseFloat(amount || 0) * 100)

  const loadTxs = useCallback(async (page = 1) => {
    setTxLoading(true)
    try {
      const { data } = await api.get(`/wallet/transactions?page=${page}&limit=20`)
      setTxs(data.items || [])
      setTxTotal(data.total || 0)
      setTxPage(page)
    } catch {}
    setTxLoading(false)
  }, [])

  useEffect(() => {
    if (tab === 'history') loadTxs(1)
    if (tab === 'balance') refreshWallet()
  }, [tab])

  const handleTopup = async e => {
    e.preventDefault()
    setTopupErr(''); setTopupResult(null)
    if (!amountPaise || amountPaise < 2000) return setTopupErr('Minimum topup is ₹20')
    setTopupLoading(true)
    try {
      const { data } = await api.post('/wallet/topup', { amount: amountPaise })
      setTopupResult(data)
    } catch (err) {
      setTopupErr(err.response?.data?.message || 'Failed to create payment')
    } finally { setTopupLoading(false) }
  }

  const handleRedeem = async e => {
    e.preventDefault()
    setRedeemMsg(''); setRedeemErr('')
    if (!code.trim()) return setRedeemErr('Enter a code')
    setRedeemLoading(true)
    try {
      const { data } = await api.post('/wallet/redeem', { code: code.trim() })
      setRedeemMsg(data.message || 'Code redeemed!')
      setCode('')
      refreshWallet()
    } catch (err) {
      setRedeemErr(err.response?.data?.message || 'Redemption failed')
    } finally { setRedeemLoading(false) }
  }

  return (
    <>
      <Navbar />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 520 }}>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg,#6d28d9,#4c00b0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Wallet size={18} color="#fff" />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>My Wallet</h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Secure in-app balance</p>
          </div>

          {/* Balance card (always visible) */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(76,0,176,0.28) 0%, rgba(30,10,80,0.9) 100%)',
            border: '1px solid rgba(120,40,255,0.3)',
            borderRadius: 20, padding: '24px 24px', marginBottom: 20,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 180, height: 180,
              background: 'radial-gradient(circle, rgba(120,40,255,0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Available Balance
            </div>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 6 }}>
              {fmt(walletBalance)}
            </div>
            {walletStatus === 'blocked' && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171',
              }}>
                <XCircle size={12} /> Wallet Blocked
              </div>
            )}
            {walletStatus === 'active' && (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Active</div>
            )}
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 6, marginBottom: 24,
            background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 4,
          }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setTopupResult(null) }} style={{
                flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                background: tab === t.id ? 'rgba(120,40,255,0.25)' : 'transparent',
                color: tab === t.id ? '#c084fc' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.15s',
              }}>{t.label}</button>
            ))}
          </div>

          {/* ── Balance Tab ── */}
          {tab === 'balance' && (
            <div>
              {topupSuccess && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px',
                  borderRadius: 14, marginBottom: 16,
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                  color: '#4ade80', fontSize: 14, fontWeight: 600,
                }}>
                  <CheckCircle size={18} /> Topup successful! Your balance has been updated.
                </div>
              )}
              <div style={card}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 16 }}>Quick Actions</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setTab('topup')} style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: 'linear-gradient(135deg,#6d28d9,#4c00b0)',
                    border: '1px solid rgba(120,40,255,0.4)', color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <ArrowUpCircle size={16} /> Add Money
                  </button>
                  <button onClick={() => setTab('history')} style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <Clock size={16} /> History
                  </button>
                </div>
              </div>

              {isReseller && (
                <div style={card}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 14 }}>Redeem Code</div>
                  <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input
                      style={{ ...inp, letterSpacing: 2, textTransform: 'uppercase' }}
                      placeholder="Enter code…"
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                    />
                    {redeemMsg && <div style={{ color: '#4ade80', fontSize: 13, background: 'rgba(34,197,94,0.08)', padding: '8px 12px', borderRadius: 8 }}>{redeemMsg}</div>}
                    {redeemErr && <div style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8 }}>{redeemErr}</div>}
                    <button type="submit" disabled={redeemLoading} style={{
                      padding: '12px 0', borderRadius: 12, fontWeight: 800, fontSize: 14,
                      background: 'rgba(120,40,255,0.2)', border: '1px solid rgba(120,40,255,0.4)',
                      color: '#c084fc', cursor: 'pointer', opacity: redeemLoading ? 0.7 : 1,
                    }}>{redeemLoading ? 'Redeeming…' : 'Redeem'}</button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ── Add Money Tab ── */}
          {tab === 'topup' && (
            <div>
              {!topupResult ? (
                <div style={card}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 18 }}>Add Money to Wallet</div>

                  {/* Quick amount pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {TOPUP_AMOUNTS.map(p => (
                      <button key={p} onClick={() => setAmount((p / 100).toString())} style={{
                        padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                        background: amountPaise === p ? 'rgba(120,40,255,0.3)' : 'rgba(255,255,255,0.06)',
                        border: amountPaise === p ? '1px solid rgba(120,40,255,0.6)' : '1px solid rgba(255,255,255,0.1)',
                        color: amountPaise === p ? '#c084fc' : 'rgba(255,255,255,0.6)', cursor: 'pointer',
                      }}>
                        {fmt(p)}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleTopup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>
                        AMOUNT (₹)
                      </label>
                      <input
                        style={inp}
                        type="number"
                        min="20"
                        max="10000"
                        step="1"
                        placeholder="Enter amount…"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                      />
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                        Min ₹20 · Max ₹10,000
                      </div>
                    </div>

                    {topupErr && <div style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: 10 }}>{topupErr}</div>}

                    <button type="submit" disabled={topupLoading || walletStatus === 'blocked'} style={{
                      padding: '14px 0', borderRadius: 12, fontWeight: 800, fontSize: 15,
                      background: 'linear-gradient(135deg,#6d28d9,#4c00b0)',
                      border: '1px solid rgba(120,40,255,0.4)', color: '#fff',
                      cursor: (topupLoading || walletStatus === 'blocked') ? 'not-allowed' : 'pointer',
                      opacity: topupLoading ? 0.7 : 1,
                    }}>
                      {topupLoading ? 'Creating payment…' : walletStatus === 'blocked' ? 'Wallet Blocked' : `Pay ${amount ? fmt(amountPaise) : ''}`.trim()}
                    </button>
                  </form>
                </div>
              ) : (
                /* Payment created — show QR / UPI / link */
                <div style={card}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ color: '#a78bfa', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Pay to top up wallet</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{fmt(amountPaise)}</div>
                  </div>

                  {topupResult.qr_code && (
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                      <img
                        src={`data:image/png;base64,${topupResult.qr_code}`}
                        alt="QR Code"
                        style={{ width: 180, height: 180, borderRadius: 12, background: '#fff', padding: 8 }}
                      />
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>Scan with any UPI app</div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {topupResult.upi_intent && (
                      <a href={topupResult.upi_intent} style={{
                        display: 'block', textAlign: 'center', padding: '13px 0', borderRadius: 12,
                        fontWeight: 800, fontSize: 14,
                        background: 'linear-gradient(135deg,#22c55e,#16a34a)',
                        border: 'none', color: '#fff', textDecoration: 'none',
                      }}>
                        Open UPI App
                      </a>
                    )}
                    <a href={topupResult.payment_url} target="_blank" rel="noreferrer" style={{
                      display: 'block', textAlign: 'center', padding: '13px 0', borderRadius: 12,
                      fontWeight: 800, fontSize: 14,
                      background: 'linear-gradient(135deg,#6d28d9,#4c00b0)',
                      border: '1px solid rgba(120,40,255,0.4)', color: '#fff', textDecoration: 'none',
                    }}>
                      Open Payment Page
                    </a>
                    <button onClick={() => { setTopupResult(null); setAmount('') }} style={{
                      padding: '11px 0', borderRadius: 12, fontWeight: 700, fontSize: 14,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                    }}>
                      Cancel / Enter different amount
                    </button>
                  </div>

                  <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 16 }}>
                    Payment is processed securely via NovaPay.<br />Balance updates automatically after payment.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── History Tab ── */}
          {tab === 'history' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{txTotal} transactions</div>
                <button onClick={() => loadTxs(1)} disabled={txLoading} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '6px 12px', color: 'rgba(255,255,255,0.5)', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer',
                }}>
                  <RefreshCw size={12} style={{ animation: txLoading ? 'spin 1s linear infinite' : 'none' }} />
                  Refresh
                </button>
              </div>

              {txLoading && txs.length === 0 && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px 0', fontSize: 14 }}>Loading…</div>
              )}

              {!txLoading && txs.length === 0 && (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: '40px 0' }}>
                  <Clock size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <div style={{ fontSize: 14 }}>No transactions yet</div>
                </div>
              )}

              {txs.map(tx => (
                <div key={tx._id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 14, marginBottom: 8,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    background: txColor(tx.type) === '#4ade80' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 900, color: txColor(tx.type),
                  }}>
                    {txIcon(tx.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{txLabel(tx.type)}</div>
                    {tx.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>}
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                      {new Date(tx.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 15, color: txColor(tx.type) }}>
                      {txIcon(tx.type)}{fmt(tx.amount)}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
                      Bal: {fmt(tx.balanceAfter)}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {txTotal > 20 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                  <button onClick={() => loadTxs(txPage - 1)} disabled={txPage === 1 || txLoading} style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)', cursor: txPage === 1 ? 'not-allowed' : 'pointer',
                  }}>← Prev</button>
                  <span style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                    Page {txPage}
                  </span>
                  <button onClick={() => loadTxs(txPage + 1)} disabled={txPage * 20 >= txTotal || txLoading} style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)', cursor: txPage * 20 >= txTotal ? 'not-allowed' : 'pointer',
                  }}>Next →</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
