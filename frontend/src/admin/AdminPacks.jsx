// src/admin/AdminPacks.jsx
import { useState, useEffect } from 'react'
import api from '../api/axios'
import theme from '../theme'


const EMPTY_PACK = {
  title: '', price: '', diamonds: '', bonus: '',
  provider: '', providerGameId: '', active: true, sortOrder: 0, skuCodes: [], sectionName: '', oldPrice: '',
}

// SKU input row
function SkuList({ skuCodes, onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    if (!input.trim()) return
    onChange([...skuCodes, { skuCode: input.trim(), quantity: 1 }])
    setInput('')
  }
  const remove = i => onChange(skuCodes.filter((_, j) => j !== i))
  const inp = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 10px', color: '#fff', fontSize: 13, outline: 'none' }
  return (
    <div>
      {skuCodes.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 7, padding: '5px 10px' }}>
          <span style={{ flex: 1, color: '#fff', fontSize: 12, fontFamily: 'monospace' }}>{s.skuCode}</span>
          <button type="button" onClick={() => remove(i)} style={{ background: 'none', color: '#f87171', fontSize: 14, cursor: 'pointer' }}>✕</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <input style={{ ...inp, flex: 1 }} placeholder="Enter SKU / product code"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
        <button type="button" onClick={add} style={{ padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}>Add</button>
      </div>
    </div>
  )
}

// Pack add/edit modal
function PackModal({ pack, gameId, regionSlug, onSave, onClose }) {
  const [form, setForm] = useState(pack
    ? { ...pack, gameId, regionSlug, sectionName: pack.sectionName || '' }
    : { ...EMPTY_PACK, gameId, regionSlug }
  )
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [imageFile, setImageFile] = useState(null)

  const save = async e => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const fd = new FormData()
      fd.append('gameId', gameId)
      fd.append('regionSlug', regionSlug || '')
      fd.append('sectionName', form.sectionName || '')
      fd.append('title', form.title)
      fd.append('price', Number(form.price))
      fd.append('oldPrice', Number(form.oldPrice) || 0)
      fd.append('diamonds', Number(form.diamonds) || 0)
      fd.append('bonus', Number(form.bonus) || 0)
      fd.append('provider', form.provider || '')
      fd.append('providerGameId', form.providerGameId || '')
      fd.append('active', form.active)
      fd.append('sortOrder', Number(form.sortOrder) || 0)
      fd.append('skuCodes', JSON.stringify(form.skuCodes || []))
      if (imageFile) fd.append('image', imageFile)
      if (pack) await api.put(`/packs/${pack._id}`, fd)
      else await api.post('/packs', fd)
      onSave()
    } catch (err) { setError(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const inp = { width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 500, background: 'rgba(12,8,28,0.99)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, maxHeight: '90vh', overflow: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 17, color: '#fff' }}>{pack ? 'Edit Pack' : 'Add Pack'}</h2>
            {regionSlug && <div style={{ color: theme.primary, fontSize: 12, marginTop: 2 }}>Region: {regionSlug}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 20 }}>✕</button>
        </div>

        <form onSubmit={save} style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div className="form-group">
            <label>Pack Title *</label>
            <input style={inp} placeholder="e.g. 100 Diamonds" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>

          <div className="form-group">
            <label>Section Name <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(optional)</span></label>
            <input style={inp} placeholder='e.g. Bonus Packs, Double Diamond, Weekly Passes'
              value={form.sectionName || ''} onChange={e => setForm(f => ({ ...f, sectionName: e.target.value }))} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              Packs with the same section name are grouped with a header on the recharge page
            </div>
          </div>

          <div className="form-group">
            <label>Pack Image <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>(optional)</span></label>
            {form.image && !imageFile && (
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={form.image} alt="pack" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                <button type="button" onClick={() => setForm(f => ({ ...f, image: '' }))}
                  style={{ fontSize: 11, color: '#f87171', background: 'none', cursor: 'pointer' }}>Remove</button>
              </div>
            )}
            {imageFile && (
              <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={URL.createObjectURL(imageFile)} alt="preview" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(249,115,22,0.4)' }} />
                <span style={{ fontSize: 11, color: theme.primary }}>New image selected</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
              style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label>Price (₹) *</label>
              <input style={inp} type="number" step="0.01" placeholder="149" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Old Price <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontSize: 11 }}>(for discount badge)</span></label>
              <input style={inp} type="number" step="0.01" placeholder="165" value={form.oldPrice} onChange={e => setForm(f => ({ ...f, oldPrice: e.target.value }))} />
            </div>
          </div>

          {form.oldPrice > 0 && form.price > 0 && Number(form.oldPrice) > Number(form.price) && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
              🏷️ Discount badge: <strong>-{Math.round((1 - Number(form.price) / Number(form.oldPrice)) * 100)}%</strong>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label>Diamonds</label>
              <input style={inp} type="number" placeholder="100" value={form.diamonds} onChange={e => setForm(f => ({ ...f, diamonds: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Bonus</label>
              <input style={inp} type="number" placeholder="0" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label>Provider</label>
              <select style={inp} value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}>
                <option value="">Manual</option>
                <option value="moogold">Moogold</option>
                <option value="smile">Smile.One</option>
                <option value="g2bulk">G2Bulk</option>
              </select>
            </div>
            <div className="form-group">
              <label>Provider Game ID</label>
              <input style={inp} placeholder="e.g. mlbb" value={form.providerGameId} onChange={e => setForm(f => ({ ...f, providerGameId: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label>SKU / Product Codes</label>
            <SkuList skuCodes={form.skuCodes || []} onChange={v => setForm(f => ({ ...f, skuCodes: v }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label>Sort Order <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>(lower = first)</span></label>
              <input style={inp} type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select style={inp} value={form.active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))}>
                <option value="true">Active</option>
                <option value="false">Hidden</option>
              </select>
            </div>
          </div>

          {error && <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : pack ? 'Save Changes' : 'Add Pack'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Pack list for one region
function RegionPackList({ gameId, regionSlug, regionName }) {
  const [packs, setPacks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)
  const [moving, setMoving]   = useState(null)

  const load = () => {
    const url = regionSlug
      ? `/packs/all?gameId=${gameId}&region=${regionSlug}`
      : `/packs/all?gameId=${gameId}&region=`
    api.get(url)
      .then(r => setPacks(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [gameId, regionSlug])

  const del = async id => {
    if (!confirm('Delete this pack?')) return
    await api.delete(`/packs/${id}`)
    load()
  }

  // ✅ Fixed: send FormData not plain JSON
  const move = async (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= packs.length) return
    setMoving(packs[index]._id)
    try {
      const a = packs[index]
      const b = packs[target]
      const newA = b.sortOrder ?? target
      const newB = a.sortOrder ?? index
      const fdA = new FormData()
fdA.append('sortOrder', newA)
fdA.append('title', a.title)
fdA.append('price', a.price)
fdA.append('active', a.active)

const fdB = new FormData()
fdB.append('sortOrder', newB)
fdB.append('title', b.title)
fdB.append('price', b.price)
fdB.append('active', b.active)
      await Promise.all([
        api.put(`/packs/${a._id}`, fdA),
        api.put(`/packs/${b._id}`, fdB),
      ])
      load()
    } catch(e) { console.error('Sort failed', e) }
    finally { setMoving(null) }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 30 }}><div className="spinner" /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{packs.length} pack{packs.length !== 1 ? 's' : ''}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>· use ▲▼ to reorder</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>+ Add Pack</button>
      </div>

      {packs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
          No packs yet for {regionName}.<br />Click "+ Add Pack" to create one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {packs.map((pack, i) => (
            <div key={pack._id} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: moving === pack._id ? 0.5 : 1,
              transition: 'opacity 0.15s',
            }}>
              {/* Sort position badge */}
              <div style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                background: theme.alpha(0.15), border: '1px solid rgba(249,115,22,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: theme.primary, fontWeight: 900, fontSize: 11,
              }}>{i + 1}</div>

              {/* Up / Down buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                <button onClick={() => move(i, -1)} disabled={i === 0 || !!moving}
                  style={{ width: 20, height: 16, borderRadius: 4, border: 'none', cursor: i === 0 ? 'default' : 'pointer', background: i === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)', color: i === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
                <button onClick={() => move(i, 1)} disabled={i === packs.length - 1 || !!moving}
                  style={{ width: 20, height: 16, borderRadius: 4, border: 'none', cursor: i === packs.length - 1 ? 'default' : 'pointer', background: i === packs.length - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)', color: i === packs.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
              </div>

              {/* Pack info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{pack.title}</div>
                  {pack.sectionName && (
                    <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
                      {pack.sectionName}
                    </span>
                  )}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>
                  {pack.diamonds > 0 && `💎 ${pack.diamonds}${pack.bonus > 0 ? ` +${pack.bonus}` : ''} · `}
                  {pack.provider || 'manual'}
                  {pack.skuCodes?.length > 0 && ` · ${pack.skuCodes.length} SKU`}
                  {` · sort: ${pack.sortOrder ?? i}`}
                </div>
              </div>

              <div style={{ fontWeight: 800, color: theme.primary, fontSize: 15, flexShrink: 0 }}>₹{pack.price}</div>

              <span style={{
                padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, flexShrink: 0,
                background: pack.active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: pack.active ? '#4ade80' : '#f87171',
              }}>{pack.active ? 'On' : 'Off'}</span>

              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(pack)}>Edit</button>
                <button onClick={() => del(pack._id)} style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <PackModal
          pack={modal === 'add' ? null : modal}
          gameId={gameId}
          regionSlug={regionSlug}
          onSave={() => { setModal(null); load() }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

export default function AdminPacks() {
  const [games, setGames]           = useState([])
  const [selectedGame, setSelectedGame] = useState(null)
  const [selectedRegion, setSelectedRegion] = useState('__none__')
  const [loading, setLoading]       = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    api.get('/games/all')
      .then(r => setGames(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleGameChange = gameId => {
    const game = games.find(g => g._id === gameId) || null
    setSelectedGame(game)
    setSelectedRegion('__none__')
  }

  const filteredGames = games.filter(g => categoryFilter === 'all' || g.category === categoryFilter)
  const regions = selectedGame?.regions?.filter(r => r.active) || []
  const hasRegions = regions.length > 0
  const activeRegionSlug = selectedRegion === '__none__' ? '' : selectedRegion
  const activeRegionName = selectedRegion === '__none__'
    ? (hasRegions ? 'No Region' : selectedGame?.name || 'Game')
    : (regions.find(r => r.slug === selectedRegion)?.name || selectedRegion)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 2 }}>Packs</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Manage packs per game and region</p>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'game', 'voucher', 'other'].map(c => (
          <button key={c} onClick={() => { setCategoryFilter(c); setSelectedGame(null) }}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: categoryFilter === c ? theme.grad : 'rgba(255,255,255,0.06)',
              border: categoryFilter === c ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.09)',
              color: '#fff', transition: 'all 0.15s', textTransform: 'capitalize',
            }}>{c === 'all' ? '🎮 All' : c === 'game' ? '🎮 Games' : c === 'voucher' ? '🎁 Vouchers' : '📦 Other'}</button>
        ))}
      </div>

      {/* Game selector */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Select Game</label>
        {loading ? (
          <div className="spinner" />
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {filteredGames.map(g => (
              <button key={g._id} onClick={() => handleGameChange(g._id)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                background: selectedGame?._id === g._id ? theme.grad : 'rgba(255,255,255,0.06)',
                border: selectedGame?._id === g._id ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.09)',
                color: '#fff', fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
              }}>
                {g.icon && <img src={g.icon} alt="" style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover' }} />}
                {g.name}
                {g.category === 'voucher' && <span style={{ fontSize: 10, background: 'rgba(251,191,36,0.2)', color: '#fbbf24', padding: '1px 6px', borderRadius: 10 }}>voucher</span>}
              </button>
            ))}
            {filteredGames.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No games found.</div>}
          </div>
        )}
      </div>

      {/* Region tabs */}
      {selectedGame && (
        <div>
          {hasRegions && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
              {regions.map(r => (
                <button key={r.slug} onClick={() => setSelectedRegion(r.slug)} style={{
                  padding: '10px 18px', fontSize: 13, fontWeight: 700, background: 'none', cursor: 'pointer',
                  color: selectedRegion === r.slug ? theme.primary : 'rgba(255,255,255,0.4)',
                  borderBottom: selectedRegion === r.slug ? '2px solid #a78bfa' : '2px solid transparent',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}>
                  🌐 {r.name}
                </button>
              ))}
            </div>
          )}

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: 16 }}>
                {selectedGame.name}{hasRegions ? ` — ${activeRegionName}` : ''}
              </div>
              {hasRegions && (
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
                  Packs shown to users who selected <strong style={{ color: theme.primary }}>{activeRegionName}</strong>
                </div>
              )}
            </div>
            <RegionPackList
              key={`${selectedGame._id}-${activeRegionSlug}`}
              gameId={selectedGame._id}
              regionSlug={activeRegionSlug}
              regionName={activeRegionName}
            />
          </div>
        </div>
      )}

      {!selectedGame && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 16, color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
          👆 Select a game above to manage its packs
        </div>
      )}
    </div>
  )
}