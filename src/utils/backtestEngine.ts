import type { StockData, BacktestResults, Position, Transaction } from '../types';

export const runBacktest = (data: StockData[]): BacktestResults => {
  const LOT_SIZE = 10000; // ₹10,000 per lot
  const THRESHOLD = 0.05; // 5%
  
  // Helper function to parse numbers with commas (e.g., "1,150.00" -> 1150)
  const parsePrice = (price: string): number => {
    return parseFloat(price.replace(/,/g, ''));
  };
  
  // Reverse data to process chronologically (oldest to newest)
  const sortedData = [...data].reverse();
  
  let positions: Position[] = [];
  let transactions: Transaction[] = [];
  let totalInvested = 0;
  let totalRealized = 0;

  // First buy at OPEN of first day
  const firstPrice = parsePrice(sortedData[0].OPEN);
  const firstShares = Math.floor(LOT_SIZE / firstPrice);
  positions.push({
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

    // Check for SELL triggers (5% up from any current position)
    const positionsToSell: number[] = [];
    for (let j = 0; j < positions.length; j++) {
      const pos = positions[j];
      const sellPrice = pos.buyPrice * (1 + THRESHOLD);
      
      if (high >= sellPrice) {
        positionsToSell.push(j);
        const sellAmount = pos.shares * sellPrice;
        totalRealized += sellAmount;
        
        transactions.push({
          date: date,
          type: 'SELL',
          price: sellPrice,
          shares: pos.shares,
          amount: sellAmount,
          boughtAt: pos.buyPrice,
          profit: sellAmount - (pos.shares * pos.buyPrice)
        });
      }
    }
    
    // Remove sold positions (in reverse to maintain indices)
    for (let j = positionsToSell.length - 1; j >= 0; j--) {
      positions.splice(positionsToSell[j], 1);
    }

    // Check for BUY triggers
    // Only check 5% below CURRENT positions (from start of day)
    const potentialBuys: number[] = [];
    const currentPositionCount = positions.length; // Track how many positions we had at start of day
    
    // Check if we can buy 5% below any CURRENT position (from start of day)
    for (let j = 0; j < currentPositionCount; j++) {
      const pos = positions[j];
      const buyPrice = pos.buyPrice * (1 - THRESHOLD);
      
      if (low <= buyPrice) {
        // Check if we already have a position at this price
        const existingAtLevel = positions.find(p => 
          Math.abs(p.buyPrice - buyPrice) < 0.01
        );
        
        if (!existingAtLevel && !potentialBuys.some(p => Math.abs(p - buyPrice) < 0.01)) {
          potentialBuys.push(buyPrice);
        }
      }
    }
    
    // Execute ALL valid buys, sorted by price (lowest first)
    if (potentialBuys.length > 0) {
      // Sort lowest to highest
      potentialBuys.sort((a, b) => a - b);
      
      for (const buyPrice of potentialBuys) {
        const shares = Math.floor(LOT_SIZE / buyPrice);
        
        positions.push({
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
  for (const pos of positions) {
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
    remainingPositions: positions,
    totalTrades: transactions.length,
    currentPrice: lastClose
  };
};