
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  GetApp as ExportIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { useAlert } from '../../context/AlertContext';

function SalesOrder() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [skus, setSkus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalOrders, setTotalOrders] = useState(0);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    customer: '',
    orderDate: new Date(),
    expectedDeliveryDate: new Date(),
    deliveryMethod: '',
    salesPerson: '',
    items: [{ sku: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }],
    notes: '',
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: ''
    },
    billingAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: ''
    }
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    customer: '',
    startDate: null,
    endDate: null
  });

  const { showAlert } = useAlert();

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchSKUs();
  }, [page, rowsPerPage, filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      };
      
      const response = await axios.get('/api/sales-orders', { params });
      setOrders(response.data.salesOrders || []);
      setTotalOrders(response.data.totalOrders || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showAlert('Failed to fetch sales orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchSKUs = async () => {
    try {
      const response = await axios.get('/api/skus');
      setSkus(response.data.skus || []);
    } catch (error) {
      console.error('Error fetching SKUs:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      customer: '',
      orderDate: new Date(),
      expectedDeliveryDate: new Date(),
      deliveryMethod: '',
      salesPerson: '',
      items: [{ sku: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }],
      notes: '',
      shippingAddress: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: ''
      },
      billingAddress: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: ''
      }
    });
    setSelectedOrder(null);
  };

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      
      // Validate form data
      if (!formData.customer) {
        showAlert('Please select a customer', 'error');
        return;
      }
      
      if (formData.items.some(item => !item.sku || item.quantity <= 0)) {
        showAlert('Please fill all item details', 'error');
        return;
      }

      const orderData = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          totalAmount: (item.quantity * item.unitPrice) - item.discount + item.tax
        }))
      };

      const response = await axios.post('/api/sales-orders', orderData);
      
      showAlert('Sales order created successfully', 'success');
      setDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error('Sales order creation error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create sales order';
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async () => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/sales-orders/${selectedOrder._id}`, formData);
      
      showAlert('Sales order updated successfully', 'success');
      setDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update sales order';
      showAlert(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await axios.delete(`/api/sales-orders/${orderId}`);
        showAlert('Order deleted successfully', 'success');
        fetchOrders();
      } catch (error) {
        console.error('Error deleting order:', error);
        showAlert('Failed to delete order', 'error');
      }
    }
  };

  const handleExportPDF = async (orderId) => {
    try {
      const response = await axios.get(`/api/sales-orders/export/pdf/${orderId}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-order-${orderId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showAlert('Failed to export PDF', 'error');
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setFormData({
      customer: order.customer._id,
      orderDate: new Date(order.orderDate),
      expectedDeliveryDate: new Date(order.expectedDeliveryDate),
      deliveryMethod: order.deliveryMethod || '',
      salesPerson: order.salesPerson || '',
      items: order.items.map(item => ({
        sku: item.sku._id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        tax: item.tax || 0
      })),
      notes: order.notes || '',
      shippingAddress: order.shippingAddress || {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: ''
      },
      billingAddress: order.billingAddress || {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: ''
      }
    });
    setDialogOpen(true);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setViewDialog(true);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { sku: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      confirmed: 'primary',
      pending_dispatch: 'warning',
      dispatched: 'info',
      delivered: 'success',
      cancelled: 'error',
      returned: 'secondary'
    };
    return colors[status] || 'default';
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice) - item.discount + item.tax;
    }, 0);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Customer Orders
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => {
                // Export all orders functionality
                showAlert('Export all orders feature coming soon', 'info');
              }}
            >
              Export All
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Create Customer Order
            </Button>
          </Box>
        </Paper>

        {/* Filters */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="pending_dispatch">Processing</MenuItem>
                  <MenuItem value="dispatched">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={customers}
                getOptionLabel={(option) => option.name || ''}
                value={customers.find(c => c._id === filters.customer) || null}
                onChange={(_, newValue) => setFilters(prev => ({ ...prev, customer: newValue?._id || '' }))}
                renderInput={(params) => (
                  <TextField {...params} label="Customer" size="small" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Orders Table */}
        <Paper elevation={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order Number</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell>{order.customer?.name || 'N/A'}</TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell>${order.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View">
                          <IconButton onClick={() => handleViewOrder(order)} size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton 
                            onClick={() => handleEditOrder(order)} 
                            size="small"
                            disabled={order.status !== 'draft'}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Export PDF">
                          <IconButton onClick={() => handleExportPDF(order._id)} size="small">
                            <ExportIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            onClick={() => handleDeleteOrder(order._id)} 
                            size="small"
                            disabled={order.status !== 'draft'}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalOrders}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Paper>

        {/* Create/Edit Order Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            resetForm();
          }}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {selectedOrder ? `Edit Customer Order - ${selectedOrder.orderNumber}` : 'Create Customer Order'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Customer Selection */}
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => option.name || ''}
                  value={customers.find(c => c._id === formData.customer) || null}
                  onChange={(_, newValue) => setFormData(prev => ({ ...prev, customer: newValue?._id || '' }))}
                  renderInput={(params) => (
                    <TextField {...params} label="Customer" required fullWidth />
                  )}
                />
              </Grid>

              {/* Dates */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Order Date"
                  value={formData.orderDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, orderDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Estimated Delivery Date"
                  value={formData.expectedDeliveryDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, expectedDeliveryDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>

              {/* Delivery Method and Sales Person */}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Shipping Method"
                  value={formData.deliveryMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryMethod: e.target.value }))}
                  fullWidth
                >
                  <MenuItem value="standard">Standard Shipping</MenuItem>
                  <MenuItem value="express">Express Shipping</MenuItem>
                  <MenuItem value="overnight">Overnight Delivery</MenuItem>
                  <MenuItem value="pickup">Customer Pickup</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Sales Representative"
                  value={formData.salesPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, salesPerson: e.target.value }))}
                  fullWidth
                />
              </Grid>

              {/* Items Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>Products in Order</Typography>
                {formData.items.map((item, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                          <Autocomplete
                            options={skus}
                            getOptionLabel={(option) => `${option.name} - ${option.sku}` || ''}
                            value={skus.find(s => s._id === item.sku) || null}
                            onChange={(_, newValue) => updateItem(index, 'sku', newValue?._id || '')}
                            renderInput={(params) => (
                              <TextField {...params} label="Product" required size="small" />
                            )}
                          />
                        </Grid>
                        <Grid item xs={6} md={2}>
                          <TextField
                            label="Quantity"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                            size="small"
                            fullWidth
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                        <Grid item xs={6} md={2}>
                          <TextField
                            label="Unit Price"
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            size="small"
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </Grid>
                        <Grid item xs={6} md={2}>
                          <TextField
                            label="Discount"
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                            size="small"
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </Grid>
                        <Grid item xs={6} md={2}>
                          <TextField
                            label="Tax"
                            type="number"
                            value={item.tax}
                            onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value) || 0)}
                            size="small"
                            fullWidth
                            inputProps={{ min: 0, step: 0.01 }}
                          />
                        </Grid>
                        <Grid item xs={12} md={1}>
                          <IconButton
                            onClick={() => removeItem(index)}
                            color="error"
                            disabled={formData.items.length === 1}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addItem}
                  sx={{ mb: 2 }}
                >
                  Add Item
                </Button>
              </Grid>

              {/* Total */}
              <Grid item xs={12}>
                <Typography variant="h6" align="right">
                  Order Total: ₹{calculateTotal().toFixed(2)}
                </Typography>
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  label="Order Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  multiline
                  rows={3}
                  fullWidth
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={selectedOrder ? handleUpdateOrder : handleCreateOrder}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : (selectedOrder ? 'Update Order' : 'Create Order')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Order Dialog */}
        <Dialog
          open={viewDialog}
          onClose={() => setViewDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Customer Order Details - {selectedOrder?.orderNumber}
          </DialogTitle>
          <DialogContent>
            {selectedOrder && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Customer:</strong> {selectedOrder.customer?.name}</Typography>
                  <Typography variant="body2"><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</Typography>
                  <Typography variant="body2"><strong>Fulfillment Status:</strong> {selectedOrder.status}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Order Total:</strong> ₹{selectedOrder.totalAmount?.toFixed(2)}</Typography>
                  <Typography variant="body2"><strong>Sales Rep:</strong> {selectedOrder.salesPerson || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Ordered Products</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Unit Price</TableCell>
                          <TableCell>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.sku?.name || 'N/A'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>₹{item.unitPrice?.toFixed(2)}</TableCell>
                            <TableCell>₹{item.totalAmount?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialog(false)}>Close</Button>
            <Button
              variant="contained"
              startIcon={<ExportIcon />}
              onClick={() => {
                handleExportPDF(selectedOrder._id);
                setViewDialog(false);
              }}
            >
              Export PDF
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}

export default SalesOrder;
