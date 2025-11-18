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
// export const MOCK_BASE: Record<string, Quote[]> = {
//   indices: [
//     { symbol: 'SPY', price: 665.6700, high: 673.7100, low: 662.1700, previousClose: 671.9300, change: -6.2600, changePercent: -0.9316, latestTradingDay: new Date().toISOString() },
//     { symbol: 'QQQ', price: 372, high: 375, low: 370, previousClose: 370, change: 2, changePercent: 0.54, latestTradingDay: new Date().toISOString() },
//     { symbol: 'DIA', price: 350, high: 352, low: 348, previousClose: 349, change: 1, changePercent: 0.29, latestTradingDay: new Date().toISOString() },
//   ],
//   acciones: [
//     { symbol: 'AAPL', price: 176, high: 178, low: 174, previousClose: 175, change: 1, changePercent: 0.57, latestTradingDay: new Date().toISOString() },
//     { symbol: 'MSFT', price: 332, high: 335, low: 329, previousClose: 330, change: 2, changePercent: 0.61, latestTradingDay: new Date().toISOString() },
//     { symbol: 'GOOGL', price: 140, high: 142, low: 138, previousClose: 139, change: 1, changePercent: 0.72, latestTradingDay: new Date().toISOString() },
//     { symbol: 'AMZN', price: 135, high: 137, low: 133, previousClose: 134, change: 1, changePercent: 0.74, latestTradingDay: new Date().toISOString() },
//   ],
//   commodities: [
//     { symbol: 'GLD', price: 1972, high: 1985, low: 1955, previousClose: 1960, change: 12, changePercent: 0.61, latestTradingDay: new Date().toISOString() },
//     { symbol: 'USO', price: 87, high: 89, low: 85, previousClose: 86.5, change: 0.5, changePercent: 0.58, latestTradingDay: new Date().toISOString() },
//     { symbol: 'SLV', price: 24.8, high: 25.2, low: 24.3, previousClose: 24.5, change: 0.3, changePercent: 1.22, latestTradingDay: new Date().toISOString() },
//   ],
//   crypto: [
//     { symbol: 'BTC', price: 64500, high: 65500, low: 63500, previousClose: 64000, change: 500, changePercent: 0.78, latestTradingDay: new Date().toISOString() },
//     { symbol: 'ETH', price: 3250, high: 3330, low: 3180, previousClose: 3200, change: 50, changePercent: 1.56, latestTradingDay: new Date().toISOString() },
//     { symbol: 'SOL', price: 135, high: 140, low: 132, previousClose: 134, change: 1, changePercent: 0.75, latestTradingDay: new Date().toISOString() },
//     { symbol: 'XRP', price: 0.52, high: 0.54, low: 0.50, previousClose: 0.51, change: 0.01, changePercent: 1.96, latestTradingDay: new Date().toISOString() },
//   ],
//   fx: [
//     { symbol: 'EURUSD', price: 1.095, high: 1.100, low: 1.090, previousClose: 1.09, change: 0.005, changePercent: 0.46, latestTradingDay: new Date().toISOString() },
//     { symbol: 'USDJPY', price: 145.7, high: 146.5, low: 145.0, previousClose: 145.2, change: 0.5, changePercent: 0.34, latestTradingDay: new Date().toISOString() },
//     { symbol: 'GBPUSD', price: 1.26, high: 1.27, low: 1.25, previousClose: 1.255, change: 0.005, changePercent: 0.40, latestTradingDay: new Date().toISOString() },
//     { symbol: 'USDCAD', price: 1.34, high: 1.35, low: 1.33, previousClose: 1.338, change: 0.002, changePercent: 0.15, latestTradingDay: new Date().toISOString() },
//   ],
// };

export const MOCK_BASE: Record<string, Quote[]> = {
  indices: [
    { symbol: "SPY", price: 665.67, high: 673.71, low: 662.17, previousClose: 671.93, change: -6.26, changePercent: -0.9316, latestTradingDay: new Date().toISOString() },
    { symbol: "QQQ", price: 611.45, high: 615.0, low: 599.87, previousClose: 608.4, change: 3.05, changePercent: 0.5013, latestTradingDay: new Date().toISOString() },
    { symbol: "DIA", price: 470.6, high: 472.05, low: 468.87, previousClose: 471.8, change: -1.2, changePercent: -0.2543, latestTradingDay: new Date().toISOString() },
  ],
  acciones: [
    { symbol: "AAPL", price: 272.83, high: 272.82, low: 265.73, previousClose: 272.41, change: 0.42, changePercent: 0.1542, latestTradingDay: new Date().toISOString() },
    { symbol: "MSFT", price: 272.83, high: 272.82, low: 265.73, previousClose: 272.41, change: 0.42, changePercent: 0.1542, latestTradingDay: new Date().toISOString() },
    { symbol: "TSLA", price: 507.49, high: 512.12, low: 504.92, previousClose: 510.18, change: -2.69, changePercent: -0.5273, latestTradingDay: new Date().toISOString() },
    { symbol: "NFLX", price: 507.49, high: 512.12, low: 504.92, previousClose: 510.18, change: -2.69, changePercent: -0.5273, latestTradingDay: new Date().toISOString() },
    { symbol: "GOOGL", price: 289.05, high: 293.95, low: 283.57, previousClose: 276.41, change: 12.64, changePercent: 4.5729, latestTradingDay: new Date().toISOString() },
    { symbol: "META", price: 289.05, high: 293.95, low: 283.57, previousClose: 276.41, change: 12.64, changePercent: 4.5729, latestTradingDay: new Date().toISOString() },
    { symbol: "AMZN", price: 232.87, high: 234.6, low: 229.19, previousClose: 234.69, change: -1.82, changePercent: -0.7755, latestTradingDay: new Date().toISOString() },
  ],
  commodities: [
    { symbol: "GLD", price: 375.96, high: 403.3, low: 236.13, previousClose: 375.96, change: 0.0, changePercent: 0.0, latestTradingDay: new Date().toISOString() },
    { symbol: "USO", price: 71.5, high: 71.9573, low: 71.13, previousClose: 69.85, change: 1.65, changePercent: 2.3622, latestTradingDay: new Date().toISOString() },
    { symbol: "SLV", price: 45.47, high: 46.705, low: 45.4, previousClose: 47.42, change: -1.95, changePercent: -4.1122, latestTradingDay: new Date().toISOString() },
  ],
  crypto: [
    { symbol: "BTC", price: 90056, high: 95903.57, low: 90294.95, previousClose: 95333.4, change: -5277.4, changePercent: -5.5357, latestTradingDay: new Date().toISOString() },
    { symbol: "ETH", price: 3031.48, high: 3223.38, low: 2946.56, previousClose: 3031.48, change: 0, changePercent: 0, latestTradingDay: new Date().toISOString() },
    { symbol: "SOL", price: 132.96, high: 142.4, low: 133.92, previousClose: 135.5, change: -2.54, changePercent: -1.8745, latestTradingDay: new Date().toISOString() },
    { symbol: "XRP", price: 2.15, high: 2.291353, low: 2.11505, previousClose: 2.15, change: 0, changePercent: 0, latestTradingDay: new Date().toISOString() },
    { symbol: "SOL", price: 132.96, high: 142.4, low: 133.92, previousClose: 135.5, change: -2.54, changePercent: -1.8745, latestTradingDay: new Date().toISOString() },
    { symbol: "XRP", price: 2.15, high: 2.291353, low: 2.11505, previousClose: 2.15, change: 0, changePercent: 0, latestTradingDay: new Date().toISOString() }
  ],

  fx: [
    { symbol: "EURUSD", price: 1.15922, high: 1.1596, low: 1.1585, previousClose: 1.1592, change: 0, changePercent: 0, latestTradingDay: new Date().toISOString() },
    { symbol: "USDJPY", price: 155.26, high: 155.38, low: 155.11, previousClose: 155.26, change: 0, changePercent: 0, latestTradingDay: new Date().toISOString() },
    { symbol: "GBPUSD", price: 1.31511, high: 1.31511, low: 1.31511, previousClose: 1.3156, change: -0.0005, changePercent: -0.038, latestTradingDay: new Date().toISOString() },
    { symbol: "USDCAD", price: 1.40494, high: 1.4058, low: 1.4045, previousClose: 1.4052, change: -0.0003, changePercent: -0.0213, latestTradingDay: new Date().toISOString() },
  ],
};
