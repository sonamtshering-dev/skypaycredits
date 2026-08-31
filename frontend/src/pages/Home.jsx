// src/pages/Home.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../api/axios'
import theme from '../theme'
import { Gamepad2, Gift, Globe, Tv, Share2, X, Handshake } from 'lucide-react'


const CATS = [
  { key: 'all',       label: 'All' },
  { key: 'game',      label: 'Games' },
  { key: 'voucher',   label: 'Gift Cards' },
  { key: 'vialogin',  label: 'Via Login' },
  { key: 'gifting',   label: 'Via Gifting' },
  { key: 'ott',       label: 'OTT' },
  { key: 'smm',       label: 'SMM' },
]

export default function Home() {
  const [games, setGames]     = useState([])
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [picker, setPicker]   = useState(null)
  const [activeCat, setActiveCat] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/home')
      .then(r => {
        setGames(Array.isArray(r.data.games) ? r.data.games : [])
        setBanners(Array.isArray(r.data.banners) ? r.data.banners : [])
      })
      .catch(() => {
        // fallback to separate calls if /home fails
        api.get('/games').then(r => setGames(r.data)).catch(() => {})
        api.get('/banners').then(r => setBanners(Array.isArray(r.data) ? r.data : [])).catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [])

  const isManual = (game) => ['voucher', 'other', 'premium', 'gifting', 'ott', 'smm'].includes(game.category || '')

  const handleGameClick = (game) => {
    const route = isManual(game) ? 'order' : 'recharge'
    const regions = game.regions?.filter(r => r.active)
    if (regions && regions.length > 1) {
      setPicker(game)
    } else if (regions && regions.length === 1) {
      navigate(`/${route}/${game._id}?region=${regions[0].slug}`)
    } else {
      navigate(`/${route}/${game._id}`)
    }
  }

  const gamesList     = games.filter(g => !g.category || g.category === 'game')
  const vouchersList  = games.filter(g => g.category === 'voucher')
  const viaLoginList  = games.filter(g => g.category === 'other' || g.category === 'premium')
  const giftingList   = games.filter(g => g.category === 'gifting')
  const ottList       = games.filter(g => g.category === 'ott')
  const smmList       = games.filter(g => g.category === 'smm')

  const visibleGames    = activeCat === 'all' || activeCat === 'game'     ? gamesList    : []
  const visibleVouchers = activeCat === 'all' || activeCat === 'voucher'  ? vouchersList : []
  const visibleViaLogin = activeCat === 'all' || activeCat === 'vialogin' ? viaLoginList : []
  const visibleGifting  = activeCat === 'all' || activeCat === 'gifting'  ? giftingList  : []
  const visibleOtt      = activeCat === 'all' || activeCat === 'ott'      ? ottList      : []
  const visibleSmm      = activeCat === 'all' || activeCat === 'smm'      ? smmList      : []

  const availableCats = CATS.filter(c => {
    if (c.key === 'all')      return true
    if (c.key === 'game')     return gamesList.length > 0
    if (c.key === 'voucher')  return vouchersList.length > 0
    if (c.key === 'vialogin') return viaLoginList.length > 0
    if (c.key === 'gifting')  return giftingList.length > 0
    if (c.key === 'ott')      return ottList.length > 0
    if (c.key === 'smm')      return smmList.length > 0
    return false
  })

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 'clamp(8px, 1.5vw, 16px)',
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .game-card { will-change: transform; }
        .game-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: clamp(8px, 1.5vw, 16px); }
        @media (min-width: 540px)  { .game-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 768px)  { .game-grid { grid-template-columns: repeat(5, 1fr); } }
        @media (min-width: 1024px) { .game-grid { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); } }
        .banner-thumbs { display: none; }
        @media (min-width: 768px)  { .banner-thumbs { display: flex; } }
      `}</style>
      <Navbar />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {banners.length > 0 && <BannerCarousel banners={banners} />}
        <div className="container" style={{ paddingTop: 12, paddingBottom: 60 }}>
          {/* Category filter tabs */}
          {!loading && games.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '8px 0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
                {availableCats.map(c => {
                  const active = activeCat === c.key
                  return (
                    <button key={c.key} onClick={() => setActiveCat(c.key)} style={{
                      padding: '8px 22px', borderRadius: 999, fontWeight: 700, fontSize: 13,
                      border: active ? 'none' : '1px solid rgba(255,255,255,0.12)',
                      background: active ? theme.grad : 'rgba(255,255,255,0.06)',
                      color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                      boxShadow: active ? '0 4px 16px rgba(76,0,176,0.4)' : 'none',
                    }}>{c.label}</button>
                  )
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" /></div>
          ) : games.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ marginBottom: 12 }}><Gamepad2 size={40} color="rgba(255,255,255,0.3)" /></div>
              No games found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {visibleGames.length > 0 && (
                <div>
                  <SectionHeader icon={<Gamepad2 size={18} color="#8b5cf6" />} title="Games" count={visibleGames.length} />
                  <div className="game-grid">
                    {visibleGames.map(game => (
                      <GameCard key={game._id} game={game} onClick={() => handleGameClick(game)} />
                    ))}
                  </div>
                </div>
              )}
              {visibleVouchers.length > 0 && (
                <div>
                  <SectionHeader icon={<Gift size={18} color="#f59e0b" />} title="Gift Cards & Vouchers" count={visibleVouchers.length} />
                  <div className="game-grid">
                    {visibleVouchers.map(game => (
                      <GameCard key={game._id} game={game} onClick={() => handleGameClick(game)} isVoucher />
                    ))}
                  </div>
                </div>
              )}
              {visibleViaLogin.length > 0 && (
                <div>
                  <SectionHeader icon={<Globe size={18} color="#06b6d4" />} title="Via Login" count={visibleViaLogin.length} />
                  <div className="game-grid">
                    {visibleViaLogin.map(game => (
                      <GameCard key={game._id} game={game} onClick={() => handleGameClick(game)} />
                    ))}
                  </div>
                </div>
              )}
              {visibleGifting.length > 0 && (
                <div>
                  <SectionHeader icon={<Handshake size={18} color="#a78bfa" />} title="Via Gifting" count={visibleGifting.length} />
                  <div className="game-grid">
                    {visibleGifting.map(game => (
                      <GameCard key={game._id} game={game} onClick={() => handleGameClick(game)} />
                    ))}
                  </div>
                </div>
              )}
              {visibleOtt.length > 0 && (
                <div>
                  <SectionHeader icon={<Tv size={18} color="#ec4899" />} title="OTT" count={visibleOtt.length} />
                  <div className="game-grid">
                    {visibleOtt.map(game => (
                      <GameCard key={game._id} game={game} onClick={() => handleGameClick(game)} />
                    ))}
                  </div>
                </div>
              )}
              {visibleSmm.length > 0 && (
                <div>
                  <SectionHeader icon={<Share2 size={18} color="#10b981" />} title="SMM" count={visibleSmm.length} />
                  <div className="game-grid">
                    {visibleSmm.map(game => (
                      <GameCard key={game._id} game={game} onClick={() => handleGameClick(game)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {picker && (
        <RegionPicker
          game={picker}
          onClose={() => setPicker(null)}
          onSelect={(game, region) => {
            setPicker(null)
            const route = isManual(game) ? 'order' : 'recharge'
            navigate(`/${route}/${game._id}?region=${region.slug}`)
          }}
        />
      )}
      <Footer />
    </>
  )
}

function SectionHeader({ icon, title, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: 'linear-gradient(to bottom,#7c3aed,#4c00b0)', flexShrink: 0 }} />
      <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      <h2 style={{ fontWeight: 900, fontSize: 17, color: '#fff', margin: 0, letterSpacing: 0.3 }}>{title}</h2>
      {count != null && (
        <div style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700, color: '#a78bfa' }}>
          {count}
        </div>
      )}
      <div style={{ flex: 1 }} />
    </div>
  )
}

function BannerCarousel({ banners }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])
  const b = banners[idx]
  const pad = 'clamp(20px, 3vw, 44px)'
  return (
    <div style={{ position: 'relative', width: '100%', height: 'clamp(260px, 40vw, 500px)', overflow: 'hidden', background: '#060612' }}>
      {b.image && (
        <img key={idx} src={b.image} alt={b.title || ''}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'bannerFade 0.5s ease' }} />
      )}
      {/* dark gradient — heavy on left so text is readable */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(6,6,18,0.94) 0%, rgba(6,6,18,0.7) 38%, rgba(6,6,18,0.25) 65%, transparent 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,6,18,0.9) 0%, transparent 40%)' }} />

      {/* Main content row */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: pad, gap: 24 }}>

        {/* Left: text + CTA */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'inline-block', background: 'rgba(124,58,237,0.88)',
            borderRadius: 5, padding: '3px 12px', fontSize: 'clamp(10px,1vw,12px)',
            fontWeight: 800, color: '#fff', marginBottom: 10,
          }}>🔥 Featured</div>
          {b.title && (
            <div style={{
              fontWeight: 900, fontSize: 'clamp(20px, 2.8vw, 38px)', color: '#fff',
              marginBottom: 8, lineHeight: 1.15, textShadow: '0 2px 20px rgba(0,0,0,1)',
            }}>{b.title}</div>
          )}
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(12px, 1.1vw, 15px)', marginBottom: 20 }}>
            Top up instantly · Best rates guaranteed
          </div>
          {b.link && (
            <button
              onClick={() => window.open(b.link, '_blank')}
              style={{
                background: 'linear-gradient(135deg,#4c00b0,#7c3aed)', border: 'none',
                borderRadius: 9, padding: 'clamp(8px,1vw,12px) clamp(18px,2vw,28px)',
                fontSize: 'clamp(12px,1.1vw,15px)', fontWeight: 800, color: '#fff',
                cursor: 'pointer', boxShadow: '0 4px 20px rgba(76,0,176,0.5)',
              }}>Top Up Now →</button>
          )}
          {!b.link && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg,#4c00b0,#7c3aed)', borderRadius: 9,
              padding: 'clamp(8px,1vw,12px) clamp(18px,2vw,28px)',
              fontSize: 'clamp(12px,1.1vw,15px)', fontWeight: 800, color: '#fff',
              boxShadow: '0 4px 20px rgba(76,0,176,0.5)',
            }}>Browse Top-Ups →</div>
          )}
        </div>

        {/* Right: thumbnail strip (desktop only) */}
        {banners.length > 1 && (
          <div className="banner-thumbs" style={{ flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            {banners.map((bn, i) => (
              <div key={i} onClick={() => setIdx(i)} style={{
                width: 'clamp(80px, 7vw, 120px)', height: 'clamp(52px, 4.8vw, 80px)',
                borderRadius: 8, overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                border: `2px solid ${i === idx ? '#7c3aed' : 'rgba(255,255,255,0.12)'}`,
                opacity: i === idx ? 1 : 0.45,
                transition: 'all 0.2s', background: '#111',
              }}>
                {bn.image && <img src={bn.image} alt={bn.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dot indicators (mobile only) */}
      {banners.length > 1 && (
        <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
          {banners.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 20 : 6, height: 4, borderRadius: 2,
              background: i === idx ? theme.primary : 'rgba(255,255,255,0.25)',
              transition: 'all 0.3s', cursor: 'pointer',
            }} />
          ))}
        </div>
      )}
      <style>{`@keyframes bannerFade { from { opacity: 0.6; } to { opacity: 1; } }`}</style>
    </div>
  )
}

function GameCard({ game, onClick, isVoucher }) {
  const [hovered, setHovered] = useState(false)
  const activeRegions = game.regions?.filter(r => r.active) || []
  const img = game.banner || game.icon

  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="game-card"
      style={{
        borderRadius: 'clamp(12px,1.5vw,20px)', overflow: 'hidden', cursor: 'pointer', position: 'relative',
        border: `1.5px solid ${hovered ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.08)'}`,
        transform: hovered ? 'translateY(-6px) scale(1.01)' : 'none',
        transition: 'all 0.22s cubic-bezier(.4,0,.2,1)',
        boxShadow: hovered ? '0 20px 56px rgba(76,0,176,0.45), 0 0 0 1px rgba(139,92,246,0.3)' : '0 2px 14px rgba(0,0,0,0.5)',
        aspectRatio: '3/4',
        background: '#0a0a14',
      }}>
      {img ? (
        <img src={img} alt={game.name} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          transform: hovered ? 'scale(1.07)' : 'scale(1)', transition: 'transform 0.45s ease',
        }} />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: isVoucher
            ? 'linear-gradient(135deg,rgba(251,191,36,0.25),rgba(249,115,22,0.15))'
            : 'linear-gradient(135deg,rgba(76,0,176,0.5),rgba(40,100,255,0.2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{isVoucher ? <Gift size={52} color="rgba(251,191,36,0.8)" /> : <Gamepad2 size={52} color="rgba(139,92,246,0.8)" />}</div>
      )}

      {/* gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.2) 45%, transparent 100%)' }} />

      {/* hover shimmer */}
      {hovered && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />}

      {activeRegions.length > 1 && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(76,0,176,0.85)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(139,92,246,0.5)',
          borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 800, color: '#fff',
        }}>{activeRegions.length} regions</div>
      )}

      {isVoucher && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(251,191,36,0.9)', backdropFilter: 'blur(8px)',
          borderRadius: 20, padding: '3px 8px', fontSize: 10, fontWeight: 800, color: '#000',
        }}>🎁 Gift Card</div>
      )}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(10px,1.5vw,16px)' }}>
        <div style={{
          fontWeight: 900,
          fontSize: 'clamp(12px,1.2vw,15px)',
          color: '#fff',
          textShadow: '0 2px 10px rgba(0,0,0,1)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          letterSpacing: 0.2,
        }}>{game.name}</div>
        {hovered && (
          <div style={{
            marginTop: 6,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'linear-gradient(135deg,#4c00b0,#7c3aed)',
            borderRadius: 8, padding: '4px 12px',
            fontSize: 11, fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 14px rgba(76,0,176,0.5)',
            animation: 'fadeUp 0.18s ease',
          }}>Top Up →</div>
        )}
      </div>
    </div>
  )
}

function RegionPicker({ game, onClose, onSelect }) {
  const regions = game.regions?.filter(r => r.active) || []
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <style>{`@keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480,
        background: 'rgba(12,8,28,0.97)', backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255,255,255,0.13)', borderRadius: 24, overflow: 'hidden',
        animation: 'popIn 0.22s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {game.icon && <img src={game.icon} alt={game.name} style={{ width: 54, height: 54, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>{game.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}><Globe size={12} /> Select your region</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 16, maxHeight: '60vh', overflowY: 'auto' }}>
          {regions.map(region => (
            <RegionCard key={region.slug} region={region} onClick={() => onSelect(game, region)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function RegionCard({ region, onClick }) {
  const [hovered, setHovered] = useState(false)
  const img = region.banner || region.icon
  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        border: `2px solid ${hovered ? theme.alpha(0.8) : 'rgba(255,255,255,0.06)'}`,
        transform: hovered ? 'scale(1.03)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
        boxShadow: hovered ? '0 10px 36px rgba(249,115,22,0.4)' : '0 2px 10px rgba(0,0,0,0.5)',
        background: '#111',
      }}>
      <div style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
        {img ? (
          <img src={img} alt={region.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.4s ease' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,rgba(80,40,200,0.5),rgba(40,80,200,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Globe size={40} color="rgba(255,255,255,0.5)" /></div>
        )}
      </div>
      <div style={{ background: hovered ? '#1a1230' : '#0f0a1e', padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.2s' }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{region.name}</div>
      </div>
    </div>
  )
}