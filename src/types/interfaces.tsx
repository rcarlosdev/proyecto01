export interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  role: string;
  status: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export interface MarketQuote {
  symbol: string;
  price: number;
  high?: number;
  low?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  latestTradingDay?: string;
}