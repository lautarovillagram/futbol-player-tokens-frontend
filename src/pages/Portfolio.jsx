import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { users as usersApi, orders as ordersApi } from '../api/endpoints'

const PAGE_SIZE = 20

const SORT_FIELDS = [
  { key: 'tokenQty', label: 'Qty' },
  { key: 'avgBuyPrice', label: 'Avg Buy' },
  { key: 'currentPrice', label: 'Current Price' },
  { key: 'currentValue', label: 'Value' },
  { key: 'profitLoss', label: 'P&L' },
]

export default function Portfolio() {
  const { userId } = useAuth()
  const [rawPositions, setRawPositions] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sellingAll, setSellingAll] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState(null)
  const [page, setPage] = useState(0)

  const fetchPortfolio = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError('')
    try {
      const [portfolioRes, balanceRes] = await Promise.all([
        usersApi.getAllPortfolio(userId),
        usersApi.getBalance(userId),
      ])
      setRawPositions(portfolioRes.data ?? [])
      setBalance(balanceRes.data.balance)
    } catch {
      setError('Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchPortfolio()
    } catch {
      setError('Failed to refresh portfolio')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSellAll = async () => {
    if (!confirm('Are you sure you want to sell all tokens in your portfolio?')) return
    setSellingAll(true)
    try {
      await ordersApi.sellAll()
      await fetchPortfolio()
    } catch {
      setError('Failed to sell all')
    } finally {
      setSellingAll(false)
    }
  }

  const handleSort = (key) => {
    setPage(0)
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortKey(null)
      setSortDir(null)
    }
  }

  const sortArrow = (key) => {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return rawPositions
    return [...rawPositions].sort((a, b) => {
      const va = a[sortKey] ?? 0
      const vb = b[sortKey] ?? 0
      return sortDir === 'asc' ? va - vb : vb - va
    })
  }, [rawPositions, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const positions = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => { fetchPortfolio() }, [fetchPortfolio])

  const totalValue = rawPositions.reduce((sum, p) => sum + (p.currentValue ?? 0), 0)
  const totalPnl = rawPositions.reduce((sum, p) => sum + (p.profitLoss ?? 0), 0)

  if (loading) return <div className="text-center py-20 text-gray-500">Loading portfolio...</div>
  if (error) return <div className="text-center py-20 text-red-400">{error}</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <div className="flex items-center gap-4">
          {positions.length > 0 && (
            <>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleSellAll}
                disabled={sellingAll}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                {sellingAll ? 'Selling...' : 'Sell All'}
              </button>
            </>
          )}
          <div className="text-right">
            <div className="text-sm text-gray-400">Available Balance: <span className="text-emerald-400 font-semibold">{balance != null ? Number(balance).toFixed(2) : '...'}</span></div>
            <div className="text-lg text-gray-400">Total Value: <span className="text-white font-semibold">{totalValue.toFixed(2)}</span></div>
            <div className={`text-sm ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              P&L: {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {positions.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No positions yet.{' '}
          <Link to="/players" className="text-emerald-400 hover:text-emerald-300">Browse players</Link> to start trading.
        </div>
      )}

      {positions.length > 0 && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left py-3 px-4">Player</th>
                  {SORT_FIELDS.map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className={`text-right py-3 px-4 cursor-pointer select-none transition-colors hover:text-white ${
                        key === 'avgBuyPrice' || key === 'currentPrice' ? 'hidden sm:table-cell' : ''
                      } ${sortKey === key ? 'text-emerald-400' : ''}`}
                    >
                      {label}{sortArrow(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.playerId} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4">
                      <Link to={`/players/${p.playerId}`} className="text-white hover:text-emerald-400 transition-colors font-medium">
                        {p.playerName}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300">{p.tokenQty}</td>
                    <td className="py-3 px-4 text-right text-gray-400 hidden sm:table-cell">{p.avgBuyPrice?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-gray-400 hidden sm:table-cell">{p.currentPrice?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-white">{p.currentValue?.toFixed(2)}</td>
                    <td className={`py-3 px-4 text-right ${p.profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {p.profitLoss >= 0 ? '+' : ''}{p.profitLoss?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-6">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                &laquo;
              </button>
              {(() => {
                const pages = []
                const start = Math.max(0, page - 2)
                const end = Math.min(totalPages - 1, page + 2)
                if (start > 0) {
                  pages.push(0)
                  if (start > 1) pages.push('...')
                }
                for (let i = start; i <= end; i++) pages.push(i)
                if (end < totalPages - 1) {
                  if (end < totalPages - 2) pages.push('...')
                  pages.push(totalPages - 1)
                }
                return pages.map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-gray-500">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                        p === page
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      {p + 1}
                    </button>
                  )
                )
              })()}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
