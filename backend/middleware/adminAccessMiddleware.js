import asyncHandler from 'express-async-handler';

export const adminAccess = asyncHandler(async (req, res, next) => {
  try {
    // Check if user is authenticated and has admin role
    if (req.user && req.user.role === 'admin') {
      // Grant full access automatically
      req.user.permissions = ['*']; // Wildcard for all permissions
      return next();
    }
    next(); // Continue with normal permission checks
  } catch (error) {
    next(error);
  }
});
