// src/pages/InfoPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useSettings } from '../context/SettingsContext'
import theme from '../theme'
import { Zap, Lock, ShieldCheck, Globe, Gamepad2 } from 'lucide-react'


const WHATSAPP = '+917085396397'

const TABS = [
  { id: 'about',   label: '🏠 About' },
  { id: 'contact', label: '💬 Contact' },
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'terms',   label: '📋 Terms & Conditions' },
]

export default function InfoPage({ defaultTab = 'about' }) {
  const [tab, setTab] = useState(defaultTab)
  const { settings }  = useSettings()
  const navigate      = useNavigate()
  const site = settings.siteName || 'Nitrogen Store'

  const section = (title, children) => (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{title}</h2>
      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.85 }}>{children}</div>
    </div>
  )

  const p = (text) => <p style={{ marginBottom: 10 }}>{text}</p>

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 80, maxWidth: 740, position: 'relative', zIndex: 1 }}>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28,
          background: 'rgba(255,255,255,0.04)', borderRadius: 14,
          padding: 6, border: '1px solid rgba(255,255,255,0.07)',
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s', flex: 1,
              background: tab === t.id ? theme.grad : 'transparent',
              border: tab === t.id ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent',
              color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.4)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 24px' }}>

          {/* ── ABOUT ── */}
          {tab === 'about' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>
                  <span style={{ color: '#fff' }}>{site.split(' ')[0]}</span>
                  {site.split(' ').slice(1).join(' ') && (
                    <span style={{ background: 'linear-gradient(135deg,#7c3aed,#4c00b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {' '}{site.split(' ').slice(1).join(' ')}
                    </span>
                  )}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Fast · Safe · Best Prices</p>
              </div>

              {section('Who We Are',
                p(`${site} is a trusted game top-up platform providing instant delivery of in-game currencies, diamonds, credits and passes for popular games worldwide. We serve players across India and globally with the fastest and most reliable recharge service.`)
              )}

              {section('Why Choose Us',
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
    gap: 10,
  }}>
    {[
      { icon: Zap,        label: 'Instant Delivery',   desc: 'Credits delivered automatically within seconds of payment confirmation.', bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
      { icon: Lock,       label: 'Safe & Secure',       desc: 'Encrypted payments. We never store your payment details.', bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
      { icon: '💰', label: 'Best Prices',         desc: 'Competitive prices with regular bonus offers and discounts across all game packs.', bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
      { icon: Globe,      label: 'Multiple Regions',    desc: 'All regional servers supported — always top up the correct account.', bg: 'rgba(168,85,247,0.12)', color: '#a855f7' },
      { icon: Gamepad2,   label: 'Wide Selection',      desc: 'MLBB, Free Fire, PUBG, Genshin Impact and more — all covered.', bg: 'rgba(236,72,153,0.12)', color: '#ec4899' },
      { icon: '📞', label: '24/7 Support',        desc: 'Support team available via WhatsApp to assist with any issues.', bg: 'rgba(20,184,166,0.12)', color: '#14b8a6' },
    ].map(({ icon, label, desc, bg, color }) => (
      <div key={label} style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>{typeof icon === 'string' ? icon : (() => { const I = icon; return <I size={18} color={color} /> })()}</div>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>{label}</div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.6 }}>{desc}</div>
      </div>
    ))}
  </div>
)}

              {section('How It Works', <>
                {['Select your game from the home page', 'Choose your region / server', 'Enter your Player ID', 'Pick a pack and proceed to payment', 'Receive your diamonds/credits instantly'].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: theme.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ paddingTop: 4, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{step}</div>
                  </div>
                ))}
              </>)}
            </div>
          )}

          {/* ── CONTACT ── */}
          {tab === 'contact' && (
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Contact Us</h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 28 }}>We're here to help. Reach out anytime.</p>

              {/* WhatsApp */}
              {WHATSAPP && (
                <a href={`https://wa.me/${WHATSAPP.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 22px', borderRadius: 16, background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', textDecoration: 'none', marginBottom: 16, transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(37,211,102,0.14)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(37,211,102,0.08)'}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#25d366' }}>WhatsApp Support</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2 }}>{WHATSAPP} · Tap to chat</div>
                  </div>
                </a>
              )}

              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '20px 22px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 14 }}>Before contacting us, please check:</div>
                {[
                  'Make sure your Player ID and Zone ID are correct',
                  'Check your Orders page to see the delivery status',
                  'Payments may take up to 5 minutes to process',
                  'For failed orders, please share your Order ID with us',
                ].map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                    <span style={{ color: theme.primary, flexShrink: 0 }}>•</span>{tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PRIVACY ── */}
          {tab === 'privacy' && (
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Privacy Policy</h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 24 }}>Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

              {section('Information We Collect', <>
                {p('When you use our service, we collect the following information:')}
                {['Account information (name, email address) when you register', 'Game Player IDs and Zone IDs you enter for recharge', 'Order history and transaction records', 'Device and browser information for security purposes'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}><span style={{ color: theme.primary }}>•</span>{item}</div>
                ))}
              </>)}

              {section('How We Use Your Information', <>
                {['Process and deliver your game top-up orders', 'Send order confirmation and status updates', 'Provide customer support when you contact us', 'Detect and prevent fraudulent transactions', 'Improve our services and user experience'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}><span style={{ color: theme.primary }}>•</span>{item}</div>
                ))}
              </>)}

              {section('Data Security',
                p(`We implement industry-standard security measures to protect your personal information. All payment transactions are processed through encrypted, secure payment gateways. We do not store your payment card details on our servers.`)
              )}

              {section('Third Party Services',
                p(`We use trusted third-party services for payment processing and game top-up delivery. These services have their own privacy policies and handle your data in accordance with their terms. We do not sell or share your personal data with advertisers.`)
              )}

              {section('Your Rights', <>
                {p('You have the right to:')}
                {['Access the personal data we hold about you', 'Request correction of inaccurate data', 'Request deletion of your account and data', 'Contact us with any privacy concerns'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}><span style={{ color: theme.primary }}>•</span>{item}</div>
                ))}
              </>)}

              {section('Contact',
                p(`For any privacy-related concerns, please contact us via WhatsApp at ${WHATSAPP}.`)
              )}
            </div>
          )}

          {/* ── TERMS ── */}
          {tab === 'terms' && (
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Terms & Conditions</h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 24 }}>Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

              {section('Acceptance of Terms',
                p(`By using ${site}, you agree to these Terms & Conditions. If you do not agree, please do not use our service.`)
              )}

              {section('Our Service',
                p(`${site} provides game top-up services allowing users to purchase in-game currencies and items for various games. We act as a reseller and are not affiliated with the game developers.`)
              )}

              {section('User Responsibilities', <>
                {['You must provide accurate Player ID and Zone ID — wrong IDs will result in delivery to the wrong account', 'You are responsible for ensuring your account complies with the game\'s terms of service', 'You must be of legal age to make purchases in your jurisdiction', 'One account per user — multiple accounts may be suspended'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 13 }}><span style={{ color: theme.primary }}>•</span>{item}</div>
                ))}
              </>)}

              {section('Payments & Refunds', <>
                {p('All prices are listed in the currency shown on the site. Payments are processed securely through our payment gateway.')}
                {p('Refunds are only available in the following cases:')}
                {['Order was not delivered within 24 hours due to a system error', 'Duplicate payment was charged for the same order', 'Technical error on our end prevented delivery'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}><span style={{ color: theme.primary }}>•</span>{item}</div>
                ))}
                {p('Refunds are NOT available if you entered an incorrect Player ID or Zone ID.')}
              </>)}

              {section('Delivery',
                p('Most orders are delivered instantly and automatically. In rare cases delivery may take up to 30 minutes. If your order is not delivered within 1 hour, please contact our support team with your Order ID.')
              )}

              {section('Prohibited Activities', <>
                {['Using our service for fraudulent transactions', 'Attempting to exploit pricing errors or system bugs', 'Reselling our services without written permission', 'Chargebacks without contacting support first'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}><span style={{ color: '#ef4444' }}>✕</span>{item}</div>
                ))}
              </>)}

              {section('Limitation of Liability',
                p(`${site} is not responsible for any loss of in-game items, account bans, or other consequences resulting from the use of our service in violation of a game's terms of service. Our maximum liability is limited to the amount paid for the specific order in question.`)
              )}

              {section('Changes to Terms',
                p('We reserve the right to update these terms at any time. Continued use of our service after changes constitutes acceptance of the new terms.')
              )}
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}