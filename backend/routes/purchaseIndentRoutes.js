import express from 'express';
import {
  createPurchaseIndent,
  getPurchaseIndents,
  getPurchaseIndentById,
  updatePurchaseIndent,
  deletePurchaseIndent,
  submitForApproval
} from '../controllers/purchaseIndentController.js';
import {
  getPendingIndentsForApproval,
  approveIndent,
  rejectIndent,
  getApprovalHistory
} from '../controllers/purchaseIndentApprovalController.js';
import { protect, manager } from '../middleware/authMiddleware.js';

router.route('/').post(protect, createPurchaseIndent).get(protect, getPurchaseIndents);
router.route('/next-indent-id').get(protect, getNextIndentId);
router.route('/sku/:skuId/vendors').get(protect, getVendorsForSku);
router.route('/:id/submit')
  .put(protect, submitForApproval);

// Approval routes
router.route('/approval/pending')
  .get(protect, manager, getPendingIndentsForApproval);

router.route('/approval/:id/approve')
  .put(protect, manager, approveIndent);

router.route('/approval/:id/reject')
  .put(protect, manager, rejectIndent);

router.route('/approval/:id/history')
  .get(protect, getApprovalHistory);

export default router;