import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Permission from '../models/permissionModel.js';
import UserPermission from '../models/userPermissionModel.js';
import generateToken from '../utils/generateToken.js';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });

  // Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    // Get user permissions - ENHANCED to always fetch data for admin
    const permissions = await user.getDetailedPermissions();
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      permissions: permissions.map(p => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        route: p.route,
        granted: p.granted,
        isAdminOverride: p.isAdminOverride || false,
        grantedAt: p.grantedAt,
        grantedBy: p.grantedBy
      })),
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    // Get user permissions - ENHANCED to always fetch data
    const permissions = await user.getDetailedPermissions();
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      permissions: permissions.map(p => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        route: p.route,
        granted: p.granted,
        isAdminOverride: p.isAdminOverride || false,
        grantedAt: p.grantedAt,
        grantedBy: p.grantedBy
      })),
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Get user permissions - ENHANCED to always fetch data
    const permissions = await user.getDetailedPermissions();
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      permissions: permissions.map(p => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        route: p.route,
        granted: p.granted,
        isAdminOverride: p.isAdminOverride || false,
        grantedAt: p.grantedAt,
        grantedBy: p.grantedBy
      })),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    // Only update password if provided
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    
    // Get user permissions - ENHANCED to always fetch data
    const permissions = await updatedUser.getDetailedPermissions();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      permissions: permissions.map(p => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        route: p.route,
        granted: p.granted,
        isAdminOverride: p.isAdminOverride || false,
        grantedAt: p.grantedAt,
        grantedBy: p.grantedBy
      })),
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users - ENHANCED with admin override data fetching
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  // Admin override ensures this endpoint is accessible
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  
  // Enhance user data with permission counts
  const usersWithPermissions = await Promise.all(
    users.map(async (user) => {
      const permissions = await user.getPermissions();
      return {
        ...user.toObject(),
        permissionCount: permissions.length,
        isAdmin: user.role === 'admin'
      };
    })
  );
  
  res.json(usersWithPermissions);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Prevent deletion of admin users by non-admin users
    if (user.role === 'admin' && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Cannot delete admin user');
    }

    // Also delete user permissions
    await UserPermission.deleteMany({ userId: user._id });
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user by ID - ENHANCED with admin override data fetching
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    // Get user permissions - ENHANCED to always fetch data
    const permissions = await user.getDetailedPermissions();
    
    res.json({
      ...user.toObject(),
      permissions: permissions.map(p => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        route: p.route,
        granted: p.granted,
        isAdminOverride: p.isAdminOverride || false,
        grantedAt: p.grantedAt,
        grantedBy: p.grantedBy
      })),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Grant permission to user
// @route   POST /api/users/:id/permissions
// @access  Private/Admin
export const grantPermission = asyncHandler(async (req, res) => {
  const { permissionId } = req.body;
  const userId = req.params.id;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Cannot modify admin permissions
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot modify permissions for admin users');
  }

  // Check if permission exists
  const permission = await Permission.findById(permissionId);
  if (!permission) {
    res.status(404);
    throw new Error('Permission not found');
  }

  // Check if permission already granted
  const existingPermission = await UserPermission.findOne({
    userId,
    permissionId,
  });

  if (existingPermission) {
    existingPermission.granted = true;
    existingPermission.grantedBy = req.user._id;
    existingPermission.grantedAt = new Date();
    existingPermission.revokedAt = null;
    await existingPermission.save();
  } else {
    await UserPermission.create({
      userId,
      permissionId,
      granted: true,
      grantedBy: req.user._id,
    });
  }

  res.json({ message: 'Permission granted successfully' });
});

// @desc    Revoke permission from user
// @route   DELETE /api/users/:id/permissions/:permissionId
// @access  Private/Admin
export const revokePermission = asyncHandler(async (req, res) => {
  const { id: userId, permissionId } = req.params;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Cannot modify admin permissions
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot modify permissions for admin users');
  }

  const userPermission = await UserPermission.findOne({
    userId,
    permissionId,
  });

  if (userPermission) {
    userPermission.granted = false;
    userPermission.revokedAt = new Date();
    await userPermission.save();
    res.json({ message: 'Permission revoked successfully' });
  } else {
    res.status(404);
    throw new Error('Permission not found for this user');
  }
});

// @desc    Get user permissions - ENHANCED with admin override data fetching
// @route   GET /api/users/:id/permissions
// @access  Private/Admin
export const getUserPermissions = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Use the enhanced permission controller method
  const permissionController = await import('./permissionController.js');
  req.params = { userId };
  return permissionController.getUserPermissions(req, res);
});