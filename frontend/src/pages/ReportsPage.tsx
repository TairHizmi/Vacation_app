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

  const sortedReport = useMemo(() => {
    return [...reportData].sort((a, b) => b.likes - a.likes)
  }, [reportData])

  const maxLikes = useMemo(() => {
    if (reportData.length === 0) return 1
    return Math.max(...reportData.map((row) => row.likes), 1)
  }, [reportData])

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
    <section className="stacked-section reports-page">
      <article className="hero-card">
        <div>
          <p className="eyebrow">Reports</p>
          <h2>Visualize destination popularity and likes at a glance.</h2>
          <p className="muted-text">A chart-ready view is available only for admins. The X axis shows each vacation destination and the Y axis shows the likes count.</p>
        </div>
      </article>

      <article className="info-card report-card">
        <div className="report-actions">
          <button className="primary-button" type="button" onClick={handleDownloadCsv} disabled={loading || reportData.length === 0}>
            Download CSV
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Loading report...</div>
        ) : reportData.length === 0 ? (
          <div className="loading-state">No report data available.</div>
        ) : (
          <div className="report-chart">
            <div className="report-chart-title">
              <h3>Vacation Report</h3>
            </div>
            <div className="report-chart-body">
              <div className="y-axis">
                {Array.from({ length: Math.min(maxLikes, 7) + 1 }, (_, index) => {
                  const value = Math.round(maxLikes - (maxLikes / Math.min(maxLikes, 7)) * index)
                  return (
                    <span key={value} className="y-axis-label">
                      {value}
                    </span>
                  )
                })}
              </div>

              <div className="chart-columns">
                {sortedReport.map((row) => {
                  const height = Math.max(12, Math.round((row.likes / maxLikes) * 100))
                  return (
                    <div key={row.destination} className="chart-column">
                      <div className="column-bar-wrapper">
                        <div className="column-bar" style={{ height: `${height}%` }}>
                          <span className="bar-value">{row.likes}</span>
                        </div>
                      </div>
                      <span className="chart-column-label">{row.destination}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </article>
    </section>
  )
}

export default ReportsPage
