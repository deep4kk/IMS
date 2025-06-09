import asyncHandler from 'express-async-handler';
import SKU from '../models/skuModel.js';

// @desc    Create a new SKU
// @route   POST /api/skus
// @access  Private
export const createSKU = asyncHandler(async (req, res) => {
  const {
    name,
    sku,
    barcode,
    description,
    category,
    costPrice,
    sellingPrice,
    initialStock,
    minStockLevel,
    imageUrl,
    warehouseId,
    supplierId,
    alternateSuppliers,
    tags,
    notes,
    location,
  } = req.body;

  // Check if SKU already exists
  const skuExists = await SKU.findOne({ sku });

  if (skuExists) {
    res.status(400);
    throw new Error('SKU code already exists');
  }

  // Create new SKU
  const newSKU = await SKU.create({
    name,
    sku,
    barcode,
    description,
    category,
    costPrice,
    sellingPrice,
    initialStock,
    currentStock: initialStock, // Initially set to initialStock
    minStockLevel,
    imageUrl,
    warehouseId,
    supplierId,
    alternateSuppliers: alternateSuppliers || [],
    tags: tags || [],
    notes,
    location,
    isActive: true,
    user: req.user._id,
  });

  if (newSKU) {
    res.status(201).json(newSKU);
  } else {
    res.status(400);
    throw new Error('Invalid SKU data');
  }
});

// @desc    Get all SKUs with filtering
// @route   GET /api/skus
// @access  Private
export const getSKUs = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.limit) || 10;
  const page = Number(req.query.page) || 1;
  
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { sku: { $regex: req.query.search, $options: 'i' } },
          { barcode: { $regex: req.query.search, $options: 'i' } },
        ],
      }
    : {};

  // Build filter object
  const filter = { ...keyword };
  
  // Add category filter if provided
  if (req.query.category && req.query.category.length > 0) {
    filter.category = { $in: Array.isArray(req.query.category) ? req.query.category : [req.query.category] };
  }
  
  // Add warehouse filter if provided
  if (req.query.warehouse && req.query.warehouse.length > 0) {
    filter.warehouseId = { $in: Array.isArray(req.query.warehouse) ? req.query.warehouse : [req.query.warehouse] };
  }
  
  // Add supplier filter if provided
  if (req.query.supplier && req.query.supplier.length > 0) {
    filter.supplierId = { $in: Array.isArray(req.query.supplier) ? req.query.supplier : [req.query.supplier] };
  }
  
  // Add stock level filters if provided
  if (req.query.minStock) {
    filter.currentStock = { $gte: Number(req.query.minStock) };
  }
  
  if (req.query.maxStock) {
    filter.currentStock = { ...filter.currentStock, $lte: Number(req.query.maxStock) };
  }

  // Count total documents matching the filter
  const count = await SKU.countDocuments(filter);
  
  // Get SKUs with pagination
  const skus = await SKU.find(filter)
    .populate('warehouseId', 'name code')
    .populate('supplierId', 'name')
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    skus,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

// @desc    Get SKU by ID
// @route   GET /api/skus/:id
// @access  Private
export const getSKUById = asyncHandler(async (req, res) => {
  const sku = await SKU.findById(req.params.id)
    .populate('warehouseId', 'name code')
    .populate('supplierId', 'name contactPerson email phone')
    .populate('alternateSuppliers', 'name');

  if (sku) {
    res.json(sku);
  } else {
    res.status(404);
    throw new Error('SKU not found');
  }
});

// @desc    Update SKU
// @route   PUT /api/skus/:id
// @access  Private
export const updateSKU = asyncHandler(async (req, res) => {
  const sku = await SKU.findById(req.params.id);

  if (sku) {
    sku.name = req.body.name || sku.name;
    sku.description = req.body.description || sku.description;
    sku.category = req.body.category || sku.category;
    sku.costPrice = req.body.costPrice || sku.costPrice;
    sku.sellingPrice = req.body.sellingPrice || sku.sellingPrice;
    sku.minStockLevel = req.body.minStockLevel || sku.minStockLevel;
    sku.imageUrl = req.body.imageUrl || sku.imageUrl;
    sku.warehouseId = req.body.warehouseId || sku.warehouseId;
    sku.supplierId = req.body.supplierId || sku.supplierId;
    sku.alternateSuppliers = req.body.alternateSuppliers || sku.alternateSuppliers;
    sku.tags = req.body.tags || sku.tags;
    sku.notes = req.body.notes || sku.notes;
    sku.isActive = req.body.isActive !== undefined ? req.body.isActive : sku.isActive;
    sku.location = req.body.location || sku.location;

    // Update barcode only if provided
    if (req.body.barcode) {
      sku.barcode = req.body.barcode;
    }

    const updatedSKU = await sku.save();
    res.json(updatedSKU);
  } else {
    res.status(404);
    throw new Error('SKU not found');
  }
});

// @desc    Delete SKU
// @route   DELETE /api/skus/:id
// @access  Private
export const deleteSKU = asyncHandler(async (req, res) => {
  const sku = await SKU.findById(req.params.id);

  if (sku) {
    await sku.deleteOne();
    res.json({ message: 'SKU removed' });
  } else {
    res.status(404);
    throw new Error('SKU not found');
  }
});

// @desc    Get low stock SKUs
// @route   GET /api/skus/low-stock
// @access  Private
export const getLowStockSKUs = asyncHandler(async (req, res) => {
  const skus = await SKU.find({
    $expr: { $lt: ['$currentStock', '$minStockLevel'] },
  })
    .populate('warehouseId', 'name')
    .populate('supplierId', 'name')
    .sort({ currentStock: 1 });

  res.json(skus);
});

// @desc    Get SKU categories
// @route   GET /api/skus/categories
// @access  Private
export const getSKUCategories = asyncHandler(async (req, res) => {
  const categories = await SKU.distinct('category');
  res.json(categories);
});