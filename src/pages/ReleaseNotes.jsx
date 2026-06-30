import { useState, useEffect } from 'react'

export default function ReleaseNotes() {
  const [content, setContent] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/RELEASE-NOTES.txt')
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.text()
      })
      .then(setContent)
      .catch(err => setError('Error al cargar release notes: ' + err.message))
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-emerald-400">Release Notes</h1>
      {error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <pre className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
          {content || 'Cargando...'}
        </pre>
      )}
    </div>
  )
}
