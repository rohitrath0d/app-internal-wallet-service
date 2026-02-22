import { topUpService, spendService, bonusService, getBalanceService } from "../services/wallet.service.js";

async function topUp(req, res, next) {
  try {
    const { userId, assetId, amount, referenceId } = req.body;

    const result = await topUpService({
      userId,
      assetId,
      amount,
      referenceId,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function bonus(req, res, next) {
  try {
    const { userId, assetId, amount, referenceId } = req.body;

    const result = await bonusService({
      userId,
      assetId,
      amount,
      referenceId,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function spend(req, res, next) {
  try {
    const { userId, assetId, amount, referenceId } = req.body;

    const result = await spendService({
      userId,
      assetId,
      amount,
      referenceId,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getBalance(req, res, next) {
  try {
    const { userId, assetId } = req.params;

    const balance = await getBalanceService(userId, assetId);

    res.json({ balance });
  } catch (err) {
    next(err);
  }
}


export {topUp, bonus, spend, getBalance};