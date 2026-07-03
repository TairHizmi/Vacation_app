import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type LayoutProps = {
  title?: string
}

const Layout = ({ title }: LayoutProps) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand-row">
            <img className="brand-logo" src="/favicon.svg" alt="Voyage Hub logo" />
            <div className="brand">Voyage Hub</div>
          </div>
          <div className="brand-subtitle">Plan, explore, and manage unforgettable escapes</div>
        </div>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/">About</NavLink>
          {user ? (
            <>
              <NavLink to="/vacations">Vacations</NavLink>
              <NavLink to="/recommendations">AI Picks</NavLink>
              <NavLink to="/mcp">MCP Ask</NavLink>
              {user.role === 'Admin' && (
                <>
                  <NavLink to="/admin">Admin</NavLink>
                  <NavLink to="/reports">Reports</NavLink>
                </>
              )}
              <button className="ghost-button" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </header>

      <main className="page-shell">
        {title && <h1 className="page-title">{title}</h1>}
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
