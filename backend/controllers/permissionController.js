
import asyncHandler from 'express-async-handler';
import Permission from '../models/permissionModel.js';
import UserPermission from '../models/userPermissionModel.js';

// @desc    Get all permissions
// @route   GET /api/permissions
// @access  Private/Admin
export const getPermissions = asyncHandler(async (req, res) => {
  const permissions = await Permission.find({});
  res.json(permissions);
});

// @desc    Create permission
// @route   POST /api/permissions
// @access  Private/Admin
export const createPermission = asyncHandler(async (req, res) => {
  const { name, route, description } = req.body;

  const permissionExists = await Permission.findOne({ route });

  if (permissionExists) {
    res.status(400);
    throw new Error('Permission already exists');
  }

  const permission = await Permission.create({
    name,
    route,
    description,
  });

  res.status(201).json(permission);
});

// @desc    Update permission
// @route   PUT /api/permissions/:id
// @access  Private/Admin
export const updatePermission = asyncHandler(async (req, res) => {
  const permission = await Permission.findById(req.params.id);

  if (permission) {
    permission.name = req.body.name || permission.name;
    permission.route = req.body.route || permission.route;
    permission.description = req.body.description || permission.description;

    const updatedPermission = await permission.save();
    res.json(updatedPermission);
  } else {
    res.status(404);
    throw new Error('Permission not found');
  }
});

// @desc    Delete permission
// @route   DELETE /api/permissions/:id
// @access  Private/Admin
export const deletePermission = asyncHandler(async (req, res) => {
  const permission = await Permission.findById(req.params.id);

  if (permission) {
    await permission.deleteOne();
    res.json({ message: 'Permission removed' });
  } else {
    res.status(404);
    throw new Error('Permission not found');
  }
});

// @desc    Get user permissions
// @route   GET /api/permissions/user/:userId
// @access  Private/Admin
export const getUserPermissions = asyncHandler(async (req, res) => {
  const userPermissions = await UserPermission.findOne({ user: req.params.userId })
    .populate('permissions');

  if (userPermissions) {
    res.json(userPermissions.permissions);
  } else {
    res.json([]);
  }
});

// @desc    Update user permissions
// @route   PUT /api/permissions/user/:userId
// @access  Private/Admin
export const updateUserPermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;

  let userPermissions = await UserPermission.findOne({ user: req.params.userId });

  if (userPermissions) {
    userPermissions.permissions = permissions;
    await userPermissions.save();
  } else {
    userPermissions = await UserPermission.create({
      user: req.params.userId,
      permissions,
    });
  }

  const populatedPermissions = await UserPermission.findById(userPermissions._id)
    .populate('permissions');

  res.json(populatedPermissions.permissions);
});

// @desc    Check user permission for route
// @route   GET /api/permissions/check/:route
// @access  Private
export const checkUserPermission = asyncHandler(async (req, res) => {
  const { route } = req.params;
  const userId = req.user._id;

  // Admin users have access to everything
  if (req.user.role === 'admin') {
    return res.json({ hasPermission: true });
  }

  const userPermissions = await UserPermission.findOne({ user: userId })
    .populate('permissions');

  if (!userPermissions) {
    return res.json({ hasPermission: false });
  }

  const hasPermission = userPermissions.permissions.some(
    permission => permission.route === route
  );

  res.json({ hasPermission });
});
