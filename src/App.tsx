import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from '@/features/auth/useAuth'
import Login from '@/features/auth/Login'
import AdminDashboard from '@/features/admin/pages/AdminDashboard'
import TournamentAdmin from '@/features/admin/pages/TournamentAdmin'
import PublicTournament from '@/features/viewer/pages/PublicTournament'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster theme="dark" position="bottom-center" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/t/:id" element={<PublicTournament />} />
        <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/tournament/:id" element={<RequireAuth><TournamentAdmin /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
