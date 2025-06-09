import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// TODO: Add dashboard controller functions
router.get('/', protect, (req, res) => res.json({
  totalSKUs: 0,
  activeInventoryValue: 0,
  lowStockItems: 0,
  pendingOrders: 0
}));

export default router;