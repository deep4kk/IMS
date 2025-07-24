import mongoose from 'mongoose';

const salesOrderItemSchema = new mongoose.Schema({
  sku: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SKU',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true
  }
});

const salesOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  expectedShipmentDate: {
    type: Date,
    required: false
  },
  deliveryMethod: {
    type: String,
    required: false
  },
  salesPerson: {
    type: String,
    required: false
  },
  dispatchDate: {
    type: Date,
    default: null
  },
  items: [salesOrderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'processing', 'pending_dispatch', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'draft'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partially_paid', 'refunded', 'failed'],
    default: 'pending'
  },
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'overnight', 'pickup'],
    default: 'standard'
  },
  trackingNumber: {
    type: String,
    default: ''
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  orderSource: {
    type: String,
    enum: ['website', 'mobile_app', 'marketplace', 'social_commerce', 'phone', 'in_store'],
    default: 'website'
  },
  dispatchStatus: {
    type: String,
    enum: ['pending', 'partial', 'completed'],
    default: 'pending'
  },
  customerNotes: {
    type: String,
    default: ''
  },
  internalNotes: {
    type: String,
    default: ''
  },
  dispatchedItems: [{
    sku: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SKU'
    },
    quantity: {
      type: Number,
      default: 0
    },
    dispatchedAt: {
      type: Date
    }
  }],
  allocatedStock: [{
    sku: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SKU'
    },
    quantity: {
      type: Number,
      default: 0
    }
  }],
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate order number
salesOrderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastOrder = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let lastOrderNumber = 0;
    if (lastOrder && lastOrder.orderNumber) {
      const match = lastOrder.orderNumber.match(/SO-(\d+)/);
      if (match) {
        lastOrderNumber = parseInt(match[1], 10);
      }
    }
    const newOrderNumber = lastOrderNumber + 1;
    this.orderNumber = `SO-${String(newOrderNumber).padStart(3, '0')}`;
  }
  next();
});

const SalesOrder = mongoose.model('SalesOrder', salesOrderSchema);
export default SalesOrder;