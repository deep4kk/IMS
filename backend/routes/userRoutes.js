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
  grantPermission,
  revokePermission,
  getUserPermissions,
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

// Admin routes - with proper permission checks that include admin override
router.route('/')
  .get(protect, checkPermission('users.read'), getUsers);

router.route('/:id')
  .get(protect, checkPermission('users.read'), getUserById)
  .put(protect, checkPermission('users.update'), updateUser)
  .delete(protect, checkPermission('users.delete'), deleteUser);

// Permission management routes
router.route('/:id/permissions')
  .get(protect, checkPermission('permissions.read'), getUserPermissions)
  .post(protect, checkPermission('permissions.manage'), grantPermission);

router.route('/:id/permissions/:permissionId')
  .delete(protect, checkPermission('permissions.manage'), revokePermission);

export default router;