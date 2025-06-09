
import asyncHandler from 'express-async-handler';
import Warehouse from '../models/warehouseModel.js';

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private
export const getWarehouses = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const warehouses = await Warehouse.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Warehouse.countDocuments();

  res.json({
    warehouses,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalWarehouses: total
  });
});

// @desc    Get single warehouse
// @route   GET /api/warehouses/:id
// @access  Private
export const getWarehouseById = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);

  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  res.json(warehouse);
});

// @desc    Create new warehouse
// @route   POST /api/warehouses
// @access  Private
export const createWarehouse = asyncHandler(async (req, res) => {
  const {
    name,
    code,
    address,
    contactPerson,
    contactPhone,
    contactEmail,
    capacity,
    currentUtilization
  } = req.body;

  // Check if warehouse code already exists
  const warehouseExists = await Warehouse.findOne({ code });
  if (warehouseExists) {
    res.status(400);
    throw new Error('Warehouse with this code already exists');
  }

  const warehouse = await Warehouse.create({
    name,
    code,
    address,
    contactPerson,
    contactPhone,
    contactEmail,
    capacity,
    currentUtilization: currentUtilization || 0
  });

  res.status(201).json(warehouse);
});

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private
export const updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);

  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  const {
    name,
    code,
    address,
    contactPerson,
    contactPhone,
    contactEmail,
    capacity,
    currentUtilization
  } = req.body;

  // Check if new code conflicts with existing warehouse
  if (code && code !== warehouse.code) {
    const existingWarehouse = await Warehouse.findOne({ code });
    if (existingWarehouse) {
      res.status(400);
      throw new Error('Warehouse with this code already exists');
    }
  }

  warehouse.name = name || warehouse.name;
  warehouse.code = code || warehouse.code;
  warehouse.address = address || warehouse.address;
  warehouse.contactPerson = contactPerson || warehouse.contactPerson;
  warehouse.contactPhone = contactPhone || warehouse.contactPhone;
  warehouse.contactEmail = contactEmail || warehouse.contactEmail;
  warehouse.capacity = capacity || warehouse.capacity;
  warehouse.currentUtilization = currentUtilization !== undefined ? currentUtilization : warehouse.currentUtilization;

  const updatedWarehouse = await warehouse.save();
  res.json(updatedWarehouse);
});

// @desc    Delete warehouse
// @route   DELETE /api/warehouses/:id
// @access  Private
export const deleteWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);

  if (!warehouse) {
    res.status(404);
    throw new Error('Warehouse not found');
  }

  await warehouse.deleteOne();
  res.json({ message: 'Warehouse deleted successfully' });
});
