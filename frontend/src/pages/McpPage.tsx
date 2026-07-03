import { useState } from 'react'
import api from '../services/api'

const McpPage = () => {
  const [question, setQuestion] = useState('How many active vacations are there right now?')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await api.post<{ answer: string }>('/mcp/ask', { question })
      setResult(response.data.answer || 'No results were returned.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="stacked-section mcp-page">
      <article className="hero-card mcp-hero-card">
        <div className="hero-copy">
          <p className="eyebrow">MCP chat</p>
          <h2 className="hero-title">Ask the vacation database anything.</h2>
          <p className="muted-text">Type any question and get a live answer straight from the database.</p>
        </div>

        <div className="mcp-form">
          <textarea
            className="mcp-textarea"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={4}
            placeholder="e.g. How many active vacations are there right now?"
          />
          <div className="mcp-form-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => void handleSubmit()}
              disabled={loading || !question.trim()}
            >
              {loading ? 'Querying...' : 'Ask the database'}
            </button>
          </div>
        </div>
      </article>

      <article className="info-card mcp-response-card">
        <div className="response-header-row">
          <div>
            <p className="eyebrow">Response</p>
          </div>
          <span className="status-pill waiting">Waiting</span>
        </div>
        <pre className="mcp-output">{result ?? 'Your MCP answer will appear here.'}</pre>
      </article>
    </section>
  )
}

export default McpPage
