import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-state">Loading your workspace...</div>
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
