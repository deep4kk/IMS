import asyncHandler from 'express-async-handler';
import SalesOrder from '../models/salesOrderModel.js';
import SKU from '../models/skuModel.js';
import Customer from '../models/customerModel.js';
import Transaction from '../models/transactionModel.js';
import PDFDocument from 'pdfkit';

// @desc    Create new sales order
// @route   POST /api/sales-orders
// @access  Private
export const createSalesOrder = asyncHandler(async (req, res) => {
  const {
    customer,
    orderDate,
    expectedDeliveryDate,
    deliveryMethod,
    salesPerson,
    items,
    notes,
    shippingAddress,
    billingAddress
  } = req.body;

  // Validate customer exists
  const customerExists = await Customer.findById(customer);
  if (!customerExists) {
    res.status(404);
    throw new Error('Customer not found');
  }

  // Validate items and calculate totals
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  for (let item of items) {
    const sku = await SKU.findById(item.sku);
    if (!sku) {
      res.status(404);
      throw new Error(`SKU ${item.sku} not found`);
    }

    // Check stock availability
    if (sku.currentStock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${sku.name}. Available: ${sku.currentStock}, Required: ${item.quantity}`);
    }

    item.totalAmount = (item.quantity * item.unitPrice) - item.discount + item.tax;
    subtotal += item.quantity * item.unitPrice;
    totalDiscount += item.discount;
    totalTax += item.tax;
  }

  const totalAmount = subtotal - totalDiscount + totalTax;

  // Generate SO number
  const lastSO = await SalesOrder.findOne().sort({ createdAt: -1 });
  let nextOrderNumber = 'SO-001';
  if (lastSO && lastSO.orderNumber) {
    const lastNumber = parseInt(lastSO.orderNumber.split('-')[1], 10);
    nextOrderNumber = `SO-${(lastNumber + 1).toString().padStart(3, '0')}`;
  }

  const orderData = {
    orderNumber: nextOrderNumber,
    customer,
    orderDate,
    expectedDeliveryDate,
    deliveryMethod,
    salesPerson,
    items,
    shippingAddress,
    billingAddress,
    subtotal,
    totalDiscount,
    totalTax,
    totalAmount,
    notes,
    createdBy: req.user._id
  };

  const salesOrder = await SalesOrder.create(orderData);

  const populatedOrder = await SalesOrder.findById(salesOrder._id)
    .populate('customer', 'name email phone')
    .populate('items.sku', 'name sku currentStock')
    .populate('createdBy', 'name email');

  res.status(201).json(populatedOrder);
});

// @desc    Get all sales orders
// @route   GET /api/sales-orders
// @access  Private
export const getSalesOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const status = req.query.status;
  const customer = req.query.customer;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  let query = {};

  if (status) query.status = status;
  if (customer) query.customer = customer;
  if (startDate || endDate) {
    query.orderDate = {};
    if (startDate) query.orderDate.$gte = new Date(startDate);
    if (endDate) query.orderDate.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const salesOrders = await SalesOrder.find(query)
    .populate('customer', 'name email phone')
    .populate('items.sku', 'name sku')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await SalesOrder.countDocuments(query);

  res.json({
    salesOrders,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalOrders: total
  });
});

// @desc    Get single sales order
// @route   GET /api/sales-orders/:id
// @access  Private
export const getSalesOrderById = asyncHandler(async (req, res) => {
  const salesOrder = await SalesOrder.findById(req.params.id)
    .populate('customer')
    .populate('items.sku')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email');

  if (!salesOrder) {
    res.status(404);
    throw new Error('Sales order not found');
  }

  res.json(salesOrder);
});

// @desc    Update sales order
// @route   PUT /api/sales-orders/:id
// @access  Private
export const updateSalesOrder = asyncHandler(async (req, res) => {
  const salesOrder = await SalesOrder.findById(req.params.id);

  if (!salesOrder) {
    res.status(404);
    throw new Error('Sales order not found');
  }

  // Only allow updates if order is in draft status
  if (salesOrder.status !== 'draft') {
    res.status(400);
    throw new Error('Cannot update confirmed sales order');
  }

  const { customer, expectedDeliveryDate, items, notes, status } = req.body;

  if (items) {
    // Recalculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    for (let item of items) {
      const sku = await SKU.findById(item.sku);
      if (!sku) {
        res.status(404);
        throw new Error(`SKU ${item.sku} not found`);
      }

      if (sku.currentStock < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for ${sku.name}`);
      }

      item.totalAmount = (item.quantity * item.unitPrice) - item.discount + item.tax;
      subtotal += item.quantity * item.unitPrice;
      totalDiscount += item.discount;
      totalTax += item.tax;
    }

    salesOrder.items = items;
    salesOrder.subtotal = subtotal;
    salesOrder.totalDiscount = totalDiscount;
    salesOrder.totalTax = totalTax;
    salesOrder.totalAmount = subtotal - totalDiscount + totalTax;
  }

  if (customer) salesOrder.customer = customer;
  if (expectedDeliveryDate) salesOrder.expectedDeliveryDate = expectedDeliveryDate;
  if (notes) salesOrder.notes = notes;

  // Handle status changes
  if (status && status !== salesOrder.status) {
    if (status === 'confirmed' && salesOrder.status === 'draft') {
      salesOrder.approvedBy = req.user._id;
      salesOrder.approvedAt = new Date();

      // Reserve stock for confirmed orders
      for (let item of salesOrder.items) {
        await SKU.findByIdAndUpdate(item.sku, {
          $inc: { reservedStock: item.quantity }
        });
      }
    }
    salesOrder.status = status;
  }

  const updatedOrder = await salesOrder.save();
  const populatedOrder = await SalesOrder.findById(updatedOrder._id)
    .populate('customer', 'name email phone')
    .populate('items.sku', 'name sku')
    .populate('createdBy', 'name email')
    .populate('approvedBy', 'name email');

  res.json(populatedOrder);
});

// @desc    Delete sales order
// @route   DELETE /api/sales-orders/:id
// @access  Private
export const deleteSalesOrder = asyncHandler(async (req, res) => {
  const salesOrder = await SalesOrder.findById(req.params.id);

  if (!salesOrder) {
    res.status(404);
    throw new Error('Sales order not found');
  }

  // Only allow deletion if order is in draft status
  if (salesOrder.status !== 'draft') {
    res.status(400);
    throw new Error('Cannot delete confirmed sales order');
  }

  await salesOrder.deleteOne();
  res.json({ message: 'Sales order deleted successfully' });
});

// @desc    Get sales order statistics
// @route   GET /api/sales-orders/stats
// @access  Private
export const getSalesOrderStats = asyncHandler(async (req, res) => {
  const stats = await SalesOrder.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  const totalOrders = await SalesOrder.countDocuments();
  const totalRevenue = await SalesOrder.aggregate([
    { $match: { status: { $in: ['delivered', 'shipped'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  res.json({
    statusBreakdown: stats,
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0
  });
});

// @desc    Export sales order to PDF
// @route   GET /api/sales-orders/export/pdf/:id
// @access  Private
export const exportOrderToPdf = asyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const salesOrder = await SalesOrder.findById(orderId)
    .populate('customer')
    .populate('items.sku', 'name sku');

  if (!salesOrder) {
    res.status(404);
    throw new Error('Sales Order not found');
  }

  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=SO_${salesOrder.orderNumber}.pdf`);

  doc.pipe(res);

  // Header
  doc.fontSize(20).text(`Sales Order: ${salesOrder.orderNumber}`, { align: 'center' });
  doc.moveDown();

  // Company and Customer Details
  doc.fontSize(12).text('Your Company Name', { align: 'left' })
     .text(`Date: ${new Date(salesOrder.orderDate).toLocaleDateString()}`, { align: 'right' });
  doc.text('123 Business Rd, Business City, 12345', { align: 'left' })
     .text(`Status: ${salesOrder.status}`, { align: 'right' });
  doc.moveDown(2);

  // Addresses
  const customer = salesOrder.customer;
  const currentY = doc.y;
  
  // Bill To Address - Left Side
  doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, currentY, { underline: true });
  doc.font('Helvetica').fontSize(10);
  doc.text(customer.name, 50, doc.y + 5);
  
  // Wrap billing address properly
  const billAddress = salesOrder.billingAddress || customer.billingAddress || {};
  if (billAddress.street) {
    doc.text(billAddress.street, 50, doc.y + 2, { width: 250, align: 'left' });
  }
  doc.text(`${billAddress.city || ''}, ${billAddress.state || ''} ${billAddress.pincode || ''}`, 50, doc.y + 2);
  if (billAddress.country) {
    doc.text(billAddress.country, 50, doc.y + 2);
  }

  // Ship To Address - Right Side
  doc.fontSize(12).font('Helvetica-Bold').text('Ship To:', 350, currentY, { underline: true });
  doc.font('Helvetica').fontSize(10);
  doc.text(customer.name, 350, currentY + 20);
  
  // Wrap shipping address properly
  const shipAddress = salesOrder.shippingAddress || customer.shippingAddress || {};
  if (shipAddress.street) {
    doc.text(shipAddress.street, 350, doc.y + 2, { width: 200, align: 'left' });
  }
  doc.text(`${shipAddress.city || ''}, ${shipAddress.state || ''} ${shipAddress.pincode || ''}`, 350, doc.y + 2);
  if (shipAddress.country) {
    doc.text(shipAddress.country, 350, doc.y + 2);
  }
  
  doc.y = Math.max(doc.y, currentY + 100); // Ensure consistent spacing
  doc.moveDown(2);

  // Items Table
  const tableTop = doc.y;
  const itemX = 50;
  const qtyX = 280;
  const priceX = 350;
  const totalX = 450;

  // Table Header
  doc.fontSize(11).font('Helvetica-Bold');
  doc.rect(50, tableTop, 500, 20).fill('#f0f0f0');
  doc.fillColor('black');
  doc.text('Item', itemX + 5, tableTop + 5)
     .text('Qty', qtyX + 5, tableTop + 5)
     .text('Unit Price', priceX + 5, tableTop + 5)
     .text('Total', totalX + 5, tableTop + 5);

  // Table Rows
  doc.font('Helvetica').fontSize(10);
  const items = salesOrder.items;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const y = tableTop + 25 + (i * 20);
    
    // Alternate row colors
    if (i % 2 === 1) {
      doc.rect(50, y - 2, 500, 20).fill('#f9f9f9');
      doc.fillColor('black');
    }
    
    doc.text(item.sku.name || 'N/A', itemX + 5, y, { width: 220 })
       .text(item.quantity.toString(), qtyX + 5, y)
       .text(`$${item.unitPrice.toFixed(2)}`, priceX + 5, y)
       .text(`$${item.totalAmount.toFixed(2)}`, totalX + 5, y);
  }
  
  const tableBottom = tableTop + 25 + (items.length * 20);
  doc.y = tableBottom + 10;

  // Totals
  const totalsY = doc.y;
  doc.fontSize(10).text(`Subtotal:`, 350, totalsY)
     .text(`$${salesOrder.subtotal.toFixed(2)}`, 450, totalsY, { align: 'right' });
  doc.text(`Discount:`, 350, doc.y)
     .text(`$${salesOrder.totalDiscount.toFixed(2)}`, 450, doc.y, { align: 'right' });
  doc.text(`Tax:`, 350, doc.y)
      .text(`$${salesOrder.totalTax.toFixed(2)}`, 450, doc.y, { align: 'right' });
  doc.fontSize(12).font('Helvetica-Bold').text(`Grand Total:`, 350, doc.y + 10)
      .text(`$${salesOrder.totalAmount.toFixed(2)}`, 450, doc.y, { align: 'right' });

  // Footer
  doc.fontSize(8).text('Thank you for your business!', 50, 750, { align: 'center', width: 500 });

  doc.end();
});