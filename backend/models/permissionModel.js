
import mongoose from 'mongoose';

const permissionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    route: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Permission = mongoose.model('Permission', permissionSchema);

export default Permission;
