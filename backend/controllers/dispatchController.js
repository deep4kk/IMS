import asyncHandler from 'express-async-handler';
import SalesOrder from '../models/salesOrderModel.js';
import SKU from '../models/skuModel.js';
import Transaction from '../models/transactionModel.js';
import DispatchLog from '../models/dispatchLogModel.js'; // Added import for DispatchLog

// @desc    Dispatch sales order
// @route   PUT /api/sales-orders/:id/dispatch
// @access  Private
export const dispatchOrder = asyncHandler(async (req, res) => {
  const { dispatchedItems } = req.body;
  console.log('Dispatch request body:', req.body); // Log request body

  const order = await SalesOrder.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Sales order not found');
  }
  console.log('Found order:', order); // Log found order

  if (order.status !== 'pending_dispatch') {
    res.status(400);
    throw new Error(`Order is not ready for dispatch. Current status: ${order.status}`);
  }

  // Validate stock and update inventory
  const processedDispatchItemsForLog = []; // To store items with stock details for logging
  for (let dispatchItem of dispatchedItems) {
    const sku = await SKU.findById(dispatchItem.sku);
    if (!sku) {
      res.status(404);
      throw new Error(`SKU not found: ${dispatchItem.sku}`);
    }

    if (sku.currentStock < dispatchItem.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${sku.name}. Available: ${sku.currentStock}, Required: ${dispatchItem.quantity}`);
    }

    const stockBeforeDispatch = sku.currentStock;
    const stockAfterDispatch = stockBeforeDispatch - dispatchItem.quantity;

    // Update stock
    try {
      await SKU.findByIdAndUpdate(dispatchItem.sku, {
        $inc: { 
          currentStock: -dispatchItem.quantity,
          // Assuming reservedStock should also be decremented upon dispatch
          // If reservedStock is only for allocation before dispatch, this might need adjustment
          // For now, let's assume it's reduced as it's no longer reserved but dispatched.
          reservedStock: -dispatchItem.quantity 
        }
      });
      console.log(`Stock updated for SKU: ${dispatchItem.sku}`);
    } catch (error) {
      console.error(`Error updating stock for SKU ${dispatchItem.sku}:`, error);
      res.status(500);
      throw new Error(`Failed to update stock for SKU ${dispatchItem.sku}`);
    }

    // Create transaction record (TEMPORARILY COMMENTED OUT FOR DEBUGGING)
    /*
    try {
      const transactionData = {
        type: 'outbound',
        sku: dispatchItem.sku,
        quantity: dispatchItem.quantity,
        unitPrice: order.items.find(item => item.sku.toString() === dispatchItem.sku.toString())?.unitPrice || 0,
        totalAmount: dispatchItem.quantity * (order.items.find(item => item.sku.toString() === dispatchItem.sku.toString())?.unitPrice || 0),
        referenceType: 'SalesOrder',
        referenceId: order._id,
        notes: `Dispatched from Sales Order ${order.orderNumber || 'N/A'}`,
        createdBy: req.user._id
      };
      console.log('Creating transaction with data:', transactionData);
      await Transaction.create(transactionData);
      console.log(`Transaction created for SKU: ${dispatchItem.sku}`);
    } catch (error) {
      console.error(`Error creating transaction for SKU ${dispatchItem.sku}:`, error);
      res.status(500);
      throw new Error(`Failed to create transaction for SKU ${dispatchItem.sku}`);
    }
    */
   console.log('Transaction creation block SKIPPED for debugging.');

    processedDispatchItemsForLog.push({
      ...dispatchItem,
      sku: dispatchItem.sku, // ensure sku is ObjectId if it's not already
      name: sku.name, // Get Sku name directly
      stockBeforeDispatch,
      stockAfterDispatch,
      // unitPrice can be added here if needed, similar to how it's done for dispatchLogEntry later
    });
  }

  // Determine dispatch status (full or partially)
  let overallDispatchStatus = 'full'; // Assume full initially
  const originalOrderItemsMap = new Map(order.items.map(item => [item.sku.toString(), item.quantity]));

  for (const dispatchedItem of dispatchedItems) {
    const orderedQuantity = originalOrderItemsMap.get(dispatchedItem.sku.toString());
    if (!orderedQuantity || dispatchedItem.quantity < orderedQuantity) {
      overallDispatchStatus = 'partially';
      // If any item is partially dispatched, or a dispatched item wasn't in the original order (edge case, should be validated earlier)
      // or if not all ordered items are present in dispatchedItems, it's partial.
    }
  }
  
  // Check if all ordered items are present in dispatchedItems and fully dispatched
  if (order.items.length !== dispatchedItems.length && overallDispatchStatus === 'full') {
      // This means some items from the original order were not in the dispatchedItems list at all.
      overallDispatchStatus = 'partially';
  } else {
      for (const orderItem of order.items) {
          const dispatchedItemDetail = dispatchedItems.find(di => di.sku.toString() === orderItem.sku.toString());
          if (!dispatchedItemDetail || dispatchedItemDetail.quantity < orderItem.quantity) {
              overallDispatchStatus = 'partially';
              break;
          }
      }
  }

  // Create Dispatch Log Entry
  try {
    const dispatchLogEntry = {
      salesOrder: order._id,
      dispatchedItems: processedDispatchItemsForLog.map(item => ({
        sku: item.sku,
        name: item.name, // Already captured from SKU object
        quantity: item.quantity,
        stockBeforeDispatch: item.stockBeforeDispatch,
        stockAfterDispatch: item.stockAfterDispatch,
        // unitPrice: order.items.find(oi => oi.sku.toString() === item.sku.toString())?.unitPrice // Optional: capture price from order
      })),
      status: overallDispatchStatus,
      dispatchedBy: req.user._id, // Assuming req.user is populated by auth middleware
      notes: `Dispatch for Sales Order ${order.orderNumber || order._id}`
    };
    await DispatchLog.create(dispatchLogEntry);
    console.log('Dispatch log created successfully.');
  } catch (error) {
    console.error('Error creating dispatch log:', error);
    // Decide if this should be a fatal error or just logged
    // For now, let's throw, as logging is crucial
    res.status(500);
    throw new Error('Failed to create dispatch log entry.');
  }

  // Update order status
  order.dispatchedItems = dispatchedItems; // Log the items that were actually dispatched
  order.status = 'dispatched'; // Main status of the order
  // Map overallDispatchStatus to the enum values in SalesOrder model
  if (overallDispatchStatus === 'full') {
    order.dispatchStatus = 'completed';
  } else if (overallDispatchStatus === 'partially') {
    order.dispatchStatus = 'partial';
  } else {
    order.dispatchStatus = 'pending'; // Default or error case
  }
  order.dispatchDate = new Date(); // Set dispatch date
  
  console.log('Order object before final save:', JSON.stringify(order, null, 2));

  try {
    const updatedOrder = await order.save();
    console.log('Order saved successfully:', updatedOrder);
    res.json({
      message: `Order dispatched ${overallDispatchStatus}`, // More descriptive message
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error saving dispatched order:', error);
    res.status(500);
    throw new Error('Failed to save dispatched order details.');
  }

});

// @desc    Get dispatch logs for a sales order
// @route   GET /api/sales-orders/:id/dispatch-logs
// @access  Private
export const getDispatchLogsByOrderId = asyncHandler(async (req, res) => {
  const salesOrderId = req.params.id;

  const dispatchLogs = await DispatchLog.find({ salesOrder: salesOrderId })
    .populate('dispatchedBy', 'name email') // Populate user details
    .populate('dispatchedItems.sku', 'name sku') // Populate SKU details within items
    .sort({ createdAt: -1 }); // Sort by newest first

  if (dispatchLogs) {
    res.json(dispatchLogs);
  } else {
    res.status(404);
    throw new Error('Dispatch logs not found for this order.');
  }
});
