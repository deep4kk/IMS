import mongoose from 'mongoose';

const vendorMappingSchema = mongoose.Schema(
  {
    sku: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SKU',
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    vendorSku: {
      type: String,
      required: true,
    },
    vendorPrice: {
      type: Number,
      required: true,
    },
    minimumOrderQuantity: {
      type: Number,
      default: 1,
    },
    leadTime: {
      type: Number, // in days
      default: 7,
    },
    isPreferred: {
      type: Boolean,
      default: false,
    },
    lastPurchaseDate: {
      type: Date,
    },
    notes: {
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

// Compound index to ensure unique combinations of SKU and vendor
vendorMappingSchema.index({ sku: 1, vendor: 1 }, { unique: true });

const VendorMapping = mongoose.model('VendorMapping', vendorMappingSchema);

export default VendorMapping;