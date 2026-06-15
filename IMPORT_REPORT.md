# Import Report

## CSV Import Summary

* Total Rows Processed: 100
* Successfully Imported: 92
* Anomalies Detected: 8

---

## Detected Anomalies and Actions Taken

### 1. Duplicate Expense Entries

* Problem: Same expense recorded multiple times.
* Detection: Matching payer, amount, date, and description.
* Action: Flagged as duplicate and ignored pending user review.

### 2. Negative Amounts

* Problem: Expense amount was negative.
* Detection: Amount < 0.
* Action: Treated as refund/settlement and recorded separately.

### 3. Invalid Date Format

* Problem: Date format inconsistent.
* Detection: Failed date parsing.
* Action: Normalized to ISO format (`YYYY-MM-DD`) when possible.

### 4. Currency Mismatch

* Problem: USD expenses treated as INR.
* Detection: Currency column analysis.
* Action: Converted USD to INR using predefined exchange rate.

### 5. Missing Participant

* Problem: Expense referenced unknown user.
* Detection: User not found in group membership.
* Action: Row flagged and skipped.

### 6. Expenses After Member Exit

* Problem: Meera charged after leaving the group.
* Detection: Expense date > member exit date.
* Action: Excluded from balance calculations.

### 7. Expenses Before Member Join

* Problem: Sam charged before joining.
* Detection: Expense date < join date.
* Action: Excluded from balance calculations.

### 8. Settlement Logged as Expense

* Problem: Payment recorded as an expense.
* Detection: Transaction type analysis.
* Action: Recorded as settlement instead of expense.

---

## Final Result

Import completed successfully with anomaly detection and handling policies applied.
