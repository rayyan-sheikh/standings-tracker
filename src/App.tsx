import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Login from '@/pages/Login'
import AdminDashboard from '@/pages/AdminDashboard'
import TournamentAdmin from '@/pages/TournamentAdmin'
import PublicTournament from '@/pages/PublicTournament'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
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
