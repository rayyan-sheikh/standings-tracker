import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from '@/features/auth/useAuth'

const Login = lazy(() => import('@/features/auth/Login'))
const AdminDashboard = lazy(() => import('@/features/admin/pages/AdminDashboard'))
const TournamentAdmin = lazy(() => import('@/features/admin/pages/TournamentAdmin'))
const PublicTournament = lazy(() => import('@/features/viewer/pages/PublicTournament'))

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-green-400 animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster theme="dark" position="bottom-center" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/t/:id" element={<PublicTournament />} />
          <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
          <Route path="/admin/tournament/:id" element={<RequireAuth><TournamentAdmin /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
