import express from 'express';
const router = express.Router();
import {topUp, spend, bonus, getBalance} from '../controllers/wallet.controller.js'

router.post('/topup', topUp);
router.post('/bonus', bonus);
router.post('/spend', spend);
router.get('/:userId/:assetId', getBalance);

export default router;