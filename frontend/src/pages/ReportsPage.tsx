import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const ReportsPage = () => {
  const { user } = useAuth()
  const [reportData, setReportData] = useState<Array<{ destination: string; likes: number }>>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.role === 'Admin'

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true)
      try {
        const response = await api.get<Array<{ destination: string; likes: number }>>('/vacations/report')
        setReportData(response.data)
      } catch (loadError) {
        console.error('Failed to load report:', loadError)
      } finally {
        setLoading(false)
      }
    }

    if (isAdmin) {
      void loadReport()
    }
  }, [isAdmin])

  const csvContent = useMemo(() => {
    const header = 'Destination,Likes'
    const rows = reportData.map((row) => `${row.destination.replace(/\n/g, ' ')},${row.likes}`)
    return [header, ...rows].join('\n')
  }, [reportData])

  const handleDownloadCsv = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Vacations_Report.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!isAdmin) {
    return (
      <section className="stacked-section">
        <article className="hero-card">
          <p className="eyebrow">Reports</p>
          <h2>Admin access required</h2>
          <p className="muted-text">Only admins can view vacation reports.</p>
        </article>
      </section>
    )
  }

  return (
    <section className="stacked-section">
      <article className="hero-card">
        <div>
          <p className="eyebrow">Reports</p>
          <h2>Visualize destination popularity and likes at a glance.</h2>
          <p className="muted-text">A chart-ready view is ready for the admin dashboard and CSV export workflow.</p>
        </div>
      </article>

      <article className="info-card">
        <div className="report-actions">
          <button className="primary-button" type="button" onClick={handleDownloadCsv} disabled={loading || reportData.length === 0}>
            Download CSV
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading report...</div>
        ) : (
          <div className="chart-card">
            <div className="chart-header-row">
              <span>Destination</span>
              <span>Likes</span>
            </div>
            <div className="chart-rows">
              {reportData.map((row) => (
                <div key={row.destination} className="chart-row">
                  <span className="chart-label">{row.destination}</span>
                  <div className="chart-bar" style={{ width: `${Math.min(100, row.likes * 8)}%` }}>
                    {row.likes}
                  </div>
                </div>
              ))}
              {reportData.length === 0 && <div className="muted-text">No report data available.</div>}
            </div>
          </div>
        )}
      </article>
    </section>
  )
}

export default ReportsPage
