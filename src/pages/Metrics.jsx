import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { actuator as actuatorApi, metrics as metricsApi, auditLogs as auditLogsApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { key: 'prometheus', label: 'Prometheus' },
  { key: 'actuator', label: 'Actuator' },
  { key: 'audit', label: 'Audit Logs' },
]

function formatJson(obj) {
  return JSON.stringify(obj, null, 2)
}

const TYPE_COLORS = {
  GAUGE: 'text-emerald-400',
  COUNTER: 'text-blue-400',
  SUMMARY: 'text-purple-400',
  HISTOGRAM: 'text-orange-400',
  UNKNOWN: 'text-gray-400',
}

function parsePrometheus(raw) {
  const lines = raw.split('\n')
  const groups = {}
  let currentName = null

  for (const line of lines) {
    if (!line.trim()) continue

    if (line.startsWith('# HELP ')) {
      const rest = line.slice(7)
      const spaceIdx = rest.indexOf(' ')
      currentName = rest.slice(0, spaceIdx)
      const help = rest.slice(spaceIdx + 1)
      if (!groups[currentName]) groups[currentName] = { name: currentName, help, type: 'UNKNOWN', samples: [] }
      groups[currentName].help = help
    } else if (line.startsWith('# TYPE ')) {
      const rest = line.slice(7)
      const spaceIdx = rest.indexOf(' ')
      currentName = rest.slice(0, spaceIdx)
      const type = rest.slice(spaceIdx + 1).toUpperCase()
      if (!groups[currentName]) groups[currentName] = { name: currentName, help: '', type, samples: [] }
      groups[currentName].type = type
    } else if (!line.startsWith('#')) {
      const braceIdx = line.indexOf('{')
      const spaceAfterBrace = line.indexOf(' ', braceIdx === -1 ? 0 : braceIdx)
      let name, labelsStr, valueStr

      if (braceIdx !== -1) {
        const closeBrace = line.indexOf('}')
        name = line.slice(0, braceIdx)
        labelsStr = line.slice(braceIdx + 1, closeBrace)
        valueStr = line.slice(closeBrace + 1).trim()
      } else {
        const sp = line.indexOf(' ')
        name = line.slice(0, sp)
        labelsStr = ''
        valueStr = line.slice(sp + 1).trim()
      }

      const parts = valueStr.split(/\s+/)
      const value = parts[0]
      const timestamp = parts[1] || null

      const labels = {}
      if (labelsStr) {
        for (const pair of labelsStr.split(',')) {
          const eqIdx = pair.indexOf('=')
          if (eqIdx === -1) continue
          const k = pair.slice(0, eqIdx).trim()
          const v = pair.slice(eqIdx + 2, pair.length - 1)
          labels[k] = v
        }
      }

      if (!groups[name]) groups[name] = { name, help: '', type: 'UNKNOWN', samples: [] }
      groups[name].samples.push({ labels, value, timestamp })
    }
  }

  return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
}

function formatValue(val) {
  const n = parseFloat(val)
  if (isNaN(n)) return val
  if (Number.isInteger(n)) return n.toLocaleString()
  if (Math.abs(n) > 1000) return n.toExponential(2)
  return n.toFixed(4)
}

function MetricGroup({ group, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/30 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-gray-500 text-xs font-mono shrink-0">{open ? '▼' : '▶'}</span>
          <span className="text-sm font-semibold text-white truncate">{group.name}</span>
          <span className={`text-xs font-mono ${TYPE_COLORS[group.type] || TYPE_COLORS.UNKNOWN}`}>{group.type}</span>
          {group.samples.length > 0 && (
            <span className="text-xs text-gray-500">({group.samples.length})</span>
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 border-t border-gray-800">
          {group.help && (
            <p className="text-xs text-gray-500 py-2 italic">{group.help}</p>
          )}
          {group.samples.length === 0 && (
            <p className="text-xs text-gray-500 py-2">No samples</p>
          )}
          {group.samples.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800/50">
                    <th className="text-left py-1.5 pr-3 font-medium">Labels</th>
                    <th className="text-right py-1.5 pl-3 font-medium w-24">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {group.samples.map((sample, i) => (
                    <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                      <td className="py-1.5 pr-3 text-gray-300 font-mono">
                        {Object.keys(sample.labels).length > 0
                          ? Object.entries(sample.labels).map(([k, v]) => (
                              <span key={k}>
                                <span className="text-gray-500">{k}=</span>
                                <span className="text-emerald-400">"{v}"</span>{' '}
                              </span>
                            ))
                          : <span className="text-gray-500">—</span>}
                      </td>
                      <td className="py-1.5 pl-3 text-right text-white font-mono whitespace-nowrap">
                        {formatValue(sample.value)}
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
  )
}

export default function Metrics() {
  const { userId, isSuperuser } = useAuth()
  const [activeTab, setActiveTab] = useState('prometheus')

  if (!isSuperuser) return <Navigate to="/" replace />

  const [prometheusData, setPrometheusData] = useState('')
  const [prometheusLoading, setPrometheusLoading] = useState(false)
  const [prometheusError, setPrometheusError] = useState('')

  const [health, setHealth] = useState(null)
  const [info, setInfo] = useState(null)
  const [marketOverview, setMarketOverview] = useState(null)
  const [topTraded, setTopTraded] = useState(null)
  const [orderBookStats, setOrderBookStats] = useState(null)
  const [actuatorLoading, setActuatorLoading] = useState(false)
  const [actuatorError, setActuatorError] = useState('')

  const [auditLogs, setAuditLogs] = useState([])
  const [auditPage, setAuditPage] = useState(0)
  const [auditTotalPages, setAuditTotalPages] = useState(0)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState('')

  const fetchPrometheus = useCallback(async () => {
    setPrometheusLoading(true)
    setPrometheusError('')
    try {
      const res = await actuatorApi.prometheus()
      setPrometheusData(res.data)
    } catch {
      setPrometheusError('Failed to fetch Prometheus metrics')
    } finally {
      setPrometheusLoading(false)
    }
  }, [])

  const fetchActuator = useCallback(async () => {
    setActuatorLoading(true)
    setActuatorError('')
    try {
      const [healthRes, infoRes, overviewRes, topTradedRes, statsRes] = await Promise.allSettled([
        actuatorApi.health(),
        actuatorApi.info(),
        metricsApi.marketOverview(),
        metricsApi.topTraded(),
        metricsApi.orderBookStats(),
      ])
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data)
      if (infoRes.status === 'fulfilled') setInfo(infoRes.value.data)
      if (overviewRes.status === 'fulfilled') setMarketOverview(overviewRes.value.data)
      if (topTradedRes.status === 'fulfilled') setTopTraded(topTradedRes.value.data)
      if (statsRes.status === 'fulfilled') setOrderBookStats(statsRes.value.data)
    } catch {
      setActuatorError('Failed to fetch some actuator data')
    } finally {
      setActuatorLoading(false)
    }
  }, [])

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true)
    setAuditError('')
    try {
      const res = await auditLogsApi.getAll({ page: auditPage, size: 20 })
      setAuditLogs(res.data.content ?? res.data)
      setAuditTotalPages(res.data.page?.totalPages ?? res.data.totalPages ?? 1)
    } catch {
      setAuditError('Failed to fetch audit logs')
    } finally {
      setAuditLoading(false)
    }
  }, [auditPage])

  useEffect(() => {
    if (activeTab === 'prometheus') {
      fetchPrometheus()
    } else if (activeTab === 'actuator') {
      fetchActuator()
    } else {
      fetchAuditLogs()
    }
  }, [activeTab, fetchPrometheus, fetchActuator, fetchAuditLogs])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Metrics</h1>

      <div className="flex border-b border-gray-800 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-3 text-sm font-medium transition-colors cursor-pointer border-b-2 ${
              activeTab === tab.key
                ? 'text-emerald-400 border-emerald-400'
                : 'text-gray-400 border-transparent hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'prometheus' && (
        <div>
          {prometheusLoading && (
            <div className="text-center py-20 text-gray-500">Loading Prometheus metrics...</div>
          )}
          {prometheusError && (
            <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-2 mb-4">{prometheusError}</div>
          )}
          {!prometheusLoading && !prometheusError && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400">{prometheusData.split('\n').filter(l => l && !l.startsWith('#')).length} active metrics</span>
                <div className="flex gap-2">
                  <button
                    onClick={fetchPrometheus}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              {(() => {
                const groups = parsePrometheus(prometheusData)
                return (
                  <div className="space-y-3">
                    {groups.map((group) => (
                      <MetricGroup key={group.name} group={group} defaultOpen={groups.length <= 5} />
                    ))}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {activeTab === 'actuator' && (
        <div>
          {actuatorLoading && (
            <div className="text-center py-20 text-gray-500">Loading Actuator data...</div>
          )}
          {actuatorError && (
            <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-2 mb-4">{actuatorError}</div>
          )}
          {!actuatorLoading && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={fetchActuator}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Health</h2>
                {health ? (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`inline-block w-3 h-3 rounded-full ${health.status === 'UP' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span className="text-lg font-medium">{health.status}</span>
                    </div>
                    {health.components && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Object.entries(health.components).map(([key, val]) => (
                          <div key={key} className="bg-gray-800/50 rounded-lg p-3">
                            <div className="text-xs text-gray-400 mb-1">{key}</div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-block w-2 h-2 rounded-full ${val.status === 'UP' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              <span className="text-sm text-white">{val.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500">Health data unavailable</div>
                )}
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Info</h2>
                {info ? (
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{formatJson(info)}</pre>
                ) : (
                  <div className="text-gray-500">Info unavailable</div>
                )}
              </div>

              {marketOverview && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4">Market Overview</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-400">{marketOverview.openBuyOrders}</div>
                      <div className="text-xs text-gray-400 mt-1">Buy Orders</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-400">{marketOverview.openSellOrders}</div>
                      <div className="text-xs text-gray-400 mt-1">Sell Orders</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{marketOverview.activeUsers}</div>
                      <div className="text-xs text-gray-400 mt-1">Active Users</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{marketOverview.totalPlayers}</div>
                      <div className="text-xs text-gray-400 mt-1">Total Players</div>
                    </div>
                  </div>
                </div>
              )}

              {orderBookStats && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4">Order Book Stats</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">{orderBookStats.totalOrders}</div>
                      <div className="text-xs text-gray-400 mt-1">Total Orders</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-400">{orderBookStats.filledOrders}</div>
                      <div className="text-xs text-gray-400 mt-1">Filled</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400">{orderBookStats.pendingOrders}</div>
                      <div className="text-xs text-gray-400 mt-1">Pending</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-400">{orderBookStats.cancelledOrders}</div>
                      <div className="text-xs text-gray-400 mt-1">Cancelled</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-white">{(orderBookStats.fillRate * 100).toFixed(1)}%</div>
                      <div className="text-xs text-gray-400 mt-1">Fill Rate</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-white">{(orderBookStats.cancelRate * 100).toFixed(1)}%</div>
                      <div className="text-xs text-gray-400 mt-1">Cancel Rate</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                      <div className="text-lg font-bold text-white">{orderBookStats.avgOrderSize}</div>
                      <div className="text-xs text-gray-400 mt-1">Avg Order Size</div>
                    </div>
                  </div>
                </div>
              )}

              {topTraded && topTraded.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4">Top Traded Players</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-800">
                        <th className="text-left py-2 px-3">#</th>
                        <th className="text-left py-2 px-3">Player</th>
                        <th className="text-right py-2 px-3">Orders</th>
                        <th className="text-right py-2 px-3">Quantity</th>
                        <th className="text-right py-2 px-3">Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topTraded.map((p) => (
                        <tr key={p.playerId} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-2 px-3 text-gray-400">{p.rank}</td>
                          <td className="py-2 px-3 text-white font-medium">{p.playerName}</td>
                          <td className="py-2 px-3 text-right text-gray-300">{p.orderCount}</td>
                          <td className="py-2 px-3 text-right text-gray-300">{p.totalQuantity}</td>
                          <td className="py-2 px-3 text-right text-emerald-400">{Number(p.totalValue).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div>
          {auditLoading && (
            <div className="text-center py-20 text-gray-500">Loading audit logs...</div>
          )}
          {auditError && (
            <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-2 mb-4">{auditError}</div>
          )}
          {!auditLoading && !auditError && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => { setAuditPage(0); fetchAuditLogs() }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              {auditLogs.length === 0 && (
                <div className="text-center py-20 text-gray-500">No audit logs yet.</div>
              )}

              {auditLogs.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-800 bg-gray-900/50">
                        <th className="text-left py-3 px-4">Timestamp</th>
                        <th className="text-left py-3 px-4">User</th>
                        <th className="text-left py-3 px-4">Operation</th>
                        <th className="text-left py-3 px-4 hidden lg:table-cell">Parameters</th>
                        <th className="text-right py-3 px-4">Time (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              log.username === 'anonymous' ? 'bg-gray-800 text-gray-400' : 'bg-blue-900/40 text-blue-400'
                            }`}>
                              {log.username}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white font-mono text-xs">{log.operation}</td>
                          <td className="py-3 px-4 text-gray-500 text-xs hidden lg:table-cell max-w-xs truncate">{log.parameters}</td>
                          <td className="py-3 px-4 text-right font-mono text-xs">
                            <span className={`${log.executionTimeMs > 1000 ? 'text-red-400' : log.executionTimeMs > 200 ? 'text-yellow-400' : 'text-gray-300'}`}>
                              {log.executionTimeMs}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {auditTotalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-6">
                  <button
                    onClick={() => setAuditPage(p => Math.max(0, p - 1))}
                    disabled={auditPage === 0}
                    className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                  >
                    &laquo;
                  </button>
                  {(() => {
                    const pages = []
                    const start = Math.max(0, auditPage - 2)
                    const end = Math.min(auditTotalPages - 1, auditPage + 2)
                    if (start > 0) {
                      pages.push(0)
                      if (start > 1) pages.push('...')
                    }
                    for (let i = start; i <= end; i++) pages.push(i)
                    if (end < auditTotalPages - 1) {
                      if (end < auditTotalPages - 2) pages.push('...')
                      pages.push(auditTotalPages - 1)
                    }
                    return pages.map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-gray-500">...</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setAuditPage(p)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                            p === auditPage
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          {p + 1}
                        </button>
                      )
                    )
                  })()}
                  <button
                    onClick={() => setAuditPage(p => Math.min(auditTotalPages - 1, p + 1))}
                    disabled={auditPage >= auditTotalPages - 1}
                    className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                  >
                    &raquo;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
