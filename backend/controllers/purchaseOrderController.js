
import asyncHandler from 'express-async-handler';
import PurchaseOrder from '../models/purchaseOrderModel.js';
import PurchaseIndent from '../models/purchaseIndentModel.js';
import SKU from '../models/skuModel.js';

// @desc    Create new purchase order
// @route   POST /api/purchase-orders
// @access  Private
export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const {
    indent,
    vendor,
    expectedDeliveryDate,
    paymentTerms,
    items,
    notes
  } = req.body;

  // Validate indent exists and is approved
  const purchaseIndent = await PurchaseIndent.findById(indent);
  if (!purchaseIndent) {
    res.status(404);
    throw new Error('Purchase indent not found');
  }

  if (purchaseIndent.status !== 'Approved') {
    res.status(400);
    throw new Error('Can only create PO from approved indents');
  }

  // Calculate totals
  let subtotal = 0;
  let totalTax = 0;

  for (let item of items) {
    const sku = await SKU.findById(item.sku);
    if (!sku) {
      res.status(404);
      throw new Error(`SKU ${item.sku} not found`);
    }

    item.totalAmount = (item.quantity * item.unitPrice) + item.tax;
    subtotal += item.quantity * item.unitPrice;
    totalTax += item.tax;
  }

  const totalAmount = subtotal + totalTax;

  // Generate PO number
  const lastPO = await PurchaseOrder.findOne().sort({ createdAt: -1 });
  let nextPoNumber = 'PO-0001';
  if (lastPO && lastPO.poNumber) {
    const lastNumber = parseInt(lastPO.poNumber.split('-')[1], 10);
    nextPoNumber = `PO-${(lastNumber + 1).toString().padStart(4, '0')}`;
  }

  const purchaseOrder = await PurchaseOrder.create({
    poNumber: nextPoNumber,
    indent,
    vendor,
    expectedDeliveryDate,
    paymentTerms,
    items,
    subtotal,
    totalTax,
    totalAmount,
    notes,
    createdBy: req.user._id
  });

  const populatedPO = await PurchaseOrder.findById(purchaseOrder._id)
    .populate('indent')
    .populate('vendor', 'name email')
    .populate('items.sku', 'name sku')
    .populate('createdBy', 'name email');

  res.status(201).json(populatedPO);
});

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private
export const getPurchaseOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const status = req.query.status;
  const vendor = req.query.vendor;

  let query = {};
  if (status) query.status = status;
  if (vendor) query.vendor = vendor;

  const skip = (page - 1) * limit;

  const purchaseOrders = await PurchaseOrder.find(query)
    .populate('vendor', 'name email')
    .populate('items.sku', 'name sku')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await PurchaseOrder.countDocuments(query);

  res.json({
    purchaseOrders,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalOrders: total
  });
});

// @desc    Get single purchase order
// @route   GET /api/purchase-orders/:id
// @access  Private
export const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const purchaseOrder = await PurchaseOrder.findById(req.params.id)
    .populate('indent')
    .populate('vendor')
    .populate('items.sku')
    .populate('createdBy', 'name email');

  if (!purchaseOrder) {
    res.status(404);
    throw new Error('Purchase order not found');
  }

  res.json(purchaseOrder);
});

// @desc    Update purchase order
// @route   PUT /api/purchase-orders/:id
// @access  Private
export const updatePurchaseOrder = asyncHandler(async (req, res) => {
  const purchaseOrder = await PurchaseOrder.findById(req.params.id);

  if (!purchaseOrder) {
    res.status(404);
    throw new Error('Purchase order not found');
  }

  if (purchaseOrder.status !== 'pending') {
    res.status(400);
    throw new Error('Cannot update confirmed purchase order');
  }

  const { expectedDeliveryDate, items, notes, status } = req.body;

  if (items) {
    // Recalculate totals
    let subtotal = 0;
    let totalTax = 0;

    for (let item of items) {
      const sku = await SKU.findById(item.sku);
      if (!sku) {
        res.status(404);
        throw new Error(`SKU ${item.sku} not found`);
      }

      item.totalAmount = (item.quantity * item.unitPrice) + item.tax;
      subtotal += item.quantity * item.unitPrice;
      totalTax += item.tax;
    }

    purchaseOrder.items = items;
    purchaseOrder.subtotal = subtotal;
    purchaseOrder.totalTax = totalTax;
    purchaseOrder.totalAmount = subtotal + totalTax;
  }

  if (expectedDeliveryDate) purchaseOrder.expectedDeliveryDate = expectedDeliveryDate;
  if (notes) purchaseOrder.notes = notes;
  if (status) purchaseOrder.status = status;

  const updatedPO = await purchaseOrder.save();
  const populatedPO = await PurchaseOrder.findById(updatedPO._id)
    .populate('vendor', 'name email')
    .populate('items.sku', 'name sku')
    .populate('createdBy', 'name email');

  res.json(populatedPO);
});

// @desc    Delete purchase order
// @route   DELETE /api/purchase-orders/:id
// @access  Private
export const deletePurchaseOrder = asyncHandler(async (req, res) => {
  const purchaseOrder = await PurchaseOrder.findById(req.params.id);

  if (!purchaseOrder) {
    res.status(404);
    throw new Error('Purchase order not found');
  }

  if (purchaseOrder.status !== 'pending') {
    res.status(400);
    throw new Error('Cannot delete confirmed purchase order');
  }

  await purchaseOrder.deleteOne();
  res.json({ message: 'Purchase order deleted successfully' });
});

// @desc    Get next PO number
// @route   GET /api/purchase-orders/next-po-number
// @access  Private
export const getNextPoNumber = asyncHandler(async (req, res) => {
  const lastPO = await PurchaseOrder.findOne().sort({ createdAt: -1 });
  let nextPoNumber = 'PO-0001';
  if (lastPO && lastPO.poNumber) {
    const lastNumber = parseInt(lastPO.poNumber.split('-')[1], 10);
    nextPoNumber = `PO-${(lastNumber + 1).toString().padStart(4, '0')}`;
  }
  res.json({ nextPoNumber });
});

// @desc    Get approved items for PO by vendor
// @route   GET /api/purchase-orders/approved-items/:vendorId
// @access  Private
export const getApprovedItemsForVendor = asyncHandler(async (req, res) => {
  const { vendorId } = req.params;
  
  const approvedIndents = await PurchaseIndent.find({ 
    status: 'Approved',
    'items.vendor': vendorId
  })
    .populate('items.sku', 'name sku')
    .populate('items.vendor', 'name');

  let approvedItems = [];
  
  approvedIndents.forEach(indent => {
    indent.items.forEach(item => {
      if (item.vendor && item.vendor._id.toString() === vendorId) {
        approvedItems.push({
          _id: item._id,
          sku: item.sku,
          quantity: item.quantity,
          indentId: indent.indentId,
          indentObjectId: indent._id
        });
      }
    });
  });

  res.json(approvedItems);
});
