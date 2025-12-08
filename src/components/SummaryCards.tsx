import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { BacktestResults } from '../types';

interface SummaryCardsProps {
  results: BacktestResults;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ results }) => {
  return (
    <>
      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-blue-100 text-sm mb-1">Total Invested</p>
          <p className="text-3xl font-bold">₹{results.totalInvested.toFixed(2)}</p>
        </div>
        
        <div className={`bg-gradient-to-br ${results.totalProfit >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} rounded-xl p-6 text-white`}>
          <p className="text-white/80 text-sm mb-1">Total Profit/Loss</p>
          <p className="text-3xl font-bold flex items-center">
            {results.totalProfit >= 0 ? <TrendingUp className="mr-2" /> : <TrendingDown className="mr-2" />}
            ₹{results.totalProfit.toFixed(2)}
          </p>
        </div>

        <div className={`bg-gradient-to-br ${results.profitPercentage >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-orange-500 to-orange-600'} rounded-xl p-6 text-white`}>
          <p className="text-white/80 text-sm mb-1">Profit/Loss %</p>
          <p className="text-3xl font-bold">{results.profitPercentage.toFixed(2)}%</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm">Total Trades</p>
          <p className="text-2xl font-semibold text-gray-800">{results.totalTrades}</p>
          <p className="text-xs text-gray-500 mt-1">
            {results.transactions.filter(t => t.type === 'BUY').length} buys, {results.transactions.filter(t => t.type === 'SELL').length} sells
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm">Realized Value</p>
          <p className="text-2xl font-semibold text-gray-800">₹{results.totalRealized.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">From completed trades</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm">Current Holdings Value</p>
          <p className="text-2xl font-semibold text-gray-800">₹{results.currentValue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{results.remainingPositions.length} open positions</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-600 text-sm">Final Price</p>
          <p className="text-2xl font-semibold text-gray-800">₹{results.currentPrice.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Last closing price</p>
        </div>
      </div>
    </>
  );
};

export default SummaryCards;