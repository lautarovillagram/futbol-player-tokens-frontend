import { useState, useEffect, useCallback } from 'react'
import { players as playersApi } from '../api/endpoints'
import PlayerCard from '../components/PlayerCard'
import PlayerFilters from '../components/PlayerFilters'

const PAGE_SIZE = 20

export default function Players() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [filters, setFilters] = useState({})

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { ...filters, page, size: PAGE_SIZE }
      const res = await playersApi.getAll(params)
      setPlayers(res.data.content ?? [])
      setHasMore(!res.data.last)
    } catch {
      setError('Failed to load players')
    } finally {
      setLoading(false)
    }
  }, [filters, page])

  const handleFilter = (newFilters) => {
    setFilters(newFilters)
    setPage(0)
  }

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Players</h1>

      <PlayerFilters onFilter={handleFilter} />

      {loading && (
        <div className="text-center py-20 text-gray-500">Loading players...</div>
      )}

      {error && (
        <div className="text-center py-20 text-red-400">{error}</div>
      )}

      {!loading && !error && players.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No players found. Try different filters.
        </div>
      )}

      {!loading && players.length > 0 && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>

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
        </>
      )}
    </div>
  )
}
