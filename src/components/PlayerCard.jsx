import { Link } from 'react-router-dom'

export default function PlayerCard({ player }) {
  return (
    <Link to={`/players/${player.id}`} className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-emerald-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{player.name}</h3>
          <p className="text-sm text-gray-400">{player.team}</p>
        </div>
        <div className="text-right">
          <span className="bg-gray-800 text-xs px-2 py-1 rounded-full text-gray-300">
            {player.position}
          </span>
          {player.altPosition && (
            <span className="bg-gray-800/60 text-xs px-2 py-1 rounded-full text-gray-400 ml-1">
              {player.altPosition}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{player.league}</span>
        <span className="text-emerald-400 font-medium">{player.score?.toFixed(2)}</span>
      </div>
    </Link>
  )
}
