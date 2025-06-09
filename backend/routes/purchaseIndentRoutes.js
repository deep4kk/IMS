import express from 'express';
const router = express.Router();
import {
  createPurchaseIndent,
  getPurchaseIndents,
  getVendorsForSku,
  getNextIndentId,
} from '../controllers/purchaseIndentController.js';
import {
  getPendingIndentsForApproval,
  getApprovedIndents,
} from '../controllers/purchaseIndentApprovalController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').post(protect, createPurchaseIndent).get(protect, getPurchaseIndents);
router.route('/next-indent-id').get(protect, getNextIndentId);
router.route('/sku/:skuId/vendors').get(protect, getVendorsForSku);
router.route('/pending-for-approval').get(protect, getPendingIndentsForApproval);
router.route('/approved-indents').get(protect, getApprovedIndents);

export default router;
