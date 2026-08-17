// src/components/BottomNav.jsx
import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Wallet, Search, LayoutGrid, UserCircle, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const TABS = [
  { id: 'home',    label: 'Home',    Icon: Home,       route: '/' },
  { id: 'wallet',  label: 'Wallet',  Icon: Wallet,     route: '/wallet' },
  { id: 'search',  label: 'Search',  Icon: Search,     route: null },
  { id: 'tools',   label: 'Tools',   Icon: LayoutGrid, route: '/tools' },
  { id: 'profile', label: 'Profile', Icon: UserCircle, route: '/profile' },
]

export default function BottomNav() {
  const { user, isAdmin } = useAuth()
  const location = useLocation()
  const navigate  = useNavigate()

  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery]           = useState('')
  const [allGames, setAllGames]     = useState([])
  const [filtered, setFiltered]     = useState([])
  const inputRef = useRef(null)
  const path = location.pathname

  useEffect(() => {
    if (!searchOpen) return
    setTimeout(() => inputRef.current?.focus(), 320)
    if (allGames.length === 0) {
      api.get('/home').then(r => {
        const g = r.data?.games || []
        setAllGames(g); setFiltered(g)
      }).catch(() => {})
    } else {
      setFiltered(allGames)
    }
  }, [searchOpen])

  useEffect(() => {
    if (!query.trim()) { setFiltered(allGames); return }
    const q = query.toLowerCase()
    setFiltered(allGames.filter(g =>
      g.name.toLowerCase().includes(q) ||
      (g.category || '').toLowerCase().includes(q)
    ))
  }, [query, allGames])

  if (path.startsWith('/admin') || path === '/auth') return null

  const close = () => { setSearchOpen(false); setQuery('') }

  const isActive = (id, route) => {
    if (id === 'search') return searchOpen
    if (!route) return false
    if (route === '/') return path === '/'
    return path.startsWith(route)
  }

  const handleTab = (tab) => {
    if (tab.id === 'search') { setSearchOpen(v => !v); return }
    close()
    if (tab.id === 'profile') { navigate(user ? '/profile' : '/auth'); return }
    navigate(tab.route)
  }

  return (
    <>
      {/* ── Backdrop (dim top half) ── */}
      <div
        className={`btm-backdrop${searchOpen ? ' open' : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* ── Half-screen sheet ── */}
      <div className={`btm-sheet${searchOpen ? ' open' : ''}`} role="dialog" aria-label="Search games">
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Search input row */}
        <div style={{ padding: '8px 14px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14, padding: '10px 12px',
          }}>
            <Search size={15} color="rgba(255,255,255,0.4)" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search games…"
              className="btm-search-input"
            />
            {query && (
              <button onClick={() => setQuery('')} className="btm-icon-btn" aria-label="Clear">
                <X size={13} />
              </button>
            )}
          </div>
          <button onClick={close} className="btm-icon-btn btm-close-btn" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="btm-results">
          {!query && allGames.length === 0 && (
            <p className="btm-hint">Loading…</p>
          )}
          {!query && allGames.length > 0 && (
            <p className="btm-hint">Search for a game</p>
          )}
          {query && filtered.length === 0 && (
            <p className="btm-hint">No results for "{query}"</p>
          )}
          <div className="btm-grid">
            {filtered.map(game => {
              const img = game.banner || game.icon
              return (
                <button key={game._id} className="btm-game-card"
                  onClick={() => { close(); navigate(`/recharge/${game._id}`) }}
                  aria-label={game.name}>
                  <div className="btm-game-img-wrap">
                    {img
                      ? <img src={img} alt={game.name} className="btm-game-img" />
                      : <div className="btm-game-fallback">🎮</div>
                    }
                    <div className="btm-game-img-fade" />
                  </div>
                  <span className="btm-game-name">{game.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom nav bar ── */}
      <nav className="btm-nav" role="navigation" aria-label="Main navigation">
        {TABS.map(tab => {
          const active = isActive(tab.id, tab.route)
          const { Icon } = tab

          if (tab.id === 'search') return (
            <button key="search" onClick={() => handleTab(tab)} aria-label="Search games" className="btm-center-btn">
              <div className={`btm-fab${searchOpen ? ' btm-fab-active' : ''}`}>
                <Icon size={24} color="#fff" />
              </div>
              <span className={`btm-label${searchOpen ? ' btm-label-active' : ''}`}>Search</span>
            </button>
          )

          return (
            <button key={tab.id} onClick={() => handleTab(tab)} className="btm-tab" aria-label={tab.label}>
              <Icon size={22} color={active ? '#fff' : 'rgba(255,255,255,0.35)'} style={{ transition: 'color 0.15s' }} />
              <span className={`btm-label${active ? ' btm-label-active' : ''}`}>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <style>{`
        /* ── Nav bar ── */
        .btm-nav {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0;
          z-index: 400;
          background: #0a0a0a;
          border-top: 1px solid rgba(255,255,255,0.08);
          align-items: center; justify-content: space-around;
          height: 64px;
          padding-bottom: env(safe-area-inset-bottom, 0px);
          overflow: visible;
        }
        @media (max-width: 639px) { .btm-nav { display: flex; } }

        .btm-tab {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          background: none; border: none; cursor: pointer; padding: 4px 12px; flex: 1;
        }
        .btm-center-btn {
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          background: none; border: none; cursor: pointer;
          margin-top: -22px; flex: 1;
        }
        .btm-fab {
          width: 54px; height: 54px; border-radius: 50%;
          background: linear-gradient(135deg, #6d28d9, #4c00b0);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(76,0,176,0.55);
          border: 2px solid rgba(255,255,255,0.12);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .btm-fab-active {
          transform: rotate(45deg);
          box-shadow: 0 6px 28px rgba(76,0,176,0.75);
        }
        .btm-label {
          font-size: 10px; color: rgba(255,255,255,0.35);
          font-weight: 500; font-family: inherit; transition: color 0.15s;
        }
        .btm-label-active { color: #9b6dff; font-weight: 700; }

        /* ── Backdrop ── */
        .btm-backdrop {
          display: none;
          position: fixed; inset: 0; z-index: 398;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .btm-backdrop.open { opacity: 1; pointer-events: auto; }
        @media (max-width: 639px) { .btm-backdrop { display: block; } }

        /* ── Sheet ── */
        .btm-sheet {
          display: none;
          position: fixed;
          bottom: 64px; left: 0; right: 0;
          height: 58vh;
          background: #111;
          border-radius: 20px 20px 0 0;
          border-top: 1px solid rgba(255,255,255,0.1);
          z-index: 399;
          flex-direction: column;
          overflow: hidden;
          transform: translateY(100%);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btm-sheet.open { transform: translateY(0); }
        @media (max-width: 639px) { .btm-sheet { display: flex; } }

        /* ── Search input ── */
        .btm-search-input {
          flex: 1; background: none; border: none; outline: none;
          color: #fff; font-size: 16px; font-family: inherit;
        }
        .btm-search-input::placeholder { color: rgba(255,255,255,0.3); }
        .btm-icon-btn {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.5); display: flex; align-items: center; padding: 0;
        }
        .btm-close-btn {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1) !important;
          justify-content: center;
        }

        /* ── Results ── */
        .btm-results {
          flex: 1; overflow-y: auto; padding: 4px 14px 12px;
          -webkit-overflow-scrolling: touch;
        }
        .btm-hint {
          text-align: center; padding: 20px 0;
          color: rgba(255,255,255,0.25); font-size: 13px;
        }
        .btm-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        }
        .btm-game-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 0;
          display: flex; flex-direction: column; align-items: stretch;
          cursor: pointer; text-align: center; overflow: hidden;
          transition: border-color 0.15s, transform 0.15s;
        }
        .btm-game-card:active {
          transform: scale(0.96);
          border-color: rgba(76,0,176,0.5);
        }
        .btm-game-img-wrap {
          position: relative; width: 100%; aspect-ratio: 3/4; overflow: hidden;
        }
        .btm-game-img {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .btm-game-img-fade {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%);
        }
        .btm-game-fallback {
          width: 100%; height: 100%;
          background: linear-gradient(135deg,#1a0840,#0d0520);
          display: flex; align-items: center; justify-content: center; font-size: 28px;
        }
        .btm-game-name {
          font-size: 11px; color: #fff; font-weight: 700;
          line-height: 1.3; font-family: inherit;
          padding: 6px 6px 7px; text-align: center;
          background: #111;
          overflow: hidden; display: -webkit-box;
          -webkit-line-clamp: 2; -webkit-box-orient: vertical;
        }
      `}</style>
    </>
  )
}
