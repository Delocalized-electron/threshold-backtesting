# Two Backtesting Engines - Quick Comparison

## 🔄 How to Switch

### **In `src/App.tsx` (lines 7-9):**

**Option 1: Multi-Position Engine (Current)**

```typescript
import { runBacktest } from "./utils/backtestEngine";
// import { runBacktestStack as runBacktest } from './utils/backtestEngineStack';
```

**Option 2: Stack-Based Engine**

```typescript
// import { runBacktest } from './utils/backtestEngine';
import { runBacktestStack as runBacktest } from "./utils/backtestEngineStack";
```

Just comment/uncomment the lines to switch!

---

## 📊 Quick Comparison

| Feature          | Multi-Position                | Stack (LIFO)               |
| ---------------- | ----------------------------- | -------------------------- |
| **Buy Trigger**  | 5% below ANY position         | 5% below TOP of stack only |
| **Sell Order**   | Any position that hits target | Top of stack first (LIFO)  |
| **Buys Per Day** | Multiple possible             | Maximum 1                  |
| **Complexity**   | More complex                  | Simpler                    |
| **Trades**       | More trades                   | Fewer trades               |
| **Best For**     | Volatile markets              | Trending markets           |

---

## 🎯 Example with Same Data

**Scenario:** Buy at ₹1000, price drops to ₹880

### **Multi-Position:**

```
Positions: [₹1000]
LOW = ₹880

Check ₹1000: Buy at ₹950 ✓
Positions: [₹1000, ₹950]

Check ₹950: Buy at ₹902.50 ✓
Positions: [₹1000, ₹950, ₹902.50]

Result: 2 buys on same day
```

### **Stack:**

```
Stack: [₹1000] ← top
LOW = ₹880

Check top (₹1000): Buy at ₹950 ✓
Stack: [₹1000, ₹950] ← top

Don't check ₹1000 again (only check top)

Result: 1 buy on same day
```

---

## ✅ Recommendations

### **Use Multi-Position If:**

- You want maximum trading opportunities
- Market is choppy/volatile
- You're okay with more complexity
- You want to build positions aggressively

### **Use Stack If:**

- You want simple, predictable behavior
- Market is trending
- You prefer fewer, cleaner trades
- You like LIFO selling order

---

## 🧪 Test Both!

Upload your CSV with each engine and compare:

- Number of trades
- Final profit/loss
- Trading pattern

Choose the one that works best for your data!
