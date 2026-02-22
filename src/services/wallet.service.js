import { withTransaction } from "../connections/db/pg_sql.js";
import { poolConnection } from "../connections/db/pg_sql.js";

// feats: top-up, spend, bonus
// top-up brainstorming: (transactional + idempotent)
// spend : concurrency in check

async function topUpService({ userId, assetId, amount, referenceId }) {

  if (!amount || amount <= 0) {
    throw new Error('Amount must be positive');
  }

  // transaction + retry logic is handled in withTransaction function
  return withTransaction(async (db) => {

    // lock the wallet row
    const walletResult = await db.query(
      `SELECT * FROM wallets
         WHERE user_id = $1 AND asset_id = $2
         FOR UPDATE`,
      [userId, assetId]
    );

    if (walletResult.rowCount === 0) {
      throw new Error('Wallet not found')
    }

    const wallet = walletResult.rows[0]

    try {
      // inserting ledger entry (idempotency via unique reference_id)
      await db.query(
        `INSERT INTO ledger_entries
          (wallet_id, amount, transaction_type, reference_id)
          VALUES($1, $2, 'TOPUP', $3)`,
        [wallet.id, amount, referenceId]
      );
    } catch (error) {
      if (error.code === '23505') {
        return { success: true, message: 'Already processed (idempotent)' };
      }
      throw error;
    }

    // Update wallet balance
    await db.query(
      `UPDATE wallets
         SET balance = balance + $1
         WHERE id = $2`,
      [amount, wallet.id]
    );

    return {
      success: true
    };

  });

}


async function spendService({ userId, assetId, amount, referenceId }) {

  if (!amount || amount <= 0) {
    throw new Error('Amount must be positive');
  }

  return withTransaction(async (db) => {

    // Lock wallet row
    const walletResult = await db.query(
      `SELECT * FROM wallets
         WHERE user_id = $1 AND asset_id = $2
         FOR UPDATE`,
      [userId, assetId]
    );

    if (walletResult.rowCount === 0) {
      throw new Error('Wallet not found');
    }

    const wallet = walletResult.rows[0];

    // Check balance
    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    try {
      // Insert ledger entry
      await db.query(
        `INSERT INTO ledger_entries
           (wallet_id, amount, transaction_type, reference_id)
           VALUES ($1, $2, 'SPEND', $3)`,
        [wallet.id, -amount, referenceId]
      );
    } catch (error) {
      if (error.code === '23505') {
        return { success: true, message: 'Already processed (idempotent)' };
      }
      throw error;
    }

    // Update balance
    await db.query(
      `UPDATE wallets
         SET balance = balance - $1
         WHERE id = $2`,
      [amount, wallet.id]
    );

    return { success: true };

  });
}


// assuming bonus 
async function bonusService({ userId, assetId, amount, referenceId }) {

  if (!amount || amount <= 0) {
    throw new Error('Amount must be positive');
  }

  return withTransaction(async (db) => {

    const walletResult = await db.query(
      `SELECT * FROM wallets
       WHERE user_id = $1 AND asset_id = $2
       FOR UPDATE`,
      [userId, assetId]
    );

    if (walletResult.rowCount === 0) {
      throw new Error('Wallet not found');
    }

    const wallet = walletResult.rows[0];

    try {
      await db.query(
        `INSERT INTO ledger_entries
         (wallet_id, amount, transaction_type, reference_id)
         VALUES ($1, $2, 'BONUS', $3)`,
        [wallet.id, amount, referenceId]
      );
    } catch (err) {
      if (err.code === '23505') {
        return { success: true, message: 'Already processed (idempotent)' };
      }
      throw err;
    }

    await db.query(
      `UPDATE wallets
       SET balance = balance + $1
       WHERE id = $2`,
      [amount, wallet.id]
    );

    return { success: true };
  });
}

async function getBalanceService(userId, assetId) {
  const result = await poolConnection.query(
    `SELECT balance FROM wallets
     WHERE user_id = $1 AND asset_id = $2`,
    [userId, assetId]
  );

  if (result.rowCount === 0) {
    throw new Error('Wallet not found');
  }

  console.log("[LOG]: Checking wallet for:", userId, assetId);

  return result.rows[0].balance;
}

export { topUpService, spendService, bonusService, getBalanceService }