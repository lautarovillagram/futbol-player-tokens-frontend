export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
        <p className="mb-1">Futbol Players Tokens — API de cotizaciones y estadísticas de fútbol</p>
        <p>&copy; {new Date().getFullYear()} — Proyecto personal</p>
      </div>
    </footer>
  )
}
