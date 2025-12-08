# CORRECTED ALGORITHM - Cascading 5% Strategy

## Date: 2025-12-06

## Status: ✅ FIXED

---

## ❌ **What Was WRONG Before:**

The algorithm was tracking ALL historical buy levels forever, which caused:

- Buying at levels that weren't triggered by actual transactions
- Multiple buys on the same day at unrelated prices
- Not following the cascading 5% logic

---

## ✅ **CORRECT Logic Now:**

### **Rule: Only track levels from CURRENT positions and RECENT sells**

---

## 📊 **Step-by-Step Example:**

### **Day 1: Initial Buy**

- **Action:** Buy at ₹100
- **Current Positions:** [₹100]
- **Pending Buy Levels:** {} (empty)
- **Possible Actions:**
  - Buy at ₹95 (5% below ₹100 position)
  - Sell at ₹105 (5% above ₹100 position)

---

### **Day 2: Price Drops - Scenario A**

- **LOW = ₹95**
- **Action:** Buy at ₹95 (triggered by ₹100 position)
- **Current Positions:** [₹100, ₹95]
- **Pending Buy Levels:** {} (empty)
- **Possible Actions:**
  - Sell ₹100 at ₹105 (5% above ₹100)
  - Buy at ₹95 (already have this)
  - Sell ₹95 at ₹99.75 (5% above ₹95)
  - Buy at ₹90.25 (5% below ₹95)

---

### **Day 3: Price Rises - Sell ₹100 Position**

- **HIGH = ₹105**
- **Actions:**
  - Sell ₹100 position at ₹105 ✓
  - Sell ₹95 position at ₹99.75 ✓
- **Current Positions:** [] (empty)
- **Pending Buy Levels:** {₹99.75} (5% below ₹105 sell)
- **Possible Actions:**
  - Buy at ₹99.75 (from the ₹105 sell)
  - Buy at ₹94.76 (from the ₹99.75 sell)

---

### **Day 4: Price Drops Again**

- **LOW = ₹99.75**
- **Action:** Buy at ₹99.75 (from pending level)
- **Current Positions:** [₹99.75]
- **Pending Buy Levels:** {} (₹99.75 removed after buying)
- **Possible Actions:**
  - Sell ₹99.75 at ₹104.74 (5% above ₹99.75)
  - Buy at ₹94.76 (5% below ₹99.75)

---

## 🔑 **Key Differences:**

### **OLD (WRONG):**

```
Buy at ₹100 → Track ₹100 forever
Sell at ₹105 → Track ₹105 forever
Buy at ₹95 → Track ₹95 forever

Result: Keeps checking ₹100, ₹105, ₹95 forever
        Multiple unrelated buys on same day
```

### **NEW (CORRECT):**

```
Buy at ₹100 → Can buy at ₹95 OR sell at ₹105
Sell at ₹105 → Remove ₹100, add ₹99.75 as pending buy
Buy at ₹99.75 → Remove ₹99.75 from pending, can now buy at ₹94.76

Result: Only tracks current positions + one-time buy levels from sells
        Clean cascading 5% strategy
```

---

## 💡 **How It Works:**

### **1. Selling:**

```typescript
// When we sell a position at ₹105
- Remove position from holdings
- Add ₹99.75 (105 × 0.95) to pending buy levels
- This is a ONE-TIME buy opportunity
```

### **2. Buying from Current Positions:**

```typescript
// For each position we currently hold
- Check if LOW ≤ position price × 0.95
- If yes, buy at that price
- This creates a new position that can cascade further down
```

### **3. Buying from Pending Levels:**

```typescript
// For each pending buy level (from recent sells)
- Check if LOW ≤ that level
- If yes, buy at that level
- REMOVE that level (it's been used)
```

---

## 📈 **Example with Real Numbers:**

### **Timeline:**

| Day | Event        | Positions          | Pending Levels     | Action                |
| --- | ------------ | ------------------ | ------------------ | --------------------- |
| 1   | OPEN=₹1000   | [₹1000]            | {}                 | Initial buy           |
| 2   | LOW=₹950     | [₹1000, ₹950]      | {}                 | Buy ₹950 (from ₹1000) |
| 3   | HIGH=₹1050   | [₹950]             | {₹997.50}          | Sell ₹1000 at ₹1050   |
| 4   | HIGH=₹997.50 | []                 | {₹997.50, ₹947.63} | Sell ₹950 at ₹997.50  |
| 5   | LOW=₹997.50  | [₹997.50]          | {₹947.63}          | Buy at ₹997.50        |
| 6   | LOW=₹947.63  | [₹997.50, ₹947.63] | {}                 | Buy at ₹947.63        |

**Notice:** Only 1-2 buys per day, all connected by the 5% cascade!

---

## ✅ **Benefits of Corrected Logic:**

1. ✅ **Clean cascading** - Each action leads to next logical step
2. ✅ **No random buys** - All buys are triggered by current positions or recent sells
3. ✅ **Predictable** - Easy to understand what will happen next
4. ✅ **Efficient** - Doesn't track unnecessary historical levels

---

## 🎯 **Expected Results:**

With the corrected algorithm, you should see:

- ✅ Fewer trades per day (usually 1-2, not 3+)
- ✅ Clear 5% steps between consecutive buys
- ✅ Logical flow: buy → sell → buy lower → sell higher
- ✅ No mysterious buys at unrelated price levels

---

## ✅ **STATUS: READY TO TEST**

Upload your CSV again and you should see a much cleaner trading pattern that follows the cascading 5% logic correctly! 🚀
