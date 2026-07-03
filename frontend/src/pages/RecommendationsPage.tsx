import { useState } from 'react'
import api from '../services/api'

const RecommendationsPage = () => {
  const [destination, setDestination] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await api.post<{ answer: string }>('/mcp/recommend', { destination })
      setResult(response.data.answer || 'No recommendation was returned.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="stacked-section recommendations-page">
      <article className="hero-card recommendations-hero-card">
        <div className="hero-copy">
          <p className="eyebrow">AI recommendation</p>
          <h2>Plan your next escape with personalized guidance.</h2>
          <p className="muted-text">Enter a destination and get a tailored itinerary in seconds.</p>
        </div>
        <div className="recommendation-form">
          <input
            className="recommendation-input"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Try Bali, Tokyo, or Lisbon..."
          />
          <button
            className="primary-button"
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading || !destination.trim()}
          >
            {loading ? 'Thinking...' : 'Get recommendation'}
          </button>
        </div>
      </article>

      <article className="info-card recommendation-output-card">
        <div className="recommendation-output-header">
          <div>
            <p className="eyebrow">Recommendation output</p>
          </div>
          <span className="status-pill ready">Ready</span>
        </div>
        <pre className="recommendation-output">{result ?? 'Your recommended itinerary will appear here.'}</pre>
      </article>
    </section>
  )
}

export default RecommendationsPage
