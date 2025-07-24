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
    productUrl: {
      type: String,
      default: '',
    },
    brand: {
      type: String,
      default: '',
    },
    weight: {
      type: Number,
      default: 0,
    },
    dimensions: {
      length: { type: Number, default: 0 },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    shippingClass: {
      type: String,
      enum: ['standard', 'express', 'fragile', 'hazardous'],
      default: 'standard',
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
    },
    subcategory: {
      type: String,
      default: '',
    },
    costPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    compareAtPrice: {
      type: Number,
      default: 0,
    },
    profitMargin: {
      type: Number,
      default: 0,
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
    reservedStock: {
      type: Number,
      default: 0,
    },
    minStockLevel: {
      type: Number,
      required: true,
      default: 0,
    },
    maxStockLevel: {
      type: Number,
      default: 0,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    additionalImages: [String],
    seoTitle: {
      type: String,
      default: '',
    },
    seoDescription: {
      type: String,
      default: '',
    },
    metaKeywords: [String],
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
    isDigital: {
      type: Boolean,
      default: false,
    },
    requiresShipping: {
      type: Boolean,
      default: true,
    },
    trackInventory: {
      type: Boolean,
      default: true,
    },
    allowBackorders: {
      type: Boolean,
      default: false,
    },
    taxable: {
      type: Boolean,
      default: true,
    },
    hsCode: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
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

// Calculate profit margin before saving
skuSchema.pre('save', function(next) {
  if (this.costPrice && this.sellingPrice) {
    this.profitMargin = ((this.sellingPrice - this.costPrice) / this.sellingPrice * 100).toFixed(2);
  }
  next();
});

const SKU = mongoose.model('SKU', skuSchema);

export default SKU;