import mongoose from 'mongoose';

const skuSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    barcode: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
    },
    costPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    initialStock: {
      type: Number,
      required: true,
      default: 0,
    },
    currentStock: {
      type: Number,
      required: true,
      default: 0,
    },
    minStockLevel: {
      type: Number,
      required: true,
      default: 0,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    alternateSuppliers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
      }
    ],
    tags: [String],
    notes: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    location: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SKU = mongoose.model('SKU', skuSchema);

export default SKU;