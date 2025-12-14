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
                  <td className="py-3 px-4 text-right text-gray-800">
                    <div className="flex items-center justify-end gap-2">
                      ₹{pos.buyPrice.toFixed(2)}
                      {pos.threshold && pos.threshold > 0.05 && pos.threshold < 0.15 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          10% Dip
                        </span>
                      )}
                      {pos.threshold && pos.threshold >= 0.15 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          20% Dip
                        </span>
                      )}
                    </div>
                  </td>
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
      
      {positions.length > 0 && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Invested</p>
              <p className="text-lg font-semibold text-gray-800">
                ₹{positions.reduce((sum, p) => sum + (p.shares * p.buyPrice), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Value</p>
              <p className="text-lg font-semibold text-gray-800">
                ₹{positions.reduce((sum, p) => sum + (p.shares * currentPrice), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Unrealized P/L</p>
              <p className={`text-lg font-bold ${
                positions.reduce((sum, p) => sum + (p.shares * currentPrice) - (p.shares * p.buyPrice), 0) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                ₹{positions.reduce((sum, p) => sum + (p.shares * currentPrice) - (p.shares * p.buyPrice), 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenPositions;