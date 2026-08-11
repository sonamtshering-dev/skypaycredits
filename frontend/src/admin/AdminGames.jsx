// src/admin/AdminGames.jsx
import { useState, useEffect } from 'react'
import api from '../api/axios'
import theme from '../theme'
import { Gamepad2 } from 'lucide-react'


const EMPTY = {
  name: '', slug: '', category: 'game', active: true,
  provider: '', providerGameId: '', smileProductId: '',
  fields: [], regions: [],
}

export default function AdminGames() {
  const [games, setGames]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null)
  const [form, setForm]     = useState(EMPTY)
  const [fieldInput, setFieldInput] = useState({ name: '', label: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [iconFile, setIconFile]     = useState(null)
  const [bannerFile, setBannerFile] = useState(null)

  // Smart key mapping
  const smartKey = (label) => {
    const l = label.toLowerCase().trim()
    if (l.includes('user') || l.includes('player') || l.includes('uid') || l.includes('account')) return 'userId'
    if (l.includes('zone') || l.includes('server') || l.includes('region')) return 'zoneId'
    if (l.includes('character') || l.includes('char')) return 'userId'
    return label.toLowerCase().replace(/[^a-z0-9]/gi, '')
  }

  const load = () => { api.get('/games/all').then(r => setGames(r.data)).finally(() => setLoading(false)) }
  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(EMPTY); setIconFile(null); setBannerFile(null); setError(''); setModal('add') }
  const openEdit = g  => { setForm({ ...g, fields: g.fields||[], regions: g.regions||[] }); setIconFile(null); setBannerFile(null); setError(''); setModal(g) }

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const fd = new FormData()
      const cleanRegions = form.regions.map(({ _imageFile, ...r }) => r)
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'fields') fd.append(k, JSON.stringify(v))
        else if (k === 'regions') fd.append(k, JSON.stringify(cleanRegions))
        else fd.append(k, v)
      })
      if (iconFile)   fd.append('icon',   iconFile)
      if (bannerFile) fd.append('banner', bannerFile)
      form.regions.forEach(r => {
        if (r._imageFile) fd.append(`region_image_${r.slug}`, r._imageFile)
      })
      if (modal === 'add') await api.post('/games', fd)
      else                 await api.put(`/games/${modal._id}`, fd)
      setModal(null); load()
    } catch (err) { setError(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const deleteGame = async id => {
    if (!confirm('Delete this game?')) return
    await api.delete(`/games/${id}`); load()
  }

  const addField = () => {
    if (!fieldInput.label) return
    fieldInput.name = fieldInput.name || fieldInput.label.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'')
    setForm(f => ({ ...f, fields: [...f.fields, { ...fieldInput }] }))
    setFieldInput({ name: '', label: '' })
  }

  const addRegion = () => setForm(f => ({
    ...f, regions: [...f.regions, { name: '', slug: '', active: true, provider: '', providerGameId: '', smileRegionUrl: '', displayTitle: '' }]
  }))
  const updateRegion = (i, updated) => setForm(f => ({
    ...f, regions: f.regions.map((r, j) => j === i ? updated : r)
  }))
  const removeRegion = (i) => setForm(f => ({
    ...f, regions: f.regions.filter((_, j) => j !== i)
  }))

  const moveGame = async (id, direction) => {
    const idx = games.findIndex(g => g._id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= games.length) return
    const updated = [...games]
    // Swap the two games in array
    const temp = updated[idx]
    updated[idx] = updated[swapIdx]
    updated[swapIdx] = temp
    // Reassign sortOrder based on position
    const newOrders = updated.map((g, i) => ({ id: g._id, sortOrder: i * 10 }))
    updated.forEach((g, i) => g.sortOrder = i * 10)
    setGames([...updated])
    // Save all new orders to backend
    for (const { id, sortOrder } of newOrders) {
      await api.patch(`/games/${id}/sort`, { sortOrder })
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>

  const glassRow = { background: 'var(--bg2)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>Games</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Game</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Icon</th><th>Name</th><th>Provider</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {games.map(g => (
                <tr key={g._id}>
                  <td>{g.icon
                    ? <img src={g.icon} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }} />
                    : <div style={{ width: 38, height: 38, borderRadius: 8, background: theme.alpha(0.2), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Gamepad2 size={18} color="rgba(249,115,22,0.6)" /></div>}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text)' }}>{g.name}</td>
                  <td style={{ color: 'var(--text2)', fontSize: 13 }}>{g.provider || 'manual'}</td>
                  <td><span className={`badge badge-${g.active ? 'success' : 'danger'}`}>{g.active ? 'Active' : 'Hidden'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => moveGame(g._id, 'up')} title="Move Up">▲</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => moveGame(g._id, 'down')} title="Move Down">▼</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(g)}>Edit</button>
                      <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }} onClick={() => deleteGame(g._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{modal === 'add' ? 'Add Game' : 'Edit Game'}</div>
              <button onClick={() => setModal(null)} style={{ background: 'none', color: 'var(--text2)', fontSize: 20 }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Name *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Slug *</label>
                    <input className="form-input" value={form.slug} onChange={e => setForm(f=>({...f,slug:e.target.value.toLowerCase().replace(/\s+/g,'-')}))} required />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Category</label>
                    <select className="form-input" value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>
                      <option value="game">Game</option>
                      <option value="voucher">Gift Card</option>
                      <option value="premium">Via Login</option>
                      <option value="ott">OTT</option>
                      <option value="smm">SMM</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Status</label>
                    <select className="form-input" value={form.active?'true':'false'} onChange={e => setForm(f=>({...f,active:e.target.value==='true'}))}>
                      <option value="true">Active</option><option value="false">Hidden</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Icon image</label>
                    {form.icon && <img src={form.icon} style={{ height: 32, borderRadius: 6, marginBottom: 4 }} alt="" />}
                    <input type="file" accept="image/*" onChange={e => setIconFile(e.target.files[0])} style={{ color: 'var(--text2)', fontSize: 12 }} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Banner image</label>
                    {form.banner && <img src={form.banner} style={{ height: 32, borderRadius: 6, marginBottom: 4 }} alt="" />}
                    <input type="file" accept="image/*" onChange={e => setBannerFile(e.target.files[0])} style={{ color: 'var(--text2)', fontSize: 12 }} />
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' }}>Provider</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Provider</label>
                      <select className="form-input" value={form.provider} onChange={e => setForm(f=>({...f,provider:e.target.value}))}>
                        <option value="">Manual</option><option value="fintopup">FinTopup</option><option value="smile">Smile.One</option><option value="moogold">Moogold</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>{form.provider === 'smile' ? 'Smile Product ID' : 'Provider Game ID'}</label>
                      <input className="form-input" value={form.providerGameId} onChange={e => setForm(f=>({...f,providerGameId:e.target.value}))} />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' }}>Player input fields</div>
                  {form.fields.map((f, i) => (
                    <div key={i} style={glassRow}>
                      <span style={{ flex: 1 }}>{f.label} <span style={{ opacity: .5 }}>({f.name})</span></span>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(f2=>({...f2,fields:f2.fields.filter((_,j)=>j!==i)}))}>✕</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" placeholder="Field label (e.g. User ID, Zone ID, Server)" value={fieldInput.label} onChange={e=>setFieldInput(v=>({...v,label:e.target.value,name:smartKey(e.target.value)}))} style={{ flex: 1 }} />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addField}>Add</button>
                  </div>
                </div>
              </div>

                {/* Regions */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text3)', textTransform: 'uppercase' }}>Regions</div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addRegion}>+ Add Region</button>
                  </div>
                  {form.regions.length === 0 && (
                    <div style={{ color: 'var(--text3)', fontSize: 12 }}>No regions — uses game-level settings</div>
                  )}
                  {form.regions.map((r, i) => (
                    <RegionRow key={i} region={r}
                      onChange={updated => updateRegion(i, updated)}
                      onRemove={() => removeRegion(i)}
                    />
                  ))}
                </div>

              {error && <div style={{ color: '#f87171', fontSize: 13, margin: '0 0 8px', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 22px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Game'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function RegionRow({ region, onChange, onRemove }) {
  const [open, setOpen] = useState(false)
  const inp = {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '7px 10px', color: 'var(--text)', fontSize: 13, outline: 'none',
  }
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ flex: 1, fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{region.name || '(unnamed region)'}</span>
        {region.displayTitle && <span style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>{region.displayTitle}</span>}
        <span className={`badge badge-${region.active ? 'success' : 'danger'}`} style={{ fontSize: 10 }}>{region.active ? 'Active' : 'Hidden'}</span>
        <button type="button" onClick={e => { e.stopPropagation(); onRemove() }}
          style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 15, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>✕</button>
        <span style={{ color: 'var(--text3)', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Region Name</label>
              <input style={inp} value={region.name} onChange={e => onChange({ ...region, name: e.target.value })} placeholder="e.g. Brazil (BR)" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Slug</label>
              <input style={inp} value={region.slug} onChange={e => onChange({ ...region, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="e.g. br" />
            </div>
          </div>
          <div className="form-group">
            <label>Recharge Page Title <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional — replaces auto "Game — Region" title)</span></label>
            <input style={inp} value={region.displayTitle || ''} onChange={e => onChange({ ...region, displayTitle: e.target.value })} placeholder={`e.g. MLBB Brazil`} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Status</label>
              <select style={inp} value={region.active ? 'true' : 'false'} onChange={e => onChange({ ...region, active: e.target.value === 'true' })}>
                <option value="true">Active</option>
                <option value="false">Hidden</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Smile Region URL</label>
              <input style={inp} value={region.smileRegionUrl || ''} onChange={e => onChange({ ...region, smileRegionUrl: e.target.value })} placeholder="https://www.smile.one/br" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Provider Game ID</label>
              <input style={inp} value={region.providerGameId || ''} onChange={e => onChange({ ...region, providerGameId: e.target.value })} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}