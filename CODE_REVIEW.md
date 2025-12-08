# Code Review: Stock Backtesting Application

## Review Date: 2025-12-06

---

## ✅ **WHAT'S WORKING CORRECTLY**

### 1. **Project Structure** ✓

- All required files and components are present
- TypeScript interfaces match the specification
- Component organization is clean and modular

### 2. **CSV Upload & Validation** ✓

- File upload UI is implemented with proper styling
- CSV parsing using PapaParse is correct
- Validation for required columns (OPEN, HIGH, LOW) exists
- Error handling and loading states are implemented

### 3. **Initial Buy Logic** ✓

- First buy happens at OPEN price of first row ✓
- Buys ₹10,000 worth (LOT_SIZE = 10000) ✓
- Rounds down to whole shares using `Math.floor()` ✓
- Adds to positions and transactions correctly ✓

### 4. **UI Components** ✓

- Summary cards display all required metrics
- Transaction history table shows all columns
- Open positions table displays correctly
- Color coding and responsive design implemented
- Modern, clean interface with gradients

---

## ❌ **CRITICAL ISSUES FOUND**

### **Issue #1: INCORRECT BUY TRIGGER LOGIC** 🔴

**Location:** `backtestEngine.ts`, lines 71-104

**Problem:**
The current code checks if `low <= buyPrice` where `buyPrice = level * (1 - THRESHOLD)`. This is **WRONG**.

**Current Logic:**

```typescript
const buyPrice = level * (1 - THRESHOLD);  // This calculates 5% BELOW the level
if (low <= buyPrice) {  // Then checks if we can buy at that lower price
```

**What's Wrong:**

- The code is calculating the buy price as 5% below a level
- Then checking if LOW reaches that calculated price
- This means it's looking for a 5% drop from levels that are ALREADY 5% below something

**Correct Logic Should Be:**
According to the spec: "BUY Trigger: When LOW reaches 5% below any tracked buy level"

The buy levels should be the ACTUAL buy prices, and we should buy when LOW drops 5% below them.

**Example of the Bug:**

- First buy at ₹100 → adds ₹100 to buyLevels
- Current code: calculates buyPrice = 100 \* 0.95 = ₹95
- Then waits for LOW to reach ₹95
- This is correct for the first iteration

BUT:

- After selling at ₹105, code adds ₹105 and ₹99.75 to buyLevels
- For level ₹99.75: calculates buyPrice = 99.75 \* 0.95 = ₹94.76
- This is WRONG - we should buy when LOW reaches ₹99.75, not ₹94.76!

**Fix Required:**

```typescript
// WRONG (current):
for (const level of levelsToCheck) {
  const buyPrice = level * (1 - THRESHOLD);
  if (low <= buyPrice) {
    // buy at buyPrice
  }
}

// CORRECT:
for (const level of levelsToCheck) {
  if (low <= level) {
    // buy at level (which is already the target buy price)
  }
}
```

---

### **Issue #2: BUY LEVELS MANAGEMENT IS CONFUSING** 🟡

**Location:** `backtestEngine.ts`, lines 61-62, 90, 101

**Problem:**
The buyLevels Set is being used inconsistently:

- Sometimes it stores actual buy prices
- Sometimes it stores prices that need to be calculated from

**Current Behavior:**

```typescript
// After selling at ₹105:
buyLevels.add(sellPrice); // Adds ₹105
buyLevels.add(sellPrice * (1 - THRESHOLD)); // Adds ₹99.75

// After buying at ₹95:
buyLevels.add(buyPrice); // Adds ₹95
buyLevels.add(buyPrice * (1 - THRESHOLD)); // Adds ₹90.25
```

**What Should Happen:**
According to spec:

- After SELL: add the sell price AND 5% below it as NEW BUY LEVELS
- After BUY: add 5% below the buy price as a NEW BUY LEVEL

The buyLevels should contain the ACTUAL PRICES we want to buy at, not prices to calculate from.

**Fix Required:**
The logic needs to be restructured so buyLevels contains target buy prices, and we check if LOW reaches those prices directly.

---

### **Issue #3: VALIDATION MISSING CLOSE COLUMN** 🟡

**Location:** `App.tsx`, line 33

**Current Code:**

```typescript
if (!firstRow.OPEN || !firstRow.HIGH || !firstRow.LOW) {
  throw new Error("CSV must contain OPEN, HIGH, and LOW columns");
}
```

**Problem:**
The spec says required columns are: DATE, OPEN, HIGH, LOW, **CLOSE**

CLOSE is required because it's used to calculate current holdings value (line 108 of backtestEngine.ts).

**Fix Required:**

```typescript
if (!firstRow.OPEN || !firstRow.HIGH || !firstRow.LOW || !firstRow.CLOSE) {
  throw new Error("CSV must contain OPEN, HIGH, LOW, and CLOSE columns");
}
```

---

### **Issue #4: POTENTIAL DUPLICATE BUYS ON SAME DAY** 🟡

**Location:** `backtestEngine.ts`, lines 71-104

**Problem:**
If multiple buy levels are triggered on the same day (e.g., LOW = ₹90 triggers both ₹95 and ₹90.25 levels), the current code will execute multiple buys.

**Current Behavior:**

```typescript
for (const level of levelsToCheck) {
  const buyPrice = level * (1 - THRESHOLD);
  if (low <= buyPrice) {
    // This could execute multiple times in one iteration
  }
}
```

**Is This Correct?**
The spec says: "Can buy/sell at the same price level multiple times"

This seems to allow it, BUT the spec also says we're checking discrete levels. The current implementation might buy at multiple different levels on the same day, which could be intentional for a grid trading strategy.

**Recommendation:**
This might be correct behavior, but it should be verified with test data to ensure it matches expectations.

---

## 🔍 **LOGIC VERIFICATION**

### **Test Case 1: Basic Buy and Sell**

**Scenario:** Stock starts at ₹100, goes to ₹105, then ₹95

**Expected Behavior:**

1. Day 1: Buy at ₹100 (OPEN) → 100 shares for ₹10,000
2. Day 2: HIGH = ₹105 → Sell at ₹105 (5% above ₹100)
3. After sell: Add buy levels at ₹105 and ₹99.75 (5% below ₹105)
4. Day 3: LOW = ₹95 → Should buy at ₹99.75? NO! Should buy at ₹95 (5% below ₹100)

**Current Code Behavior:**
❌ Will NOT buy at ₹95 because:

- buyLevels has ₹100, ₹105, ₹99.75
- For ₹100: calculates buyPrice = ₹95, checks if LOW(95) <= 95 ✓ → BUYS at ₹95 ✓
- For ₹105: calculates buyPrice = ₹99.75, checks if LOW(95) <= 99.75 ✓ → BUYS at ₹99.75 ✓
- For ₹99.75: calculates buyPrice = ₹94.76, checks if LOW(95) <= 94.76 ✗ → No buy

**Result:** Actually works for this case, but for the wrong reasons!

---

### **Test Case 2: After Sell, Re-buy Trigger**

**Scenario:** Buy at ₹100, sell at ₹105, then LOW drops to ₹99.75

**Expected Behavior:**

- Should buy at ₹99.75 (which is 5% below the sell price of ₹105)

**Current Code Behavior:**

- buyLevels contains ₹105 and ₹99.75 (added after sell)
- For ₹99.75: calculates buyPrice = 99.75 \* 0.95 = ₹94.76
- Checks if LOW(99.75) <= 94.76 → NO
- ❌ **DOES NOT BUY** - This is WRONG!

**This confirms the bug in Issue #1**

---

## 📊 **SUMMARY**

### **Severity Levels:**

- 🔴 **Critical:** Must fix - breaks core functionality
- 🟡 **Important:** Should fix - may cause incorrect results
- 🟢 **Minor:** Nice to have - improves code quality

### **Issues to Fix:**

| Issue                           | Severity     | Impact                                           |
| ------------------------------- | ------------ | ------------------------------------------------ |
| #1: Incorrect buy trigger logic | 🔴 Critical  | Prevents re-buying after sells at correct prices |
| #2: Buy levels management       | 🟡 Important | Makes code confusing and error-prone             |
| #3: Missing CLOSE validation    | 🟡 Important | Could crash if CLOSE column missing              |
| #4: Multiple buys same day      | 🟢 Minor     | May be intentional, needs verification           |

---

## 🛠️ **RECOMMENDED FIXES**

### **Fix #1: Correct Buy Logic**

**File:** `src/utils/backtestEngine.ts`

**Replace lines 71-104 with:**

```typescript
// Check for BUY triggers - check all buy levels
const levelsToCheck = Array.from(buyLevels);
for (const targetBuyPrice of levelsToCheck) {
  // Check if LOW reached this buy level
  if (low <= targetBuyPrice) {
    // Check if we already have a position at this exact price level
    const existingAtLevel = positions.find(
      (p) => Math.abs(p.buyPrice - targetBuyPrice) < 0.01
    );

    if (!existingAtLevel) {
      const shares = Math.floor(LOT_SIZE / targetBuyPrice);
      positions.push({
        buyPrice: targetBuyPrice,
        shares: shares,
        buyDate: date,
      });
      totalInvested += shares * targetBuyPrice;

      transactions.push({
        date: date,
        type: "BUY",
        price: targetBuyPrice,
        shares: shares,
        amount: shares * targetBuyPrice,
      });

      // Add new buy level 5% below this buy
      const newBuyLevel = targetBuyPrice * (1 - THRESHOLD);
      buyLevels.add(newBuyLevel);
    }
  }
}
```

**Key Changes:**

- Renamed variable from `level` to `targetBuyPrice` for clarity
- Removed the calculation `buyPrice = level * (1 - THRESHOLD)`
- Check if `low <= targetBuyPrice` directly
- Only add ONE new buy level after buying (5% below the buy price)

---

### **Fix #2: Correct Sell Logic**

**File:** `src/utils/backtestEngine.ts`

**Lines 60-62 should be:**

```typescript
// Add new buy levels after selling
// 1. The sell price itself becomes a buy level
// 2. 5% below the sell price becomes a buy level
buyLevels.add(sellPrice);
const newBuyLevel = sellPrice * (1 - THRESHOLD);
buyLevels.add(newBuyLevel);
```

**This is actually correct in the current code!** ✓

---

### **Fix #3: Add CLOSE Validation**

**File:** `src/App.tsx`

**Replace line 33:**

```typescript
if (!firstRow.OPEN || !firstRow.HIGH || !firstRow.LOW || !firstRow.CLOSE) {
  throw new Error("CSV must contain OPEN, HIGH, LOW, and CLOSE columns");
}
```

---

## ✅ **WHAT TO TEST AFTER FIXES**

1. **Basic flow:** Upload CSV, verify first buy at OPEN
2. **Sell trigger:** Verify sells happen at exactly 5% above buy price
3. **Re-buy after sell:** Verify new buy levels are created and triggered
4. **Multiple positions:** Verify can hold multiple positions simultaneously
5. **Grid expansion:** Verify buy levels expand as price moves
6. **Final calculations:** Verify all metrics are calculated correctly

---

## 📝 **CONCLUSION**

The application has a **solid foundation** with good UI/UX and proper structure. However, there is a **critical bug in the buy trigger logic** (Issue #1) that prevents the strategy from working correctly after the initial trades.

**Priority:** Fix Issue #1 immediately, then Issues #2 and #3.

After fixes, the application should correctly implement the 5% threshold grid trading strategy as specified.
