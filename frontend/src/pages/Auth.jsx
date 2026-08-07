// src/pages/Auth.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { KeyRound, Lock } from 'lucide-react'
import api from '../api/axios'
import theme from '../theme'

export default function Auth() {
  const { login } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const [tab, setTab]           = useState('login')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // OTP state
  const [step, setStep]         = useState('form') // 'form' | 'otp' | 'phone-otp' | 'forgot' | 'reset-otp' | 'new-password'
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingPhone, setPendingPhone] = useState('')
  const [otp, setOtp]           = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Forgot password state
  const [forgotEmail, setForgotEmail]     = useState('')
  const [resetOtp, setResetOtp]           = useState('')
  const [newPassword, setNewPassword]     = useState('')
  const [newConfirm, setNewConfirm]       = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError]     = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')

  const reset = () => { setError(''); setPassword(''); setConfirm('') }

  const handleLogin = async e => {
    e.preventDefault(); setError('')
    if (!email || !password) return setError('Fill in all fields')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      if (data.requiresVerification) {
        setPendingEmail(data.email)
        setStep('otp')
        startResendCooldown()
        return
      }
      login(data.token, data.user)
      navigate('/')
    } catch (err) {
      const d = err.response?.data
      if (d?.requiresVerification) {
        setPendingEmail(d.email)
        setStep('otp')
        startResendCooldown()
        return
      }
      setError(d?.message || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  const handleRegister = async e => {
    e.preventDefault(); setError('')
    if (!name || !email || !phone || !password) return setError('Fill in all fields')
    const phone10 = phone.replace(/^\+?91/, '').replace(/\D/g, '').slice(-10)
    if (!/^[6-9]\d{9}$/.test(phone10)) return setError('Enter a valid 10-digit Indian mobile number')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return setError('Password needs uppercase, lowercase and a number')
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    try {
      await api.post('/auth/register', { name, email, password, phone })
      setPendingEmail(email)
      setStep('otp')
      startResendCooldown()
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const handleVerifyOTP = async e => {
    e.preventDefault(); setOtpError('')
    if (!otp || otp.length !== 6) return setOtpError('Enter the 6-digit code')
    setOtpLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { email: pendingEmail, otp })
      if (data.requiresPhoneVerification) {
        setPendingPhone(data.phone || '')
        setOtp('')
        setOtpError('')
        setStep('phone-otp')
        startResendCooldown()
        return
      }
      login(data.token, data.user)
      navigate('/')
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid code')
    } finally { setOtpLoading(false) }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return
    try {
      await api.post('/auth/resend-otp', { email: pendingEmail })
      setOtpError('')
      startResendCooldown()
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend')
    }
  }

  const handleVerifyPhoneOTP = async e => {
    e.preventDefault(); setOtpError('')
    if (!otp || otp.length !== 6) return setOtpError('Enter the 6-digit code')
    setOtpLoading(true)
    try {
      const { data } = await api.post('/auth/verify-phone-otp', { email: pendingEmail, otp })
      login(data.token, data.user)
      navigate('/')
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid code')
    } finally { setOtpLoading(false) }
  }

  const handleResendPhoneOTP = async () => {
    if (resendCooldown > 0) return
    try {
      await api.post('/auth/resend-phone-otp', { email: pendingEmail })
      setOtpError('')
      startResendCooldown()
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Failed to resend')
    }
  }

  const handleForgotPassword = async e => {
    e.preventDefault(); setForgotError(''); setForgotSuccess('')
    if (!forgotEmail) return setForgotError('Enter your email address')
    setForgotLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail })
      setForgotSuccess('If that email exists, a reset code has been sent.')
      setPendingEmail(forgotEmail)
      startResendCooldown()
      setStep('reset-otp')
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to send reset email')
    } finally { setForgotLoading(false) }
  }

  const handleVerifyResetOtp = async e => {
    e.preventDefault(); setForgotError('')
    if (!resetOtp || resetOtp.length !== 6) return setForgotError('Enter the 6-digit code')
    setForgotLoading(true)
    setForgotLoading(false)
    setStep('new-password')
  }

  const handleResetPassword = async e => {
    e.preventDefault(); setForgotError('')
    if (newPassword.length < 8) return setForgotError('Password must be at least 8 characters')
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) return setForgotError('Password needs uppercase, lowercase and a number')
    if (newPassword !== newConfirm) return setForgotError('Passwords do not match')
    setForgotLoading(true)
    try {
      await api.post('/auth/reset-password', { email: pendingEmail, otp: resetOtp, password: newPassword })
      setStep('form')
      setTab('login')
      setEmail(pendingEmail)
      setForgotEmail(''); setResetOtp(''); setNewPassword(''); setNewConfirm('')
      setError('Password reset! Please log in with your new password.')
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Reset failed')
      if (err.response?.status === 400) setStep('reset-otp')
    } finally { setForgotLoading(false) }
  }

  const handleResendResetOtp = async () => {
    if (resendCooldown > 0) return
    try {
      await api.post('/auth/forgot-password', { email: pendingEmail })
      setForgotError('')
      startResendCooldown()
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to resend')
    }
  }

  const startResendCooldown = () => {
    setResendCooldown(60)
    const t = setInterval(() => {
      setResendCooldown(v => {
        if (v <= 1) { clearInterval(t); return 0 }
        return v - 1
      })
    }, 1000)
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, padding: '12px 14px',
    color: '#fff', fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
  }

  const card = {
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: 20, padding: 28,
  }

  const outerWrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', zIndex: 1 }

  const submitBtn = (disabled) => ({
    width: '100%', padding: 13, borderRadius: 11, fontWeight: 800, fontSize: 15,
    background: theme.grad, border: '1px solid rgba(249,115,22,0.3)',
    color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
  })

  const ghostBtn = {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
    fontSize: 13, cursor: 'pointer', padding: 0,
  }

  const resendBtnStyle = (disabled) => ({
    background: 'none', border: 'none', fontSize: 13,
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? 'rgba(255,255,255,0.3)' : theme.primary,
    fontWeight: 600,
  })

  const errStyle = {
    color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.1)',
    padding: '8px 12px', borderRadius: 8,
  }

  // ── Forgot Password — enter email ───────────────────
  if (step === 'forgot') {
    return (
      <div style={outerWrap}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ marginBottom: 8 }}><KeyRound size={48} color="#8b5cf6" /></div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Forgot password?</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Enter your email and we'll send a reset code</div>
          </div>
          <div style={card}>
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Email address</label>
                <input style={inputStyle} type="email" placeholder="you@example.com" value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)} autoFocus autoComplete="email" />
              </div>
              {forgotError && <div style={errStyle}>{forgotError}</div>}
              <button type="submit" disabled={forgotLoading} style={submitBtn(forgotLoading)}>
                {forgotLoading ? 'Sending…' : 'Send Reset Code'}
              </button>
              <button type="button" onClick={() => { setStep('form'); setForgotError('') }} style={{ ...ghostBtn, textAlign: 'center' }}>
                ← Back to login
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── Reset OTP verification ───────────────────────────
  if (step === 'reset-otp') {
    return (
      <div style={outerWrap}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📧</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Enter reset code</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              We sent a 6-digit code to<br />
              <span style={{ color: theme.primary, fontWeight: 700 }}>{pendingEmail}</span>
            </div>
          </div>
          <div style={card}>
            <form onSubmit={handleVerifyResetOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>Reset Code</label>
                <input
                  style={{ ...inputStyle, fontSize: 28, fontWeight: 800, letterSpacing: 12, textAlign: 'center' }}
                  type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                  value={resetOtp}
                  onChange={e => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                />
              </div>
              {forgotError && <div style={errStyle}>{forgotError}</div>}
              <button type="submit" disabled={resetOtp.length !== 6} style={submitBtn(resetOtp.length !== 6)}>
                Continue
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={() => { setStep('forgot'); setForgotError('') }} style={ghostBtn}>← Back</button>
                <button type="button" onClick={handleResendResetOtp} disabled={resendCooldown > 0} style={resendBtnStyle(resendCooldown > 0)}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── New Password ─────────────────────────────────────
  if (step === 'new-password') {
    return (
      <div style={outerWrap}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ marginBottom: 8 }}><Lock size={48} color="#8b5cf6" /></div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Set new password</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Choose a strong password</div>
          </div>
          <div style={card}>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle, paddingRight: 44 }}
                    type={showPw ? 'text' : 'password'} placeholder="Min. 8 chars, uppercase & number"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} autoFocus
                    autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 16, border: 'none', cursor: 'pointer',
                  }}>{showPw ? '🙈' : '👁️'}</button>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input style={inputStyle} type={showPw ? 'text' : 'password'}
                  placeholder="Repeat password" value={newConfirm} onChange={e => setNewConfirm(e.target.value)}
                  autoComplete="new-password" />
              </div>
              {forgotError && <div style={errStyle}>{forgotError}</div>}
              <button type="submit" disabled={forgotLoading} style={submitBtn(forgotLoading)}>
                {forgotLoading ? 'Resetting…' : 'Reset Password'}
              </button>
              <button type="button" onClick={() => { setStep('reset-otp'); setForgotError('') }} style={{ ...ghostBtn, textAlign: 'center' }}>
                ← Back
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── Login / Register / Inline OTP ────────────────────
  return (
    <div style={outerWrap}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {settings.logo && <img src={settings.logo} alt={settings.siteName} style={{ height: 40, flexShrink: 0 }} />}
            <span>
              <span style={{ color: '#fff' }}>{(settings.siteName || 'Nitrogen Store').split(' ')[0]}</span>
              {(settings.siteName || 'Nitrogen Store').split(' ').slice(1).join(' ') && (
                <span style={{ background: theme.gradSoft, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {' '}{(settings.siteName || 'Nitrogen Store').split(' ').slice(1).join(' ')}
                </span>
              )}
            </span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: 8, fontSize: 14 }}>
            {step === 'otp' ? `Code sent to ${pendingEmail}` :
             step === 'phone-otp' ? `Code sent to ${pendingPhone || 'your phone'}` :
             tab === 'login' ? 'Welcome back' : 'Create your account'}
          </div>
        </div>

        <div style={card}>

          {/* ── Inline Email OTP ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📧</div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: 15, marginBottom: 6 }}>Verify your email</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.5 }}>
                  Enter the 6-digit code we sent to<br />
                  <span style={{ color: theme.primary, fontWeight: 700 }}>{pendingEmail}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Verification Code</label>
                <input
                  style={{ ...inputStyle, fontSize: 26, fontWeight: 800, letterSpacing: 10, textAlign: 'center' }}
                  type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus autoComplete="one-time-code"
                />
              </div>

              {otpError && <div style={errStyle}>{otpError}</div>}

              <button type="submit" disabled={otpLoading || otp.length !== 6} style={submitBtn(otpLoading || otp.length !== 6)}>
                {otpLoading ? 'Verifying…' : 'Verify Email'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={() => { setStep('form'); setOtp(''); setOtpError('') }} style={ghostBtn}>
                  ← Back
                </button>
                <button type="button" onClick={handleResendOTP} disabled={resendCooldown > 0} style={resendBtnStyle(resendCooldown > 0)}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* ── Inline Phone OTP ── */}
          {step === 'phone-otp' && (
            <form onSubmit={handleVerifyPhoneOTP} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📱</div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: 15, marginBottom: 6 }}>Verify your phone</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, lineHeight: 1.5 }}>
                  Enter the 6-digit code we sent to<br />
                  <span style={{ color: theme.primary, fontWeight: 700 }}>{pendingPhone || 'your phone'}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Phone Verification Code</label>
                <input
                  style={{ ...inputStyle, fontSize: 26, fontWeight: 800, letterSpacing: 10, textAlign: 'center' }}
                  type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus autoComplete="one-time-code"
                />
              </div>

              {otpError && <div style={errStyle}>{otpError}</div>}

              <button type="submit" disabled={otpLoading || otp.length !== 6} style={submitBtn(otpLoading || otp.length !== 6)}>
                {otpLoading ? 'Verifying…' : 'Verify Phone'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={() => { setStep('form'); setOtp(''); setOtpError('') }} style={ghostBtn}>
                  ← Back
                </button>
                <button type="button" onClick={handleResendPhoneOTP} disabled={resendCooldown > 0} style={resendBtnStyle(resendCooldown > 0)}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* ── Login / Register ── */}
          {step === 'form' && (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 }}>
                {['login', 'register'].map(t => (
                  <button key={t} onClick={() => { setTab(t); reset() }} style={{
                    flex: 1, padding: '9px 0', borderRadius: 7, fontSize: 14, fontWeight: 700,
                    background: tab === t ? theme.grad : 'transparent',
                    color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                    border: tab === t ? '1px solid rgba(249,115,22,0.3)' : 'none',
                    cursor: 'pointer',
                  }}>
                    {t === 'login' ? 'Login' : 'Register'}
                  </button>
                ))}
              </div>

              {tab === 'login' ? (
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label>Email address</label>
                    <input style={inputStyle} type="email" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoFocus />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inputStyle, paddingRight: 44 }}
                        type={showPw ? 'text' : 'password'} placeholder="Your password"
                        value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                      <button type="button" onClick={() => setShowPw(v => !v)} style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 16, border: 'none', cursor: 'pointer',
                      }}>{showPw ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: -8 }}>
                    <button type="button" onClick={() => { setStep('forgot'); setForgotError(''); setForgotEmail(email) }} style={{
                      background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', color: theme.primary, fontWeight: 600,
                    }}>Forgot password?</button>
                  </div>
                  {error && <div style={{ color: error.startsWith('Password reset') ? '#4ade80' : '#f87171', fontSize: 13, background: error.startsWith('Password reset') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}
                  <button type="submit" disabled={loading} style={submitBtn(loading)}>
                    {loading ? 'Signing in…' : 'Login'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} autoComplete="off">
                  <div className="form-group">
                    <label>Your name</label>
                    <input style={inputStyle} placeholder="Display name" value={name}
                      onChange={e => setName(e.target.value)} autoFocus autoComplete="off" />
                  </div>
                  <div className="form-group">
                    <label>Email address</label>
                    <input style={inputStyle} type="text" inputMode="email" placeholder="you@example.com" value={email}
                      onChange={e => setEmail(e.target.value)} autoComplete="off" />
                  </div>
                  <div className="form-group">
                    <label>Phone number</label>
                    <div style={{ display: 'flex', gap: 0 }}>
                      <span style={{
                        background: 'rgba(76,0,176,0.15)', border: '1px solid rgba(255,255,255,0.12)',
                        borderRight: 'none', borderRadius: '10px 0 0 10px',
                        padding: '12px 12px', color: 'rgba(255,255,255,0.7)', fontSize: 14,
                        display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', userSelect: 'none',
                      }}>🇮🇳 +91</span>
                      <input style={{ ...inputStyle, borderRadius: '0 10px 10px 0', flex: 1 }}
                        type="tel" inputMode="numeric" placeholder="98765 43210"
                        value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        maxLength={10} autoComplete="off" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inputStyle, paddingRight: 44 }}
                        type={showPw ? 'text' : 'password'} placeholder="Min. 8 chars, uppercase & number"
                        value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPw(v => !v)} style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 16, border: 'none', cursor: 'pointer',
                      }}>{showPw ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Confirm password</label>
                    <input style={inputStyle} type={showPw ? 'text' : 'password'}
                      placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)}
                      autoComplete="new-password" />
                  </div>
                  {error && <div style={errStyle}>{error}</div>}
                  <button type="submit" disabled={loading} style={submitBtn(loading)}>
                    {loading ? 'Sending verification code…' : 'Continue →'}
                  </button>
                  <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: -6 }}>
                    📧 A verification code will be sent to your email
                  </div>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
