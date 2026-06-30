import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { orders as ordersApi } from '../api/endpoints'

export default function Transactions() {
  const [tab, setTab] = useState('my')
  const [orderType, setOrderType] = useState('ALL')
  const [data, setData] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page, size: 20 }
      const res = tab === 'my'
        ? await ordersApi.getTransactions(params)
        : await ordersApi.getBook(orderType === 'ALL' ? params : { ...params, type: orderType })
      setData(res.data.content ?? res.data)
      setTotalPages(res.data.page?.totalPages ?? res.data.totalPages ?? 1)
    } catch {
      setError(tab === 'my' ? 'Failed to load transactions' : 'Failed to load order book')
    } finally {
      setLoading(false)
    }
  }, [tab, orderType, page])

  useEffect(() => { setPage(0) }, [tab, orderType])
  useEffect(() => { fetchData() }, [fetchData])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchData()
    } catch {
      setError('Failed to refresh')
    } finally {
      setRefreshing(false)
    }
  }

  const handleCancel = async (orderId) => {
    if (!confirm('Cancel this order?')) return
    setCancelling(orderId)
    try {
      await ordersApi.cancel(orderId)
      await fetchData()
    } catch {
      setError('Failed to cancel order')
    } finally {
      setCancelling(null)
    }
  }

  const tabs = [
    { key: 'my', label: 'My Transactions' },
    { key: 'book', label: 'Order Book' },
  ]

  const orderTypes = ['ALL', 'BUY', 'SELL']

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(0) }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === t.key
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {tab === 'book' && (
        <div className="flex gap-2 mb-4">
          {orderTypes.map((t) => (
            <button
              key={t}
              onClick={() => { setOrderType(t); setPage(0) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                orderType === t
                  ? t === 'BUY' ? 'bg-emerald-900/40 text-emerald-400' :
                    t === 'SELL' ? 'bg-red-900/40 text-red-400' :
                    'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t === 'ALL' ? 'All' : t}
            </button>
          ))}
        </div>
      )}

      {error && <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-2 mb-4">{error}</div>}

      {data.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          {tab === 'my'
            ? <>No transactions yet. <Link to="/players" className="text-emerald-400 hover:text-emerald-300">Browse players</Link> to start trading.</>
            : 'No open orders in the book.'}
        </div>
      )}

      {data.length > 0 && (
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
                  {tab === 'book' && <th className="text-right py-3 px-4">User</th>}
                  <th className="text-right py-3 px-4">Status</th>
                  {tab === 'my' && <th className="text-right py-3 px-4">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
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
                    {tab === 'book' && (
                      <td className="py-3 px-4 text-right text-gray-500">{t.userId}</td>
                    )}
                    <td className="py-3 px-4 text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        t.status === 'FILLED' ? 'bg-emerald-900/40 text-emerald-400' :
                        t.status === 'PENDING' || t.status === 'PARTIALLY_FILLED' ? 'bg-yellow-900/40 text-yellow-400' :
                        'bg-red-900/40 text-red-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    {tab === 'my' && (
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
                    )}
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
