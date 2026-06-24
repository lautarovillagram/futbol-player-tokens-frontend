import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { users as usersApi, quotes as quotesApi } from '../api/endpoints'

export default function Navbar() {
  const { isAuthenticated, userId, username, logout } = useAuth()
  const [balance, setBalance] = useState(null)
  const [recalculating, setRecalculating] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (!userId) return
    usersApi.getBalance(userId)
      .then(res => setBalance(res.data.balance))
      .catch(err => console.error('Failed to fetch balance:', err))
  }, [userId, location])

  const handleRecalculate = async () => {
    setRecalculating(true)
    try {
      await quotesApi.recalculate()
    } catch {
      // silent
    } finally {
      setRecalculating(false)
    }
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-emerald-400">
            Futbol<span className="text-white">Tokens</span>
          </Link>
          {isAuthenticated && username && (
            <span className="text-sm text-gray-400 hidden sm:inline">
              {username}
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          {isAuthenticated && (
            <>
              <Link to="/players" className="text-gray-300 hover:text-white transition-colors">
                Players
              </Link>
              <Link to="/ranking" className="text-gray-300 hover:text-white transition-colors">
                Ranking
              </Link>
              <Link to="/portfolio" className="text-gray-300 hover:text-white transition-colors">
                Portfolio
              </Link>
              <Link to="/transactions" className="text-gray-300 hover:text-white transition-colors">
                Transactions
              </Link>
              <Link to="/matches" className="text-gray-300 hover:text-white transition-colors">
                Matches
              </Link>
              <Link to="/strategies" className="text-gray-300 hover:text-white transition-colors">
                Strategy
              </Link>
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="text-gray-300 hover:text-emerald-400 transition-colors text-sm disabled:opacity-40 cursor-pointer"
              >
                {recalculating ? 'Recalculating...' : 'Recalculate'}
              </button>
            </>
          )}

          {isAuthenticated ? (
            <>
              <span className="text-emerald-400 font-medium text-sm">
                Balance: {balance != null ? Number(balance).toFixed(2) : '...'}
              </span>
              <button
                onClick={logout}
                className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
