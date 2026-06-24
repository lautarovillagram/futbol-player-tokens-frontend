import { useState } from 'react'

const LEAGUES = ['', 'LaLiga', 'Premier League', 'Bundesliga', 'Serie A', 'Ligue 1', 'World Cup']
const POSITIONS = ['', 'Forward', 'Midfielder', 'Defender', 'Goalkeeper']

export default function PlayerFilters({ onFilter }) {
  const [league, setLeague] = useState('')
  const [team, setTeam] = useState('')
  const [position, setPosition] = useState('')

  const handleApply = () => {
    const params = {}
    if (league) params.league = league
    if (team.trim()) params.team = team.trim()
    if (position) params.position = position
    onFilter(params)
  }

  const handleClear = () => {
    setLeague('')
    setTeam('')
    setPosition('')
    onFilter({})
  }

  return (
    <div className="flex flex-wrap items-end gap-3 mb-6">
      <div>
        <label className="block text-xs text-gray-400 mb-1">League</label>
        <select
          value={league}
          onChange={(e) => setLeague(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        >
          {LEAGUES.map((l) => (
            <option key={l} value={l}>{l || 'All Leagues'}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Team</label>
        <input
          type="text"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          placeholder="Any team"
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-emerald-500"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Position</label>
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
        >
          {POSITIONS.map((p) => (
            <option key={p} value={p}>{p || 'All Positions'}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleApply}
        className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
      >
        Apply
      </button>
      <button
        onClick={handleClear}
        className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
      >
        Clear
      </button>
    </div>
  )
}
