import express from 'express';
import {
  createSKU,
  getSKUs,
  getSKUById,
  updateSKU,
  deleteSKU,
  getLowStockSKUs,
  getSKUCategories,
} from '../controllers/skuController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.route('/')
  .post(protect, createSKU)
  .get(protect, getSKUs);

router.route('/low-stock')
  .get(protect, getLowStockSKUs);

router.route('/categories')
  .get(protect, getSKUCategories);

router.route('/:id')
  .get(protect, getSKUById)
  .put(protect, updateSKU)
  .delete(protect, deleteSKU);

export default router;