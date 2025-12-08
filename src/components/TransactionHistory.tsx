import React from 'react';
import type { Transaction } from '../types';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Transaction History</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 px-4 text-gray-700">Date</th>
              <th className="text-left py-3 px-4 text-gray-700">Type</th>
              <th className="text-right py-3 px-4 text-gray-700">Price</th>
              <th className="text-right py-3 px-4 text-gray-700">Shares</th>
              <th className="text-right py-3 px-4 text-gray-700">Amount</th>
              <th className="text-right py-3 px-4 text-gray-700">Profit</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, idx) => (
              <tr key={idx} className="border-b border-gray-200 hover:bg-white transition">
                <td className="py-3 px-4 text-gray-800">{txn.date}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    txn.type === 'BUY' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {txn.type}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-gray-800">₹{txn.price.toFixed(2)}</td>
                <td className="py-3 px-4 text-right text-gray-800">{txn.shares}</td>
                <td className="py-3 px-4 text-right text-gray-800">₹{txn.amount.toFixed(2)}</td>
                <td className="py-3 px-4 text-right">
                  {txn.profit !== undefined ? (
                    <span className={txn.profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      ₹{txn.profit.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;