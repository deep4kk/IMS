
import express from 'express';
const router = express.Router();
import {
  getSalesReport,
  getFinancialReport,
  getInventoryReport,
  getCustomerReport,
  getSupplierReport,
  getPurchaseReport,
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/sales').get(protect, getSalesReport);
router.route('/financial').get(protect, getFinancialReport);
router.route('/inventory').get(protect, getInventoryReport);
router.route('/customers').get(protect, getCustomerReport);
router.route('/suppliers').get(protect, getSupplierReport);
router.route('/purchase').get(protect, getPurchaseReport);

export default router;
