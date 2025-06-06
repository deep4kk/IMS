import mongoose from 'mongoose';

const purchaseIndentSchema = new mongoose.Schema({
  indentId: {
    type: String,
    unique: true
  },
  items: [
    {
      sku: { type: mongoose.Schema.Types.ObjectId, ref: 'SKU', required: true },
      quantity: { type: Number, required: true },
      department: { type: String, required: true },
      // Vendor might be selected later in PO, or can be optional here
      vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }, // Assuming 'Supplier' model exists
    }
  ],
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'PO Pending', 'PO Created', 'Deleted'],
    default: 'Pending'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // removed redundant timestamps field, { timestamps: true } handles createdAt and updatedAt
}, { timestamps: true });

// Pre-save hook to generate indentId
purchaseIndentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastIndent = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let lastIndentIdNumber = 0;
    if (lastIndent && lastIndent.indentId) {
      const match = lastIndent.indentId.match(/IND-(\d+)/);
      if (match) {
        lastIndentIdNumber = parseInt(match[1], 10);
      }
    }
    const newIndentIdNumber = lastIndentIdNumber + 1;
    this.indentId = `IND-${String(newIndentIdNumber).padStart(3, '0')}`;
  }
  next();
});

export default mongoose.model('PurchaseIndent', purchaseIndentSchema);
