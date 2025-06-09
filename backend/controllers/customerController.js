import Customer from '../models/customerModel.js';
import asyncHandler from 'express-async-handler';

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private (Admin/Manager)
const createCustomer = asyncHandler(async (req, res) => {
  const {
    name, email, phone, alternatePhone, companyName, contactPerson, contactPersonPhone,
    gstin, address, billingAddress, shippingAddress, customerType, creditLimit, paymentTerms, notes
  } = req.body;

  if (!name || !phone) {
    res.status(400);
    throw new Error('Customer name and phone are required.');
  }

  const customerExists = await Customer.findOne({ $or: [{ email }, { phone }] });
  if (email && customerExists && customerExists.email === email) {
     res.status(400);
     throw new Error('Customer with this email already exists.');
  }
   if (customerExists && customerExists.phone === phone) {
     res.status(400);
     throw new Error('Customer with this phone number already exists.');
  }


  const customer = new Customer({
    name, email, phone, alternatePhone, companyName, contactPerson, contactPersonPhone,
    gstin, address, billingAddress, shippingAddress, customerType, creditLimit, paymentTerms, notes
    // createdBy: req.user._id // If tracking who created
  });

  const createdCustomer = await customer.save();
  res.status(201).json(createdCustomer);
});

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
  // Add pagination and search/filtering later if needed
  const customers = await Customer.find({ isActive: true }).sort({ name: 1 }); // Sort by name
  res.json(customers);
});

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (customer && customer.isActive) {
    res.json(customer);
  } else {
    res.status(404);
    throw new Error('Customer not found or is inactive.');
  }
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Admin/Manager)
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (customer) {
    customer.name = req.body.name || customer.name;
    customer.email = req.body.email || customer.email;
    customer.phone = req.body.phone || customer.phone;
    customer.alternatePhone = req.body.alternatePhone || customer.alternatePhone;
    customer.companyName = req.body.companyName || customer.companyName;
    customer.contactPerson = req.body.contactPerson || customer.contactPerson;
    customer.contactPersonPhone = req.body.contactPersonPhone || customer.contactPersonPhone;
    customer.gstin = req.body.gstin || customer.gstin;
    
    // For address objects, ensure to update them correctly
    if (req.body.address) customer.address = { ...customer.address, ...req.body.address };
    if (req.body.billingAddress) customer.billingAddress = { ...customer.billingAddress, ...req.body.billingAddress };
    if (req.body.shippingAddress) customer.shippingAddress = { ...customer.shippingAddress, ...req.body.shippingAddress };

    customer.customerType = req.body.customerType || customer.customerType;
    customer.creditLimit = req.body.creditLimit ?? customer.creditLimit; // Allow setting to 0
    customer.paymentTerms = req.body.paymentTerms || customer.paymentTerms;
    customer.isActive = req.body.isActive ?? customer.isActive;
    customer.notes = req.body.notes || customer.notes;
    // customer.updatedBy = req.user._id; // If tracking who updated

    // Check for uniqueness again if email/phone changed
    if (req.body.email && req.body.email !== customer.email) {
        const existingByEmail = await Customer.findOne({ email: req.body.email });
        if (existingByEmail && existingByEmail._id.toString() !== customer._id.toString()) {
            res.status(400);
            throw new Error('Another customer with this email already exists.');
        }
    }
    if (req.body.phone && req.body.phone !== customer.phone) {
        const existingByPhone = await Customer.findOne({ phone: req.body.phone });
        if (existingByPhone && existingByPhone._id.toString() !== customer._id.toString()) {
            res.status(400);
            throw new Error('Another customer with this phone number already exists.');
        }
    }

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } else {
    res.status(404);
    throw new Error('Customer not found.');
  }
});

// @desc    Delete a customer (soft delete by marking inactive)
// @route   DELETE /api/customers/:id
// @access  Private (Admin/Manager)
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (customer) {
    customer.isActive = false; // Soft delete
    // customer.updatedBy = req.user._id;
    await customer.save();
    res.json({ message: 'Customer marked as inactive.' });
  } else {
    res.status(404);
    throw new Error('Customer not found.');
  }
});

// @desc    Search customers (e.g., for auto-population in Sales Order)
// @route   GET /api/customers/search
// @access  Private
const searchCustomers = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        isActive: true, // Only search active customers
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { customerCode: { $regex: req.query.keyword, $options: 'i' } },
          { phone: { $regex: req.query.keyword, $options: 'i' } },
          { email: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : { isActive: true };

  const customers = await Customer.find(keyword).limit(10); // Limit results for performance
  res.json(customers);
});


export {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomers
};