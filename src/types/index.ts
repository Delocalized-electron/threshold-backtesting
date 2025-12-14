export interface StockData {
  DATE: string;
  SERIES: string;
  OPEN: string;
  HIGH: string;
  LOW: string;
  'PREV. CLOSE': string;
  LTP: string;
  CLOSE: string;
  VWAP: string;
  '52W H': string;
  '52W L': string;
  VOLUME: string;
  VALUE: string;
  'NO. OF  TRADES': string;
}

export interface Position {
  buyPrice: number;
  shares: number;
  date: string;
  buyDate?: string; // Track when this specific lot was bought
  threshold?: number; // Track if bought at 5% or 10%
}

export interface Transaction {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  shares: number;
  amount: number;
  profit?: number;
  buyPrice?: number; // For SELL transactions, what was the buy price
  buyDate?: string; // For SELL transactions, when was it bought
  boughtAt?: number; // Alias for buyPrice (legacy support)
  threshold?: number; // Track if bought at 5% or 10%
}

export interface BacktestResults {
  totalInvested: number;
  totalRealized: number;
  currentValue: number;
  totalValue: number;
  totalProfit: number;
  profitPercentage: number;
  transactions: Transaction[];
  remainingPositions: Position[];
  totalTrades: number;
  currentPrice: number;
  annualizedROI?: number;
  startDate?: string;
  endDate?: string;
}