import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { players as playersApi } from '../api/endpoints'

const PAGE_SIZE = 20

export default function Ranking() {
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchRanking = useCallback(async (pageNum) => {
    setLoading(true)
    setError('')
    try {
      const res = await playersApi.getRanking({ page: pageNum, size: PAGE_SIZE })
      setRanking(res.data)
      setHasMore(res.data.length === PAGE_SIZE)
    } catch {
      setError('Failed to load ranking')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRanking(page) }, [page, fetchRanking])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchRanking(page)
    } catch {
      setError('Failed to refresh ranking')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Player Ranking</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading && <div className="text-center py-20 text-gray-500">Loading ranking...</div>}
      {error && <div className="text-center py-20 text-red-400">{error}</div>}

      {!loading && !error && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800 bg-gray-900/50">
                <th className="text-left py-3 px-4 w-12">#</th>
                <th className="text-left py-3 px-4">Player</th>
                <th className="text-left py-3 px-4 hidden sm:table-cell">Team</th>
                <th className="text-left py-3 px-4 hidden md:table-cell">Position</th>
                <th className="text-left py-3 px-4 hidden md:table-cell">League</th>
                <th className="text-right py-3 px-4">Score</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((p) => (
                <tr key={p.playerId} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3 px-4 text-gray-500 font-mono">{p.rank}</td>
                  <td className="py-3 px-4">
                    <Link to={`/players/${p.playerId}`} className="text-white hover:text-emerald-400 transition-colors font-medium">
                      {p.playerName ?? `Player #${p.playerId}`}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-400 hidden sm:table-cell">{p.team ?? '-'}</td>
                  <td className="py-3 px-4 text-gray-400 hidden md:table-cell">{p.position ?? '-'}</td>
                  <td className="py-3 px-4 text-gray-500 hidden md:table-cell">{p.league ?? '-'}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-medium">{p.score?.toFixed(2) ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="flex items-center text-sm text-gray-400">Page {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore}
          className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}
