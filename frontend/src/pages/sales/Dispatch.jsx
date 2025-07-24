
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Chip,
  Alert,
  IconButton,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Visibility as ViewIcon,
  LocalShipping as DispatchIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAlert } from '../../context/AlertContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dispatch-tabpanel-${index}`}
      aria-labelledby={`dispatch-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Dispatch() {
  const [tabValue, setTabValue] = useState(0);
  const [orders, setOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dispatchDialog, setDispatchDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [skuStock, setSkuStock] = useState({});
  const [dispatchQuantities, setDispatchQuantities] = useState({});
  const [loading, setLoading] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const { showSuccess, showError } = useAlert();

  useEffect(() => {
    fetchOrders();
    fetchPendingOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/sales-orders');
      setOrders(response.data.salesOrders || []);
    } catch (error) {
      showError('Failed to fetch orders');
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const response = await axios.get('/api/sales-orders', {
        params: { status: 'pending_dispatch' }
      });
      setPendingOrders(response.data.salesOrders || []);
    } catch (error) {
      showError('Failed to fetch pending orders');
    }
  };

  const fetchSkuStock = async (skuIds) => {
    try {
      const stockPromises = skuIds.map(id => axios.get(`/api/skus/${id}`));
      const stockResponses = await Promise.all(stockPromises);
      const stockData = {};
      stockResponses.forEach((response, index) => {
        stockData[skuIds[index]] = response.data.currentStock || 0;
      });
      setSkuStock(stockData);
    } catch (error) {
      showError('Failed to fetch SKU stock information');
    }
  };

  const fetchDispatchLogs = async (orderId) => {
    if (!orderId) return;
    setLoadingLogs(true);
    try {
      const response = await axios.get(`/api/sales-orders/${orderId}/dispatch-logs`);
      setDispatchLogs(response.data || []);
    } catch (error) {
      showError('Failed to fetch dispatch logs');
      setDispatchLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    fetchDispatchLogs(order._id);
    setViewDialog(true);
  };

  const handleDispatchOrder = async (order) => {
    setSelectedOrder(order);
    const skuIds = order.items.map(item => item.sku._id);
    await fetchSkuStock(skuIds);
    
    // Initialize dispatch quantities
    const initialQuantities = {};
    order.items.forEach(item => {
      initialQuantities[item.sku._id] = item.quantity;
    });
    setDispatchQuantities(initialQuantities);
    setDispatchDialog(true);
  };

  const handleDispatchSubmit = async () => {
    setLoading(true);
    try {
      // Validate stock availability
      for (const item of selectedOrder.items) {
        const skuId = item.sku._id;
        const requestedQty = dispatchQuantities[skuId];
        const availableStock = skuStock[skuId];
        
        if (requestedQty > availableStock) {
          showError(`Insufficient stock for ${item.sku.name}. Available: ${availableStock}, Requested: ${requestedQty}`);
          setLoading(false);
          return;
        }
      }

      // Process dispatch
      const dispatchData = {
        dispatchedItems: selectedOrder.items.map(item => ({
          sku: item.sku._id,
          quantity: dispatchQuantities[item.sku._id],
          dispatchedAt: new Date()
        }))
      };

      await axios.put(`/api/sales-orders/${selectedOrder._id}/dispatch`, dispatchData);
      showSuccess('Order dispatched successfully');
      setDispatchDialog(false);
      fetchOrders();
      fetchPendingOrders();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to dispatch order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_dispatch: 'warning',
      dispatched: 'info',
      delivered: 'success',
      partial: 'warning'
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom>
        Order Fulfillment & Shipping
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Awaiting Fulfillment" />
          <Tab label="All Orders" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Products</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingOrders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.customer?.name}</TableCell>
                    <TableCell>
                      {new Date(order.orderDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{order.items?.length || 0}</TableCell>
                    <TableCell>₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewOrder(order)}
                      >
                        <ViewIcon />
                      </IconButton>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<DispatchIcon />}
                        onClick={() => handleDispatchOrder(order)}
                        sx={{ ml: 1 }}
                      >
                        Ship Order
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Order Status</TableCell>
                  <TableCell>Shipping Status</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.customer?.name}</TableCell>
                    <TableCell>
                      {new Date(order.orderDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.dispatchStatus || 'pending'}
                        color={getStatusColor(order.dispatchStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewOrder(order)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Dispatch Dialog */}
      <Dialog
        open={dispatchDialog}
        onClose={() => setDispatchDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ship Order: {selectedOrder?.orderNumber}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Please verify inventory availability before shipping. You cannot ship more than the current stock.
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Customer:</Typography>
                  <Typography>{selectedOrder.customer?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Order Date:</Typography>
                  <Typography>
                    {new Date(selectedOrder.orderDate).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Products to Ship
              </Typography>

              {selectedOrder.items?.map((item, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={4}>
                        <Typography variant="subtitle2">{item.sku?.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          SKU: {item.sku?.sku}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body2">
                          Ordered: {item.quantity}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Typography variant="body2">
                          Available: {skuStock[item.sku?._id] || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          type="number"
                          label="Ship Quantity"
                          size="small"
                          value={dispatchQuantities[item.sku?._id] || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setDispatchQuantities(prev => ({
                              ...prev,
                              [item.sku._id]: value
                            }));
                          }}
                          inputProps={{
                            min: 0,
                            max: Math.min(item.quantity, skuStock[item.sku?._id] || 0)
                          }}
                          error={dispatchQuantities[item.sku?._id] > (skuStock[item.sku?._id] || 0)}
                          helperText={
                            dispatchQuantities[item.sku?._id] > (skuStock[item.sku?._id] || 0)
                              ? 'Exceeds available stock'
                              : ''
                          }
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDispatchDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDispatchSubmit} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Ship Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog
        open={viewDialog}
        onClose={() => {
          setViewDialog(false);
          setDispatchLogs([]); // Clear logs when dialog closes
        }}
        maxWidth="lg" // Increased width to accommodate logs
        fullWidth
      >
        <DialogTitle>Order Details: {selectedOrder?.orderNumber}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Order Number:</Typography>
                  <Typography>{selectedOrder.orderNumber}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Customer:</Typography>
                  <Typography>{selectedOrder.customer?.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Status:</Typography>
                  <Chip
                    label={selectedOrder.status}
                    color={getStatusColor(selectedOrder.status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="subtitle2">Dispatch Status:</Typography>
                  <Chip
                    label={selectedOrder.dispatchStatus || 'pending'}
                    color={getStatusColor(selectedOrder.dispatchStatus)}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Ordered Items
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>SKU</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.sku?.sku}</TableCell>
                        <TableCell>{item.sku?.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">₹{item.unitPrice?.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{item.totalAmount?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="h6" align="right" sx={{ mb: 3 }}>
                Order Total: ₹{selectedOrder.totalAmount?.toFixed(2)}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Dispatch Log
              </Typography>
              {loadingLogs ? (
                <Typography>Loading dispatch logs...</Typography>
              ) : dispatchLogs.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Log ID</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Dispatched By</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Items</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dispatchLogs.map((log) => (
                        <TableRow key={log._id}>
                          <TableCell>{log._id.slice(-6)}</TableCell>
                          <TableCell>{new Date(log.dispatchDate || log.createdAt).toLocaleString()}</TableCell>
                          <TableCell>{log.dispatchedBy?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <Chip label={log.status} color={getStatusColor(log.status)} size="small" />
                          </TableCell>
                          <TableCell>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>SKU</TableCell>
                                  <TableCell>Name</TableCell>
                                  <TableCell align="right">Qty</TableCell>
                                  <TableCell align="right">Stock Before</TableCell>
                                  <TableCell align="right">Stock After</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {log.dispatchedItems.map(item => (
                                  <TableRow key={item.sku?._id || item.sku}>
                                    <TableCell>{item.sku?.sku || 'N/A'}</TableCell>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell align="right">{item.quantity}</TableCell>
                                    <TableCell align="right">{item.stockBeforeDispatch}</TableCell>
                                    <TableCell align="right">{item.stockAfterDispatch}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableCell>
                          <TableCell>{log.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>No dispatch logs found for this order.</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setViewDialog(false); setDispatchLogs([]); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dispatch;
