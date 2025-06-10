import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Permission from '../models/permissionModel.js';
import UserPermission from '../models/userPermissionModel.js';

// Protect routes - verify JWT token
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token and populate permissions
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }

      if (!req.user.isActive) {
        res.status(401);
        throw new Error('User account is deactivated');
      }

      // Get user permissions - FIXED: Always fetch data for admin override
      req.userPermissions = await req.user.getPermissions();

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Authorize manager role
export const manager = (req, res, next) => {
  if (req.user && (req.user.role === 'manager' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a manager');
  }
};

// Authorize admin role
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

// Check specific permission - ENHANCED with proper admin override
export const checkPermission = (permissionName) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    // Admin users have all permissions - ADMIN OVERRIDE with data fetching
    if (req.user.role === 'admin') {
      // Ensure admin gets all permission data
      if (!req.userPermissions || req.userPermissions.length === 0) {
        req.userPermissions = await Permission.find({});
      }
      return next();
    }

    // Check if user has the specific permission
    const hasPermission = await req.user.hasPermission(permissionName);
    
    if (!hasPermission) {
      res.status(403);
      throw new Error(`Access denied. Required permission: ${permissionName}`);
    }

    next();
  });
};

// Check multiple permissions (user needs ALL of them) - ENHANCED
export const checkPermissions = (permissionNames) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    // Admin users have all permissions - ADMIN OVERRIDE with data fetching
    if (req.user.role === 'admin') {
      // Ensure admin gets all permission data
      if (!req.userPermissions || req.userPermissions.length === 0) {
        req.userPermissions = await Permission.find({});
      }
      return next();
    }

    // Check if user has all required permissions
    for (const permissionName of permissionNames) {
      const hasPermission = await req.user.hasPermission(permissionName);
      if (!hasPermission) {
        res.status(403);
        throw new Error(`Access denied. Required permission: ${permissionName}`);
      }
    }

    next();
  });
};

// Check if user has any of the specified permissions - ENHANCED
export const checkAnyPermission = (permissionNames) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    // Admin users have all permissions - ADMIN OVERRIDE with data fetching
    if (req.user.role === 'admin') {
      // Ensure admin gets all permission data
      if (!req.userPermissions || req.userPermissions.length === 0) {
        req.userPermissions = await Permission.find({});
      }
      return next();
    }

    // Check if user has any of the required permissions
    let hasAnyPermission = false;
    for (const permissionName of permissionNames) {
      const hasPermission = await req.user.hasPermission(permissionName);
      if (hasPermission) {
        hasAnyPermission = true;
        break;
      }
    }

    if (!hasAnyPermission) {
      res.status(403);
      throw new Error(`Access denied. Required one of: ${permissionNames.join(', ')}`);
    }

    next();
  });
};

// Check permission by route - NEW FUNCTION for route-based permissions
export const checkRoutePermission = (route) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authenticated');
    }

    // Admin users have all permissions - ADMIN OVERRIDE with data fetching
    if (req.user.role === 'admin') {
      // Ensure admin gets all permission data
      if (!req.userPermissions || req.userPermissions.length === 0) {
        req.userPermissions = await Permission.find({});
      }
      return next();
    }

    // Find permission by route
    const permission = await Permission.findOne({ route });
    if (!permission) {
      res.status(403);
      throw new Error(`Route permission not found: ${route}`);
    }

    // Check if user has this route permission
    const hasPermission = await req.user.hasPermission(permission.name);
    
    if (!hasPermission) {
      res.status(403);
      throw new Error(`Access denied for route: ${route}`);
    }

    next();
  });
};