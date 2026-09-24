// src/pages/Profile.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../api/axios'
import theme from '../theme'


export default function Profile() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()

  const [name, setName]         = useState(user?.name || '')
  const [phone, setPhone]       = useState(user?.phone || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]       = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving]     = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [msg, setMsg]           = useState('')
  const [err, setErr]           = useState('')
  const [pwMsg, setPwMsg]       = useState('')
  const [pwErr, setPwErr]       = useState('')

  // Change phone
  const [showPhoneForm, setShowPhoneForm] = useState(false)
  const [cpPhone, setCpPhone]             = useState('')
  const [cpOtpSent, setCpOtpSent]         = useState(false)
  const [cpOtp, setCpOtp]                 = useState('')
  const [cpLoading, setCpLoading]         = useState(false)
  const [cpMsg, setCpMsg]                 = useState('')
  const [cpErr, setCpErr]                 = useState('')
  const [cpCooldown, setCpCooldown]       = useState(0)

  const handleUpdateProfile = async e => {
    e.preventDefault()
    setSaving(true); setMsg(''); setErr('')
    try {
      const { data } = await api.put('/auth/profile', { name, phone })
      login(localStorage.getItem('token'), data.user || { ...user, name })
      setMsg('Profile updated!')
    } catch (e) {
      setErr(e.response?.data?.message || 'Update failed')
    } finally { setSaving(false) }
  }

  const handleChangePassword = async e => {
    e.preventDefault()
    setPwMsg(''); setPwErr('')
    if (newPw.length < 6) return setPwErr('New password must be at least 6 characters')
    if (newPw !== confirmPw) return setPwErr('Passwords do not match')
    setPwSaving(true)
    try {
      await api.put('/auth/password', { currentPassword: currentPw, newPassword: newPw })
      setPwMsg('Password changed!')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (e) {
      setPwErr(e.response?.data?.message || 'Failed to change password')
    } finally { setPwSaving(false) }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const card = {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 18, padding: 24, marginBottom: 16,
  }

  const inp = {
    width: '100%', background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '11px 14px',
    color: '#fff', fontSize: 14, outline: 'none',
  }

  return (
    <>
      <Navbar />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 560 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0 }}>Profile</h1>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 20,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </div>

          {/* Avatar + info */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: theme.grad,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 900, color: '#fff', flexShrink: 0,
              border: '2px solid rgba(249,115,22,0.3)',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>{user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{user?.email}</div>
              {user?.role === 'admin' && (
                <span style={{
                  display: 'inline-block', marginTop: 4,
                  padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: theme.alpha(0.15), color: theme.primary,
                  border: '1px solid rgba(249,115,22,0.3)',
                }}>Admin</span>
              )}
            </div>
          </div>

          {/* Update name */}
          <div style={card}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 16 }}>Edit Profile</div>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Display Name</label>
                <input style={inp} value={name} onChange={e => setName(e.target.value)}
                  onFocus={e => e.target.style.borderColor = theme.alpha(0.5)}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input style={{ ...inp, opacity: 0.5, cursor: 'not-allowed' }} value={user?.email} readOnly />
              </div>
              {msg && <div style={{ color: '#4ade80', fontSize: 13, background: 'rgba(34,197,94,0.08)', padding: '8px 12px', borderRadius: 8 }}>{msg}</div>}
              {err && <div style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8 }}>{err}</div>}
              <button type="submit" disabled={saving} style={{
                padding: '11px 0', borderRadius: 10, fontWeight: 800, fontSize: 14,
                background: theme.grad,
                border: '1px solid rgba(249,115,22,0.3)', color: '#fff',
                cursor: 'pointer', opacity: saving ? 0.7 : 1,
              }}>{saving ? 'Saving…' : 'Save Changes'}</button>
            </form>
          </div>

          {/* Change phone */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showPhoneForm ? 16 : 0 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Phone Number</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 3 }}>
                  {user?.phone ? `+91 ${user.phone.slice(0,2)}••••${user.phone.slice(-2)}` : 'Not added'}
                </div>
              </div>
              <button
                onClick={() => { setShowPhoneForm(v => !v); setCpPhone(''); setCpOtpSent(false); setCpOtp(''); setCpMsg(''); setCpErr(''); setCpCooldown(0) }}
                style={{
                  padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                  background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)',
                  color: '#a78bfa', cursor: 'pointer',
                }}
              >{showPhoneForm ? 'Cancel' : user?.phone ? 'Change' : 'Add'}</button>
            </div>

            {showPhoneForm && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {!cpOtpSent ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="tel" inputMode="numeric" placeholder="10-digit mobile number"
                      value={cpPhone}
                      onChange={e => setCpPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                      style={{ ...inp, flex: 1 }}
                    />
                    <button
                      onClick={async () => {
                        setCpErr(''); setCpMsg('')
                        if (!/^[6-9]\d{9}$/.test(cpPhone)) return setCpErr('Enter a valid 10-digit number')
                        setCpLoading(true)
                        try {
                          await api.post('/auth/send-phone-otp', { phone: cpPhone })
                          setCpOtpSent(true); setCpOtp('')
                          let c = 30; setCpCooldown(c)
                          const t = setInterval(() => { c--; setCpCooldown(c); if (c <= 0) clearInterval(t) }, 1000)
                        } catch (e) { setCpErr(e.response?.data?.message || 'Failed to send OTP') }
                        finally { setCpLoading(false) }
                      }}
                      disabled={cpLoading}
                      style={{ padding: '11px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#4c00b0)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', opacity: cpLoading ? 0.6 : 1 }}
                    >{cpLoading ? '…' : 'Send OTP'}</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                      Code sent to <strong style={{ color: '#c4b5fd' }}>+91 {cpPhone}</strong>
                      <button onClick={() => { setCpOtpSent(false); setCpOtp('') }} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#7c3aed', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>Change</button>
                    </div>
                    <input
                      type="tel" inputMode="numeric" placeholder="Enter 6-digit OTP"
                      value={cpOtp}
                      onChange={e => setCpOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                      style={{ ...inp, textAlign: 'center', letterSpacing: 6, fontSize: 18, fontWeight: 700 }}
                    />
                    <button
                      onClick={async () => {
                        setCpErr(''); setCpMsg('')
                        if (cpOtp.length !== 6) return setCpErr('Enter the 6-digit code')
                        setCpLoading(true)
                        try {
                          const { data } = await api.post('/auth/verify-phone-otp-pre', { phone: cpPhone, otp: cpOtp })
                          await api.post('/auth/add-phone', { phoneVerifiedToken: data.token })
                          login(localStorage.getItem('token'), { ...user, phone: cpPhone })
                          setCpMsg('Phone number updated!')
                          setShowPhoneForm(false)
                        } catch (e) { setCpErr(e.response?.data?.message || 'Incorrect code') }
                        finally { setCpLoading(false) }
                      }}
                      disabled={cpLoading || cpOtp.length !== 6}
                      style={{ padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#4c00b0)', border: 'none', color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', opacity: (cpLoading || cpOtp.length !== 6) ? 0.5 : 1 }}
                    >{cpLoading ? 'Verifying…' : 'Verify & Save'}</button>
                    {cpCooldown > 0
                      ? <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Resend in {cpCooldown}s</div>
                      : <button onClick={() => { setCpOtpSent(false); setCpOtp('') }} style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}>Resend OTP</button>
                    }
                  </>
                )}
                {cpErr && <div style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8 }}>{cpErr}</div>}
              </div>
            )}
            {cpMsg && !showPhoneForm && <div style={{ color: '#4ade80', fontSize: 13, background: 'rgba(34,197,94,0.08)', padding: '8px 12px', borderRadius: 8, marginTop: 12 }}>{cpMsg}</div>}
          </div>

          {/* Change password */}
          <div style={card}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#fff', marginBottom: 16 }}>Change Password</div>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['Current Password', currentPw, setCurrentPw],
                ['New Password',     newPw,     setNewPw],
                ['Confirm Password', confirmPw,  setConfirmPw],
              ].map(([label, val, setter]) => (
                <div className="form-group" key={label}>
                  <label>{label}</label>
                  <input style={inp} type="password" value={val}
                    onChange={e => setter(e.target.value)}
                    onFocus={e => e.target.style.borderColor = theme.alpha(0.5)}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'} />
                </div>
              ))}
              {pwMsg && <div style={{ color: '#4ade80', fontSize: 13, background: 'rgba(34,197,94,0.08)', padding: '8px 12px', borderRadius: 8 }}>{pwMsg}</div>}
              {pwErr && <div style={{ color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8 }}>{pwErr}</div>}
              <button type="submit" disabled={pwSaving} style={{
                padding: '11px 0', borderRadius: 10, fontWeight: 800, fontSize: 14,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)', color: '#fff',
                cursor: 'pointer', opacity: pwSaving ? 0.7 : 1,
              }}>{pwSaving ? 'Changing…' : 'Change Password'}</button>
            </form>
          </div>


        </div>
      </div>
    </>
  )
}