import express from 'express';
const router = express.Router();
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  searchCustomers
} from '../controllers/customerController.js';

// Public routes for customers
router.route('/search').get(searchCustomers);

router.route('/')
  .post(createCustomer)
  .get(getCustomers);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

export default router;
