import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// TODO: Add vendor mapping controller functions
router.route('/')
  .get(protect, (req, res) => res.json([]))
  .post(protect, (req, res) => res.status(201).json({}));

router.route('/:id')
  .get(protect, (req, res) => res.json({}))
  .put(protect, (req, res) => res.json({}))
  .delete(protect, (req, res) => res.json({ message: 'Vendor mapping removed' }));

export default router;