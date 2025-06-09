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

// Get user permissions
userSchema.methods.getPermissions = async function () {
  const UserPermission = mongoose.model('UserPermission');
  const Permission = mongoose.model('Permission');
  
  const userPermissions = await UserPermission.find({ 
    userId: this._id, 
    granted: true 
  }).populate('permissionId');
  
  return userPermissions.map(up => up.permissionId);
};

// Check if user has specific permission
userSchema.methods.hasPermission = async function (permissionName) {
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