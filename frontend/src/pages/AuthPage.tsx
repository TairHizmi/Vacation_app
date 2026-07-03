import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import AuthForm from '../components/AuthForm'
import { useAuth } from '../context/AuthContext'

type AuthPageProps = {
  mode: 'login' | 'register'
}

const AuthPage = ({ mode }: AuthPageProps) => {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (payload: { firstName?: string; lastName?: string; email: string; password: string; role?: string }) => {
    try {
      setError(null)
      if (mode === 'login') {
        await login(payload.email, payload.password)
      } else {
        await register({
          firstName: payload.firstName ?? '',
          lastName: payload.lastName ?? '',
          email: payload.email,
          password: payload.password,
          role: payload.role,
        })
      }
      navigate('/vacations')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to authenticate right now.'
      setError(message)
    }
  }

  return <AuthForm mode={mode} onSubmit={handleSubmit} error={error} />
}

export default AuthPage
