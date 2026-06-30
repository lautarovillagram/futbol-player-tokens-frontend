import axiosClient from './axiosClient'

export const auth = {
  login: (username, password) =>
    axiosClient.post('/auth/login', { username, password }),
  register: (username, password, email) =>
    axiosClient.post('/auth/register', { username, password, email }),
  logout: () => axiosClient.post('/auth/logout'),
}

export const players = {
  getAll: (params) => axiosClient.get('/players', { params }),
  getById: (id) => axiosClient.get(`/players/${id}`),
  getRanking: (params) => axiosClient.get('/players/ranking', { params }),
  getQuotes: (id) => axiosClient.get(`/players/${id}/quotes`),
  scrapeAll: () => axiosClient.post('/players/scrape'),
  scrapeNewOnly: () => axiosClient.post('/players/scrape/new-only'),
}

export const orders = {
  buy: (playerId, quantity, idempotencyKey, maxPrice) =>
    axiosClient.post('/orders/buy', { playerId, quantity, idempotencyKey, maxPrice }),
  sell: (playerId, quantity, idempotencyKey, minPrice) =>
    axiosClient.post('/orders/sell', { playerId, quantity, idempotencyKey, minPrice }),
  getTransactions: (params) => axiosClient.get('/orders/transactions', { params }),
  getBook: (params) => axiosClient.get('/orders/book', { params }),
  getPending: (params) => axiosClient.get('/orders/pending', { params }),
  getByPlayer: (playerId) => axiosClient.get(`/orders/player/${playerId}`),
  sellAll: () => axiosClient.post('/orders/sell-all'),
  cancel: (id) => axiosClient.post(`/orders/${id}/cancel`),
}

export const quotes = {
  getCurrent: (playerId) => axiosClient.get(`/quotes/player/${playerId}/current`),
  recalculate: () => axiosClient.post('/quotes/recalculate'),
}

export const users = {
  getPortfolio: (userId, params) => axiosClient.get(`/users/${userId}/portfolio`, { params }),
  getAllPortfolio: (userId) => axiosClient.get(`/users/${userId}/portfolio/all`),
  getTransactions: (userId) => axiosClient.get(`/users/${userId}/transactions`),
  getBalance: (userId) => axiosClient.get(`/users/${userId}/balance`),
}

export const matches = {
  getAll: () => axiosClient.get('/api/matches/all'),
  getById: (id) => axiosClient.get(`/api/matches/${id}`),
  getByTeam: (teamId) => axiosClient.get(`/api/matches/team/${teamId}`),
  create: (data) => axiosClient.post('/api/matches', data),
  update: (id, data) => axiosClient.put(`/api/matches/${id}`, data),
  delete: (id) => axiosClient.delete(`/api/matches/${id}`),
  scrapeToday: () => axiosClient.post('/api/matches/scrape/today'),
  reschedule: (id) => axiosClient.post(`/api/matches/reschedule/${id}`),
}

export const scheduler = {
  getStatus: () => axiosClient.get('/api/scheduler/status'),
  getMatches: () => axiosClient.get('/api/scheduler/matches'),
  scheduleAll: () => axiosClient.post('/api/scheduler/test/schedule-all'),
}

export const strategies = {
  getActive: () => axiosClient.get('/api/strategies/active'),
  getAll: () => axiosClient.get('/api/strategies'),
  getByType: (type) => axiosClient.get(`/api/strategies/${type}`),
  update: (type, data) => axiosClient.put(`/api/strategies/${type}`, data),
  updateNormalized: (type, data) => axiosClient.put(`/api/strategies/${type}/normalized`, data),
  getHistory: (type) => axiosClient.get(`/api/strategies/${type}/history`),
  getMode: () => axiosClient.get('/api/strategies/mode'),
  updateMode: (mode) => axiosClient.put('/api/strategies/mode', { mode }),
}

export const actuator = {
  health: () => axiosClient.get('/actuator/health'),
  info: () => axiosClient.get('/actuator/info'),
  prometheus: () => axiosClient.get('/actuator/prometheus'),
}

export const metrics = {
  marketOverview: () => axiosClient.get('/api/metrics/market-overview'),
  topTraded: () => axiosClient.get('/api/metrics/top-traded'),
  orderBookStats: () => axiosClient.get('/api/metrics/order-book-stats'),
  strategyImpact: () => axiosClient.get('/api/metrics/strategy-impact'),
  playerValuation: (playerId) => axiosClient.get(`/api/metrics/player-valuation/${playerId}`),
  marketDepth: (playerId) => axiosClient.get(`/api/metrics/market-depth/${playerId}`),
  portfolioSummary: (userId) => axiosClient.get(`/api/metrics/portfolio-summary/${userId}`),
}

export const auditLogs = {
  getAll: (params) => axiosClient.get('/api/audit-logs', { params }),
}


