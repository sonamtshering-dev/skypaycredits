// src/admin/AdminGames.jsx
import { useState, useEffect } from 'react'
import api from '../api/axios'
import theme from '../theme'


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
  const [regionTab, setRegionTab]   = useState(0)
  const [newRegion, setNewRegion]   = useState({ name: '', slug: '', provider: '', providerGameId: '', providerUrl: '', smileProductId: '', hasServerList: false, serverSource: '', staticServers: [], fields: [], active: true })
  const [regionImageFile, setRegionImageFile] = useState(null)
  const [regionFieldInput, setRegionFieldInput] = useState({ name: '', label: '' })
  const [newServerInputs, setNewServerInputs] = useState({}) // { [regionIndex]: { name, id } }

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

  const openAdd  = () => { setForm(EMPTY); setIconFile(null); setBannerFile(null); setError(''); setRegionTab(0); setModal('add') }
  const openEdit = g  => { setForm({ ...g, fields: g.fields||[], regions: g.regions||[] }); setIconFile(null); setBannerFile(null); setError(''); setRegionTab(0); setModal(g) }

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

  const addRegion = () => {
    if (!newRegion.name || !newRegion.slug) return
    const regionData = { ...newRegion }
    if (regionImageFile) regionData._imageFile = regionImageFile
    setForm(f => ({ ...f, regions: [...f.regions, regionData] }))
    setNewRegion({ name: '', slug: '', provider: '', providerGameId: '', providerUrl: '', smileProductId: '', hasServerList: false, serverSource: '', staticServers: [], fields: [], active: true })
    setRegionImageFile(null)
  }

  const removeRegion = i => setForm(f => ({ ...f, regions: f.regions.filter((_, j) => j !== i) }))

  const addRegionField = () => {
    if (!regionFieldInput.label) return
    const name = regionFieldInput.name || regionFieldInput.label.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9]/g,'')
    setNewRegion(r => ({ ...r, fields: [...r.fields, { name, label: regionFieldInput.label }] }))
    setRegionFieldInput({ name: '', label: '' })
  }

  // Add server to existing region
  const addServerToRegion = (i) => {
    const inputs = newServerInputs[i] || {}
    const name = inputs.name?.trim()
    const id   = inputs.id?.trim()
    if (!name || !id) return
    const updated = [...form.regions]
    updated[i] = { ...updated[i], staticServers: [...(updated[i].staticServers || []), { serverName: name, serverId: id }] }
    setForm(f => ({ ...f, regions: updated }))
    setNewServerInputs(prev => ({ ...prev, [i]: { name: '', id: '' } }))
  }

  // Add server to new region form
  const [newRegionServerInput, setNewRegionServerInput] = useState({ name: '', id: '' })
  const addServerToNewRegion = () => {
    const name = newRegionServerInput.name?.trim()
    const id   = newRegionServerInput.id?.trim()
    if (!name || !id) return
    setNewRegion(r => ({ ...r, staticServers: [...(r.staticServers || []), { serverName: name, serverId: id }] }))
    setNewRegionServerInput({ name: '', id: '' })
  }

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
            <thead><tr><th>Icon</th><th>Name</th><th>Regions</th><th>Provider</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {games.map(g => (
                <tr key={g._id}>
                  <td>{g.icon
                    ? <img src={g.icon} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover' }} />
                    : <div style={{ width: 38, height: 38, borderRadius: 8, background: theme.alpha(0.2), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎮</div>}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text)' }}>{g.name}</td>
                  <td style={{ color: 'var(--text2)', fontSize: 13 }}>
                    {g.regions?.length > 0 ? `${g.regions.length} regions` : 'Single'}
                  </td>
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

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {['Basic Info', 'Regions'].map((t,i) => (
                <button key={i} onClick={() => setRegionTab(i)} style={{
                  flex: 1, padding: '12px', fontSize: 13, fontWeight: 700, background: 'none',
                  color: regionTab === i ? theme.primary : 'rgba(255,255,255,0.4)',
                  borderBottom: regionTab === i ? '2px solid #a78bfa' : '2px solid transparent',
                  transition: '.15s', cursor: 'pointer',
                }}>{t}</button>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {/* BASIC INFO TAB */}
              <div style={{ padding: 22, display: regionTab === 0 ? 'flex' : 'none', flexDirection: 'column', gap: 14 }}>
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
                      <option value="game">Game</option><option value="voucher">Gift card</option><option value="other">Via Login</option>
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
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase' }}>Default provider (no regions)</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Provider</label>
                      <select className="form-input" value={form.provider} onChange={e => setForm(f=>({...f,provider:e.target.value}))}>
                        <option value="">Manual</option><option value="smile">Smile.One</option><option value="g2bulk">G2Bulk (150+ games)</option><option value="moogold">Moogold</option>
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

              {/* REGIONS TAB */}
              <div style={{ padding: 22, display: regionTab === 1 ? 'flex' : 'none', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
                  Add multiple regions (e.g. Bangladesh, Global). If regions exist, users pick a region before seeing packs.
                </div>

                {/* Existing regions */}
                {form.regions.map((r, i) => (
                  <div key={i} style={{ ...glassRow, flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{r.name}</span>
                        <span style={{ color: 'var(--text2)', fontSize: 12, marginLeft: 8 }}>/{r.slug}</span>
                        {r.provider && <span style={{ color: theme.primary, fontSize: 12, marginLeft: 8 }}>· {r.provider}</span>}
                        {r.providerGameId && <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 8 }}>· {r.providerGameId}</span>}
                        {r.hasServerList && <span style={{ color: '#22c55e', fontSize: 12, marginLeft: 8 }}>· server dropdown ✓</span>}
                      </div>
                      <button type="button" className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }} onClick={() => removeRegion(i)}>Remove</button>
                    </div>

                    {/* Provider Game ID edit for existing region */}
                    <div style={{ display: 'flex', gap: 10, width: '100%', flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                        <label style={{ fontSize: 11 }}>Provider</label>
                        <select className="form-input" value={r.provider || ''} onChange={e => {
                          const updated = [...form.regions]
                          updated[i] = { ...updated[i], provider: e.target.value }
                          setForm(f => ({ ...f, regions: updated }))
                        }}>
                          <option value="">Manual</option>
                          <option value="g2bulk">G2Bulk</option>
                          <option value="smile">Smile.One</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
                        <label style={{ fontSize: 11 }}>Provider Game ID</label>
                        <input className="form-input" value={r.providerGameId || ''} placeholder="e.g. mlbb, genshin_ph"
                          onChange={e => {
                            const updated = [...form.regions]
                            updated[i] = { ...updated[i], providerGameId: e.target.value }
                            setForm(f => ({ ...f, regions: updated }))
                          }} />
                      </div>
                      <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
                        <label style={{ fontSize: 11 }}>Server List Type</label>
                        <select className="form-input" value={r.serverSource || ''} onChange={e => {
                          const updated = [...form.regions]
                          updated[i] = { ...updated[i], serverSource: e.target.value, hasServerList: e.target.value !== '' }
                          setForm(f => ({ ...f, regions: updated }))
                        }}>
                          <option value="">No server list (text input)</option>
                          <option value="static">Static list (manual)</option>
                          <option value="smile">Fetch from Smile API</option>
                        </select>
                      </div>
                    </div>

                    {/* Region Banner Image */}
                    <div className="form-group" style={{ width: '100%' }}>
                      <label style={{ fontSize: 11 }}>Region Banner Image</label>
                      {r.banner && <img src={r.banner} style={{ height: 32, borderRadius: 6, marginBottom: 4, display: 'block' }} alt="" />}
                      <input type="file" accept="image/*" onChange={e => {
                        const updated = [...form.regions]
                        updated[i] = { ...updated[i], _imageFile: e.target.files[0] }
                        setForm(f => ({ ...f, regions: updated }))
                      }} style={{ color: 'var(--text2)', fontSize: 12 }} />
                    </div>

                    {/* Static servers for existing region — works for ALL providers */}
                    {r.serverSource === 'static' && (
                      <div style={{ width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                          Server List ({r.staticServers?.length || 0} servers)
                        </div>
                        {(r.staticServers || []).length === 0 && (
                          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>No servers yet. Add below.</div>
                        )}
                        {(r.staticServers || []).map((s, si) => (
                          <div key={si} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, background: 'var(--bg2)', borderRadius: 8, padding: '6px 10px' }}>
                            <span style={{ flex: 1, fontSize: 12, color: 'var(--text)' }}>
                              {s.serverName} <span style={{ color: 'var(--text3)' }}>({s.serverId})</span>
                            </span>
                            <button type="button" onClick={() => {
                              const updated = [...form.regions]
                              updated[i] = { ...updated[i], staticServers: updated[i].staticServers.filter((_, j) => j !== si) }
                              setForm(f => ({ ...f, regions: updated }))
                            }} style={{ background: 'none', color: '#f87171', cursor: 'pointer', fontSize: 14, border: 'none' }}>✕</button>
                          </div>
                        ))}
                        {/* Add server row — uses React state, no DOM getElementById */}
                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                          <input className="form-input" placeholder="Server Name (e.g. Asia)"
                            value={newServerInputs[i]?.name || ''}
                            onChange={e => setNewServerInputs(prev => ({ ...prev, [i]: { ...prev[i], name: e.target.value } }))}
                            style={{ flex: 1, fontSize: 12, padding: '6px 10px' }} />
                          <input className="form-input" placeholder="Server ID (e.g. os_asia)"
                            value={newServerInputs[i]?.id || ''}
                            onChange={e => setNewServerInputs(prev => ({ ...prev, [i]: { ...prev[i], id: e.target.value } }))}
                            style={{ flex: 1, fontSize: 12, padding: '6px 10px' }} />
                          <button type="button" className="btn btn-sm"
                            style={{ background: theme.grad, color: '#fff', whiteSpace: 'nowrap' }}
                            onClick={() => addServerToRegion(i)}>
                            + Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add new region form */}
                <div style={{ background: theme.alpha(0.06), border: '1px solid rgba(249,115,22,0.15)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: theme.primary, textTransform: 'uppercase', letterSpacing: 1 }}>Add New Region</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Region name</label>
                      <input className="form-input" placeholder="e.g. Bangladesh" value={newRegion.name} onChange={e=>setNewRegion(r=>({...r,name:e.target.value}))} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Slug</label>
                      <input className="form-input" placeholder="e.g. bd" value={newRegion.slug} onChange={e=>setNewRegion(r=>({...r,slug:e.target.value.toLowerCase().replace(/\s/g,'-')}))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Region Banner Image</label>
                    <input type="file" accept="image/*" onChange={e => setRegionImageFile(e.target.files[0])} style={{ color: 'var(--text2)', fontSize: 12 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Provider</label>
                      <select className="form-input" value={newRegion.provider} onChange={e=>setNewRegion(r=>({...r,provider:e.target.value}))}>
                        <option value="">Manual</option>
                        <option value="g2bulk">G2Bulk (150+ games)</option>
                        <option value="smile">Smile.One</option>
                        <option value="moogold">Moogold</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Provider Game ID</label>
                      <input className="form-input" placeholder="e.g. mlbb, genshin_ph, pubgm" value={newRegion.providerGameId} onChange={e=>setNewRegion(r=>({...r,providerGameId:e.target.value}))} />
                    </div>
                  </div>

                  {newRegion.provider === 'g2bulk' && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', fontSize: 12, color: 'var(--text2)' }}>
                      ⚡ G2Bulk game codes: <b>mlbb</b>, <b>mlbb_global</b>, <b>pubgm</b>, <b>genshin</b>, <b>genshin_ph</b>, <b>honkai_star_rail</b>, <b>wuwa</b>, <b>hok</b>, <b>freefire_bd</b>, etc.
                    </div>
                  )}

                  {newRegion.provider === 'smile' && (
                    <div className="form-group">
                      <label>Smile Region URL</label>
                      <select className="form-input" value={newRegion.providerUrl} onChange={e=>setNewRegion(r=>({...r,providerUrl:e.target.value}))}>
                        <option value="">Select region URL</option>
                        <option value="https://www.smile.one/ph">🇵🇭 Philippines</option>
                        <option value="https://www.smile.one/br">🇧🇷 Brazil</option>
                      </select>
                    </div>
                  )}

                  {/* Server list — available for ALL providers */}
                  <div className="form-group">
                    <label>Server List Type</label>
                    <select className="form-input" value={newRegion.serverSource} onChange={e=>setNewRegion(r=>({...r,serverSource:e.target.value,hasServerList:e.target.value!==''}))}>
                      <option value="">No server list (user types server manually)</option>
                      <option value="static">Static list — add servers manually below</option>
                      <option value="smile">Fetch from Smile API automatically</option>
                    </select>
                  </div>

                  {newRegion.serverSource === 'static' && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Server List ({newRegion.staticServers?.length || 0} servers)
                      </div>
                      {newRegion.staticServers.length === 0 && (
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>No servers yet.</div>
                      )}
                      {newRegion.staticServers.map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center', background: 'var(--bg2)', borderRadius: 8, padding: '6px 10px' }}>
                          <span style={{ flex: 1, fontSize: 12, color: 'var(--text)' }}>{s.serverName} <span style={{ color: 'var(--text3)' }}>({s.serverId})</span></span>
                          <button type="button" onClick={() => setNewRegion(r => ({ ...r, staticServers: r.staticServers.filter((_, j) => j !== i) }))}
                            style={{ background: 'none', color: '#f87171', cursor: 'pointer', fontSize: 14, border: 'none' }}>✕</button>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <input className="form-input" placeholder="Server Name (e.g. Asia)"
                          value={newRegionServerInput.name}
                          onChange={e => setNewRegionServerInput(v => ({ ...v, name: e.target.value }))}
                          style={{ flex: 1 }} />
                        <input className="form-input" placeholder="Server ID (e.g. os_asia)"
                          value={newRegionServerInput.id}
                          onChange={e => setNewRegionServerInput(v => ({ ...v, id: e.target.value }))}
                          style={{ flex: 1 }} />
                        <button type="button" className="btn btn-ghost btn-sm" onClick={addServerToNewRegion}>+ Add</button>
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>Region player fields (leave empty to use game defaults)</div>
                  {newRegion.fields.map((f,i) => (
                    <div key={i} style={glassRow}>
                      <span style={{ flex: 1 }}>{f.label}</span>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={()=>setNewRegion(r=>({...r,fields:r.fields.filter((_,j)=>j!==i)}))}>✕</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" placeholder="Field label (e.g. User ID, Zone ID)" value={regionFieldInput.label}
                      onChange={e=>setRegionFieldInput(v=>({...v,label:e.target.value,name:smartKey(e.target.value)}))} style={{ flex: 2 }} />
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addRegionField}>+ Add</button>
                  </div>
                  <button type="button" className="btn btn-ghost" onClick={addRegion} style={{ alignSelf: 'flex-start' }}>+ Add this region</button>
                </div>
              </div>

              {error && <div style={{ color: '#f87171', fontSize: 13, margin: '0 22px 8px', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

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