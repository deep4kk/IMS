import mongoose from 'mongoose';

const dispatchLogSchema = new mongoose.Schema(
  {
    salesOrder: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'SalesOrder',
    },
    dispatchedItems: [
      {
        sku: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'SKU',
        },
        name: { // Storing name for easier display in logs
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        stockBeforeDispatch: {
          type: Number,
          required: true,
        },
        stockAfterDispatch: {
          type: Number,
          required: true,
        },
        unitPrice: { // Optional: store unit price at time of dispatch
            type: Number,
            required: false
        }
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ['full', 'partially', 'pending'], // Added pending as a possible initial state if needed
      default: 'pending',
    },
    dispatchDate: {
      type: Date,
      default: Date.now,
    },
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    notes: {
        type: String,
        trim: true,
    }
  },
  {
    timestamps: true,
  }
);

const DispatchLog = mongoose.model('DispatchLog', dispatchLogSchema);

export default DispatchLog;
