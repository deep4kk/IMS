import express from 'express';
import {
  createSalesOrder,
  getSalesOrders,
  getSalesOrderById,
  updateSalesOrder,
  deleteSalesOrder,
  getSalesOrderStats,
  exportOrderToPdf
} from '../controllers/salesOrderController.js';
import { dispatchOrder, getDispatchLogsByOrderId } from '../controllers/dispatchController.js';
import { protect, manager } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createSalesOrder)
  .get(protect, getSalesOrders);

router.route('/stats')
  .get(protect, getSalesOrderStats);

router.route('/export/pdf/:id').get(protect, exportOrderToPdf);

router.route('/:id')
  .get(protect, getSalesOrderById)
  .put(protect, updateSalesOrder)
  .delete(protect, manager, deleteSalesOrder);

router.route('/:id/dispatch')
  .put(protect, dispatchOrder);

router.route('/:id/dispatch-logs')
  .get(protect, getDispatchLogsByOrderId);

export default router;
