import type { StockData, BacktestResults, Position, Transaction } from '../types';

/**
 * Reference-Based Backtesting Engine
 * 
 * Strategy: Dynamic Reference Trading with 5% Threshold
 * 
 * Core Concept:
 * - Maintain a "reference price" which is the last action taken (buy or sell)
 * - Buy trigger: 5% below reference
 * - Sell trigger: Each position sells at 5% above its buy price
 * - After each action, update the reference
 * - Multiple actions possible per day as reference updates
 * 
 * Key Rules:
 * 1. Reference starts as the first buy price
 * 2. When we buy: new buy price becomes reference
 * 3. When we sell: sell price becomes reference
 * 4. When we sell multiple: highest sell becomes reference
 * 5. After selling, if positions remain: highest position becomes reference
 * 6. We continuously check for new actions after each reference update
 * 
 * Example Flow:
 * Day 1: Buy ₹100 → ref = ₹100
 * Day 2: HIGH = ₹108
 *   - Sell ₹100 at ₹105 → ref = ₹105
 *   - Check buy: 5% below ₹105 = ₹99.75, if LOW ≤ ₹99.75 → buy
 * Day 3: Positions [₹95, ₹100], ref = ₹95, HIGH = ₹108
 *   - Sell ₹95 at ₹99.75 → ref = ₹100 (highest remaining position)
 *   - Sell ₹100 at ₹105 → ref = ₹105
 *   - Check buy: 5% below ₹105 = ₹99.75, if LOW ≤ ₹99.75 → buy
 */
export const runBacktest = (data: StockData[]): BacktestResults => {
  console.log('🚀 Reference-Based Engine V2 Started');
  
  // Trading parameters
  const LOT_SIZE = 10000; // Fixed investment amount per trade: ₹10,000
  const THRESHOLD = 0.05; // 5% threshold for buy/sell triggers
  
  /**
   * Helper function to parse Indian number format with commas
   * Converts "1,150.00" to 1150
   */
  const parsePrice = (price: string): number => {
    return parseFloat(price.replace(/,/g, ''));
  };
  
  /**
   * Reverse the data array to process chronologically
   * CSV is sorted newest-to-oldest, we need oldest-to-newest
   */
  const sortedData = [...data].reverse();
  
  // State variables
  let positions: Position[] = [];        // Array of currently held positions
  let transactions: Transaction[] = [];  // History of all buy/sell transactions
  let totalInvested = 0;                // Total money spent on purchases
  let totalRealized = 0;                // Total money received from sales
  let reference = 0;                    // Current reference price for buy/sell triggers

  /**
   * INITIAL BUY
   * Always buy at the OPEN price of the first day
   * This becomes our initial reference
   */
  const firstPrice = parsePrice(sortedData[0].OPEN);
  const firstShares = Math.floor(LOT_SIZE / firstPrice);
  
  positions.push({
    buyPrice: firstPrice,
    shares: firstShares,
    buyDate: sortedData[0].DATE
  });
  totalInvested += firstShares * firstPrice;
  reference = firstPrice; // Set initial reference
  
  transactions.push({
    date: sortedData[0].DATE,
    type: 'BUY',
    price: firstPrice,
    shares: firstShares,
    amount: firstShares * firstPrice
  });

  /**
   * MAIN PROCESSING LOOP
   * Process each day in the dataset chronologically
   */
  for (let i = 0; i < sortedData.length; i++) {
    const row = sortedData[i];
    const high = parsePrice(row.HIGH);
    const low = parsePrice(row.LOW);
    const close = parsePrice(row.CLOSE);
    const date = row.DATE;

    /**
     * RECOVERY MODE
     * 
     * When we have no positions (sold everything) and price has risen 10% above last sell:
     * - Switch to using daily HIGH as reference
     * - Each day, if CLOSE > previous reference, update reference to today's HIGH
     * - Buy at 5% below the HIGH
     * - This allows re-entry during bull markets
     * 
     * Example:
     * - Sold at ₹100, positions = 0
     * - Day 1: CLOSE = ₹112 (>10% above ₹100) → ref = HIGH
     * - Day 2: CLOSE > ref → update ref to today's HIGH
     * - Continue until we buy, then resume normal algorithm
     */
    if (positions.length === 0) {
      // We have no positions
      // Check if we need to enter recovery mode or update reference
      
      // Get the last sell price (which is current reference)
      const lastSellPrice = reference;
      
      // Check if price has risen 10% above last sell
      if (close > lastSellPrice * 1.10) {
        // Enter/continue recovery mode: use HIGH as reference
        if (close > reference) {
          // Update reference to today's HIGH
          const oldRef = reference;
          reference = high;
          console.log(`${date}: Recovery mode - CLOSE (${close.toFixed(2)}) > ref (${oldRef.toFixed(2)}). New reference = HIGH (${high.toFixed(2)})`);
        }
      }
    }

    /**
     * CONTINUOUS ACTION LOOP
     * Keep checking for actions until no more actions are possible
     * This allows multiple buys/sells on the same day as reference updates
     */
    let actionTaken = true;
    let loopCount = 0;
    let lastSellPriceToday = 0; // Track highest sell price today to prevent buy-sell loops
    let buyPricesToday = new Set<number>(); // Track all buy prices executed today
    
    while (actionTaken) {
      actionTaken = false;
      loopCount++;
      
      if (loopCount > 20) {
        console.error('Infinite loop detected on', date);
        break;
      }

      /**
       * STEP 1: CHECK FOR SELL TRIGGERS
       * 
       * Check all positions (sorted by buy price, lowest first)
       * Sell positions one by one, updating reference after each sell
       * 
       * Important: After each sell, we update reference and continue checking
       * This allows cascading sells on the same day
       */
      if (positions.length > 0) {
        // Sort positions by buy price (lowest first)
        positions.sort((a, b) => a.buyPrice - b.buyPrice);
        
        // Check the lowest position first
        const pos = positions[0];
        const sellPrice = pos.buyPrice * (1 + THRESHOLD);
        
        if (high >= sellPrice) {
          // SELL this position
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
          
          // Remove this position
          positions.shift(); // Remove first element
          
          // Update reference
          if (positions.length > 0) {
            // If we have remaining positions, reference becomes highest remaining position
            const highestPosition = Math.max(...positions.map(p => p.buyPrice));
            reference = highestPosition;
            console.log(`${date}: After sell, ${positions.length} positions remain. Reference = ${reference.toFixed(2)}`);
          } else {
            // No positions left, reference is the sell price
            reference = sellPrice;
            lastSellPriceToday = Math.max(lastSellPriceToday, sellPrice); // Track highest sell today
            console.log(`${date}: After sell, no positions. Reference = ${reference.toFixed(2)}`);
          }
          
          actionTaken = true; // We took an action, continue loop
          continue; // Check for more sells
        }
      }

      /**
       * STEP 2: CHECK FOR BUY TRIGGER
       * 
       * Buy trigger: 5% below current reference
       * After buying, new buy price becomes reference
       * 
       * Important: 
       * - We only buy if we don't already have a position at this exact price
       * - The buy price must be within the day's range (LOW <= buyPrice <= HIGH)
       *   This ensures the price actually reached our buy level during the day
       */
      const buyPrice = reference * (1 - THRESHOLD);
      
      // Debug logging for specific dates
      if (date === '21-Mar-2025' || date === '22-Mar-2025' || date === '07-Apr-2025' || date === '2021-02-06' || date === '2021-02-08' || date === '2021-03-01') {
        console.log(`${date}: Checking buy. Reference=${reference.toFixed(2)}, BuyPrice=${buyPrice.toFixed(2)}, LOW=${low.toFixed(2)}, HIGH=${high.toFixed(2)}`);
        if (!(low <= buyPrice && buyPrice <= high)) {
          console.log(`${date}: ❌ BuyPrice ${buyPrice.toFixed(2)} is NOT in range [${low.toFixed(2)}, ${high.toFixed(2)}]`);
        }
      }
      
      // Check if buy price is within the day's range
      if (low <= buyPrice && buyPrice <= high) {
        // Prevent buy-sell loops: Don't buy on same day after selling everything
        if (lastSellPriceToday > 0) {
          // We sold everything today, don't buy again today
          // This prevents infinite cascading loops
          if (date === '2021-04-08' || date === '2021-04-29') {
            console.log(`${date}: Skipping buy at ${buyPrice.toFixed(2)} - already sold everything today at ${lastSellPriceToday.toFixed(2)}`);
          }
        } else {
          // Check if we already have a position at this price
          const existingAtLevel = positions.find(p => 
            Math.abs(p.buyPrice - buyPrice) < 0.01
          );
          
          // Check if we already bought at this price today (even if we sold it)
          const boughtTodayAtLevel = Array.from(buyPricesToday).some(p => 
            Math.abs(p - buyPrice) < 0.01
          );
          
          if (date === '07-Apr-2025' || date === '2022-01-24' || date === '2025-05-02') {
            console.log(`${date}: BuyPrice is within range! Existing position?`, existingAtLevel ? 'YES' : 'NO', 'Bought today?', boughtTodayAtLevel ? 'YES' : 'NO');
          }
          
          if (!existingAtLevel && !boughtTodayAtLevel) {
            // BUY at this price
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
            
            // Track that we bought at this price today
            buyPricesToday.add(buyPrice);
            
            // Update reference to the new buy price
            reference = buyPrice;
            
            console.log(`${date}: BOUGHT at ${buyPrice.toFixed(2)}, new reference = ${reference.toFixed(2)}`);
            
            actionTaken = true; // We took an action, continue loop
            continue;
          }
        }
      }
      
      // If we reach here, no action was taken, exit the while loop
    }
  }

  console.log('\n=== BACKTEST SUMMARY ===');
  console.log('Total transactions:', transactions.length);
  console.log('Final reference:', reference.toFixed(2));
  console.log('Final positions:', positions.length);
  console.log('Last 5 days of data:');
  for (let i = Math.max(0, sortedData.length - 5); i < sortedData.length; i++) {
    const row = sortedData[i];
    console.log(`  ${row.DATE}: HIGH=${parsePrice(row.HIGH).toFixed(2)}, LOW=${parsePrice(row.LOW).toFixed(2)}`);
  }
  console.log('Buy trigger would be:', (reference * 0.95).toFixed(2));

  /**
   * CALCULATE FINAL RESULTS
   * 
   * After processing all days:
   * 1. Calculate current value of remaining positions using last CLOSE price
   * 2. Total value = realized (from sells) + current (from holdings)
   * 3. Total profit = total value - total invested
   * 4. Profit percentage = (profit / invested) × 100
   */
  const lastClose = parsePrice(sortedData[sortedData.length - 1].CLOSE);
  let currentValue = 0;
  
  for (const pos of positions) {
    currentValue += pos.shares * lastClose;
  }

  const totalValue = totalRealized + currentValue;
  const totalProfit = totalValue - totalInvested;
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  /**
   * RETURN RESULTS
   */
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

export default runBacktest;
