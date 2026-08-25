// src/admin/AdminSettings.jsx
import { useState, useEffect } from 'react'
import api from '../api/axios'
import theme from '../theme'
import { CheckCircle, XCircle } from 'lucide-react'


export default function AdminSettings() {
  const [form, setForm] = useState({
    siteName: '', currency: 'INR', maintenanceMode: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const [err, setErr]         = useState('')
  const [logoFile, setLogoFile] = useState(null)

  useEffect(() => {
    api.get('/settings')
      .then(r => setForm(f => ({ ...f, ...r.data })))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async e => {
    e.preventDefault(); setMsg(''); setErr(''); setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (logoFile) fd.append('logo', logoFile)
      await api.put('/settings', fd)
      setMsg('Settings saved!'); setTimeout(() => setMsg(''), 3000)
    } catch (e) { setErr(e.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const inp = {
    width: '100%', background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
    padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none',
  }

  const CURRENCIES = [
    { code: 'INR', label: 'INR — Indian Rupee (₹)' },
    { code: 'USD', label: 'USD — US Dollar ($)' },
    { code: 'EUR', label: 'EUR — Euro (€)' },
    { code: 'GBP', label: 'GBP — British Pound (£)' },
    { code: 'PHP', label: 'PHP — Philippine Peso (₱)' },
    { code: 'MYR', label: 'MYR — Malaysian Ringgit (RM)' },
    { code: 'IDR', label: 'IDR — Indonesian Rupiah (Rp)' },
    { code: 'SGD', label: 'SGD — Singapore Dollar (S$)' },
    { code: 'THB', label: 'THB — Thai Baht (฿)' },
    { code: 'NPR', label: 'NPR — Nepalese Rupee (₨)' },
  ]

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Settings</h1>


      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div className="form-group">
          <label>Site Name</label>
          <input style={inp} value={form.siteName} onChange={e => set('siteName', e.target.value)} placeholder="Nitrogen Store" />
        </div>

        <div className="form-group">
          <label>Logo</label>
          <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])}
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }} />
          {form.logo && !logoFile && <img src={form.logo} alt="" style={{ height: 36, marginTop: 8, borderRadius: 6 }} />}
        </div>

        <div className="form-group">
          <label>Currency</label>
          <select style={inp} value={form.currency} onChange={e => set('currency', e.target.value)}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>PHP Exchange Rate <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontSize: 11 }}>(1 INR = ? PHP · shown when customers switch to ₱)</span></label>
          <input style={inp} type="number" step="0.0001" min="0.01"
            value={form.phpRate ?? 0.67}
            onChange={e => set('phpRate', parseFloat(e.target.value) || 0.67)}
            placeholder="0.67" />
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Social Links</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="form-group">
              <label>WhatsApp Store Link (footer icon)</label>
              <input style={inp} value={form.whatsapp || ''} onChange={e => set('whatsapp', e.target.value)} placeholder="https://chat.whatsapp.com/... or group number" />
            </div>
            <div className="form-group">
              <label>WhatsApp Support Number (floating button)</label>
              <input style={inp} value={form.whatsappSupport || ''} onChange={e => set('whatsappSupport', e.target.value)} placeholder="917085396397" />
            </div>
            <div className="form-group">
              <label>Instagram URL</label>
              <input style={inp} value={form.instagram || ''} onChange={e => set('instagram', e.target.value)} placeholder="https://instagram.com/yourpage" />
            </div>
            <div className="form-group">
              <label>Facebook URL</label>
              <input style={inp} value={form.facebook || ''} onChange={e => set('facebook', e.target.value)} placeholder="https://facebook.com/yourpage" />
            </div>
            <div className="form-group">
              <label>Support Email</label>
              <input style={inp} value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="support@yourdomain.com" />
            </div>
          </div>
        </div>



        {/* Maintenance Mode toggle */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 2 }}>Maintenance Mode</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Hide site from users — only admins can access</div>
          </div>
          <label style={{ position: 'relative', width: 44, height: 24, flexShrink: 0, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.maintenanceMode}
              onChange={e => set('maintenanceMode', e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: 'absolute', inset: 0, borderRadius: 24,
              background: form.maintenanceMode ? theme.grad : 'rgba(255,255,255,0.15)',
              transition: 'all 0.2s',
            }} />
            <span style={{
              position: 'absolute', top: 3,
              left: form.maintenanceMode ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
          </label>
        </div>

        {/* Purchases toggle */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${form.purchasesEnabled === false ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 12, padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 2 }}>Purchases</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
              {form.purchasesEnabled === false ? '🔴 Purchases are disabled — customers cannot buy' : '🟢 Customers can place orders'}
            </div>
          </div>
          <label style={{ position: 'relative', width: 44, height: 24, flexShrink: 0, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.purchasesEnabled !== false}
              onChange={e => set('purchasesEnabled', e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: 'absolute', inset: 0, borderRadius: 24,
              background: form.purchasesEnabled !== false ? '#22c55e' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.2s',
            }} />
            <span style={{
              position: 'absolute', top: 3,
              left: form.purchasesEnabled !== false ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
          </label>
        </div>



        {msg && <div style={{ color: '#4ade80', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', padding: '10px 14px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14} /> {msg}</div>}
        {err && <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', padding: '10px 14px', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><XCircle size={14} /> {err}</div>}

        <button type="submit" disabled={saving} style={{
          padding: '12px 32px', borderRadius: 10, fontWeight: 800, fontSize: 14,
          background: theme.grad,
          border: '1px solid rgba(249,115,22,0.3)', color: '#fff',
          cursor: 'pointer', opacity: saving ? 0.7 : 1, width: 'fit-content',
        }}>{saving ? 'Saving…' : 'Save Settings'}</button>

      </form>
    </div>
  )
}