# Internal Wallet Service

A production-grade virtual wallet system for high-traffic applications such as gaming platforms and loyalty rewards systems.

This project implements a robust internal wallet service that manages virtual credits (Gold Coins, Diamonds, Loyalty Points, etc.). While the currency is virtual and exists only within the application, data integrity is treated with **production financial-grade systems**.

---

## key architectural viewpoints
- No transaction is lost :- Full audit trail for every operation
- No negative balances :- Enforced at database and application layers
- No double spending :- Atomic transactions with row-level locking
- Safe duplicate handling :- Idempotent design via unique reference IDs
- Concurrent safety :- SERIALIZABLE isolation level prevents race conditions

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js (Express) |
| **Database** | PostgreSQL |
| **No ORM used** | Raw SQL (intentional for transaction control) |
| **Containerization** | Docker |

> **Why Raw SQL?** Tried to maintain explicit control over transactions, locking strategies, isolation levels, and error handling - essential for financial-grade operations.

---

## Architecture
The system follows a layered architecture:
```
Client
  ↓
Express Route Handler
  ↓
Controller Layer
  ↓
Service Layer (Business Logic)
  ↓
Transaction Wrapper
  ↓
PostgreSQL Database
  ├── Wallets (row-level locks)
  └── Ledger Entries (audit trail)
```
The service layer contains business logic.  
All state-changing operations are executed inside explicit database transactions.

---

## Schema Tables

### `users`
Stores application users.

### `assets`
Defines supported asset types (Gold Coins, Diamonds, Loyalty Points).

### `wallets`
Represents a wallet per user per asset.

**Constraints enforced:**
- One user wallet per asset
- One system wallet per asset per system account type
- USER wallets must have `user_id`
- SYSTEM wallets must not have `user_id`
- Balance cannot be negative (CHECK constraint)

### `ledger_entries`
Audit log of all credit/debit operations.

**Key Fields:**
- `transaction_type` :- TOPUP, BONUS, SPEND
- `reference_id` :- Unique identifier for idempotency
- `amount` :- Signed value (checked by constraints)
- `created_at` :- Timestamp for reconstruct-ability

**Constraints:**
- Unique `reference_id` for duplicate prevention
- CHECK constraints on amount signs per transaction type

---

## Design Decisions made in the process

### 1. Ledger-Based Architecture :

Instead of directly modifying balances without traceability, every operation::
1. **Inserts** a ledger entry
2. **Updates** the wallet balance
3. **Maintains** full auditability

**This ensures:**
- Full audit trail/ history
- Reconstructible balance from ledger
- Debuggability on failures
- Financial-style 

The balance column exists for performance but the ledger is the source of truth.

---

### 2. Concurrency Control :

Concurrency is handled at the **database level** using::
- Explicit transactions
- Row-level locking: `SELECT ... FOR UPDATE`
- SERIALIZABLE isolation level

When a wallet is accessed for modification:
```sql
BEGIN ISOLATION LEVEL SERIALIZABLE;
  SELECT * FROM wallets WHERE id = $1 FOR UPDATE;
  -- Business logic
COMMIT;
```
FOR UPDATE locks the wallet row until the transaction completes.  

This prevents race conditions such as:  
- Two concurrent spend requests both reading balance 100 and both spending 80.
- With row locking, one request waits until the other commits.

---

### 3. Race Condition Prevention :

Race conditions are prevented using:
- Row-level locks on wallets
- Atomic balance updates inside transactions
- Isolation level set to SERIALIZABLE  

Only one transaction can modify a wallet at a time.  

No external locking mechanism (Redis, mutex, etc.) was required because PostgreSQL provides strong ACID guarantees.

---

### 4. Idempotency :

Idempotency is implemented using a **unique `reference_id`** column in ledger_entries.

**Scenario:** If the same request is retried (e.g., webhook retry or network failure):
1. The insert fails with unique constraint violation (23505).
2. The service catches the error.
3. The operation is treated as already processed. 

This prevents duplicate credits or debits.

---

### 5. Deadlock Handling :

**Deadlocks are handled by:**
- Keeping transactions short
- Locking only required rows
- Always locking wallets in a consistent way
- Retrying on PostgreSQL error codes:
  - 40P01 (deadlock detected)
  - 40001 (serialization failure)  

A retry wrapper re-executes the transaction up to a limited number of times.

---

### 6. Transaction Scope :

Transactions are scoped per operation.  

Each operation follows:
```javascript
Opens connection (a helper function)
  ↓
BEGIN DATABASE TRANSACTION
  ↓
Execute service logic
  ↓
COMMIT or ROLLBACK
  ↓
Release connection
```
This ensures:
- No transaction leaks
- No connection leaks
- Clean retry boundaries

---

### 7. Schema-Level Integrity :

Data integrity **enforced at database layer** using:

| Constraint | Purpose |
|-----------|---------|
| CHECK constraints | Balance ≥ 0 |
| CHECK constraints | Transaction amount signs |
| Partial unique indexes | One user wallet per asset |
| Partial unique indexes | One system wallet per asset |
| Foreign keys | Referential integrity |

**Why this matters:** Invalid data cannot enter the system, even if application logic fails.

**This ensures :**  
- Invalid data cannot enter the system
- Business rules are enforced even if service logic fails
- Database is always consistent

The database acts as the final safety boundary.

---

### 8. How Webhooks Are Handled (Top-Up Flow) :

Top-up simulates an external payment system.  

### **The assumption is:**  
An external payment gateway confirms success and calls this service.

**Webhook safety is ensured via idempotency:**

```
Payment Provider sends reference_id
         ↓
Service inserts ledger entry with that reference_id
         ↓
Unique constraint prevents duplicate on retry
         ↓
Webhook safely retried without side effects
```
This mirrors real production webhook handling.

---

### 9. Retry Strategy :

All transactional operations are wrapped in a retry mechanism:
- If deadlock (40P01) → retry
- If serialization failure (40001) → retry
- Maximum retries limited

This ensures high reliability under concurrent load.

--- 

## How to Run
1. Start PostgreSQL using Docker.
2. Initialization scripts automatically create schema and seed data.
3. Start Node.js server.
4. Use REST endpoints to perform operations.

--- 

## Documentations reference :

- [PostgreSQL ISOLATION LEVELS](https://www.postgresql.org/docs/current/transaction-iso.html)
- [Row-Level Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [CHECK Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [ACID Properties](https://en.wikipedia.org/wiki/ACID)

---

## Notes :

This system prioritizes:
1. **Data integrity** over convenience
2. **Concurrency correctness** over simplicity
3. **Explicit transaction control** over abstraction
4. **Database-enforced constraints** over application-only validation

---