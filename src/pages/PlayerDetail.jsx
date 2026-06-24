import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { players as playersApi, quotes as quotesApi, orders as ordersApi, users as usersApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'
import BuySellModal from '../components/BuySellModal'

const statLabels = {
  rating: 'Rating', appearances: 'Apps', minutes: 'Min', goals: 'Goals',
  assists: 'Assists', shotsOnTarget: 'Shots on Target', keyPasses: 'Key Passes',
  passAccuracy: 'Pass %', dribbles: 'Dribbles',
  tackles: 'Tackles', interceptions: 'Int', blocks: 'Blocks',
  clears: 'Clears', aerialWon: 'Aerial Won', fouls: 'Fouls',
  yellowCards: 'Yellow', redCards: 'Red', playerOfTheMatch: 'POTM',
  ownGoals: 'Own Goals', offsides: 'Offsides',
}

export default function PlayerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, userId } = useAuth()
  const [player, setPlayer] = useState(null)
  const [quotes, setQuotes] = useState([])
  const [currentQuote, setCurrentQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showBuySell, setShowBuySell] = useState(null)
  const [openOrders, setOpenOrders] = useState([])
  const [ordersExpanded, setOrdersExpanded] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [userTokens, setUserTokens] = useState(null)

  const fetchOpenOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const res = await ordersApi.getByPlayer(id)
      setOpenOrders(res.data)
    } catch {
      setOpenOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }, [id])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const requests = [
        playersApi.getById(id),
        playersApi.getQuotes(id),
        quotesApi.getCurrent(id),
      ]
      if (userId) {
        requests.push(usersApi.getAllPortfolio(userId))
      }
      const [playerRes, quotesRes, currentRes, portfolioRes] = await Promise.all(requests)
      setPlayer(playerRes.data)
      setQuotes(quotesRes.data)
      setCurrentQuote(currentRes.data)
      if (portfolioRes) {
        const items = Array.isArray(portfolioRes.data) ? portfolioRes.data : (portfolioRes.data.content ?? [])
        const pos = items.find(p => p.playerId === Number(id))
        setUserTokens(pos ? pos.tokenQty : 0)
      }
    } catch {
      setError('Failed to load player')
    } finally {
      setLoading(false)
    }

    fetchOpenOrders()
  }, [id, userId, fetchOpenOrders])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="text-center py-20 text-gray-500">Loading player...</div>
  if (error) return <div className="text-center py-20 text-red-400">{error}</div>
  if (!player) return <div className="text-center py-20 text-gray-500">Player not found</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mb-6 transition-colors cursor-pointer">&larr; Back</button>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{player.name}</h1>
            <p className="text-gray-400 mt-1">{player.team} &middot; {player.league}</p>
            <div className="flex gap-2 mt-2">
              <span className="bg-gray-800 text-xs px-3 py-1 rounded-full text-gray-300">{player.position}</span>
              {player.altPosition && (
                <span className="bg-gray-800/60 text-xs px-3 py-1 rounded-full text-gray-400">{player.altPosition}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-400">{player.score?.toFixed(2) ?? '-'}</div>
            <div className="text-sm text-gray-500">Score</div>
            {currentQuote && (
              <>
                <div className="text-xl font-semibold text-white mt-2">{currentQuote.price?.toFixed(2)}</div>
                <div className="text-sm text-gray-500">Current Price</div>
              </>
            )}
            {isAuthenticated && userTokens != null && (
              <div className={`text-sm mt-2 ${userTokens > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                Your tokens: {userTokens}
              </div>
            )}
            {player.availableTokens != null && (
              <div className="text-sm mt-1 text-gray-500">
                Available supply: {player.availableTokens}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {isAuthenticated && (
            <>
              <button onClick={() => setShowBuySell('BUY')} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer">Buy Tokens</button>
              <button onClick={() => setShowBuySell('SELL')} className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer">Sell Tokens</button>
              <button
                onClick={() => setOrdersExpanded(v => !v)}
                className="bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Open Orders ({openOrders.length})
              </button>
            </>
          )}
        </div>

        {ordersExpanded && (
          <div className="mt-4 bg-gray-800/40 border border-gray-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Open Orders for {player.name}</h3>
            {ordersLoading ? (
              <div className="text-sm text-gray-500 py-4 text-center">Loading orders...</div>
            ) : openOrders.length === 0 ? (
              <div className="text-sm text-gray-500 py-4 text-center">No open orders for this player</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2 pr-4">Type</th>
                      <th className="text-right py-2 pr-4">Qty</th>
                      <th className="text-right py-2 pr-4">Price</th>
                      <th className="text-right py-2 pr-4">Remaining</th>
                      <th className="text-right py-2 pr-4">Total</th>
                      <th className="text-right py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openOrders.map((o) => (
                      <tr key={o.id} className="border-b border-gray-800/50">
                        <td className="py-2 pr-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${o.type === 'BUY' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                            {o.type}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-right text-gray-300">{o.quantity}</td>
                        <td className="py-2 pr-4 text-right text-gray-300">{o.priceAtOrder?.toFixed(2)}</td>
                        <td className="py-2 pr-4 text-right text-gray-400">{o.remainingQuantity}</td>
                        <td className="py-2 pr-4 text-right text-white">{(o.priceAtOrder * o.remainingQuantity)?.toFixed(2)}</td>
                        <td className="py-2 text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            o.status === 'PENDING' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-blue-900/40 text-blue-400'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
        {Object.entries(statLabels).map(([key, label]) => {
          const val = player[key]
          if (val == null) return null
          return (
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className="text-lg font-semibold text-white">{typeof val === 'number' ? val.toFixed(1) : val}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          )
        })}
      </div>

      {quotes.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Quote History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="text-left py-2">Date</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Strategy</th>
                  <th className="text-right py-2">Trigger</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 text-gray-300">{new Date(q.timestamp).toLocaleString()}</td>
                    <td className="py-2 text-right text-emerald-400">{q.price?.toFixed(2)}</td>
                    <td className="py-2 text-right text-gray-400">v{q.strategyVersion ?? '-'}</td>
                    <td className="py-2 text-right text-gray-400">{q.trigger}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showBuySell && (
        <BuySellModal
          type={showBuySell}
          player={player}
          currentPrice={currentQuote?.price}
          onClose={() => setShowBuySell(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  )
}
