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
  buyDate: string;
}

export interface Transaction {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  shares: number;
  amount: number;
  boughtAt?: number;
  profit?: number;
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
}