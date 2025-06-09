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
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  PictureAsPdf as PdfIcon,
  Business as BusinessIcon,
  GetApp as GetAppIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAlert } from '../../context/AlertContext';
import axios from 'axios';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function PurchaseOrderMaster() {
  const [orders, setOrders] = useState([]);
  const [pendingIndents, setPendingIndents] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalOrders, setTotalOrders] = useState(0);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [createPoDialog, setCreatePoDialog] = useState(false);
  const [selectedIndents, setSelectedIndents] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    supplier: '',
    startDate: null,
    endDate: null
  });

  const { showAlert } = useAlert();

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    if (tabValue === 1) {
      fetchPendingIndents();
    }
  }, [page, rowsPerPage, filters, tabValue]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      };

      const response = await axios.get('/api/purchase-orders', { params });
      setOrders(response.data.purchaseOrders || response.data || []);
      setTotalOrders(response.data.totalOrders || 0);
    } catch (error) {
      showAlert('error', 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingIndents = async () => {
    try {
      const response = await axios.get('/api/purchase-indents', {
        params: { status: 'approved' }
      });
      setPendingIndents(response.data.indents || []);
    } catch (error) {
      showAlert('error', 'Failed to fetch pending indents');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers');
      setSuppliers(response.data || []);
    } catch (error) {
      showAlert('error', 'Failed to fetch suppliers');
    }
  };

  const handleCreatePO = async () => {
    if (selectedIndents.length === 0) {
      showAlert('error', 'Please select at least one indent');
      return;
    }

    try {
      const response = await axios.post('/api/purchase-orders/from-indents', {
        indentIds: selectedIndents
      });
      showAlert('success', 'Purchase Order created successfully');
      setCreatePoDialog(false);
      setSelectedIndents([]);
      fetchOrders();
      fetchPendingIndents();
    } catch (error) {
      showAlert('error', 'Failed to create purchase order');
    }
  };

  const handleExportPdf = async (orderId) => {
    try {
      const response = await axios.get(`/api/purchase-orders/export/pdf/${orderId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PurchaseOrder_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showAlert('success', 'PDF exported successfully!');
    } catch (error) {
      showAlert('error', 'Failed to export PDF.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      confirmed: 'primary',
      partial_received: 'warning',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const groupIndentsBySupplier = () => {
    const grouped = {};
    pendingIndents.forEach(indent => {
      indent.items.forEach(item => {
        if (item.preferredSupplier) {
          const supplierId = item.preferredSupplier._id;
          if (!grouped[supplierId]) {
            grouped[supplierId] = {
              supplier: item.preferredSupplier,
              indents: []
            };
          }
          const existingIndent = grouped[supplierId].indents.find(i => i._id === indent._id);
          if (!existingIndent) {
            grouped[supplierId].indents.push(indent);
          }
        }
      });
    });
    return grouped;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
        <Paper elevation={3} sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Purchase Order Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<GetAppIcon />}
              onClick={() => {
                // Export all purchase orders functionality
                alert('Export all purchase orders feature coming soon');
              }}
            >
              Export All
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreatePoDialog(true)}
            >
              Create PO
            </Button>
          </Box>
        </Paper>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Master (All POs)" />
            <Tab label="Pending Indents" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
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
                    <MenuItem value="partial_received">Partial Received</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Autocomplete
                  size="small"
                  options={suppliers}
                  getOptionLabel={(option) => option.name || ''}
                  value={suppliers.find(s => s._id === filters.supplier) || null}
                  onChange={(_, value) => setFilters(prev => ({ ...prev, supplier: value?._id || '' }))}
                  renderInput={(params) => (
                    <TextField {...params} label="Supplier" />
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
                  onClick={() => setFilters({ status: '', supplier: '', startDate: null, endDate: null })}
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
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>PO Number</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Supplier</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Order Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Expected Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total Amount</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.supplier?.name}</TableCell>
                    <TableCell>
                      {new Date(order.orderDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>₹{order.totalAmount?.toFixed(2) || '0.00'}</TableCell>
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
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Pending Indents by Supplier */}
          <Grid container spacing={3}>
            {Object.entries(groupIndentsBySupplier()).map(([supplierId, data]) => (
              <Grid item xs={12} md={6} lg={4} key={supplierId}>
                <Card elevation={3}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BusinessIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h2">
                        {data.supplier.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Pending Indents: {data.indents.length}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    {data.indents.slice(0, 3).map((indent) => (
                      <Typography key={indent._id} variant="body2" sx={{ mb: 0.5 }}>
                        • {indent.indentNumber} - {indent.items.length} items
                      </Typography>
                    ))}
                    {data.indents.length > 3 && (
                      <Typography variant="body2" color="text.secondary">
                        ... and {data.indents.length - 3} more
                      </Typography>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => {
                        setSelectedIndents(data.indents.map(i => i._id));
                        setCreatePoDialog(true);
                      }}
                    >
                      Create PO
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* View Order Dialog */}
        <Dialog
          open={viewDialog}
          onClose={() => setViewDialog(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Purchase Order Details - {selectedOrder?.orderNumber}</DialogTitle>
          <DialogContent>
            {selectedOrder && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Supplier</Typography>
                    <Typography>{selectedOrder.supplier?.name}</Typography>
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
                        <TableCell>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.sku?.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>₹{item.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="h6">
                    Grand Total: ₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Create PO Dialog */}
        <Dialog
          open={createPoDialog}
          onClose={() => setCreatePoDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Selected Indents: {selectedIndents.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This will create a purchase order from the selected indents.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreatePoDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePO} variant="contained">
              Create PO
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}

export default PurchaseOrderMaster;