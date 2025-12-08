# Debug Analysis - Only 2 Trades

## Current Output:

```
Date          Type   Price    Shares   Amount        Profit
05-Dec-2025   BUY    ₹1.00    10000    ₹10000.00    -
19-Jun-2025   SELL   ₹1.05    10000    ₹10500.00    ₹500.00
```

## Why Only 2 Trades?

### Possible Reasons:

1. **CSV Data Issue:**

   - The price in your CSV might stay between ₹1.00 and ₹1.05 for the entire dataset
   - After selling at ₹1.05, the price never drops to trigger new buys

2. **What Should Trigger More Trades:**

   After selling at ₹1.05:

   - buyLevels = {₹1.00, ₹1.05}
   - For ₹1.00: Will buy if LOW ≤ ₹0.95 (1.00 × 0.95)
   - For ₹1.05: Will buy if LOW ≤ ₹0.9975 (1.05 × 0.95)

   **Question:** Does your CSV have any rows where LOW ≤ ₹0.9975?

3. **Date Order:**
   - Notice the dates are backwards: Dec-2025 → Jun-2025
   - This suggests the CSV might be sorted in reverse chronological order
   - The algorithm processes rows sequentially, so it's processing Dec first, then Jun

## What We Need:

**Please share 10-15 rows from your CSV file** so I can see:

1. The actual price ranges (OPEN, HIGH, LOW, CLOSE)
2. The date order
3. Whether prices ever drop below ₹0.9975 or rise above ₹1.05

## Example of what I need to see:

```csv
DATE,SERIES,OPEN,HIGH,LOW,PREV. CLOSE,LTP,CLOSE,VWAP,52W H,52W L,VOLUME,VALUE,NO. OF TRADES
05-Dec-2025,EQ,1.00,1.05,0.98,0.99,1.04,1.04,1.02,1.20,0.85,1000000,102000000,50000
04-Dec-2025,EQ,0.99,1.01,0.97,0.98,1.00,1.00,0.99,1.20,0.85,950000,94050000,48000
...
```

This will help me understand why the algorithm is only making 2 trades.
