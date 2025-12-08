# Correct Grid Trading Algorithm - Final Implementation

## Date: 2025-12-06

## Status: ✅ CORRECTED

---

## 🎯 **CORRECT ALGORITHM**

### **Core Principle:**

- **Track ALL price levels forever** (both buy and sell prices)
- **Buy when LOW drops 5% below ANY tracked level**
- **Sell when HIGH reaches 5% above ANY held position**
- **Grid expands infinitely in both directions**

---

## 📊 **DETAILED WALKTHROUGH**

### **Starting Point:**

- **Day 1:** Buy at ₹100 (OPEN price from CSV)
- **buyLevels:** {₹100}
- **Held positions:** [₹100 lot]

---

### **Day 2: Price drops - LOW = ₹95**

**Buy Check:**

- For level ₹100: buyPrice = ₹100 × 0.95 = ₹95
- Is LOW(₹95) ≤ ₹95? **YES**
- **Action: BUY at ₹95**

**After Day 2:**

- **buyLevels:** {₹100, ₹95}
- **Held positions:** [₹100 lot, ₹95 lot]

---

### **Day 3: Price rises - HIGH = ₹105**

**Sell Check:**

- ₹100 lot: sellPrice = ₹100 × 1.05 = ₹105
  - Is HIGH(₹105) ≥ ₹105? **YES** → **SELL ₹100 lot at ₹105**
  - Add ₹105 to buyLevels
- ₹95 lot: sellPrice = ₹95 × 1.05 = ₹99.75
  - Is HIGH(₹105) ≥ ₹99.75? **YES** → **SELL ₹95 lot at ₹99.75**
  - Add ₹99.75 to buyLevels

**After Day 3:**

- **buyLevels:** {₹100, ₹95, ₹105, ₹99.75}
- **Held positions:** [] (sold everything)

---

### **Day 4: Price drops - LOW = ₹100**

**Buy Check:**

- For level ₹105: buyPrice = ₹105 × 0.95 = ₹99.75
  - Is LOW(₹100) ≤ ₹99.75? **NO**
- For level ₹100: buyPrice = ₹100 × 0.95 = ₹95
  - Is LOW(₹100) ≤ ₹95? **NO**
- For level ₹99.75: buyPrice = ₹99.75 × 0.95 = ₹94.76
  - Is LOW(₹100) ≤ ₹94.76? **NO**
- For level ₹95: buyPrice = ₹95 × 0.95 = ₹90.25
  - Is LOW(₹100) ≤ ₹90.25? **NO**

**After Day 4:**

- **buyLevels:** {₹100, ₹95, ₹105, ₹99.75}
- **Held positions:** [] (no buys triggered)

---

### **Day 5: Price drops more - LOW = ₹95**

**Buy Check:**

- For level ₹100: buyPrice = ₹100 × 0.95 = ₹95
  - Is LOW(₹95) ≤ ₹95? **YES** → **BUY at ₹95**
  - Add ₹95 to buyLevels (already exists)

**After Day 5:**

- **buyLevels:** {₹100, ₹95, ₹105, ₹99.75}
- **Held positions:** [₹95 lot]

---

### **Day 6: Price drops further - LOW = ₹90.25**

**Buy Check:**

- For level ₹95: buyPrice = ₹95 × 0.95 = ₹90.25
  - Is LOW(₹90.25) ≤ ₹90.25? **YES** → **BUY at ₹90.25**
  - Add ₹90.25 to buyLevels

**After Day 6:**

- **buyLevels:** {₹100, ₹95, ₹105, ₹99.75, ₹90.25}
- **Held positions:** [₹95 lot, ₹90.25 lot]

---

### **Day 7: Price rises - HIGH = ₹99.75**

**Sell Check:**

- ₹95 lot: sellPrice = ₹95 × 1.05 = ₹99.75
  - Is HIGH(₹99.75) ≥ ₹99.75? **YES** → **SELL ₹95 lot at ₹99.75**
  - Add ₹99.75 to buyLevels (already exists)
- ₹90.25 lot: sellPrice = ₹90.25 × 1.05 = ₹94.76
  - Is HIGH(₹99.75) ≥ ₹94.76? **YES** → **SELL ₹90.25 lot at ₹94.76**
  - Add ₹94.76 to buyLevels

**After Day 7:**

- **buyLevels:** {₹100, ₹95, ₹105, ₹99.75, ₹90.25, ₹94.76}
- **Held positions:** [] (sold everything)

---

## ✅ **KEY FEATURES**

### **1. Infinite Grid Expansion**

- Grid expands downward: ₹100 → ₹95 → ₹90.25 → ₹85.74 → ...
- Grid expands upward: ₹100 → ₹105 → ₹110.25 → ₹115.76 → ...
- ALL levels are tracked forever

### **2. Multiple Positions**

- Can hold positions at different price levels simultaneously
- Each position sells independently when its 5% target is reached

### **3. Re-buying**

- After selling, can buy again at the same price level
- Only one position per price level at a time

### **4. Continuous Trading**

- Trades continue throughout the entire CSV dataset
- No limit on number of trades

---

## 🔍 **CODE LOGIC**

### **After SELLING:**

```typescript
// Add the sell price to tracked levels
buyLevels.add(sellPrice);
```

**Example:** Sell at ₹105 → Add ₹105 to buyLevels → Future buy at ₹99.75 (5% below ₹105)

### **After BUYING:**

```typescript
// Add the buy price to tracked levels
buyLevels.add(buyPrice);
```

**Example:** Buy at ₹95 → Add ₹95 to buyLevels → Future buy at ₹90.25 (5% below ₹95)

### **Buy Trigger:**

```typescript
for (const level of buyLevels) {
  const buyPrice = level * (1 - THRESHOLD); // Calculate 5% below
  if (low <= buyPrice) {
    // BUY at buyPrice
  }
}
```

### **Sell Trigger:**

```typescript
for (const position of positions) {
  const sellPrice = position.buyPrice * (1 + THRESHOLD); // Calculate 5% above
  if (high >= sellPrice) {
    // SELL at sellPrice
  }
}
```

---

## 📈 **EXPECTED OUTPUT**

With your CSV data, you should now see:

- ✅ **Multiple different buy prices** (not just ₹1.00)
- ✅ **Multiple different sell prices** (not just ₹1.05)
- ✅ **Grid expanding** as price moves
- ✅ **Many more trades** throughout the dataset

---

## 🎯 **EXAMPLE WITH YOUR DATA**

If your CSV starts at ₹1.00:

| Day | Event         | Action                          | buyLevels                               |
| --- | ------------- | ------------------------------- | --------------------------------------- |
| 1   | OPEN = ₹1.00  | Buy at ₹1.00                    | {₹1.00}                                 |
| 2   | HIGH = ₹1.05  | Sell at ₹1.05                   | {₹1.00, ₹1.05}                          |
| 3   | LOW = ₹0.95   | Buy at ₹0.95 (5% below ₹1.00)   | {₹1.00, ₹1.05, ₹0.95}                   |
| 4   | HIGH = ₹1.00  | Sell ₹0.95 lot at ₹0.9975       | {₹1.00, ₹1.05, ₹0.95, ₹0.9975}          |
| 5   | LOW = ₹0.9975 | Buy at ₹0.9975 (5% below ₹1.05) | {₹1.00, ₹1.05, ₹0.95, ₹0.9975}          |
| 6   | LOW = ₹0.90   | Buy at ₹0.9025 (5% below ₹0.95) | {₹1.00, ₹1.05, ₹0.95, ₹0.9975, ₹0.9025} |

**You should see MANY different prices, not just ₹1.00 and ₹1.05!**

---

## ✅ **STATUS: READY TO TEST**

Upload your CSV file again and check the transaction history. You should now see a proper grid trading pattern with many different price levels!
