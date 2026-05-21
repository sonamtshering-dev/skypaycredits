// src/admin/AdminCoupons.jsx
import { useState, useEffect } from 'react'
import api from '../api/axios'
import theme from '../theme'

const inp = {
  width: '100%', background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
  padding: '10px 14px', color: '#fff', fontSize: 14,
  outline: 'none', boxSizing: 'border-box',
}

const emptyForm = {
  code: '', type: 'flat', value: '', minOrder: '',
  maxDiscount: '', usageLimit: '', perUser: '1',
  active: true, expiresAt: '',
}

export default function AdminCoupons() {
  const [coupons, setCoupons]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState(emptyForm)
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [showForm, setShowForm] = useState(false)

  const load = async () => {
    try {
      const { data } = await api.get('/coupons')
      setCoupons(data)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load coupons')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSuccess(''); setSaving(true)
    try {
      if (editing) {
        await api.put(`/coupons/${editing}`, form)
        setSuccess('Coupon updated!')
      } else {
        await api.post('/coupons', form)
        setSuccess('Coupon created!')
      }
      setForm(emptyForm); setEditing(null); setShowForm(false)
      load()
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save coupon')
    } finally { setSaving(false) }
  }

  const handleEdit = c => {
    setForm({
      code:        c.code,
      type:        c.type,
      value:       c.value,
      minOrder:    c.minOrder || '',
      maxDiscount: c.maxDiscount || '',
      usageLimit:  c.usageLimit || '',
      perUser:     c.perUser || 1,
      active:      c.active,
      expiresAt:   c.expiresAt ? c.expiresAt.split('T')[0] : '',
    })
    setEditing(c._id)
    setShowForm(true)
    setError(''); setSuccess('')
  }

  const handleDelete = async id => {
    if (!confirm('Delete this coupon?')) return
    try {
      await api.delete(`/coupons/${id}`)
      load()
    } catch (e) { setError('Failed to delete') }
  }

  const toggleActive = async (c) => {
    try {
      await api.put(`/coupons/${c._id}`, { active: !c.active })
      load()
    } catch (e) { setError('Failed to update') }
  }

  const isExpired = c => c.expiresAt && new Date(c.expiresAt) < new Date()

  return (
    <div style={{ padding: '24px 16px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>🎟️ Coupons</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{coupons.length} total</div>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm) }} style={{
          padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14,
          background: theme.grad, border: 'none', color: '#fff', cursor: 'pointer',
        }}>+ New Coupon</button>
      </div>

      {error   && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#f87171', marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '10px 14px', color: '#4ade80', marginBottom: 16 }}>{success}</div>}

      {/* Form */}
      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 20 }}>
            {editing ? 'Edit Coupon' : 'Create Coupon'}
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label>Coupon Code *</label>
                <input style={inp} placeholder="e.g. SAVE50" value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required />
              </div>
              <div className="form-group">
                <label>Discount Type *</label>
                <select style={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="flat">Flat (₹ off)</option>
                  <option value="percent">Percent (% off)</option>
                </select>
              </div>
              <div className="form-group">
                <label>{form.type === 'flat' ? 'Discount Amount (₹) *' : 'Discount Percent (%) *'}</label>
                <input style={inp} type="number" min="1" max={form.type === 'percent' ? 100 : undefined}
                  placeholder={form.type === 'flat' ? 'e.g. 50' : 'e.g. 10'}
                  value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Min Order Amount (₹)</label>
                <input style={inp} type="number" min="0" placeholder="e.g. 100 (0 = no minimum)"
                  value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} />
              </div>
              {form.type === 'percent' && (
                <div className="form-group">
                  <label>Max Discount Cap (₹)</label>
                  <input style={inp} type="number" min="0" placeholder="e.g. 200 (0 = no cap)"
                    value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} />
                </div>
              )}
              <div className="form-group">
                <label>Total Usage Limit</label>
                <input style={inp} type="number" min="0" placeholder="0 = unlimited"
                  value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Per User Limit</label>
                <input style={inp} type="number" min="1" placeholder="e.g. 1"
                  value={form.perUser} onChange={e => setForm(f => ({ ...f, perUser: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input style={inp} type="date"
                  value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} id="activeCheck" />
                <label htmlFor="activeCheck" style={{ cursor: 'pointer' }}>Active</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="submit" disabled={saving} style={{
                padding: '10px 24px', borderRadius: 10, fontWeight: 800, fontSize: 14,
                background: theme.grad, border: 'none', color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1,
              }}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm) }} style={{
                padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Coupon List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
      ) : coupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: 48 }}>🎟️</div>
          <div style={{ marginTop: 12 }}>No coupons yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {coupons.map(c => (
            <div key={c._id} style={{
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${isExpired(c) ? 'rgba(239,68,68,0.2)' : !c.active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 14, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              opacity: !c.active || isExpired(c) ? 0.6 : 1,
            }}>
              {/* Code */}
              <div style={{
                background: theme.alpha(0.15), border: `1px solid ${theme.alpha(0.3)}`,
                borderRadius: 8, padding: '6px 14px', fontFamily: 'monospace',
                fontWeight: 900, fontSize: 16, color: theme.primary, letterSpacing: 2,
              }}>{c.code}</div>

              {/* Details */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
                  {c.type === 'flat' ? `₹${c.value} off` : `${c.value}% off`}
                  {c.maxDiscount > 0 && c.type === 'percent' && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}> (max ₹{c.maxDiscount})</span>}
                  {c.minOrder > 0 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}> · min ₹{c.minOrder}</span>}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  Used {c.usedCount}/{c.usageLimit || '∞'} · Per user: {c.perUser}
                  {c.expiresAt && <span> · Expires: {new Date(c.expiresAt).toLocaleDateString()}</span>}
                  {isExpired(c) && <span style={{ color: '#f87171' }}> · EXPIRED</span>}
                </div>
              </div>

              {/* Status badge */}
              <div style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: c.active && !isExpired(c) ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: c.active && !isExpired(c) ? '#4ade80' : '#f87171',
              }}>{c.active && !isExpired(c) ? 'Active' : 'Inactive'}</div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleActive(c)} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', cursor: 'pointer',
                }}>{c.active ? 'Disable' : 'Enable'}</button>
                <button onClick={() => handleEdit(c)} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: theme.alpha(0.15), border: `1px solid ${theme.alpha(0.3)}`,
                  color: theme.primary, cursor: 'pointer',
                }}>Edit</button>
                <button onClick={() => handleDelete(c._id)} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171', cursor: 'pointer',
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}