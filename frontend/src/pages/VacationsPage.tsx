import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  cover_image_filename?: string | null // תמיכה במבנה הנתונים מה-SQL
  likesCount: number
  likedByMe: boolean
}

type Pagination = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

type VacationListResponse = {
  vacations: Vacation[]
  pagination: Pagination
}

const VacationsPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vacations, setVacations] = useState<Vacation[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 9, totalItems: 0, totalPages: 1 })
  const [filter, setFilter] = useState<'all' | 'liked' | 'active' | 'upcoming'>('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const imageMap: { [key: string]: string } = {
    'rome.jpg': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&auto=format&fit=crop',
    'rhodes.jpg': 'https://images.unsplash.com/photo-1601581874834-3b6065645e07?w=600&auto=format&fit=crop',
    'lahaina.jpg': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop',
    'hilo.jpg': 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?w=600&auto=format&fit=crop',
    'honolulu.jpg': 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&auto=format&fit=crop',
    'kailua_kona.jpg': 'https://images.unsplash.com/photo-1509233725247-49e657c54213?w=600&auto=format&fit=crop',
    'port_antonio.jpg': 'https://images.unsplash.com/photo-1538964173425-93884d739596?w=600&auto=format&fit=crop',
    'paris.jpg': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&auto=format&fit=crop',
    
    // שינוי לקישורים ניטרליים ויציבים עבור שלושת היעדים העקשניים לעקיפת בעיות CORS
    'corfu.jpg': 'https://picsum.photos/id/1015/600/400',
    'montego_bay.jpg': 'https://picsum.photos/id/1016/600/400',
    'puerto_rico.jpg': 'https://picsum.photos/id/1018/600/400',
    'las_vegas.jpg': 'https://picsum.photos/id/1043/600/400',
  }

  const normalizeDateString = (value: string) => {
    if (!value) return ''
    const match = value.match(/\d{4}-\d{2}-\d{2}/)
    return match ? match[0] : value
  }

  const loadVacations = async (nextPage = page, nextFilter = filter, search = searchTerm) => {
    setLoading(true)
    try {
      const encodedSearch = encodeURIComponent(search)
      const response = await api.get<VacationListResponse>(`/vacations?page=${nextPage}&filter=${nextFilter}&search=${encodedSearch}`)
      setVacations(response.data.vacations)
      setPagination(response.data.pagination)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadVacations(page, filter)
  }, [page, filter])

  const handleToggleLike = async (id: number) => {
    try {
      await api.post(`/vacations/${id}/like`)
      await loadVacations(page, filter)
    } catch {
      // keep UI resilient for now
    }
  }

  const handleEditVacation = (id: number) => {
    navigate(`/admin?edit=${id}`)
  }

  const handleDeleteVacation = async (id: number) => {
    const confirmed = window.confirm('Delete this vacation? This action cannot be undone.')
    if (!confirmed) {
      return
    }

    try {
      await api.delete(`/vacations/${id}`)
      await loadVacations(page, filter)
    } catch (error) {
      console.error('Delete vacation failed:', error)
      window.alert('Unable to delete vacation. Please try again.')
    }
  }

  const heroCopy = useMemo(() => {
    if (user?.role === 'Admin') {
      return 'Manage the catalog with quick edits and delete actions.'
    }
    return 'Browse handpicked escapes and save your favorites.'
  }, [user])

  return (
    <div className="stacked-section">
      <section className="hero-card vacation-page-header">
        <div className="hero-copy">
          <p className="eyebrow">Vacation collection</p>
          <h2>{heroCopy}</h2>
          <p className="muted-text">Sort, filter, and explore vacation ideas with a clean responsive layout.</p>
        </div>
        <div className="hero-actions">
          <div className="filter-row">
            <button className={filter === 'all' ? 'filter-pill active' : 'filter-pill'} onClick={() => { setFilter('all'); setPage(1); void loadVacations(1, 'all', searchTerm) }}>All</button>
            <button className={filter === 'liked' ? 'filter-pill active' : 'filter-pill'} onClick={() => { setFilter('liked'); setPage(1); void loadVacations(1, 'liked', searchTerm) }}>Liked</button>
            <button className={filter === 'active' ? 'filter-pill active' : 'filter-pill'} onClick={() => { setFilter('active'); setPage(1); void loadVacations(1, 'active', searchTerm) }}>Active</button>
            <button className={filter === 'upcoming' ? 'filter-pill active' : 'filter-pill'} onClick={() => { setFilter('upcoming'); setPage(1); void loadVacations(1, 'upcoming', searchTerm) }}>Upcoming</button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="loading-state">Loading vacations...</div>
      ) : (
        <div className="card-grid">
          {vacations.map((vacation) => {
            // חילוץ שם הקובץ הגולמי
            // חילוץ שם הקובץ והפיכתו לאותיות קטנות בלבד באופן יזום
const rawFilename = vacation.coverImageFilename || vacation.cover_image_filename
const filename = rawFilename ? rawFilename.trim().toLowerCase() : null

const imageUrl = filename
  ? filename.startsWith('http')
    ? filename 
    : imageMap[filename] || `http://localhost:5000/uploads/${filename}`
  : undefined

            return (
              <article key={vacation.id} className="vacation-card">
                <div className="card-image" style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : 'none' }} />
                <div className="card-body">
                  <div className="card-header-row">
                    <h3>{vacation.destination}</h3>
                    <span className="price-pill">${vacation.price}</span>
                  </div>
                  <p className="muted-text">{vacation.description}</p>
                  <div className="meta-line">{normalizeDateString(vacation.startDate)} → {normalizeDateString(vacation.endDate)}</div>
                  <div className="card-footer-row">
                    <span>{vacation.likesCount} likes</span>
                    {user?.role === 'Admin' ? (
                      <div className="inline-actions">
                        <button className="ghost-button small" type="button" onClick={() => handleEditVacation(vacation.id)}>Edit</button>
                        <button className="ghost-button small" type="button" onClick={() => void handleDeleteVacation(vacation.id)}>Delete</button>
                      </div>
                    ) : (
                      <button className="primary-button small" onClick={() => void handleToggleLike(vacation.id)}>
                        {vacation.likedByMe ? 'Unlike' : 'Like'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="pagination-row">
        <button className="ghost-button" disabled={page <= 1} onClick={() => { setPage((current) => Math.max(1, current - 1)); void loadVacations(Math.max(1, page - 1), filter, searchTerm) }}>Previous</button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button className="ghost-button" disabled={page >= pagination.totalPages} onClick={() => { setPage((current) => current + 1); void loadVacations(page + 1, filter, searchTerm) }}>Next</button>
      </div>
    </div>
  )
}

export default VacationsPage