import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { orders as ordersApi } from '../api/endpoints'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await ordersApi.getTransactions({ page, size: 20 })
      setTransactions(res.data.content ?? res.data)
      setTotalPages(res.data.page?.totalPages ?? res.data.totalPages ?? 1)
    } catch {
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchTransactions()
    } catch {
      setError('Failed to refresh transactions')
    } finally {
      setRefreshing(false)
    }
  }

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order?')) return
    setCancelling(orderId)
    try {
      await ordersApi.cancel(orderId)
      await fetchTransactions()
    } catch {
      setError('Failed to cancel order')
    } finally {
      setCancelling(null)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading transactions...</div>
  if (error) return <div className="text-center py-20 text-red-400">{error}</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          No transactions yet.{' '}
          <Link to="/players" className="text-emerald-400 hover:text-emerald-300">Browse players</Link> to start trading.
        </div>
      )}

      {transactions.length > 0 && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Player</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-right py-3 px-4">Qty</th>
                  <th className="text-right py-3 px-4">Price</th>
                  <th className="text-right py-3 px-4">Total</th>
                  <th className="text-right py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-gray-400">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Link to={`/players/${t.playerId}`} className="text-white hover:text-emerald-400 transition-colors">
                        {t.playerName}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${t.type === 'BUY' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300">{t.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-400">{t.priceAtOrder?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-white">{t.total?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        t.status === 'FILLED' ? 'bg-emerald-900/40 text-emerald-400' :
                        t.status === 'PENDING' || t.status === 'PARTIALLY_FILLED' ? 'bg-yellow-900/40 text-yellow-400' :
                        'bg-red-900/40 text-red-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {(t.status === 'PENDING' || t.status === 'PARTIALLY_FILLED') && (
                        <button
                          onClick={() => handleCancel(t.id)}
                          disabled={cancelling === t.id}
                          className="text-red-400 hover:text-red-300 text-xs disabled:opacity-40 cursor-pointer"
                        >
                          {cancelling === t.id ? '...' : 'Cancel'}
                        </button>
                      )}
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
