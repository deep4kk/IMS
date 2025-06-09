
import asyncHandler from 'express-async-handler';
import PurchaseIndent from '../models/purchaseIndentModel.js';
import PurchaseIndentApproval from '../models/purchaseIndentApprovalModel.js';

// @desc    Get all pending indents for approval
// @route   GET /api/purchase-indents/approval/pending
// @access  Private
export const getPendingIndentsForApproval = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const pendingIndents = await PurchaseIndent.find({ 
    status: 'pending_approval' 
  })
    .populate('createdBy', 'name email')
    .populate('items.sku', 'name sku')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await PurchaseIndent.countDocuments({ status: 'pending_approval' });

  res.json({
    indents: pendingIndents,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalIndents: total
  });
});

// @desc    Get approved indents
// @route   GET /api/purchase-indents/approval/approved
// @access  Private
export const getApprovedIndents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const approvedIndents = await PurchaseIndent.find({
    status: { $in: ['approved', 'rejected'] }
  })
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .populate('items.sku', 'name sku')
    .sort({ approvedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await PurchaseIndent.countDocuments({ 
    status: { $in: ['approved', 'rejected'] }
  });

  res.json({
    indents: approvedIndents,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalIndents: total
  });
});

// @desc    Approve purchase indent
// @route   PUT /api/purchase-indents/approval/:id/approve
// @access  Private
export const approveIndent = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  
  const indent = await PurchaseIndent.findById(req.params.id);

  if (!indent) {
    res.status(404);
    throw new Error('Purchase indent not found');
  }

  if (indent.status !== 'pending_approval') {
    res.status(400);
    throw new Error('Indent is not in pending approval status');
  }

  // Update indent status
  indent.status = 'approved';
  indent.approvedBy = req.user._id;
  indent.approvedAt = new Date();
  if (remarks) indent.approvalRemarks = remarks;

  await indent.save();

  // Create approval record
  await PurchaseIndentApproval.create({
    indent: indent._id,
    approvedBy: req.user._id,
    action: 'approved',
    remarks: remarks || ''
  });

  const populatedIndent = await PurchaseIndent.findById(indent._id)
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .populate('items.sku', 'name sku');

  res.json(populatedIndent);
});

// @desc    Reject purchase indent
// @route   PUT /api/purchase-indents/approval/:id/reject
// @access  Private
export const rejectIndent = asyncHandler(async (req, res) => {
  const { remarks } = req.body;
  
  const indent = await PurchaseIndent.findById(req.params.id);

  if (!indent) {
    res.status(404);
    throw new Error('Purchase indent not found');
  }

  if (indent.status !== 'pending_approval') {
    res.status(400);
    throw new Error('Indent is not in pending approval status');
  }

  // Update indent status
  indent.status = 'rejected';
  indent.approvedBy = req.user._id;
  indent.approvedAt = new Date();
  if (remarks) indent.approvalRemarks = remarks;

  await indent.save();

  // Create approval record
  await PurchaseIndentApproval.create({
    indent: indent._id,
    approvedBy: req.user._id,
    action: 'rejected',
    remarks: remarks || ''
  });

  const populatedIndent = await PurchaseIndent.findById(indent._id)
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .populate('items.sku', 'name sku');

  res.json(populatedIndent);
});

// @desc    Get approval history for an indent
// @route   GET /api/purchase-indents/approval/:id/history
// @access  Private
export const getApprovalHistory = asyncHandler(async (req, res) => {
  const approvalHistory = await PurchaseIndentApproval.find({
    indent: req.params.id
  })
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 });

  res.json(approvalHistory);
});
