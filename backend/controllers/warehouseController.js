
import asyncHandler from 'express-async-handler';
import Warehouse from '../models/warehouseModel.js';

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private
export const getWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await Warehouse.find({});
  res.json(warehouses);
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
    city,
    state,
    country,
    pincode,
    phone,
    email,
    managerName,
    capacity,
    type
  } = req.body;

  const warehouse = await Warehouse.create({
    name,
    code,
    address,
    city,
    state,
    country,
    pincode,
    phone,
    email,
    managerName,
    capacity,
    type,
    createdBy: req.user._id
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

  const updatedWarehouse = await Warehouse.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

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
