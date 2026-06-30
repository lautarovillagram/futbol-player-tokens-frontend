import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
        <p className="mb-1">Futbol Players Tokens — API de cotizaciones y estadísticas de fútbol</p>
        <p className="mb-3">&copy; {new Date().getFullYear()} — Proyecto personal</p>
        <Link
          to="/release-notes"
          className="inline-block px-4 py-2 text-xs border border-gray-700 rounded-lg text-gray-400 hover:text-emerald-400 hover:border-emerald-500 transition-colors"
        >
          Release Notes
        </Link>
      </div>
    </footer>
  )
}
