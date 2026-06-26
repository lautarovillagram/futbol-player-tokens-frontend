import { useState, useEffect, useCallback } from 'react'
import { strategies as strategiesApi, quotes as quotesApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'

const strategyMeta = {
  GENERAL: { label: 'General', color: 'text-gray-100' },
  FORWARD: { label: 'Forward', color: 'text-emerald-400' },
  MIDFIELDER: { label: 'Midfielder', color: 'text-blue-400' },
  DEFENDER: { label: 'Defender', color: 'text-orange-400' },
  GOALKEEPER: { label: 'Goalkeeper', color: 'text-purple-400' },
}

const metricLabels = {
  goals: 'Goals', assists: 'Assists', keyPasses: 'Key Passes',
  dribbles: 'Dribbles', tackles: 'Tackles', minutes: 'Minutes',
  rating: 'Rating', yellowCards: 'Yellow Cards', redCards: 'Red Cards',
  passAccuracy: 'Pass Accuracy', shots: 'Shots', ownGoals: 'Own Goals',
  faults: 'Faults', clears: 'Clears', blocks: 'Blocks',
  interceptions: 'Interceptions',
}

const PENALTY_KEYS = new Set(['yellowCards', 'redCards', 'ownGoals', 'faults'])

function formatKey(key) {
  return metricLabels[key] ?? key
}

const strategyOrder = ['GENERAL', 'FORWARD', 'MIDFIELDER', 'DEFENDER', 'GOALKEEPER']

export default function Strategies() {
  const { isSuperuser } = useAuth()
  const [configs, setConfigs] = useState([])
  const [editValues, setEditValues] = useState({})
  const [saving, setSaving] = useState({})
  const [saveMsg, setSaveMsg] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recalculating, setRecalculating] = useState(false)
  const [recalcMsg, setRecalcMsg] = useState('')
  const [historyModal, setHistoryModal] = useState(null)
  const [historyData, setHistoryData] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [valuationMode, setValuationMode] = useState('GENERAL')
  const [modeLoading, setModeLoading] = useState(true)
  const [modeSaving, setModeSaving] = useState(false)
  const [modeMsg, setModeMsg] = useState('')

  const fetchConfigs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [configsRes, modeRes] = await Promise.all([
        strategiesApi.getAll(),
        strategiesApi.getMode(),
      ])
      const arr = configsRes.data
      setConfigs(arr)
      setValuationMode(modeRes.data.mode)
      const edits = {}
      for (const cfg of arr) {
        edits[cfg.type] = {
          valorBase: cfg.valorBase,
          factorEscala: cfg.factorEscala,
          weights: { ...cfg.weights },
        }
      }
      setEditValues(edits)
    } catch {
      setError('Failed to load strategy configs')
    } finally {
      setLoading(false)
      setModeLoading(false)
    }
  }, [])

  useEffect(() => { fetchConfigs() }, [fetchConfigs])

  const handleWeightChange = (type, key, value) => {
    setEditValues(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        weights: {
          ...prev[type].weights,
          [key]: value,
        },
      },
    }))
  }

  const handleParamChange = (type, field, value) => {
    setEditValues(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }))
  }

  const sumWeights = (type) => {
    const weights = editValues[type]?.weights
    if (!weights) return 0
    return Object.entries(weights).reduce((s, [key, v]) => {
      const val = parseFloat(v) || 0
      return PENALTY_KEYS.has(key) ? s - val : s + val
    }, 0)
  }

  const handleSave = async (type) => {
    setSaving(prev => ({ ...prev, [type]: true }))
    setSaveMsg(prev => ({ ...prev, [type]: '' }))
    try {
      await strategiesApi.update(type, {
        valorBase: editValues[type].valorBase,
        factorEscala: editValues[type].factorEscala,
        weights: editValues[type].weights,
      })
      setSaveMsg(prev => ({ ...prev, [type]: 'Saved successfully' }))
      fetchConfigs()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Save failed'
      setSaveMsg(prev => ({ ...prev, [type]: msg }))
    } finally {
      setSaving(prev => ({ ...prev, [type]: false }))
      setTimeout(() => setSaveMsg(prev => ({ ...prev, [type]: '' })), 4000)
    }
  }

  const handleReset = (type) => {
    const cfg = configs.find(c => c.type === type)
    if (!cfg) return
    setEditValues(prev => ({
      ...prev,
      [type]: {
        valorBase: cfg.valorBase,
        factorEscala: cfg.factorEscala,
        weights: { ...cfg.weights },
      },
    }))
  }

  const openHistory = async (type) => {
    setHistoryModal(type)
    setHistoryData(null)
    setHistoryLoading(true)
    try {
      const res = await strategiesApi.getHistory(type)
      setHistoryData(res.data)
    } catch {
      setHistoryData([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const restoreVersion = (type, version) => {
    const entry = historyData?.find(v => v.version === version)
    if (!entry) return
    setEditValues(prev => ({
      ...prev,
      [type]: {
        valorBase: entry.valorBase,
        factorEscala: entry.factorEscala,
        weights: { ...entry.weights },
      },
    }))
    setHistoryModal(null)
  }

  const handleSaveNormalized = async (type) => {
    setSaving(prev => ({ ...prev, [type]: true }))
    setSaveMsg(prev => ({ ...prev, [type]: '' }))
    try {
      await strategiesApi.updateNormalized(type, {
        valorBase: editValues[type].valorBase,
        factorEscala: editValues[type].factorEscala,
        weights: editValues[type].weights,
      })
      setSaveMsg(prev => ({ ...prev, [type]: 'Saved normalized successfully' }))
      fetchConfigs()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Save failed'
      setSaveMsg(prev => ({ ...prev, [type]: msg }))
    } finally {
      setSaving(prev => ({ ...prev, [type]: false }))
      setTimeout(() => setSaveMsg(prev => ({ ...prev, [type]: '' })), 4000)
    }
  }

  const handleModeToggle = async () => {
    const newMode = valuationMode === 'GENERAL' ? 'POSITION' : 'GENERAL'
    setModeSaving(true)
    setModeMsg('')
    try {
      await strategiesApi.updateMode(newMode)
      setValuationMode(newMode)
      setModeMsg(`Switched to ${newMode} mode`)
    } catch {
      setModeMsg('Failed to update mode')
    } finally {
      setModeSaving(false)
      setTimeout(() => setModeMsg(''), 4000)
    }
  }

  const handleRecalculate = async () => {
    setRecalculating(true)
    setRecalcMsg('')
    try {
      await quotesApi.recalculate()
      setRecalcMsg('Recalculation triggered successfully')
    } catch {
      setRecalcMsg('Recalculation failed')
    } finally {
      setRecalculating(false)
      setTimeout(() => setRecalcMsg(''), 4000)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading strategy configs...</div>
  if (error) return <div className="text-center py-20 text-red-400">{error}</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Strategy Configuration</h1>
        {isSuperuser && (
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
          >
            {recalculating ? 'Recalculating...' : 'Recalculate Quotes'}
          </button>
        )}
      </div>

      {recalcMsg && (
        <div className={`mb-4 text-sm px-4 py-2 rounded-lg ${recalcMsg.includes('successfully') ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-red-900/40 text-red-300 border border-red-800'}`}>
          {recalcMsg}
        </div>
      )}

      {!modeLoading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-400">Scoring Mode: </span>
            <span className={`text-sm font-semibold ${valuationMode === 'POSITION' ? 'text-blue-400' : 'text-gray-100'}`}>
              {valuationMode}
            </span>
            <span className="ml-3 text-xs text-gray-500">
              {valuationMode === 'GENERAL' ? 'Same metrics for all positions' : 'Metrics weighted by position'}
            </span>
          </div>
          {isSuperuser && (
            <button
              onClick={handleModeToggle}
              disabled={modeSaving}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
            >
              {modeSaving ? 'Switching...' : `Switch to ${valuationMode === 'GENERAL' ? 'POSITION' : 'GENERAL'}`}
            </button>
          )}
        </div>
      )}

      {modeMsg && (
        <div className="mb-4 text-sm px-4 py-2 rounded-lg bg-emerald-900/40 text-emerald-300 border border-emerald-800">
          {modeMsg}
        </div>
      )}

      <div className="grid gap-6">
        {strategyOrder.map(type => {
          const cfg = configs.find(c => c.type === type)
          const meta = strategyMeta[type]
          if (!cfg || !meta) return null

          const weights = editValues[type]?.weights
          if (!weights) return null

          const total = sumWeights(type)
          const valid = total <= 1
          const isGeneral = type === 'GENERAL'
          const msg = saveMsg[type]
          const isSaving = saving[type]

          return (
            <div key={type} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${meta.color}`}>
                  {meta.label}
                  <span className="ml-2 text-xs text-gray-500 font-normal">v{cfg.version}</span>
                </h2>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${valid ? 'text-emerald-400' : 'text-red-400'}`}>
                    Sum: {total.toFixed(2)} {valid ? '✓' : '✗ (max 1)'}
                  </span>
                </div>
              </div>

              {isGeneral && (
                <div className="flex gap-6 mb-4 p-3 bg-gray-800/40 rounded-lg">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Base Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editValues[type]?.valorBase ?? ''}
                      onChange={e => handleParamChange(type, 'valorBase', parseFloat(e.target.value) || 0)}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-24 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Scale Factor</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editValues[type]?.factorEscala ?? ''}
                      onChange={e => handleParamChange(type, 'factorEscala', parseFloat(e.target.value) || 0)}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-24 text-white"
                    />
                  </div>
                </div>
              )}

              {!isGeneral && (
                <div className="mb-4 p-3 bg-gray-800/40 rounded-lg text-xs text-gray-400">
                  Uses General base price and scale factor
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {Object.entries(weights).map(([key, value]) => (
                  <div key={key} className="bg-gray-800/50 rounded-lg p-3">
                    <label className="text-xs text-gray-400 block mb-1">{formatKey(key)}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={parseFloat(value) || 0}
                      onChange={e => handleWeightChange(type, key, Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-full text-white text-center"
                    />
                  </div>
                ))}
              </div>

              {msg && (
                <div className={`mb-3 text-sm px-3 py-2 rounded-lg ${msg.includes('successfully') ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-red-900/40 text-red-300 border border-red-800'}`}>
                  {msg}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleSave(type)}
                  disabled={!valid || isSaving}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => handleSaveNormalized(type)}
                  disabled={!valid || isSaving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Normalized'}
                </button>
                <button
                  onClick={() => handleReset(type)}
                  className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Reset
                </button>
                <button
                  onClick={() => openHistory(type)}
                  className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  History
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Formula</h2>
        <p className="text-gray-300 text-sm font-mono">
          price = valorBase + (score &times; factorEscala)
        </p>
      </div>

      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setHistoryModal(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{strategyMeta[historyModal]?.label ?? historyModal} History</h2>
              <button onClick={() => setHistoryModal(null)} className="text-gray-400 hover:text-white text-xl cursor-pointer">&times;</button>
            </div>

            {historyLoading && <div className="text-center py-10 text-gray-500">Loading history...</div>}

            {!historyLoading && historyData && historyData.length === 0 && (
              <div className="text-center py-10 text-gray-500">No history found</div>
            )}

            {!historyLoading && historyData && historyData.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="text-left py-2 px-3">Version</th>
                    <th className="text-right py-2 px-3">Base</th>
                    <th className="text-right py-2 px-3">Scale</th>
                    <th className="text-right py-2 px-3">Weights</th>
                    <th className="text-right py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((entry) => {
                    const wSum = Object.entries(entry.weights || {}).reduce((s, [k, v]) => {
                      const val = parseFloat(v) || 0
                      return PENALTY_KEYS.has(k) ? s - val : s + val
                    }, 0)
                    const isActive = entry.version === (configs.find(c => c.type === historyModal)?.version ?? 0)
                    return (
                      <tr key={entry.version} className={`border-b border-gray-800/50 ${isActive ? 'bg-emerald-900/20' : ''}`}>
                        <td className="py-2 px-3 text-white font-mono">
                          v{entry.version}
                          {isActive && <span className="ml-2 text-xs text-emerald-400">(active)</span>}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-300">{entry.valorBase?.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-gray-300">{entry.factorEscala?.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-gray-300">{wSum.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right">
                          {!isActive && (
                            <button
                              onClick={() => restoreVersion(historyModal, entry.version)}
                              className="text-emerald-400 hover:text-emerald-300 text-xs cursor-pointer"
                            >
                              Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
