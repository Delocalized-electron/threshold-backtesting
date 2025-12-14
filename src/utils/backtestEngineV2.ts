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
  let sellHistory: number[] = [];       // Track ALL sell prices for future buy opportunities


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
    date: sortedData[0].DATE, // Fix: Add date
    buyDate: sortedData[0].DATE,
    threshold: THRESHOLD // Initial buy is always at standard threshold
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

    // ============================================================================
    // 🆕 ADDED: DIAGNOSTIC LOGGING
    // Shows buy/sell triggers and why conditions pass/fail
    // Remove or comment out after debugging
    // ============================================================================
    const refBuyPrice = reference * (1 - THRESHOLD);
    const shouldLog = i < 10 || i > sortedData.length - 10 || positions.length === 0; // First and last 10 days, or when no positions

    if (shouldLog) {
      console.log(`\n${date}: HIGH=${high.toFixed(2)}, LOW=${low.toFixed(2)}, CLOSE=${close.toFixed(2)}`);
      console.log(`  Reference=${reference.toFixed(2)}, BuyTrigger=${refBuyPrice.toFixed(2)}`);
      if (positions.length > 0) {
        console.log(`  SellTrigger=${(positions[0].buyPrice * 1.05).toFixed(2)}`);
      }
      console.log(`  BuyCondition: ${low.toFixed(2)} <= ${refBuyPrice.toFixed(2)} <= ${high.toFixed(2)} = ${low <= refBuyPrice && refBuyPrice <= high}`);
      console.log(`  Positions: ${positions.length}, Reference vs Close: ${((close/reference - 1) * 100).toFixed(1)}%`);
    }
    // ============================================================================


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

      // Check if price has risen 5% above last sell
      if (close > lastSellPrice * 1.05) {
        // Enter/continue recovery mode: use HIGH as reference
        if (close > reference) {
          // Update reference to today's HIGH
          const oldRef = reference;
          reference = high;
          console.log(`${date}: Recovery mode - CLOSE (${close.toFixed(2)}) > ref (${oldRef.toFixed(2)}). New reference = HIGH (${high.toFixed(2)})`);
        }
      }
    }

    // ============================================================================
    // 🆕 ADDED: FALLING STOCK ADJUSTMENT
    // If we have positions and stock has fallen 20% below reference,
    // adjust reference to current CLOSE to allow re-entry at lower levels
    // ============================================================================
    if (positions.length > 0 && close < reference * 0.80) {
      const oldRef = reference;
      reference = close;
      console.log(`${date}: ⚠️ FALLING STOCK DETECTED - Price fell 20%+ below reference.`);
      console.log(`  Old reference: ₹${oldRef.toFixed(2)} → New reference: ₹${reference.toFixed(2)}`);
      console.log(`  New buy trigger will be: ₹${(reference * 0.95).toFixed(2)}`);
    }
    // ============================================================================


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
        
        // Prevent selling on the same day it was bought
        if (pos.buyDate === date) {
           // If the lowest position was bought today, we can't sell it.
           // Since positions are sorted by price, checking the next one might be valid,
           // but usually we sell lowest price first. 
           // If we strictly follow FIFO/Lowest Price logic, we should stop here or check next.
           // If that candidate is "locked" because it was bought today, should we sell a higher priced one?
           // Usually NO, because we want to maximize profit/stick to the plan.
           // So we just skip selling for this loop iteration if the best candidate is locked.
           
           // However, let's see if we can sell OTHER positions.
           // We need to find the first position that is NOT bought today AND meets sell criteria.
           
           const sellablePosIndex = positions.findIndex(p => p.buyDate !== date);
           
           if (sellablePosIndex === -1) {
             // All positions were bought today, can't sell anything
             break; // Exit sell loop
           }
           
           // We found a position we can sell
           const sellablePos = positions[sellablePosIndex];
           // Use the position's specific threshold for sell target
           // If bought at 10% dip, sell at 10% profit. If 5%, sell at 5%.
           const sellThreshold = sellablePos.threshold || THRESHOLD;
           const sellPrice = sellablePos.buyPrice * (1 + sellThreshold);
           
           if (high >= sellPrice) {
              // SELL this position
              const sellAmount = sellablePos.shares * sellPrice;
              totalRealized += sellAmount; // Accumulate gross sales
              
              transactions.push({
                date: date,
                type: 'SELL',
                price: sellPrice,
                shares: sellablePos.shares,
                amount: sellAmount,
                boughtAt: sellablePos.buyPrice, // Changed from buyPrice to boughtAt for consistency
                buyDate: sellablePos.buyDate,
                profit: sellAmount - (sellablePos.shares * sellablePos.buyPrice),
                threshold: sellThreshold // Track threshold used for sell
              });
              
              // Remove this position
              positions.splice(sellablePosIndex, 1);
              
              // Update reference
              if (positions.length > 0) {
                // Actually, logic says reference should be the sell price we just executed
                reference = sellPrice;
              } else {
                // If no positions left, reference is the sell price
                reference = sellPrice;
                console.log(`${date}: After sell, no positions. Reference = ${reference.toFixed(2)}`);
              }
              
              // Track highest sell price today
              lastSellPriceToday = Math.max(lastSellPriceToday, sellPrice);
              
              // Track sell history
              sellHistory.push(sellPrice);
              if (sellHistory.length > 3) {
                sellHistory.shift();
              }
              
              actionTaken = true;
              continue;
           }
        } else {
            // Normal sell logic for position NOT bought today
            // Use the position's specific threshold for sell target
            const sellThreshold = pos.threshold || THRESHOLD;
            const sellPrice = pos.buyPrice * (1 + sellThreshold);
            
            if (high >= sellPrice) {
              // SELL this position
              const sellAmount = pos.shares * sellPrice;
              totalRealized += sellAmount; // Accumulate gross sales
              
              transactions.push({
                date: date,
                type: 'SELL',
                price: sellPrice,
                shares: pos.shares,
                amount: sellAmount,
                boughtAt: pos.buyPrice, // Changed from buyPrice to boughtAt for consistency
                buyDate: pos.buyDate,
                profit: sellAmount - (pos.shares * pos.buyPrice),
                threshold: sellThreshold // Track threshold used for sell
              });
              
              // Remove this position
              positions.shift(); // Remove first element
              
              // Update reference
              if (positions.length > 0) {
                reference = sellPrice;
              } else {
                reference = sellPrice;
                console.log(`${date}: After sell, no positions. Reference = ${reference.toFixed(2)}`);
              }
              
              lastSellPriceToday = Math.max(lastSellPriceToday, sellPrice);
              
              sellHistory.push(sellPrice);
              if (sellHistory.length > 3) {
                sellHistory.shift();
              }
              
              actionTaken = true;
              continue;
            }
        }
      }


      /**
       * STEP 2: CHECK FOR BUY TRIGGERS
       * 
       * Two sources of buy triggers:
       * 1. Reference-based: 5% below current reference (last action) - ALWAYS checked
       * 2. Sell history: 5% below ANY previous sell price - ONLY on first action of day
       * 
       * If we've already traded today, only use reference to avoid buying at similar prices
       */
      const potentialBuys: number[] = [];
      const hasTradestoday = buyPricesToday.size > 0 || lastSellPriceToday > 0;
      const MAX_POSITIONS = 5;

      // Determine dynamic threshold based on number of positions
      // 0-2 positions: 5% drop
      // 3 positions: 10% drop (for the 4th buy)
      // 4 positions: 20% drop (for the 5th buy)
      let currentThreshold = THRESHOLD; // Default 5%
      
      if (positions.length === 3) {
        currentThreshold = 0.10;
      } else if (positions.length >= 4) {
        currentThreshold = 0.20;
      }

      // Check if we have reached the maximum number of positions
      if (positions.length >= MAX_POSITIONS) {
        // Skip buy logic if we are at capacity
        // We still continue the loop to check for sells (which we already did in Step 1)
        // So we just break the loop if no action was taken in Step 1
        if (!actionTaken) break;
      } else {
        // 1. Check reference-based buy
        const refBuyPrice = reference * (1 - currentThreshold);
        
        // Check if reference buy price is reachable (LOW <= BuyPrice)
        if (low <= refBuyPrice) {
          // Check for GAP DOWN (Target > HIGH)
          if (refBuyPrice > high) {
            // GAP DOWN DETECTED
            // Buy at CLOSE price
            const executionPrice = parsePrice(row.CLOSE);
            console.log(`${date}: GAP DOWN! Target ${refBuyPrice.toFixed(2)} > High ${high.toFixed(2)}. Buying at CLOSE ${executionPrice.toFixed(2)}`);
            
            if (!lastSellPriceToday && !buyPricesToday.has(executionPrice)) {
               potentialBuys.push(executionPrice);
            }
          } else {
            // Normal Buy (Price reached target within range)
            if (!lastSellPriceToday && !buyPricesToday.has(refBuyPrice)) {
              // Check if we already have a position at this exact price
              if (!potentialBuys.some(p => Math.abs(p - refBuyPrice) < 0.01)) {
                 potentialBuys.push(refBuyPrice);
              }
            }
          }
        }
      }
      
      /* 
      // 2. Check sell history ONLY if no trades today yet
      // DISABLED: User requested to disable this to simplify logic and rely only on Reference.
      if (!hasTradestoday) {
        for (const sellPrice of sellHistory) {
          // Use the same dynamic threshold for sell history buys too
          const targetBuyPrice = sellPrice * (1 - currentThreshold);
          
          // Check if this buy price is reachable
          if (low <= targetBuyPrice) {
            // Check for GAP DOWN (Target > HIGH)
            let executionPrice = targetBuyPrice;
            
            if (targetBuyPrice > high) {
               // GAP DOWN for Sell History
               // Buy at CLOSE price
               executionPrice = parsePrice(row.CLOSE);
               console.log(`${date}: GAP DOWN (History)! Target ${targetBuyPrice.toFixed(2)} > High ${high.toFixed(2)}. Buying at CLOSE ${executionPrice.toFixed(2)}`);
            }
            
            // Prevent buy-sell loops: Don't buy on same day after selling everything
            // AND don't buy higher than we sold today
            if (lastSellPriceToday > 0) {
              if (executionPrice >= lastSellPriceToday) {
                continue;
              }
              
              // We sold everything today, don't buy again today
              // This prevents infinite cascading loops
              if (positions.length === 0) {
                continue;
              }
            }
            
            // IMPORTANT: Only buy LOWER than reference (we buy on dips, not rallies)
            if (executionPrice >= reference) {
              continue; // Skip this buy
            }
            
            // Check minimum gap from last buy (reference)
            // If we are in 10% mode, we should ensure the new buy is significantly lower than the last buy
            // We use currentThreshold - 1% as the minimum gap to allow for slight variations
            // e.g. if threshold is 10%, we want at least 9% gap from last buy
            const minGap = currentThreshold - 0.01;
            const gapFromLastBuy = Math.abs(reference - executionPrice) / reference;
            
            if (gapFromLastBuy >= minGap) {
              // Check if we haven't already added this price
              if (!potentialBuys.some(p => Math.abs(p - executionPrice) < 0.01)) {
                potentialBuys.push(executionPrice);
              }
            }
          }
        }
        
        // If we have multiple potential buys from sell history, only take the LOWEST
        // This prevents buying at very similar prices (e.g., ₹994.91 and ₹997.40)
        if (potentialBuys.length > 1) {
          potentialBuys.sort((a, b) => a - b);
          // Keep only the lowest one
          const lowest = potentialBuys[0];
          potentialBuys.length = 0;
          potentialBuys.push(lowest);
        }
      }
      */

      // Execute all potential buys (sorted lowest to highest)
      if (potentialBuys.length > 0) {
        potentialBuys.sort((a, b) => a - b);

        for (const buyPrice of potentialBuys) {
          // Check if we already have a position at this price
          const existingAtLevel = positions.find(p => 
            Math.abs(p.buyPrice - buyPrice) < 0.01
          );

          // Check if we already bought at this price today (even if we sold it)
          const boughtTodayAtLevel = buyPricesToday.has(buyPrice);

          if (!existingAtLevel && !boughtTodayAtLevel) {
            // BUY at this price
            const shares = Math.floor(LOT_SIZE / buyPrice);
            
            positions.push({
              buyPrice: buyPrice,
              shares: shares,
              date: date, // Fix: Add date property
              buyDate: date,
              threshold: currentThreshold // Track threshold
            });
            totalInvested += shares * buyPrice;
            
            transactions.push({
              date: date,
              type: 'BUY',
              price: buyPrice,
              shares: shares,
              amount: shares * buyPrice,
              threshold: currentThreshold // Track threshold
            });
            
            // Track that we bought at this price today
            buyPricesToday.add(buyPrice);
            
            // Update reference to the new buy price
            reference = buyPrice;
            
            console.log(`${date}: BOUGHT at ${buyPrice.toFixed(2)} (Threshold: ${(currentThreshold*100).toFixed(0)}%), new reference = ${reference.toFixed(2)}`);
            
            actionTaken = true; // We took an action, continue loop
          }
        }

        // If we executed any buys, continue the loop
        if (actionTaken) {
          continue;
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

  // Calculate Realized Profit Only (Sum of profits from SELL transactions)
  const realizedProfitOnly = transactions.reduce((sum, t) => sum + (t.profit || 0), 0);

  const totalValue = totalRealized + currentValue;
  
  // User requested to EXCLUDE unrealized profit/loss from total profit
  const totalProfit = realizedProfitOnly;
  
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // Calculate Annualized ROI based on user formula
  // (total_days/365)) = days_in_year (actually years elapsed)
  // avg_profit = profit_loss/days_in_year (annualized profit)
  // result = (avg_profit*100)/35000
  
  const startDate = new Date(sortedData[0].DATE);
  const endDate = new Date(sortedData[sortedData.length - 1].DATE);
  const timeDiff = Math.abs(endDate.getTime() - startDate.getTime());
  const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
  
  const yearsElapsed = totalDays / 365;
  const annualizedProfit = yearsElapsed > 0 ? totalProfit / yearsElapsed : 0;
  const annualizedROI = (annualizedProfit * 100) / 35000;

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
    currentPrice: lastClose,
    annualizedROI, // Add this to the return object
    startDate: sortedData[0].DATE,
    endDate: sortedData[sortedData.length - 1].DATE
  };
};


export default runBacktest;