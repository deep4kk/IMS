import express from 'express';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getNextPoNumber,
  getApprovedItemsForVendor //Import the new function
} from '../controllers/purchaseOrderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createPurchaseOrder)
  .get(protect, getPurchaseOrders);

router.route('/next-po-number')
  .get(protect, getNextPoNumber);
router.route('/approved-items/:vendorId').get(protect, getApprovedItemsForVendor);

router.route('/:id')
  .get(protect, getPurchaseOrderById)
  .put(protect, updatePurchaseOrder)
  .delete(protect, deletePurchaseOrder);

export default router;