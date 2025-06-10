import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'manager', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get user permissions - ENHANCED with proper admin override data fetching
userSchema.methods.getPermissions = async function () {
  const Permission = mongoose.model('Permission');
  
  // Admin users get all permissions automatically - FETCH ALL DATA
  if (this.role === 'admin') {
    const allPermissions = await Permission.find({}).sort({ name: 1 });
    return allPermissions;
  }

  const UserPermission = mongoose.model('UserPermission');
  
  const userPermissions = await UserPermission.find({ 
    userId: this._id, 
    granted: true 
  }).populate('permissionId');
  
  return userPermissions
    .map(up => up.permissionId)
    .filter(p => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Check if user has specific permission - ENHANCED
userSchema.methods.hasPermission = async function (permissionName) {
  // Admin users have all permissions - ALWAYS TRUE
  if (this.role === 'admin') {
    return true;
  }

  const UserPermission = mongoose.model('UserPermission');
  const Permission = mongoose.model('Permission');
  
  const permission = await Permission.findOne({ name: permissionName });
  if (!permission) return false;
  
  const userPermission = await UserPermission.findOne({
    userId: this._id,
    permissionId: permission._id,
    granted: true
  });
  
  return !!userPermission;
};

// Check if user has permission for specific route - NEW METHOD
userSchema.methods.hasRoutePermission = async function (route) {
  // Admin users have all permissions - ALWAYS TRUE
  if (this.role === 'admin') {
    return true;
  }

  const Permission = mongoose.model('Permission');
  const permission = await Permission.findOne({ route });
  
  if (!permission) return false;
  
  return await this.hasPermission(permission.name);
};

// Get user permissions with detailed info - NEW METHOD
userSchema.methods.getDetailedPermissions = async function () {
  const Permission = mongoose.model('Permission');
  
  if (this.role === 'admin') {
    const allPermissions = await Permission.find({}).sort({ name: 1 });
    return allPermissions.map(permission => ({
      ...permission.toObject(),
      granted: true,
      isAdminOverride: true,
      grantedAt: this.createdAt
    }));
  }

  const UserPermission = mongoose.model('UserPermission');
  
  const userPermissions = await UserPermission.find({ 
    userId: this._id 
  }).populate('permissionId').populate('grantedBy', 'name email');
  
  return userPermissions
    .filter(up => up.permissionId !== null)
    .map(up => ({
      ...up.permissionId.toObject(),
      granted: up.granted,
      grantedBy: up.grantedBy,
      grantedAt: up.grantedAt,
      revokedAt: up.revokedAt,
      isAdminOverride: false
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;