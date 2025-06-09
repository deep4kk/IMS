
import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getUserPermissions,
  updateUserPermissions,
  checkUserPermission
} from '../controllers/permissionController.js';

const router = express.Router();

router.route('/')
  .get(protect, admin, getPermissions)
  .post(protect, admin, createPermission);

router.route('/:id')
  .put(protect, admin, updatePermission)
  .delete(protect, admin, deletePermission);

router.route('/user/:userId')
  .get(protect, admin, getUserPermissions)
  .put(protect, admin, updateUserPermissions);

router.route('/check/:route')
  .get(protect, checkUserPermission);

export default router;
