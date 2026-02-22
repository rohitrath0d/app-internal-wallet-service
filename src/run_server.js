import express from 'express';
import { connectDB } from "./connections/db/pg_sql.js";
import walletRoutes from './routes/wallet.routes.js'
import errorHandler from './middlewares/error.middleware.js';

const app = express();
app.use(express.json());

app.use('/wallet', walletRoutes);

await connectDB();

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.get('/', () => {
  res.json({
    message: "internal wallet service up and running",
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`[SUCCESS]: Server running on port ${PORT}`);
});