import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  customerCode: { // Auto-generated or manually entered unique code
    type: String,
    unique: true,
    // required: true, // Decide if this should be strictly required initially
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, trim: true, lowercase: true }, // sparse allows multiple nulls
  phone: { type: String, required: true, trim: true }, // Primary phone
  alternatePhone: { type: String, trim: true },
  
  companyName: { type: String, trim: true }, // If B2B
  contactPerson: { type: String, trim: true },
  contactPersonPhone: { type: String, trim: true },

  gstin: { type: String, trim: true },
  
  // Default address, can be used if billing/shipping are same or not specified
  address: addressSchema,
  
  billingAddress: addressSchema,
  shippingAddress: addressSchema,

  // Customer Type (e.g., Retail, Wholesale, Corporate) - can be enum
  customerType: { type: String },
  
  // Credit Limit, Payment Terms
  creditLimit: { type: Number, default: 0 },
  paymentTerms: { type: String }, // e.g., "Net 30", "Due on Receipt"

  isActive: { type: Boolean, default: true },
  notes: { type: String },
  
  // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

// Pre-save hook to auto-generate customerCode if not provided
customerSchema.pre('save', async function(next) {
  if (this.isNew && !this.customerCode) {
    // Simple auto-generation: CUST + timestamp/random. Needs improvement for production.
    // For a more robust solution, consider a counter model or a more sophisticated sequence.
    const lastCustomer = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextId = 1001;
    if (lastCustomer && lastCustomer.customerCode) {
      const lastIdNum = parseInt(lastCustomer.customerCode.replace(/\D/g, ''), 10);
      if (!isNaN(lastIdNum)) {
        nextId = lastIdNum + 1;
      }
    }
    this.customerCode = `CUST-${String(nextId).padStart(4, '0')}`;
  }
  // If billing address is not provided, use general address
  if (!this.billingAddress && this.address) {
      this.billingAddress = this.address;
  }
  // If shipping address is not provided, use general address
  if (!this.shippingAddress && this.address) {
      this.shippingAddress = this.address;
  }
  next();
});

export default mongoose.model('Customer', customerSchema);
