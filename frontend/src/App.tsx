import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './context/AuthContext'
import AboutPage from './pages/AboutPage'
import AdminPage from './pages/AdminPage'
import AuthPage from './pages/AuthPage'
import McpPage from './pages/McpPage'
import RecommendationsPage from './pages/RecommendationsPage'
import ReportsPage from './pages/ReportsPage'
import VacationsPage from './pages/VacationsPage'

const AppRoutes = () => {
  const { user } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<AboutPage />} />
          <Route path="/login" element={user ? <Navigate to="/vacations" replace /> : <AuthPage mode="login" />} />
          <Route path="/register" element={user ? <Navigate to="/vacations" replace /> : <AuthPage mode="register" />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/vacations" element={<VacationsPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/mcp" element={<McpPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
