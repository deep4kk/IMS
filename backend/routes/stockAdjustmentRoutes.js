import express from 'express';
import {
  createStockAdjustment,
  getStockAdjustments,
  getStockAdjustmentById,
  getStockAdjustmentStats
} from '../controllers/stockAdjustmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createStockAdjustment)
  .get(protect, getStockAdjustments);

router.route('/stats')
  .get(protect, getStockAdjustmentStats);

router.route('/:id')
  .get(protect, getStockAdjustmentById);

export default router;