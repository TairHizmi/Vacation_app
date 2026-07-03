import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

type Vacation = {
  id: number
  destination: string
  description: string
  startDate: string
  endDate: string
  price: number
  coverImageFilename: string | null
  likesCount: number
  likedByMe: boolean
}

type FormState = {
  destination: string
  description: string
  startDate: string
  endDate: string
  price: string
  coverImage: File | null
}

const initialFormState: FormState = {
  destination: '',
  description: '',
  startDate: '',
  endDate: '',
  price: '',
  coverImage: null,
}

const AdminPage = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.role === 'Admin'

  const currentEditId = searchParams.get('edit')

  const resetForm = () => {
    setFormState(initialFormState)
    setSelectedId(null)
    setError(null)
    setSearchParams({})
  }

  const loadVacations = async () => {
    setLoading(true)
    try {
      const response = await api.get<{ vacations: Vacation[]; pagination: { page: number; pageSize: number; totalItems: number; totalPages: number } }>(`/vacations?page=1&filter=all`)
      setVacations(response.data.vacations)
    } catch (loadError) {
      console.error('Unable to load vacations:', loadError)
    } finally {
      setLoading(false)
    }
  }

  const normalizeDateString = (value: string) => {
    if (!value) return ''
    const match = value.match(/\d{4}-\d{2}-\d{2}/)
    return match ? match[0] : value
  }

  const loadSelectedVacation = async (id: number) => {
    setLoading(true)
    try {
      const response = await api.get<Vacation>(`/vacations/${id}`)
      setFormState({
        destination: response.data.destination,
        description: response.data.description,
        startDate: normalizeDateString(response.data.startDate),
        endDate: normalizeDateString(response.data.endDate),
        price: String(response.data.price),
        coverImage: null,
      })
      setSelectedId(id)
    } catch (loadError) {
      console.error('Unable to load vacation for editing:', loadError)
      setError('Unable to load selected vacation.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      return
    }

    void loadVacations()
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) {
      return
    }

    if (currentEditId) {
      const parsedId = Number(currentEditId)
      if (!Number.isNaN(parsedId)) {
        void loadSelectedVacation(parsedId)
      }
    } else {
      resetForm()
    }
  }, [currentEditId, isAdmin])

  const validateForm = () => {
    const destination = formState.destination.trim()
    const description = formState.description.trim()
    const priceValue = Number(formState.price)
    if (!destination || !description || !formState.startDate || !formState.endDate || formState.price.trim() === '') {
      setError('All fields except cover image are required.')
      return false
    }

    if (Number.isNaN(priceValue) || priceValue < 0 || priceValue > 10000) {
      setError('Price must be a number between 0 and 10,000.')
      return false
    }

    const start = new Date(`${formState.startDate}T00:00:00`)
    const end = new Date(`${formState.endDate}T00:00:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('Please provide valid dates.')
      return false
    }

    if (end < start) {
      setError('End date must be after start date.')
      return false
    }

    if (!selectedId) {
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      if (start < todayStart) {
        setError('New vacations must start today or later.')
        return false
      }
    }

    setError(null)
    return true
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('destination', formState.destination.trim())
      formData.append('description', formState.description.trim())
      formData.append('startDate', formState.startDate)
      formData.append('endDate', formState.endDate)
      formData.append('price', formState.price)
      if (formState.coverImage) {
        formData.append('coverImage', formState.coverImage)
      }

      if (selectedId) {
        await api.put(`/vacations/${selectedId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/vacations', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      await loadVacations()
      resetForm()
    } catch (submitError) {
      console.error('Unable to save vacation:', submitError)
      setError('Unable to save vacation. Please verify your values and try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Delete this vacation? This action cannot be undone.')
    if (!confirmed) {
      return
    }

    try {
      await api.delete(`/vacations/${id}`)
      await loadVacations()
      if (selectedId === id) {
        resetForm()
      }
    } catch (deleteError) {
      console.error('Delete vacation failed:', deleteError)
      setError('Unable to delete vacation.')
    }
  }

  if (!user) {
    return null
  }

  if (!isAdmin) {
    return (
      <section className="stacked-section">
        <article className="hero-card">
          <p className="eyebrow">Admin access required</p>
          <h2>Only admin users can manage vacations.</h2>
        </article>
      </section>
    )
  }

  return (
    <section className="stacked-section">
      <article className="hero-card">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h2>Manage the vacation catalog from one calm command center.</h2>
          <p className="muted-text">Add new stays, update existing ones, and monitor the travel report for your team.</p>
        </div>
      </article>

      <article className="info-card">
        <h3>{selectedId ? 'Edit Vacation' : 'Add Vacation'}</h3>
        <form onSubmit={handleSubmit} className="admin-form">
          <label>
            Destination
            <input
              value={formState.destination}
              onChange={(event) => setFormState({ ...formState, destination: event.target.value })}
              placeholder="Rome, Paris, Honolulu"
            />
          </label>
          <label>
            Description
            <textarea
              value={formState.description}
              onChange={(event) => setFormState({ ...formState, description: event.target.value })}
              placeholder="Describe the vacation experience"
            />
          </label>
          <label>
            Start Date
            <input
              type="date"
              value={formState.startDate}
              onChange={(event) => setFormState({ ...formState, startDate: event.target.value })}
            />
          </label>
          <label>
            End Date
            <input
              type="date"
              value={formState.endDate}
              onChange={(event) => setFormState({ ...formState, endDate: event.target.value })}
            />
          </label>
          <label>
            Price
            <input
              type="number"
              value={formState.price}
              onChange={(event) => setFormState({ ...formState, price: event.target.value })}
              min="0"
              max="10000"
              step="0.01"
            />
          </label>
          <label>
            Cover Image
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setFormState({ ...formState, coverImage: event.target.files?.[0] ?? null })}
            />
          </label>
          {error && <div className="error-text">{error}</div>}
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving...' : selectedId ? 'Update Vacation' : 'Add Vacation'}
            </button>
            {selectedId && (
              <button className="ghost-button" type="button" onClick={resetForm} disabled={saving}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </article>

      <article className="info-card">
        <h3>Vacation Catalog</h3>
        {loading ? (
          <div className="loading-state">Loading vacations...</div>
        ) : (
          <div className="admin-list">
            {vacations.map((vacation) => (
              <div key={vacation.id} className="admin-list-item">
                <div>
                  <strong>{vacation.destination}</strong>
                  <div className="muted-text">{normalizeDateString(vacation.startDate)} → {normalizeDateString(vacation.endDate)}</div>
                </div>
                <div className="inline-actions">
                  <button type="button" className="ghost-button small" onClick={() => setSearchParams({ edit: String(vacation.id) })}>
                    Edit
                  </button>
                  <button type="button" className="ghost-button small" onClick={() => void handleDelete(vacation.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {vacations.length === 0 && <div className="muted-text">No vacations found yet.</div>}
          </div>
        )}
      </article>
    </section>
  )
}

export default AdminPage
