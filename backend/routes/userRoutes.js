import express from 'express';
import {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
} from '../controllers/userController.js';
import { protect, admin, checkPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', authUser);
router.post('/register', registerUser);

// Protected routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Admin routes
router.route('/')
  .get(protect, checkPermission('users.read'), getUsers);

router.route('/:id')
  .get(protect, checkPermission('users.read'), getUserById)
  .put(protect, checkPermission('users.update'), updateUser)
  .delete(protect, checkPermission('users.delete'), deleteUser);

export default router;