import React from 'react';
import type { Position } from '../types';

interface OpenPositionsProps {
  positions: Position[];
  currentPrice: number;
}

const OpenPositions: React.FC<OpenPositionsProps> = ({ positions, currentPrice }) => {
  if (positions.length === 0) return null;

  return (
    <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Open Positions (Unsold Lots)</h2>
      <p className="text-sm text-gray-600 mb-4">
        These positions remain unsold at the end of the backtest period. Current price: ₹{currentPrice.toFixed(2)}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-amber-300">
              <th className="text-left py-3 px-4 text-gray-700">Buy Date</th>
              <th className="text-right py-3 px-4 text-gray-700">Buy Price</th>
              <th className="text-right py-3 px-4 text-gray-700">Target Sell</th>
              <th className="text-right py-3 px-4 text-gray-700">Shares</th>
              <th className="text-right py-3 px-4 text-gray-700">Invested</th>
              <th className="text-right py-3 px-4 text-gray-700">Current Value</th>
              <th className="text-right py-3 px-4 text-gray-700">Unrealized P/L</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, idx) => {
              const invested = pos.shares * pos.buyPrice;
              const currentValue = pos.shares * currentPrice;
              const unrealizedPL = currentValue - invested;
              const targetSellPrice = pos.buyPrice * 1.05;
              
              return (
                <tr key={idx} className="border-b border-amber-200">
                  <td className="py-3 px-4 text-gray-800">{pos.buyDate}</td>
                  <td className="py-3 px-4 text-right text-gray-800">₹{pos.buyPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-blue-600 font-semibold">₹{targetSellPrice.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-gray-800">{pos.shares}</td>
                  <td className="py-3 px-4 text-right text-gray-800">₹{invested.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-gray-800">₹{currentValue.toFixed(2)}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {unrealizedPL >= 0 ? '+' : ''}₹{unrealizedPL.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OpenPositions;