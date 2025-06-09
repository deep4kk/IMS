import express from 'express';
import {
  createPurchaseIndent,
  getPurchaseIndents,
  getPurchaseIndentById,
  updatePurchaseIndent,
  deletePurchaseIndent,
  submitForApproval,
  getVendorsForSku,
  getNextIndentId
} from '../controllers/purchaseIndentController.js';
import {
  getPendingIndentsForApproval,
  getApprovedIndents,
  approveIndent,
  rejectIndent,
  getApprovalHistory
} from '../controllers/purchaseIndentApprovalController.js';
import { protect, manager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createPurchaseIndent).get(protect, getPurchaseIndents);
router.route('/next-indent-id').get(protect, getNextIndentId);
router.route('/sku/:skuId/vendors').get(protect, getVendorsForSku);
router.route('/:id')
  .get(protect, getPurchaseIndentById)
  .put(protect, updatePurchaseIndent)
  .delete(protect, deletePurchaseIndent);
router.route('/:id/submit')
  .put(protect, submitForApproval);

// Approval routes
router.get('/approval/pending', protect, getPendingIndentsForApproval);
router.get('/approval/approved', protect, getApprovedIndents);
router.put('/approval/:id/approve', protect, approveIndent);
router.put('/approval/:id/reject', protect, rejectIndent);
router.get('/approval/:id/history', protect, getApprovalHistory);

export default router;