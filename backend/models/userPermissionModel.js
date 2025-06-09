
import mongoose from 'mongoose';

const userPermissionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permissions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Permission',
    }],
  },
  {
    timestamps: true,
  }
);

const UserPermission = mongoose.model('UserPermission', userPermissionSchema);

export default UserPermission;
