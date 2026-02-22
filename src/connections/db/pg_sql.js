import { Pool } from "pg";
import { withRetry } from "../../utils/retry.util.js";

export const poolConnection = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'postgres',
  database: 'internal_wallet_service_db',
  port: 5432
})


export const connectDB = async () => {
  try {

    const client = await poolConnection.connect();
    console.log('[SUCCESS]: PostgreSQL connected successfully');
    client.release();

    poolConnection.on('error', (err) => {
      console.error('[ERROR]]: Unexpected DB error!', err)
    })
  } catch (error) {
    console.error('[ERROR]: Database connection failed:', error);
    process.exit(1);
  }
}



export const withTransaction = (operation) =>
  withRetry(async () => {
    const dbClient = await poolConnection.connect();

    try {
      await dbClient.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      const transactionResult = await operation(dbClient);

      await dbClient.query('COMMIT');
      return transactionResult;
    } catch (err) {
      await dbClient.query('ROLLBACK');
      throw err;
    } finally {
      dbClient.release();
    }
  })

