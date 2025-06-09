import asyncHandler from 'express-async-handler';
import PurchaseIndent from '../models/purchaseIndentModel.js';
import VendorMapping from '../models/vendorMappingModel.js';
import SKU from '../models/skuModel.js';
import PurchaseIndentLog from '../models/purchaseIndentLogModel.js';

// @desc    Get next indent ID
// @route   GET /api/purchase-indents/next-indent-id
// @access  Private
const getNextIndentId = asyncHandler(async (req, res) => {
  const lastIndent = await PurchaseIndent.findOne().sort({ createdAt: -1 });
  let nextId = 'IND-0001';
  if (lastIndent && lastIndent.indentId) {
    const lastId = parseInt(lastIndent.indentId.split('-')[1], 10);
    nextId = `IND-${(lastId + 1).toString().padStart(4, '0')}`;
  }
  res.json({ nextIndentId: nextId });
});

// @desc    Create new purchase indent
// @route   POST /api/purchase-indents
// @access  Private
const createPurchaseIndent = asyncHandler(async (req, res) => {
  const { items, createdBy } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No indent items');
  }

  const lastIndent = await PurchaseIndent.findOne().sort({ createdAt: -1 });
  let nextId = 'IND-0001';
  if (lastIndent && lastIndent.indentId) {
    const lastId = parseInt(lastIndent.indentId.split('-')[1], 10);
    nextId = `IND-${(lastId + 1).toString().padStart(4, '0')}`;
  }

  const indent = new PurchaseIndent({
    indentId: nextId,
    items,
    status: 'Pending',
    createdBy,
  });

  const createdIndent = await indent.save();

  // Create a log entry
  await PurchaseIndentLog.create({
    indent: createdIndent._id,
    user: createdBy,
    action: 'Created',
    details: `Indent ${createdIndent.indentId} created.`,
  });


  res.status(201).json(createdIndent);
});

// @desc    Get all purchase indents
// @route   GET /api/purchase-indents
// @access  Private
const getPurchaseIndents = asyncHandler(async (req, res) => {
  const indents = await PurchaseIndent.find({}).populate('createdBy', 'name');
  res.json(indents);
});

// @desc    Get vendors for a specific SKU
// @route   GET /api/purchase-indents/sku/:skuId/vendors
// @access  Private
const getVendorsForSku = asyncHandler(async (req, res) => {
  const { skuId } = req.params;
  const vendorMappings = await VendorMapping.find({ sku: skuId }).populate('vendor', 'name');

  if (vendorMappings) {
    const vendors = vendorMappings.map(mapping => ({
      _id: mapping.vendor._id,
      name: mapping.vendor.name,
    }));
    res.json(vendors);
  } else {
    res.status(404);
    throw new Error('No vendors found for this SKU');
  }
});

// @desc    Get single purchase indent
// @route   GET /api/purchase-indents/:id
// @access  Private
const getPurchaseIndentById = asyncHandler(async (req, res) => {
  const indent = await PurchaseIndent.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('items.sku', 'name sku');

  if (!indent) {
    res.status(404);
    throw new Error('Purchase indent not found');
  }

  res.json(indent);
});

// @desc    Update purchase indent
// @route   PUT /api/purchase-indents/:id
// @access  Private
const updatePurchaseIndent = asyncHandler(async (req, res) => {
  const indent = await PurchaseIndent.findById(req.params.id);

  if (!indent) {
    res.status(404);
    throw new Error('Purchase indent not found');
  }

  if (indent.status !== 'Pending') {
    res.status(400);
    throw new Error('Cannot update approved or deleted indent');
  }

  const { items } = req.body;

  if (items) {
    indent.items = items;
  }

  const updatedIndent = await indent.save();
  const populatedIndent = await PurchaseIndent.findById(updatedIndent._id)
    .populate('createdBy', 'name email')
    .populate('items.sku', 'name sku');

  res.json(populatedIndent);
});

// @desc    Delete purchase indent
// @route   DELETE /api/purchase-indents/:id
// @access  Private
const deletePurchaseIndent = asyncHandler(async (req, res) => {
  const indent = await PurchaseIndent.findById(req.params.id);

  if (!indent) {
    res.status(404);
    throw new Error('Purchase indent not found');
  }

  if (indent.status !== 'Pending') {
    res.status(400);
    throw new Error('Cannot delete approved or processed indent');
  }

  await indent.deleteOne();
  res.json({ message: 'Purchase indent deleted successfully' });
});

// @desc    Submit indent for approval
// @route   PUT /api/purchase-indents/:id/submit
// @access  Private
const submitForApproval = asyncHandler(async (req, res) => {
  const indent = await PurchaseIndent.findById(req.params.id);

  if (!indent) {
    res.status(404);
    throw new Error('Purchase indent not found');
  }

  if (indent.status !== 'Pending') {
    res.status(400);
    throw new Error('Indent is not in pending status');
  }

  indent.status = 'pending_approval';
  await indent.save();

  // Create log entry
  await PurchaseIndentLog.create({
    indent: indent._id,
    user: req.user._id,
    action: 'Submitted for Approval',
    details: `Indent ${indent.indentId} submitted for approval.`,
  });

  const populatedIndent = await PurchaseIndent.findById(indent._id)
    .populate('createdBy', 'name email')
    .populate('items.sku', 'name sku');

  res.json(populatedIndent);
});

export {
  createPurchaseIndent,
  getPurchaseIndents,
  getPurchaseIndentById,
  updatePurchaseIndent,
  deletePurchaseIndent,
  submitForApproval,
  getVendorsForSku,
  getNextIndentId,
};