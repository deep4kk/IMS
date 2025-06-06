import express from 'express';
const router = express.Router();
import {
  createPurchaseIndent,
  getPurchaseIndents,
  getVendorsForSku,
  getNextIndentId,
} from '../controllers/purchaseIndentController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').post(protect, createPurchaseIndent).get(protect, getPurchaseIndents);
router.route('/next-indent-id').get(protect, getNextIndentId);
router.route('/sku/:skuId/vendors').get(protect, getVendorsForSku);

export default router;
