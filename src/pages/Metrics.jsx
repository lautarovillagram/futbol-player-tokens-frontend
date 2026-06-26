import { useState, useEffect, useCallback } from 'react'
import { actuator as actuatorApi, metrics as metricsApi } from '../api/endpoints'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { key: 'prometheus', label: 'Prometheus' },
  { key: 'actuator', label: 'Actuator' },
]

function formatJson(obj) {
  return JSON.stringify(obj, null, 2)
}

export default function Metrics() {
  const [activeTab, setActiveTab] = useState('prometheus')
  const { userId } = useAuth()

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

  useEffect(() => {
    if (activeTab === 'prometheus') {
      fetchPrometheus()
    } else {
      fetchActuator()
    }
  }, [activeTab, fetchPrometheus, fetchActuator])

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
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <span className="text-sm text-gray-400">Raw Prometheus Metrics</span>
                <button
                  onClick={fetchPrometheus}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Refresh
                </button>
              </div>
              <pre className="text-xs text-gray-300 p-4 overflow-auto max-h-[70vh] font-mono leading-relaxed whitespace-pre-wrap break-all">
                {prometheusData}
              </pre>
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
    </div>
  )
}
