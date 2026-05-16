// src/admin/AdminBanners.jsx
import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function AdminBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [file, setFile]       = useState(null)
  const [link, setLink]       = useState('')
  const [title, setTitle]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const load = () => {
    api.get('/banners/all')
      .then(r => setBanners(Array.isArray(r.data) ? r.data : []))
      .catch(() => setBanners([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const add = async e => {
    e.preventDefault()
    if (!file) return setError('Please select an image')
    setSaving(true); setError('')
    try {
      const fd = new FormData()
      fd.append('image', file); fd.append('link', link); fd.append('title', title)
      await api.post('/banners', fd)
      setModal(false); setFile(null); setLink(''); setTitle(''); load()
    } catch (e) { setError(e.response?.data?.message || 'Upload failed') }
    finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete?')) return
    await api.delete(`/banners/${id}`); load()
  }

  const toggle = async (id, active) => {
    await api.put(`/banners/${id}`, { active: !active }); load()
  }

  const inp = { width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 2 }}>Banners</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Promotional banners on the home page</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setModal(true); setError('') }}>+ Add Banner</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : banners.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, color: 'rgba(255,255,255,0.3)' }}>
          No banners yet
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {banners.map(b => (
            <div key={b._id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ height: 130, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                {b.image && <img src={b.image} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 8 }}>{b.title || 'Untitled'}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggle(b._id, b.active)} style={{
                    flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: b.active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.07)',
                    border: b.active ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.1)',
                    color: b.active ? '#4ade80' : 'rgba(255,255,255,0.4)',
                  }}>{b.active ? 'Active' : 'Inactive'}</button>
                  <button onClick={() => del(b._id)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: 'rgba(12,8,28,0.98)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontWeight: 900, fontSize: 18, color: '#fff' }}>Add Banner</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20 }}>✕</button>
            </div>
            <form onSubmit={add} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Image *</label>
                <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }} />
              </div>
              <div className="form-group">
                <label>Title</label>
                <input style={inp} placeholder="Banner title" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Link (optional)</label>
                <input style={inp} placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} />
              </div>
              {error && <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Uploading…' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}