import { useState, useEffect, useCallback } from 'react'
import { matches as matchesApi, players as playersApi } from '../api/endpoints'

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapingPlayers, setScrapingPlayers] = useState(false)
  const [reschedulingId, setReschedulingId] = useState(null)

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await matchesApi.getAll()
      setMatches(res.data)
    } catch {
      setError('Failed to load matches')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMatches() }, [fetchMatches])

  const handleScrape = async () => {
    setScraping(true)
    try {
      await matchesApi.scrapeToday()
      await fetchMatches()
    } catch {
      setError('Scrape failed')
    } finally {
      setScraping(false)
    }
  }

  const handleScrapePlayers = async () => {
    setScrapingPlayers(true)
    setError('')
    try {
      await playersApi.scrapeAll()
    } catch {
      setError('Failed to scrape players')
    } finally {
      setScrapingPlayers(false)
    }
  }

  const handleReschedule = async (id) => {
    setReschedulingId(id)
    setError('')
    try {
      await matchesApi.reschedule(id)
      setReschedulingId(null)
    } catch {
      setError('Failed to reschedule match')
      setReschedulingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this match?')) return
    try {
      await matchesApi.delete(id)
      setMatches((prev) => prev.filter((m) => m.id !== id))
    } catch {
      setError('Failed to delete match')
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading matches...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Matches</h1>
        <div className="flex gap-2">
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            {scraping ? 'Scraping...' : 'Scrape Today\'s Matches'}
          </button>
          <button
            onClick={handleScrapePlayers}
            disabled={scrapingPlayers}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            {scrapingPlayers ? 'Scraping...' : 'Scrape Players'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      {matches.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No matches found. Click "Scrape Today's Matches" to fetch them.
        </div>
      )}

      {matches.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800 bg-gray-900/50">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Home</th>
                <th className="text-left py-3 px-4">Away</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4 hidden md:table-cell">Match ID</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3 px-4 text-gray-300">{new Date(m.matchTime).toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' })} {new Date(m.matchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                  <td className="py-3 px-4 text-white font-medium">{m.team1Name || m.team1Id}</td>
                  <td className="py-3 px-4 text-white font-medium">{m.team2Name || m.team2Id}</td>
                  <td className="py-3 px-4">
                    {(() => {
                      const now = new Date()
                      const matchStart = new Date(m.matchTime)
                      const twoHoursAfter = new Date(matchStart.getTime() + 2 * 60 * 60 * 1000)
                      if (now < matchStart) {
                        return <span className="text-gray-400">{m.status === 'TIMED' ? '🕐 ' : ''}{m.status || '—'}</span>
                      }
                      if (now < twoHoursAfter) {
                        return <span className="text-emerald-400 font-semibold">PLAYING</span>
                      }
                      if (m.status === 'FINISHED') {
                        return <span className="text-white">FINISHED</span>
                      }
                      return <span className="text-yellow-400 font-semibold">{m.status === 'TIMED' ? 'WAITING RESULT' : (m.status || '—')}</span>
                    })()}
                  </td>
                  <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{m.footballDataMatchId}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleReschedule(m.id)}
                      disabled={reschedulingId === m.id}
                      className="text-yellow-400 hover:text-yellow-300 disabled:opacity-50 text-xs transition-colors cursor-pointer mr-3"
                    >
                      {reschedulingId === m.id ? 'Scheduling...' : 'Reschedule'}
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-red-400 hover:text-red-300 text-xs transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
