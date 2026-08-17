import { Routes, Route, Navigate } from 'react-router-dom'
import { Wrench, KeyRound } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { useSettings } from './context/SettingsContext'

import { lazy, Suspense } from 'react'

import Home          from './pages/Home'
import Auth          from './pages/Auth'
import Recharge      from './pages/Recharge'

const Orders        = lazy(() => import('./pages/Orders'))
const Wallet        = lazy(() => import('./pages/Wallet'))
const Tools         = lazy(() => import('./pages/Tools'))
const Profile       = lazy(() => import('./pages/Profile'))
const PaymentSuccess= lazy(() => import('./pages/PaymentSuccess'))
const InfoPage      = lazy(() => import('./pages/InfoPage'))
const ManualOrder   = lazy(() => import('./pages/ManualOrder'))

const AdminLayout   = lazy(() => import('./admin/AdminLayout'))
const Dashboard     = lazy(() => import('./admin/Dashboard'))
const AdminGames    = lazy(() => import('./admin/AdminGames'))
const AdminPacks    = lazy(() => import('./admin/AdminPacks'))
const AdminOrders   = lazy(() => import('./admin/AdminOrders'))
const AdminUsers    = lazy(() => import('./admin/AdminUsers'))
const AdminSettings = lazy(() => import('./admin/AdminSettings'))
const AdminBanners  = lazy(() => import('./admin/AdminBanners'))
const AdminCoupons  = lazy(() => import('./admin/AdminCoupons'))
const AdminWallet   = lazy(() => import('./admin/AdminWallet'))

function Loader() {
  return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  return user ? children : <Navigate to="/auth" replace />
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <Loader />
  if (!user)    return <Navigate to="/auth" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  return !user ? children : <Navigate to="/" replace />
}

export default function App() {
  const { settings, settingsLoaded } = useSettings()
  const { user, loading, isAdmin } = useAuth()

  if (loading || !settingsLoaded) return <Loader />

  if (settings.maintenanceMode && !isAdmin && !loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 20,
        background: 'linear-gradient(135deg, #0a0a1a 0%, #120820 100%)',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{
            width: 90, height: 90, borderRadius: 24, margin: '0 auto 28px',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))',
            border: '2px solid rgba(124,58,237,0.4)',
            boxShadow: '0 0 40px rgba(124,58,237,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Wrench size={40} color="rgba(124,58,237,0.9)" /></div>

          <h1 style={{
            fontSize: 32, fontWeight: 900, marginBottom: 14,
            color: '#ffffff', letterSpacing: '-0.5px',
          }}>
            Under Maintenance
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: 16, lineHeight: 1.7, marginBottom: 36,
          }}>
            We're making some improvements.<br />Check back soon!
          </p>

          <a href="/auth" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 50,
            fontSize: 15, fontWeight: 700,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: '#fff', textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(124,58,237,0.5)',
          }}><KeyRound size={15} style={{ marginRight: 6 }} />Admin Login</a>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={null}>
    <Routes>
      <Route path="/"                 element={<Home />} />
      <Route path="/recharge/:gameId" element={<Recharge />} />
      <Route path="/order/:gameId"   element={<PrivateRoute><ManualOrder /></PrivateRoute>} />
      <Route path="/payment/success"  element={<PaymentSuccess />} />
      <Route path="/about"           element={<InfoPage defaultTab="about" />} />
      <Route path="/contact"         element={<InfoPage defaultTab="contact" />} />
      <Route path="/privacy"         element={<InfoPage defaultTab="privacy" />} />
      <Route path="/terms"           element={<InfoPage defaultTab="terms" />} />

      <Route path="/auth" element={<GuestRoute><Auth /></GuestRoute>} />

      <Route path="/orders"  element={<PrivateRoute><Orders /></PrivateRoute>} />
      <Route path="/wallet"  element={<PrivateRoute><Wallet /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/tools"   element={<Tools />} />

      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index            element={<Dashboard />} />
        <Route path="games"     element={<AdminGames />} />
        <Route path="packs"     element={<AdminPacks />} />
        <Route path="orders"    element={<AdminOrders />} />
        <Route path="users"     element={<AdminUsers />} />
        <Route path="banners"   element={<AdminBanners />} />
        <Route path="coupons"   element={<AdminCoupons />} />
        <Route path="wallet"    element={<AdminWallet />} />
        <Route path="settings"  element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}