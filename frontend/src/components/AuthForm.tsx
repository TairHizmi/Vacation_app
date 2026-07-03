import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

type AuthFormProps = {
  mode: 'login' | 'register'
  onSubmit: (payload: { firstName?: string; lastName?: string; email: string; password: string; role?: string }) => Promise<void>
  error?: string | null
}

const AuthForm = ({ mode, onSubmit, error }: AuthFormProps) => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        firstName: mode === 'register' ? firstName : undefined,
        lastName: mode === 'register' ? lastName : undefined,
        email,
        password,
        role: mode === 'register' ? 'User' : undefined,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-card">
      <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
      <p className="muted-text">
        {mode === 'login'
          ? 'Sign in to browse curated vacations and save your favorites.'
          : 'Join Voyage Hub to track dreamy stays and discover new escapes.'}
      </p>
      <form onSubmit={handleSubmit} className="auth-form">
        {mode === 'register' && (
          <>
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" required />
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name" required />
          </>
        )}
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" minLength={4} required />
        {error && <div className="error-text">{error}</div>}
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Working...' : mode === 'login' ? 'Log in' : 'Register'}
        </button>
      </form>
      <div className="auth-link-row">
        {mode === 'login' ? <Link to="/register">Need an account?</Link> : <Link to="/login">Already have one?</Link>}
      </div>
    </div>
  )
}

export default AuthForm
