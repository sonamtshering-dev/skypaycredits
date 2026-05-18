// src/pages/Home.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../api/axios'
import theme from '../theme'


export default function Home() {
  const [games, setGames]     = useState([])
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [picker, setPicker]   = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/games').then(r => setGames(r.data)).finally(() => setLoading(false))
    api.get('/banners').then(r => setBanners(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }, [])

  const isManual = (game) => game.category === 'voucher' || game.category === 'other'

  const handleGameClick = (game) => {
    const route = isManual(game) ? 'order' : 'recharge'
    const regions = game.regions?.filter(r => r.active)
    if (!isManual(game) && regions && regions.length > 1) {
      setPicker(game)
    } else if (regions && regions.length >= 1) {
      navigate(`/${route}/${game._id}?region=${regions[0].slug}`)
    } else {
      navigate(`/${route}/${game._id}`)
    }
  }

  const gamesList    = games.filter(g => !g.category || g.category === 'game')
  const vouchersList = games.filter(g => g.category === 'voucher')
  const otherList    = games.filter(g => g.category === 'other')

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
  }

  return (
    <>
      <Navbar />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {banners.length > 0 && <BannerCarousel banners={banners} />}
        <div className="container" style={{ paddingTop: 12, paddingBottom: 60 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 80 }}><div className="spinner" /></div>
          ) : games.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎮</div>
              No games found
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {gamesList.length > 0 && (
                <div>
                  <SectionHeader icon="🎮" title="Games" count={gamesList.length} />
                  <div style={gridStyle}>
                    {gamesList.map(game => (
                      <GameCard key={game._id} game={game} onClick={() => handleGameClick(game)} />
                    ))}
                  </div>
                </div>
              )}
              {vouchersList.length > 0 && (
                <div>
                  <SectionHeader icon="🎁" title="Gift Cards & Vouchers" count={vouchersList.length} />
                  <div style={gridStyle}>
                    {vouchersList.map(game => (
                      <GameCard key={game._id} game={game} onClick={() => handleGameClick(game)} isVoucher />
                    ))}
                  </div>
                </div>
              )}
              {otherList.length > 0 && (
                <div>
                  <SectionHeader icon="📦" title="Other" count={otherList.length} />
                  <div style={gridStyle}>
                    {otherList.map(game => (
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
            navigate(`/recharge/${game._id}?region=${region.slug}`)
          }}
        />
      )}
      <Footer />
    </>
  )
}

function SectionHeader({ icon, title, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <h2 style={{ fontWeight: 900, fontSize: 18, color: '#fff', margin: 0 }}>{title}</h2>
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
        background: theme.alpha(0.15), color: theme.primary,
        border: `1px solid ${theme.alpha(0.3)}`,
      }}>{count}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)', marginLeft: 4 }} />
    </div>
  )
}

function BannerCarousel({ banners }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % banners.length), 4000)
    return () => clearInterval(t)
  }, [banners.length])
  const b = banners[idx]
  return (
    <div style={{ position: 'relative', maxWidth: 1100, margin: '0 auto', padding: '20px 16px 0' }}>
      <div style={{
        borderRadius: 20, overflow: 'hidden', position: 'relative',
        height: 'clamp(160px, 28vw, 280px)',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        cursor: b.link ? 'pointer' : 'default',
      }} onClick={() => b.link && window.open(b.link, '_blank')}>
        {b.image && (
          <img key={idx} src={b.image} alt={b.title || ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'bannerFade 0.5s ease' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,6,18,0.6) 0%, transparent 50%)' }} />
        {b.title && (
          <div style={{ position: 'absolute', bottom: 16, left: 20, color: '#fff', fontWeight: 900, fontSize: 'clamp(14px,3vw,22px)', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{b.title}</div>
        )}
      </div>
      {banners.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 10 }}>
          {banners.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 20 : 6, height: 6, borderRadius: 3,
              background: i === idx ? theme.primary : 'rgba(255,255,255,0.25)',
              transition: 'all 0.3s', cursor: 'pointer',
            }} />
          ))}
        </div>
      )}
      <style>{`@keyframes bannerFade { from { opacity: 0.5; } to { opacity: 1; } }`}</style>
    </div>
  )
}

function GameCard({ game, onClick, isVoucher }) {
  const [hovered, setHovered] = useState(false)
  const activeRegions = game.regions?.filter(r => r.active) || []
  const img = game.banner || game.icon

  return (
    <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer', position: 'relative',
        border: `1.5px solid ${hovered ? theme.alpha(0.7) : 'rgba(255,255,255,0.08)'}`,
        transform: hovered ? 'translateY(-5px)' : 'none',
        transition: 'all 0.2s cubic-bezier(.4,0,.2,1)',
        boxShadow: hovered ? '0 16px 48px rgba(249,115,22,0.3)' : '0 2px 12px rgba(0,0,0,0.4)',
        aspectRatio: '3/4',
      }}>
      {img ? (
        <img src={img} alt={game.name} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          transform: hovered ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.4s ease',
        }} />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: isVoucher
            ? 'linear-gradient(135deg,rgba(251,191,36,0.3),rgba(249,115,22,0.2))'
            : 'linear-gradient(135deg,rgba(100,60,255,0.4),rgba(40,100,255,0.2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52,
        }}>{isVoucher ? '🎁' : '🎮'}</div>
      )}

      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />

      {activeRegions.length > 1 && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: theme.alpha(0.9), backdropFilter: 'blur(8px)',
          border: '1px solid rgba(249,115,22,0.5)',
          borderRadius: 20, padding: '3px 8px', fontSize: 10, fontWeight: 800, color: '#fff',
        }}>{activeRegions.length} regions</div>
      )}

      {isVoucher && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(251,191,36,0.85)', backdropFilter: 'blur(8px)',
          borderRadius: 20, padding: '3px 8px', fontSize: 10, fontWeight: 800, color: '#000',
        }}>🎁 Gift Card</div>
      )}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px' }}>
        <div style={{
          fontWeight: 900, fontSize: 14, color: '#fff',
          textShadow: '0 2px 8px rgba(0,0,0,0.9)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{game.name}</div>
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
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>🌐 Select your region</div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>✕</button>
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
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,rgba(80,40,200,0.5),rgba(40,80,200,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🌐</div>
        )}
      </div>
      <div style={{ background: hovered ? '#1a1230' : '#0f0a1e', padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.2s' }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{region.name}</div>
      </div>
    </div>
  )
}