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

export {
  createPurchaseIndent,
  getPurchaseIndents,
  getVendorsForSku,
  getNextIndentId,
};