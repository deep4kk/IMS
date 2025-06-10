import asyncHandler from 'express-async-handler';
import Permission from '../models/permissionModel.js';

export const adminAccess = asyncHandler(async (req, res, next) => {
  try {
    // Check if user is authenticated and has admin role
    if (req.user && req.user.role === 'admin') {
      // ENHANCED: Fetch all permissions for admin override
      const allPermissions = await Permission.find({}).sort({ name: 1 });
      
      // Grant full access automatically with complete permission data
      req.user.permissions = ['*']; // Wildcard for all permissions
      req.userPermissions = allPermissions; // Full permission data
      req.isAdminOverride = true; // Flag for admin override
      
      console.log(`Admin Override: User ${req.user.email} granted full access with ${allPermissions.length} permissions`);
      return next();
    }
    next(); // Continue with normal permission checks
  } catch (error) {
    console.error('Admin Access Middleware Error:', error);
    next(error);
  }
});

// Enhanced admin check with data fetching
export const enhancedAdmin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    // Ensure admin has all permission data
    if (!req.userPermissions || req.userPermissions.length === 0) {
      const allPermissions = await Permission.find({}).sort({ name: 1 });
      req.userPermissions = allPermissions;
    }
    req.isAdminOverride = true;
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
});