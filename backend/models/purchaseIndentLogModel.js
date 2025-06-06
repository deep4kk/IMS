import mongoose from 'mongoose';

const purchaseIndentLogSchema = new mongoose.Schema({
  indent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PurchaseIndent', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  changes: [
    {
      field: { type: String, required: true },
      oldValue: { type: mongoose.Schema.Types.Mixed },
      newValue: { type: mongoose.Schema.Types.Mixed },
    }
  ],
}, { timestamps: true });

export default mongoose.model('PurchaseIndentLog', purchaseIndentLogSchema);