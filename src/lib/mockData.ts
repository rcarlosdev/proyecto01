// lib/mockData.ts
export type Quote = {
  symbol: string;
  price: number;
  high?: number;
  low?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  latestTradingDay?: string;
};

/* ---------------------- Fallback mock (estático base) ---------------------- */
/**
 * Base de mock (valores plausibles) — adáptalos cuando quieras.
 * Estos son los datos que usaremos si Alpha Vantage falla o limita.
 */
export const MOCK_BASE: Record<string, Quote[]> = {
  indices: [
    { symbol: 'SPY', price: 4525, high: 4540, low: 4505, previousClose: 4510, change: 15, changePercent: 0.33, latestTradingDay: new Date().toISOString() },
    { symbol: 'QQQ', price: 372, high: 375, low: 370, previousClose: 370, change: 2, changePercent: 0.54, latestTradingDay: new Date().toISOString() },
    { symbol: 'DIA', price: 350, high: 352, low: 348, previousClose: 349, change: 1, changePercent: 0.29, latestTradingDay: new Date().toISOString() },
  ],
  acciones: [
    { symbol: 'AAPL', price: 176, high: 178, low: 174, previousClose: 175, change: 1, changePercent: 0.57, latestTradingDay: new Date().toISOString() },
    { symbol: 'MSFT', price: 332, high: 335, low: 329, previousClose: 330, change: 2, changePercent: 0.61, latestTradingDay: new Date().toISOString() },
    { symbol: 'GOOGL', price: 140, high: 142, low: 138, previousClose: 139, change: 1, changePercent: 0.72, latestTradingDay: new Date().toISOString() },
    { symbol: 'AMZN', price: 135, high: 137, low: 133, previousClose: 134, change: 1, changePercent: 0.74, latestTradingDay: new Date().toISOString() },
  ],
  commodities: [
    { symbol: 'GLD', price: 1972, high: 1985, low: 1955, previousClose: 1960, change: 12, changePercent: 0.61, latestTradingDay: new Date().toISOString() },
    { symbol: 'USO', price: 87, high: 89, low: 85, previousClose: 86.5, change: 0.5, changePercent: 0.58, latestTradingDay: new Date().toISOString() },
    { symbol: 'SLV', price: 24.8, high: 25.2, low: 24.3, previousClose: 24.5, change: 0.3, changePercent: 1.22, latestTradingDay: new Date().toISOString() },
  ],
  crypto: [
    { symbol: 'BTC', price: 64500, high: 65500, low: 63500, previousClose: 64000, change: 500, changePercent: 0.78, latestTradingDay: new Date().toISOString() },
    { symbol: 'ETH', price: 3250, high: 3330, low: 3180, previousClose: 3200, change: 50, changePercent: 1.56, latestTradingDay: new Date().toISOString() },
    { symbol: 'SOL', price: 135, high: 140, low: 132, previousClose: 134, change: 1, changePercent: 0.75, latestTradingDay: new Date().toISOString() },
    { symbol: 'XRP', price: 0.52, high: 0.54, low: 0.50, previousClose: 0.51, change: 0.01, changePercent: 1.96, latestTradingDay: new Date().toISOString() },
  ],
  fx: [
    { symbol: 'EURUSD', price: 1.095, high: 1.100, low: 1.090, previousClose: 1.09, change: 0.005, changePercent: 0.46, latestTradingDay: new Date().toISOString() },
    { symbol: 'USDJPY', price: 145.7, high: 146.5, low: 145.0, previousClose: 145.2, change: 0.5, changePercent: 0.34, latestTradingDay: new Date().toISOString() },
    { symbol: 'GBPUSD', price: 1.26, high: 1.27, low: 1.25, previousClose: 1.255, change: 0.005, changePercent: 0.40, latestTradingDay: new Date().toISOString() },
    { symbol: 'USDCAD', price: 1.34, high: 1.35, low: 1.33, previousClose: 1.338, change: 0.002, changePercent: 0.15, latestTradingDay: new Date().toISOString() },
  ],
};