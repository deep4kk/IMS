import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Fab,
  Autocomplete,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAlert } from '../../context/AlertContext';
import axios from 'axios';

function SalesOrder() {
  const [orders, setOrders] = useState([]);
  const [allCustomersForFilter, setAllCustomersForFilter] = useState([]); // For the main filter
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
    customer: null,
    customerName: '',
    customerPhone: '',
    shippingAddress: {},
    billingAddress: {},
    orderDate: new Date(),
    expectedShipmentDate: new Date(),
    deliveryMethod: '',
    salesPerson: '',
    items: [{ sku: null, quantity: 1, unitPrice: 0, discount: 0, tax: 0 }],
    notes: ''
  });
  const [salesPeople, setSalesPeople] = useState(['John Doe', 'Jane Smith']); // Mock data
  const [newSalesPerson, setNewSalesPerson] = useState('');
  const [addSalesPersonMode, setAddSalesPersonMode] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    customer: '', // customerId for filter
    startDate: null,
    endDate: null
  });

  const { showAlert } = useAlert(); // Assuming showAlert is the correct method from context

  useEffect(() => {
    fetchOrders();
    fetchAllCustomersForFilter(); // Fetch all customers for the main page filter
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
      setOrders(response.data.salesOrders);
      setTotalOrders(response.data.totalOrders);
    } catch (error) {
      showAlert('error', 'Failed to fetch sales orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCustomersForFilter = async () => { // Renamed to avoid confusion
    try {
      const response = await axios.get('/api/customers'); // Gets all active customers
      setAllCustomersForFilter(response.data || []);
    } catch (error) {
      showAlert('error', 'Failed to fetch customers for filter');
    }
  };



  const fetchSKUs = async () => {
    try {
      const response = await axios.get('/api/skus');
      setSkus(response.data.skus || response.data);
    } catch (error) {
      showAlert('error', 'Failed to fetch SKUs');
    }
  };

  const handleCreateOrder = async () => {
    try {
      // Validate required fields before sending
      if (!formData.customer?._id) {
        showAlert('error', 'Please select a customer');
        return;
      }
      if (!formData.items || formData.items.length === 0) {
        showAlert('error', 'Please add at least one item');
        return;
      }
      if (formData.items.some(item => !item.sku?._id)) {
        showAlert('error', 'Please select SKU for all items');
        return;
      }
      if (!formData.deliveryMethod) {
        showAlert('error', 'Please select delivery method');
        return;
      }

      // Generate order number (format: SO-YYYY-MM-DD-XXXX)
      const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `SO-${datePart}-${randomPart}`;

      const orderData = {
        orderNumber,
        customer: formData.customer._id,
        orderDate: formData.orderDate,
        expectedDeliveryDate: formData.expectedShipmentDate,
        deliveryMethod: formData.deliveryMethod,
        salesPerson: formData.salesPerson,
        items: formData.items.map(item => ({
          sku: item.sku._id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          tax: item.tax,
          totalAmount: (item.quantity * item.unitPrice) - item.discount + item.tax
        })),
        notes: formData.notes,
        shippingAddress: formData.customer.shippingAddress || formData.customer.billingAddress || formData.customer.address,
        billingAddress: formData.customer.billingAddress || formData.customer.shippingAddress || formData.customer.address
      };

      await axios.post('/api/sales-orders', orderData);
      showAlert('success', 'Sales order created successfully');
      setDialogOpen(false);
      resetForm();
      fetchOrders();
    } catch (error) {
      console.error('Sales order creation error:', error);
      showAlert('error', error.response?.data?.message || 'Failed to create sales order');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`/api/sales-orders/${orderId}`, { status });
      showAlert('success', 'Order status updated successfully');
      fetchOrders();
    } catch (error) {
      showAlert('error', 'Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this sales order?')) {
      try {
        await axios.delete(`/api/sales-orders/${orderId}`);
        showAlert('success', 'Sales order deleted successfully');
        fetchOrders();
      } catch (error) {
        showAlert('error', 'Failed to delete sales order');
      }
    }
  };

  const handleExportPdf = async (orderId) => {
    try {
      const response = await axios.get(`/api/sales-orders/export/pdf/${orderId}`, {
        responseType: 'blob', // Important for handling file downloads
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SalesOrder_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showAlert('success', 'PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showAlert('error', 'Failed to export PDF.');
    }
  };

  const resetForm = () => {
    setFormData({
      customer: null,
      customerName: '',
      customerPhone: '',
      shippingAddress: {},
      billingAddress: {},
      orderDate: new Date(),
      expectedShipmentDate: new Date(),
      deliveryMethod: '',
      salesPerson: '',
      items: [{ sku: null, quantity: 1, unitPrice: 0, discount: 0, tax: 0 }],
      notes: ''
    });
    setSelectedOrder(null);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { sku: null, quantity: 1, unitPrice: 0, discount: 0, tax: 0 }]
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

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => {
      const itemTotal = (item.quantity * item.unitPrice) - item.discount + item.tax;
      return total + itemTotal;
    }, 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      confirmed: 'primary',
      processing: 'warning',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Sales Orders
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Create Order
          </Button>
        </Paper>

        {/* Filters */}
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                size="small"
                options={allCustomersForFilter} // Use allCustomersForFilter here
                getOptionLabel={(option) => option.name || ''}
                value={allCustomersForFilter.find(c => c._id === filters.customer) || null}
                onChange={(_, value) => setFilters(prev => ({ ...prev, customer: value?._id || '' }))}
                renderInput={(params) => (
                  <TextField {...params} label="Customer" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => setFilters(prev => ({ ...prev, startDate: date }))}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setFilters({ status: '', customer: '', startDate: null, endDate: null })}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Orders Table */}
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead sx={{ backgroundColor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Order Number</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Customer</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Order Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Delivery Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total Amount</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                  <TableCell>{order.orderNumber}</TableCell>
                  <TableCell>{order.customer?.name}</TableCell>
                  <TableCell>
                    {new Date(order.orderDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>₹{order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedOrder(order);
                        setViewDialog(true);
                      }}
                    >
                      <ViewIcon />
                    </IconButton>
                    {order.status === 'draft' && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedOrder(order);
                            setFormData({
                              customer: order.customer,
                              expectedDeliveryDate: new Date(order.expectedDeliveryDate),
                              items: order.items,
                              notes: order.notes
                            });
                            setDialogOpen(true);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteOrder(order._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                    {order.status === 'draft' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}
                      >
                        Confirm
                      </Button>
                    )}
                     <IconButton
                      size="small"
                      onClick={() => handleExportPdf(order._id)}
                      color="secondary"
                    >
                      <PdfIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={totalOrders}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>

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
            {selectedOrder ? `Edit Sales Order - ${selectedOrder.orderNumber}` : 'Create Sales Order'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Row 1: Customer and Sales Order # */}
              <Grid item xs={12} md={8}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    label="Customer"
                    value={formData.customer?._id || ''}
                    onChange={(e) => {
                      const customerId = e.target.value;
                      const selectedCustomer = allCustomersForFilter.find(c => c._id === customerId);
                      setFormData(prev => ({
                        ...prev,
                        customer: selectedCustomer,
                        customerName: selectedCustomer ? selectedCustomer.name : '',
                        customerPhone: selectedCustomer ? selectedCustomer.phone : '',
                        shippingAddress: selectedCustomer?.shippingAddress || selectedCustomer?.address || {},
                        billingAddress: selectedCustomer?.billingAddress || selectedCustomer?.address || {},
                      }));
                    }}
                  >
                    <MenuItem value="">
                      <em>Select a customer</em>
                    </MenuItem>
                    {allCustomersForFilter.map((customer) => (
                      <MenuItem key={customer._id} value={customer._id}>
                        {customer.name} ({customer.customerCode || 'N/A'})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Sales Order #"
                  value={selectedOrder ? selectedOrder.orderNumber : 'SO-0017'} // Example
                  InputProps={{ readOnly: true }}
                  fullWidth
                  size="small"
                  variant="filled"
                />
              </Grid>

              {/* Row 2: Mobile and Address */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Mobile"
                  value={formData.customerPhone}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  size="small"
                  variant="filled"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Billing Address"
                  value={`${formData.billingAddress?.street || ''}, ${formData.billingAddress?.city || ''}`}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  size="small"
                  variant="filled"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Shipping Address"
                  value={`${formData.shippingAddress?.street || ''}, ${formData.shippingAddress?.city || ''}`}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  size="small"
                  variant="filled"
                />
              </Grid>

              {/* Row 3: Dates */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Sales Order Date"
                  value={formData.orderDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, orderDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Expected Shipment Date"
                  value={formData.expectedShipmentDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, expectedShipmentDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>

              {/* Row 4: Delivery Method and Sales Person */}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Delivery Method"
                  value={formData.deliveryMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryMethod: e.target.value }))}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="standard">Standard Shipping</MenuItem>
                  <MenuItem value="express">Express Shipping</MenuItem>
                  <MenuItem value="pickup">Customer Pickup</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                {addSalesPersonMode ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      label="New Sales Person"
                      value={newSalesPerson}
                      onChange={(e) => setNewSalesPerson(e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <Button onClick={() => {
                      if (newSalesPerson) {
                        setSalesPeople(prev => [...prev, newSalesPerson]);
                        setFormData(prev => ({ ...prev, salesPerson: newSalesPerson }));
                        setNewSalesPerson('');
                        setAddSalesPersonMode(false);
                      }
                    }}>Add</Button>
                    <Button onClick={() => setAddSalesPersonMode(false)}>Cancel</Button>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      select
                      label="Sales Person"
                      value={formData.salesPerson}
                      onChange={(e) => setFormData(prev => ({ ...prev, salesPerson: e.target.value }))}
                      fullWidth
                      size="small"
                    >
                      {salesPeople.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </TextField>
                    <IconButton onClick={() => setAddSalesPersonMode(true)} color="primary">
                      <AddIcon />
                    </IconButton>
                  </Box>
                )}
              </Grid>

              {/* Items Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Order Items</Typography>
                {formData.items.map((item, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                          <Autocomplete
                            options={skus}
                            getOptionLabel={(option) => `${option.name} (${option.sku})` || ''}
                            value={item.sku}
                            onChange={(_, value) => {
                              updateItem(index, 'sku', value);
                              if (value) {
                                updateItem(index, 'unitPrice', value.sellingPrice || 0);
                              }
                            }}
                            renderInput={(params) => (
                              <TextField {...params} label="SKU" size="small" />
                            )}
                          />
                        </Grid>
                        <Grid item xs={6} md={1.5}>
                          <Typography variant="body2">
                            Stock: {item.sku ? item.sku.quantityInStock : '-'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={1.5}>
                          <TextField
                            type="number"
                            label="Quantity"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6} md={1.5}>
                          <TextField
                            type="number"
                            label="Unit Price"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6} md={1.5}>
                          <TextField
                            type="number"
                            label="Discount"
                            value={item.discount}
                            onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={6} md={1.5}>
                          <TextField
                            type="number"
                            label="Tax"
                            value={item.tax}
                            onChange={(e) => updateItem(index, 'tax', parseFloat(e.target.value) || 0)}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              Total: ₹{((item.quantity * item.unitPrice) - item.discount + item.tax).toFixed(2)}
                            </Typography>
                            {formData.items.length > 1 && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeItem(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </Box>
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

                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" align="right">
                  Total Amount: ₹{calculateTotal().toFixed(2)}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  fullWidth
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrder} variant="contained">
              {selectedOrder ? 'Update' : 'Create'} Order
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Order Dialog */}
        <Dialog
          open={viewDialog}
          onClose={() => setViewDialog(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
          <DialogContent>
            {selectedOrder && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Customer</Typography>
                    <Typography>{selectedOrder.customer?.name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Order Date</Typography>
                    <Typography>{new Date(selectedOrder.orderDate).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Expected Delivery Date</Typography>
                    <Typography>{new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Status</Typography>
                    <Chip label={selectedOrder.status} color={getStatusColor(selectedOrder.status)} size="small" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Billing Address</Typography>
                    <Typography>{`${selectedOrder.billingAddress?.street}, ${selectedOrder.billingAddress?.city}, ${selectedOrder.billingAddress?.state} - ${selectedOrder.billingAddress?.pincode}`}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Shipping Address</Typography>
                    <Typography>{`${selectedOrder.shippingAddress?.street}, ${selectedOrder.shippingAddress?.city}, ${selectedOrder.shippingAddress?.state} - ${selectedOrder.shippingAddress?.pincode}`}</Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>Items</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>SKU</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell>Discount</TableCell>
                        <TableCell>Tax</TableCell>
                        <TableCell>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.sku?.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell>₹{item.discount.toFixed(2)}</TableCell>
                          <TableCell>₹{item.tax.toFixed(2)}</TableCell>
                          <TableCell>₹{item.totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="h6">
                    Grand Total: ₹{selectedOrder.totalAmount?.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}

export default SalesOrder;