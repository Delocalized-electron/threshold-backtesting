import React, { useState } from 'react';
import Papa from 'papaparse';
import FileUpload from './components/FileUpload';
import SummaryCards from './components/SummaryCards';
import TransactionHistory from './components/TransactionHistory';
import OpenPositions from './components/OpenPositions';
//import { runBacktest } from './utils/backtestEngine';
// Alternative: Stack-based engine (LIFO approach)
//import { runBacktestStack as runBacktest } from './utils/backtestEngineStack';
import { runBacktest } from './utils/backtestEngineV2';
import type { StockData, BacktestResults } from './types';

function App() {
  const [results, setResults] = useState<BacktestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const processCSV = (file: File) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setFileName(file.name);

    Papa.parse<StockData>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parseResult) => {
        try {
          const data = parseResult.data;
          
          if (!data || data.length === 0) {
            throw new Error('CSV file is empty');
          }

          // Validate required columns
          const firstRow = data[0];
          if (!firstRow.OPEN || !firstRow.HIGH || !firstRow.LOW || !firstRow.CLOSE) {
            throw new Error('CSV must contain OPEN, HIGH, LOW, and CLOSE columns');
          }

          const backtestResults = runBacktest(data);
          setResults(backtestResults);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        setError('Error parsing CSV: ' + err.message);
        setLoading(false);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCSV(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Stock Backtesting Application
          </h1>
          <p className="text-gray-600 mb-8">
            Upload your CSV to analyze buy/sell patterns with 5% threshold strategy
          </p>

          <FileUpload onFileUpload={handleFileUpload} />

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Processing your data...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {results && (
            <div className="space-y-6">
              <SummaryCards 
                results={results} 
                stockName={fileName.replace(/\.[^/.]+$/, "")} // Remove extension
              />
              <TransactionHistory transactions={results.transactions} />
              <OpenPositions positions={results.remainingPositions} currentPrice={results.currentPrice} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;