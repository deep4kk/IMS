import asyncHandler from 'express-async-handler';
import PurchaseIndentApproval from '../models/purchaseIndentApprovalModel.js';
import PurchaseIndent from '../models/purchaseIndentModel.js';

// Get pending indents for approval
const getPendingIndentsForApproval = asyncHandler(async (req, res) => {
  const pendingIndents = await PurchaseIndentApproval.find({
    status: 'PO Pending'
  })
  .populate('indent', 'indentId items')
  .populate('approvedBy', 'name')
  .populate('items.sku', 'name skuCode');

  res.json(pendingIndents);
});

// Get approved indents
const getApprovedIndents = asyncHandler(async (req, res) => {
  const approvedIndents = await PurchaseIndentApproval.find({
    status: { $in: ['PO Created', 'Cancelled'] }
  })
  .populate('indent', 'indentId items')
  .populate('approvedBy', 'name')
  .populate('items.sku', 'name skuCode');

  res.json(approvedIndents);
});

export {
  getPendingIndentsForApproval,
  getApprovedIndents,
};
