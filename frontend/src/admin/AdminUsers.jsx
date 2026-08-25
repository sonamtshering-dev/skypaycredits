// src/admin/AdminUsers.jsx
import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import theme from '../theme'

const PER_PAGE = 20

export default function AdminUsers() {
  const [users, setUsers]   = useState([])
  const [total, setTotal]   = useState(0)
  const [pages, setPages]   = useState(1)
  const [page, setPage]     = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [acting, setActing] = useState(null)

  const load = useCallback((p = page, q = search, r = roleFilter) => {
    setLoading(true)
    const params = new URLSearchParams({ page: p, limit: PER_PAGE })
    if (q) params.set('search', q)
    if (r) params.set('role', r)
    api.get(`/users?${params}`)
      .then(res => {
        const data = res.data
        setUsers(Array.isArray(data) ? data : (data.users || []))
        setTotal(data.total ?? (Array.isArray(data) ? data.length : 0))
        setPages(data.pages ?? 1)
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [page, search, roleFilter])

  useEffect(() => { load(1, search, roleFilter); setPage(1) }, [search, roleFilter])
  useEffect(() => { load(page, search, roleFilter) }, [page])

  const goTo = (p) => { if (p >= 1 && p <= pages) setPage(p) }

  const toggleBan = async (user) => {
    setActing(user._id)
    try {
      await api.put(`/users/${user._id}`, { status: user.status === 'banned' ? 'active' : 'banned' })
      load(page, search)
    } catch (e) { alert(e.response?.data?.message || 'Failed') }
    finally { setActing(null) }
  }

  const toggleAdmin = async (user) => {
    if (!confirm(`${user.role === 'admin' ? 'Remove admin: ' : 'Make admin: '}${user.email}?`)) return
    setActing(user._id)
    try {
      await api.put(`/users/${user._id}`, { role: user.role === 'admin' ? 'user' : 'admin' })
      load(page, search)
    } catch (e) { alert(e.response?.data?.message || 'Failed') }
    finally { setActing(null) }
  }

  const toggleReseller = async (user) => {
    const making = user.role !== 'reseller'
    if (!confirm(`${making ? 'Promote to Reseller' : 'Remove Reseller'}: ${user.name || user.email}?`)) return
    setActing(user._id)
    try {
      await api.put(`/users/${user._id}`, { role: making ? 'reseller' : 'user' })
      load(page, search)
    } catch (e) { alert(e.response?.data?.message || 'Failed') }
    finally { setActing(null) }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 2 }}>Users</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{total} total</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {[['', 'All'], ['user', 'Normal'], ['reseller', 'Reseller'], ['admin', 'Admin']].map(([val, label]) => (
            <button key={val} onClick={() => { setRoleFilter(val); setPage(1) }} style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: roleFilter === val ? theme.grad : 'rgba(255,255,255,0.07)',
              border: `1px solid ${roleFilter === val ? 'transparent' : 'rgba(255,255,255,0.12)'}`,
              color: roleFilter === val ? '#fff' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
          <input
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '9px 14px', color: '#fff', fontSize: 13, outline: 'none', minWidth: 200 }}
            placeholder="Search name or email…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>No users found</div>}
            {users.map(user => (
              <div key={user._id} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: theme.grad,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 900, color: '#fff',
                  }}>{user.name?.[0]?.toUpperCase() || 'U'}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{user.name || '—'}</span>
                      {user.role === 'admin' && (
                        <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: theme.alpha(0.2), color: theme.primary, border: '1px solid rgba(249,115,22,0.3)' }}>Admin</span>
                      )}
                      {user.role === 'reseller' && (
                        <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>Reseller</span>
                      )}
                      <span style={{
                        padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        background: user.status === 'banned' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.1)',
                        color: user.status === 'banned' ? '#f87171' : '#4ade80',
                      }}>{user.status === 'banned' ? 'Banned' : 'Active'}</span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                      {user.email} {user.phone ? `· ${user.phone}` : ''} · {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => toggleBan(user)} disabled={!!acting} style={{
                    flex: 1, minWidth: 70, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: user.status === 'banned' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: user.status === 'banned' ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)',
                    color: user.status === 'banned' ? '#4ade80' : '#f87171', opacity: acting ? 0.5 : 1,
                  }}>{user.status === 'banned' ? 'Unban' : 'Ban'}</button>
                  <button onClick={() => toggleReseller(user)} disabled={!!acting || user.role === 'admin'} style={{
                    flex: 1, minWidth: 90, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: user.role === 'reseller' ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.07)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    color: '#a5b4fc', opacity: (acting || user.role === 'admin') ? 0.4 : 1,
                  }}>{user.role === 'reseller' ? 'Remove Reseller' : 'Make Reseller'}</button>
                  <button onClick={() => toggleAdmin(user)} disabled={!!acting} style={{
                    flex: 1, minWidth: 80, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: theme.alpha(0.1), border: '1px solid rgba(249,115,22,0.2)',
                    color: theme.primary, opacity: acting ? 0.5 : 1,
                  }}>{user.role === 'admin' ? 'Demote' : 'Make Admin'}</button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
              <button onClick={() => goTo(page - 1)} disabled={page === 1} style={btnStyle(page === 1)}>← Prev</button>
              {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => goTo(p)} style={btnStyle(false, p === page)}>{p}</button>
              ))}
              <button onClick={() => goTo(page + 1)} disabled={page === pages} style={btnStyle(page === pages)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function btnStyle(disabled, active = false) {
  return {
    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
    background: active ? '#6366f1' : 'rgba(255,255,255,0.07)',
    border: `1px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.12)'}`,
    color: disabled ? 'rgba(255,255,255,0.2)' : '#fff',
    opacity: disabled ? 0.5 : 1,
  }
}
