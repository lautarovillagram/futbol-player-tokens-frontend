import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Multi-league Scraping',
    desc: 'LaLiga, Premier League, Bundesliga, Serie A y Ligue 1 actualizadas desde WhoScored.',
    icon: '⚽',
  },
  {
    title: 'Player Valuation',
    desc: 'Cotizaciones dinámicas basadas en rendimiento, estadísticas y algoritmos de puntuación.',
    icon: '📈',
  },
  {
    title: 'Ranking & Stats',
    desc: 'Ranking global de jugadores con filtros por liga, equipo y posición.',
    icon: '🏆',
  },
  {
    title: 'Match Tracking',
    desc: 'Seguimiento de partidos en vivo y scraping automático de resultados.',
    icon: '📅',
  },
]

export default function Home() {
  return (
    <div>
      <section className="max-w-4xl mx-auto px-4 pt-24 pb-16 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Football <span className="text-emerald-400">Player Tokens</span>
        </h1>
        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
          API de cotizaciones y estadísticas para jugadores de las principales ligas europeas.
          Datos actualizados, ranking dinámico y cotizaciones automatizadas.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/register"
            className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Get Started
          </Link>
          <Link
            to="/players"
            className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Browse Players
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-semibold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center hover:border-gray-700 transition-colors"
            >
              <span className="text-3xl block mb-3">{f.icon}</span>
              <h3 className="text-white font-medium mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold mb-6">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-8 text-left">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <span className="text-emerald-400 text-xl font-bold">01</span>
            <h3 className="text-white font-medium mt-2 mb-1">Create an account</h3>
            <p className="text-sm text-gray-400">Register and get your JWT token to access the API.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <span className="text-emerald-400 text-xl font-bold">02</span>
            <h3 className="text-white font-medium mt-2 mb-1">Browse players</h3>
            <p className="text-sm text-gray-400">Filter by league, team, or position to find any player.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <span className="text-emerald-400 text-xl font-bold">03</span>
            <h3 className="text-white font-medium mt-2 mb-1">Track valuations</h3>
            <p className="text-sm text-gray-400">View historical quotes and score trends for each player.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
