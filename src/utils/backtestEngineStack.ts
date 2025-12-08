import type { StockData, BacktestResults, Position, Transaction } from '../types';

/**
 * Stack-based backtesting engine
 * Uses LIFO (Last In First Out) approach for selling positions
 * When checking sells, we check from the top of the stack (most recent buy)
 * and work our way down
 */
export const runBacktestStack = (data: StockData[]): BacktestResults => {
  const LOT_SIZE = 10000; // ₹10,000 per lot
  const THRESHOLD = 0.05; // 5%
  
  // Helper function to parse numbers with commas (e.g., "1,150.00" -> 1150)
  const parsePrice = (price: string): number => {
    return parseFloat(price.replace(/,/g, ''));
  };
  
  // Reverse data to process chronologically (oldest to newest)
  const sortedData = [...data].reverse();
  
  // Stack of positions (most recent buy is at the end)
  let positionStack: Position[] = [];
  let transactions: Transaction[] = [];
  let totalInvested = 0;
  let totalRealized = 0;

  // First buy at OPEN of first day
  const firstPrice = parsePrice(sortedData[0].OPEN);
  const firstShares = Math.floor(LOT_SIZE / firstPrice);
  positionStack.push({
    buyPrice: firstPrice,
    shares: firstShares,
    buyDate: sortedData[0].DATE
  });
  totalInvested += firstShares * firstPrice;
  
  transactions.push({
    date: sortedData[0].DATE,
    type: 'BUY',
    price: firstPrice,
    shares: firstShares,
    amount: firstShares * firstPrice
  });

  // Process each day
  for (let i = 0; i < sortedData.length; i++) {
    const row = sortedData[i];
    const high = parsePrice(row.HIGH);
    const low = parsePrice(row.LOW);
    const date = row.DATE;

    // SELL CHECK: Check from top of stack (most recent buy) downward
    // Keep checking until we find a position that doesn't hit its sell target
    let continueChecking = true;
    while (continueChecking && positionStack.length > 0) {
      // Peek at top of stack (most recent buy)
      const topPosition = positionStack[positionStack.length - 1];
      const sellPrice = topPosition.buyPrice * (1 + THRESHOLD);
      
      if (high >= sellPrice) {
        // Pop from stack and sell
        const soldPosition = positionStack.pop()!;
        const sellAmount = soldPosition.shares * sellPrice;
        totalRealized += sellAmount;
        
        transactions.push({
          date: date,
          type: 'SELL',
          price: sellPrice,
          shares: soldPosition.shares,
          amount: sellAmount,
          boughtAt: soldPosition.buyPrice,
          profit: sellAmount - (soldPosition.shares * soldPosition.buyPrice)
        });
      } else {
        // Top position didn't hit target, stop checking
        continueChecking = false;
      }
    }

    // BUY CHECK: Check if we can buy 5% below the top of stack (most recent position)
    if (positionStack.length > 0) {
      const topPosition = positionStack[positionStack.length - 1];
      const buyPrice = topPosition.buyPrice * (1 - THRESHOLD);
      
      if (low <= buyPrice) {
        // Buy at this level
        const shares = Math.floor(LOT_SIZE / buyPrice);
        
        positionStack.push({
          buyPrice: buyPrice,
          shares: shares,
          buyDate: date
        });
        totalInvested += shares * buyPrice;
        
        transactions.push({
          date: date,
          type: 'BUY',
          price: buyPrice,
          shares: shares,
          amount: shares * buyPrice
        });
      }
    }
  }

  // Calculate current value of remaining positions using last day's CLOSE
  const lastClose = parsePrice(sortedData[sortedData.length - 1].CLOSE);
  let currentValue = 0;
  for (const pos of positionStack) {
    currentValue += pos.shares * lastClose;
  }

  const totalValue = totalRealized + currentValue;
  const totalProfit = totalValue - totalInvested;
  const profitPercentage = (totalProfit / totalInvested) * 100;

  return {
    totalInvested,
    totalRealized,
    currentValue,
    totalValue,
    totalProfit,
    profitPercentage,
    transactions,
    remainingPositions: positionStack,
    totalTrades: transactions.length,
    currentPrice: lastClose
  };
};
