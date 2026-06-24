import { useState } from 'react'
import { orders as ordersApi } from '../api/endpoints'

export default function BuySellModal({ type, player, currentPrice, onClose, onSuccess }) {
  const [quantity, setQuantity] = useState(1)
  const [limitPrice, setLimitPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const idempotencyKey = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
    try {
      if (type === 'BUY') {
        await ordersApi.buy(player.id, quantity, idempotencyKey, limitPrice ? parseFloat(limitPrice) : undefined)
      } else {
        await ordersApi.sell(player.id, quantity, idempotencyKey, limitPrice ? parseFloat(limitPrice) : undefined)
      }
      onSuccess()
      onClose()
    } catch (err) {
      const msg = err.response?.data || `${type} order failed`
      setError(typeof msg === 'string' ? msg : 'Transaction failed')
    } finally {
      setLoading(false)
    }
  }

  const total = currentPrice ? (currentPrice * quantity).toFixed(2) : '-'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {type === 'BUY' ? 'Buy' : 'Sell'} Tokens
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl cursor-pointer">&times;</button>
        </div>

        <p className="text-sm text-gray-400 mb-4">{player.name} &middot; {player.team}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-2">{error}</div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              {type === 'BUY' ? 'Max Price (optional)' : 'Min Price (optional)'}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={type === 'BUY' ? 'Maximum price per token' : 'Minimum price per token'}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 placeholder-gray-500"
            />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Price per token:</span>
            <span className="text-white">{currentPrice?.toFixed(2) ?? '-'}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-400">Total:</span>
            <span className="text-emerald-400">{total}</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 ${
              type === 'BUY'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {loading
              ? 'Processing...'
              : `${type === 'BUY' ? 'Buy' : 'Sell'} ${quantity} token${quantity > 1 ? 's' : ''}`}
          </button>
        </form>
      </div>
    </div>
  )
}
