// src/admin/AdminWallet.jsx
import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { Search, RefreshCw, Plus, ArrowLeft, Copy } from 'lucide-react'

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

const TABS = [
  { id: 'users',  label: 'User Wallets' },
  { id: 'codes',  label: 'Redeem Codes' },
  { id: 'audit',  label: 'Audit Log' },
]

function fmt(paise) {
  if (paise == null) return '₹0.00'
  return '₹' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })
}

const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14, padding: 20, marginBottom: 16,
}

const inp = {
  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none', width: '100%',
  boxSizing: 'border-box',
}

const btn = (variant = 'default') => ({
  padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
  border: 'none',
  ...(variant === 'primary'  ? { background: 'linear-gradient(135deg,#6d28d9,#4c00b0)', color: '#fff' } :
      variant === 'danger'   ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' } :
      variant === 'success'  ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' } :
      variant === 'ghost'    ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' } :
      { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }),
})

// ── User Wallets Tab ─────────────────────────────────────────
function UsersTab() {
  const isMobile = useIsMobile()
  const [q, setQ]             = useState('')
  const [users, setUsers]     = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null) // userId for detail panel
  const [detail, setDetail]   = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Action form state
  const [action, setAction]   = useState('') // credit | debit | block | unblock
  const [amount, setAmount]   = useState('')
  const [reason, setReason]   = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [actionErr, setActionErr] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const load = useCallback(async (pg = 1, query = q) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/wallet?page=${pg}&q=${encodeURIComponent(query)}`)
      setUsers(data.users || [])
      setTotal(data.total || 0)
      setPage(pg)
    } catch {}
    setLoading(false)
  }, [q])

  useEffect(() => { load(1) }, [])

  const loadDetail = async (userId) => {
    setSelected(userId)
    setDetail(null)
    setAction(''); setAmount(''); setReason(''); setActionMsg(''); setActionErr('')
    setDetailLoading(true)
    try {
      const { data } = await api.get(`/admin/wallet/${userId}`)
      setDetail(data)
    } catch {}
    setDetailLoading(false)
  }

  const handleAction = async () => {
    setActionMsg(''); setActionErr('')
    if (!reason.trim()) return setActionErr('Reason is required')

    let url = `/admin/wallet/${selected}/${action}`
    const body = { reason: reason.trim() }
    if (action === 'credit' || action === 'debit') {
      const paise = Math.round(parseFloat(amount) * 100)
      if (!paise || paise <= 0) return setActionErr('Enter a valid amount')
      body.amount = paise
    }

    setActionLoading(true)
    try {
      await api.post(url, body)
      setActionMsg(`${action} successful`)
      setAmount(''); setReason(''); setAction('')
      await loadDetail(selected)
      load(page)
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Action failed')
    } finally { setActionLoading(false) }
  }

  // On mobile: show detail panel OR list, not both
  const showList   = !isMobile || !selected
  const showDetail = !!selected

  return (
    <div style={!isMobile && selected ? { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 } : {}}>
      {/* User list */}
      {showList && (
      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
            <input
              style={{ ...inp, paddingLeft: 32 }}
              placeholder="Search by email or name…"
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load(1, q)}
            />
          </div>
          <button onClick={() => load(1, q)} style={btn('primary')}>Search</button>
          <button onClick={() => load(page)} style={btn('ghost')}><RefreshCw size={13} /></button>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>{total} users</div>

        {loading && <div style={{ color: 'rgba(255,255,255,0.3)', padding: 20, textAlign: 'center' }}>Loading…</div>}

        {users.map(u => (
          <div key={u._id} onClick={() => loadDetail(u._id)} style={{
            ...card, cursor: 'pointer', marginBottom: 8, padding: '14px 18px',
            border: selected === u._id ? '1px solid rgba(120,40,255,0.5)' : '1px solid rgba(255,255,255,0.07)',
            transition: 'border-color 0.15s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 2 }}>{u.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{u.email}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{u.role}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 15, color: '#a78bfa' }}>{fmt(u.walletBalance)}</div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: u.walletStatus === 'blocked' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)',
                  color: u.walletStatus === 'blocked' ? '#f87171' : '#4ade80',
                  border: u.walletStatus === 'blocked' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.2)',
                }}>{u.walletStatus || 'active'}</span>
              </div>
            </div>
          </div>
        ))}

        {total > 50 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
            <button onClick={() => load(page - 1)} disabled={page === 1} style={btn('ghost')}>← Prev</button>
            <span style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Page {page}</span>
            <button onClick={() => load(page + 1)} disabled={page * 50 >= total} style={btn('ghost')}>Next →</button>
          </div>
        )}
      </div>
      )}

      {/* Detail panel */}
      {showDetail && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>
              {isMobile ? (
                <button onClick={() => setSelected(null)} style={{ ...btn('ghost'), display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px' }}>
                  <ArrowLeft size={14} /> Back
                </button>
              ) : 'Wallet Detail'}
            </div>
            {!isMobile && <button onClick={() => setSelected(null)} style={btn('ghost')}>✕</button>}
          </div>

          {detailLoading && <div style={{ color: 'rgba(255,255,255,0.3)', padding: 20, textAlign: 'center' }}>Loading…</div>}

          {detail && (
            <>
              <div style={{ ...card, padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{detail.user.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{detail.user.email}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#a78bfa', marginBottom: 4 }}>{fmt(detail.user.walletBalance)}</div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: detail.user.walletStatus === 'blocked' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)',
                  color: detail.user.walletStatus === 'blocked' ? '#f87171' : '#4ade80',
                  border: detail.user.walletStatus === 'blocked' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.2)',
                }}>{detail.user.walletStatus || 'active'}</span>
                {detail.user.walletBlockReason && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#f87171' }}>Block reason: {detail.user.walletBlockReason}</div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                {[
                  { id: 'credit', label: 'Credit', variant: 'success' },
                  { id: 'debit',  label: 'Debit',  variant: 'danger' },
                  detail.user.walletStatus === 'blocked'
                    ? { id: 'unblock', label: 'Unblock', variant: 'success' }
                    : { id: 'block',   label: 'Block',   variant: 'danger' },
                ].map(a => (
                  <button key={a.id} onClick={() => { setAction(action === a.id ? '' : a.id); setActionMsg(''); setActionErr('') }}
                    style={{ ...btn(a.variant), background: action === a.id ? undefined : 'rgba(255,255,255,0.05)' }}>
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Action form */}
              {action && (
                <div style={{ ...card, padding: '14px 16px', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {action.toUpperCase()} WALLET
                  </div>
                  {(action === 'credit' || action === 'debit') && (
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Amount (₹)</label>
                      <input style={inp} type="number" min="1" placeholder="e.g. 100" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                  )}
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Reason *</label>
                    <input style={inp} placeholder="Required reason…" value={reason} onChange={e => setReason(e.target.value)} />
                  </div>
                  {actionMsg && <div style={{ color: '#4ade80', fontSize: 12, marginBottom: 8 }}>✓ {actionMsg}</div>}
                  {actionErr && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>{actionErr}</div>}
                  <button onClick={handleAction} disabled={actionLoading} style={{ ...btn('primary'), width: '100%' }}>
                    {actionLoading ? 'Processing…' : `Confirm ${action}`}
                  </button>
                </div>
              )}

              {/* Recent transactions */}
              <div style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Recent Transactions ({detail.total})
              </div>
              {detail.transactions.slice(0, 10).map(tx => (
                <div key={tx._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 5,
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#fff', textTransform: 'capitalize' }}>{tx.type}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{new Date(tx.createdAt).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: ['credit','topup','refund','redeem'].includes(tx.type) ? '#4ade80' : '#f87171' }}>
                      {['credit','topup','refund','redeem'].includes(tx.type) ? '+' : '−'}{fmt(tx.amount)}
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>bal: {fmt(tx.balanceAfter)}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Redeem Codes Tab ─────────────────────────────────────────
function CodesTab() {
  const [codes, setCodes]     = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter]   = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newCodes, setNewCodes]     = useState([]) // returned plaintext codes

  // Create form
  const [count,   setCount]   = useState('1')
  const [value,   setValue]   = useState('')
  const [expires, setExpires] = useState('')
  const [note,    setNote]    = useState('')
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')

  const load = useCallback(async (pg = 1, status = filter) => {
    setLoading(true)
    try {
      const q = status ? `&status=${status}` : ''
      const { data } = await api.get(`/admin/wallet/codes?page=${pg}${q}`)
      setCodes(data.codes || [])
      setTotal(data.total || 0)
      setPage(pg)
    } catch {}
    setLoading(false)
  }, [filter])

  useEffect(() => { load(1) }, [])

  const handleCreate = async () => {
    setCreateErr('')
    const paise = Math.round(parseFloat(value) * 100)
    if (!paise || paise <= 0) return setCreateErr('Enter a valid value (₹)')
    setCreating(true)
    try {
      const { data } = await api.post('/admin/wallet/codes', {
        count: parseInt(count) || 1,
        value: paise,
        expiresAt: expires || null,
        batchNote: note,
      })
      setNewCodes(data.codes || [])
      setShowCreate(false)
      setCount('1'); setValue(''); setExpires(''); setNote('')
      load(1)
    } catch (err) {
      setCreateErr(err.response?.data?.message || 'Failed')
    } finally { setCreating(false) }
  }

  const disableCode = async (id) => {
    if (!window.confirm('Disable this code?')) return
    try { await api.put(`/admin/wallet/codes/${id}/disable`); load(page) } catch {}
  }

  const copyAll = () => navigator.clipboard.writeText(newCodes.join('\n'))

  return (
    <div>
      {/* New codes display */}
      {newCodes.length > 0 && (
        <div style={{ ...card, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#4ade80' }}>✓ {newCodes.length} codes generated — copy now, won't show again</div>
            <button onClick={copyAll} style={{ ...btn('success'), display: 'flex', alignItems: 'center', gap: 5 }}>
              <Copy size={12} /> Copy All
            </button>
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '12px 14px',
            fontFamily: 'monospace', fontSize: 13, color: '#a7f3d0',
            maxHeight: 200, overflowY: 'auto', letterSpacing: 1,
          }}>
            {newCodes.map((c, i) => <div key={i}>{c}</div>)}
          </div>
          <button onClick={() => setNewCodes([])} style={{ ...btn('ghost'), marginTop: 10, fontSize: 12 }}>Dismiss</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        {['', 'active', 'used', 'disabled'].map(s => (
          <button key={s} onClick={() => { setFilter(s); load(1, s) }} style={{
            ...btn(filter === s ? 'primary' : 'ghost'), padding: '6px 14px', fontSize: 12,
          }}>{s || 'All'}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowCreate(v => !v)} style={{ ...btn('primary'), display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={13} /> Create Codes
        </button>
        <button onClick={() => load(page)} style={btn('ghost')}><RefreshCw size={13} /></button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 14 }}>Create Redeem Codes</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Quantity</label>
              <input style={inp} type="number" min="1" max="100" value={count} onChange={e => setCount(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Value (₹) *</label>
              <input style={inp} type="number" min="1" placeholder="e.g. 2000" value={value} onChange={e => setValue(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Expires (optional)</label>
              <input style={inp} type="date" value={expires} onChange={e => setExpires(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>Batch Note</label>
              <input style={inp} placeholder="e.g. Aug 2026 batch" value={note} onChange={e => setNote(e.target.value)} />
            </div>
          </div>
          {createErr && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{createErr}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCreate} disabled={creating} style={btn('primary')}>{creating ? 'Creating…' : `Generate ${count} Code${count > 1 ? 's' : ''}`}</button>
            <button onClick={() => setShowCreate(false)} style={btn('ghost')}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>{total} codes</div>

      {loading && <div style={{ color: 'rgba(255,255,255,0.3)', padding: 20, textAlign: 'center' }}>Loading…</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Value', 'Status', 'Batch Note', 'Expires', 'Redeemed By', 'Created', ''].map(h => (
                <th key={h} style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.35)', fontWeight: 700, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {codes.map(c => (
              <tr key={c._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '10px 10px', fontWeight: 800, color: '#a78bfa' }}>{fmt(c.value)}</td>
                <td style={{ padding: '10px 10px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                    background: c.status === 'active' ? 'rgba(34,197,94,0.1)' : c.status === 'used' ? 'rgba(120,40,255,0.1)' : 'rgba(239,68,68,0.1)',
                    color: c.status === 'active' ? '#4ade80' : c.status === 'used' ? '#c084fc' : '#f87171',
                  }}>{c.status}</span>
                </td>
                <td style={{ padding: '10px 10px', color: 'rgba(255,255,255,0.5)' }}>{c.batchNote || '—'}</td>
                <td style={{ padding: '10px 10px', color: 'rgba(255,255,255,0.5)' }}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : '—'}</td>
                <td style={{ padding: '10px 10px', color: 'rgba(255,255,255,0.5)' }}>{c.redeemedBy?.email || '—'}</td>
                <td style={{ padding: '10px 10px', color: 'rgba(255,255,255,0.35)' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                <td style={{ padding: '10px 10px' }}>
                  {c.status === 'active' && (
                    <button onClick={() => disableCode(c._id)} style={{ ...btn('danger'), padding: '4px 10px', fontSize: 11 }}>Disable</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 50 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button onClick={() => load(page - 1)} disabled={page === 1} style={btn('ghost')}>← Prev</button>
          <span style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Page {page}</span>
          <button onClick={() => load(page + 1)} disabled={page * 50 >= total} style={btn('ghost')}>Next →</button>
        </div>
      )}
    </div>
  )
}

// ── Audit Log Tab ────────────────────────────────────────────
function AuditTab() {
  const [logs, setLogs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/wallet/audit?page=${pg}`)
      setLogs(data.logs || [])
      setTotal(data.total || 0)
      setPage(pg)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load(1) }, [])

  const actionColor = (action) => {
    if (action.includes('credit') || action.includes('unblock') || action.includes('redeem')) return '#4ade80'
    if (action.includes('debit') || action.includes('block')) return '#f87171'
    return '#a78bfa'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{total} log entries</div>
        <button onClick={() => load(1)} style={btn('ghost')}><RefreshCw size={13} /></button>
      </div>

      {loading && <div style={{ color: 'rgba(255,255,255,0.3)', padding: 20, textAlign: 'center' }}>Loading…</div>}

      {logs.map(log => (
        <div key={log._id} style={{
          ...card, padding: '12px 16px', marginBottom: 8,
          borderLeft: `3px solid ${actionColor(log.action)}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: 'rgba(255,255,255,0.06)', color: actionColor(log.action), marginBottom: 6,
              }}>{log.action.replace(/_/g, ' ').toUpperCase()}</span>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>By:</span> {log.actorId?.name || '—'} ({log.actorRole})
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>Target:</span> {log.targetUserId?.name || '—'} · {log.targetUserId?.email || '—'}
              </div>
              {log.amount > 0 && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>Amount:</span> {fmt(log.amount)}
                  {log.balanceBefore != null && <span> · {fmt(log.balanceBefore)} → {fmt(log.balanceAfter)}</span>}
                </div>
              )}
              {log.reason && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Reason: {log.reason}</div>}
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              {new Date(log.createdAt).toLocaleString('en-IN')}
              {log.ipAddress && <div>{log.ipAddress}</div>}
            </div>
          </div>
        </div>
      ))}

      {total > 50 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button onClick={() => load(page - 1)} disabled={page === 1} style={btn('ghost')}>← Prev</button>
          <span style={{ padding: '8px 12px', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Page {page}</span>
          <button onClick={() => load(page + 1)} disabled={page * 50 >= total} style={btn('ghost')}>Next →</button>
        </div>
      )}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────
export default function AdminWallet() {
  const [tab, setTab] = useState('users')

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, marginBottom: 4 }}>Wallet Management</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>Credit, debit, block wallets · manage redeem codes · audit log</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: tab === t.id ? 'linear-gradient(135deg,rgba(249,115,22,0.2),rgba(234,106,16,0.15))' : 'transparent',
            color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.4)',
            border: tab === t.id ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent',
            transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'codes' && <CodesTab />}
      {tab === 'audit' && <AuditTab />}
    </div>
  )
}
