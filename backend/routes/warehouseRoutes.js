import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getWarehouses,
  createWarehouse,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
} from '../controllers/warehouseController.js';

const router = express.Router();

router.route('/')
  .get(protect, getWarehouses)
  .post(protect, createWarehouse);

router.route('/:id')
  .get(protect, getWarehouseById)
  .put(protect, updateWarehouse)
  .delete(protect, deleteWarehouse);

export default router;