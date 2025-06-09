import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  GetApp as ExportIcon,
  Business as SupplierIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function PurchaseOrderMaster() {
  const [activeTab, setActiveTab] = useState(0);
  const [allPOs, setAllPOs] = useState([]);
  const [pendingPOs, setPendingPOs] = useState([]);
  const [supplierGroups, setSupplierGroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [createPODialog, setCreatePODialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [newPOData, setNewPOData] = useState({
    supplier: '',
    expectedDeliveryDate: '',
    terms: '',
    notes: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [posResponse, suppliersResponse] = await Promise.all([
        axios.get('/api/purchase-orders'),
        axios.get('/api/suppliers')
      ]);

      const allOrders = posResponse.data.purchaseOrders || [];
      setAllPOs(allOrders);

      // Group pending POs by supplier
      const pending = allOrders.filter(po => po.status === 'pending' || po.status === 'draft');
      setPendingPOs(pending);

      // Group by supplier
      const grouped = pending.reduce((acc, po) => {
        const supplierId = po.supplier?._id || 'unknown';
        const supplierName = po.supplier?.name || 'Unknown Supplier';

        if (!acc[supplierId]) {
          acc[supplierId] = {
            supplier: po.supplier,
            orders: []
          };
        }
        acc[supplierId].orders.push(po);
        return acc;
      }, {});

      setSupplierGroups(grouped);
      setSuppliers(suppliersResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleCreatePO = async () => {
    if (!newPOData.supplier) return;

    try {
      const response = await axios.post('/api/purchase-orders', {
        ...newPOData,
        status: 'draft',
        items: [] // Empty items array for new PO
      });

      setCreatePODialog(false);
      setNewPOData({
        supplier: '',
        expectedDeliveryDate: '',
        terms: '',
        notes: ''
      });
      fetchAllData();
    } catch (error) {
      console.error('Error creating PO:', error);
    }
  };

  const exportToPDF = (orders, title) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);

    const tableColumn = ['PO Number', 'Supplier', 'Total Amount', 'Status', 'Date'];
    const tableRows = orders.map(po => [
      po.poNumber || 'N/A',
      po.supplier?.name || 'Unknown',
      `$${po.totalAmount?.toFixed(2) || '0.00'}`,
      po.status,
      format(new Date(po.createdAt), 'dd/MM/yyyy')
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'received': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Purchase Order Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => exportToPDF(
              activeTab === 0 ? allPOs : pendingPOs,
              activeTab === 0 ? 'All Purchase Orders' : 'Pending Purchase Orders'
            )}
          >
            Export PDF
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreatePODialog(true)}
          >
            Create PO
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label={`Master (${allPOs.length})`} />
            <Tab label={`Pending (${pendingPOs.length})`} />
            <Tab label="Supplier Wise" />
          </Tabs>

          {/* Master Tab - All POs */}
          <TabPanel value={activeTab} index={0}>
            {allPOs.length === 0 ? (
              <Alert severity="info">No purchase orders found</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>PO Number</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell>Total Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Order Date</TableCell>
                      <TableCell>Expected Delivery</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allPOs.map((po) => (
                      <TableRow key={po._id} hover>
                        <TableCell>{po.poNumber || 'N/A'}</TableCell>
                        <TableCell>{po.supplier?.name || 'Unknown'}</TableCell>
                        <TableCell>${po.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={po.status} 
                            color={getStatusColor(po.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{format(new Date(po.createdAt), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          {po.expectedDeliveryDate ? 
                            format(new Date(po.expectedDeliveryDate), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="View">
                              <IconButton size="small">
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small">
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Pending Tab */}
          <TabPanel value={activeTab} index={1}>
            {pendingPOs.length === 0 ? (
              <Alert severity="info">No pending purchase orders</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>PO Number</TableCell>
                      <TableCell>Supplier</TableCell>
                      <TableCell>Total Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Order Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingPOs.map((po) => (
                      <TableRow key={po._id} hover>
                        <TableCell>{po.poNumber || 'N/A'}</TableCell>
                        <TableCell>{po.supplier?.name || 'Unknown'}</TableCell>
                        <TableCell>${po.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={po.status} 
                            color={getStatusColor(po.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{format(new Date(po.createdAt), 'dd/MM/yyyy')}</TableCell>
                        <TableCell align="center">
                          <Button variant="outlined" size="small">
                            Edit PO
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Supplier Wise Tab */}
          <TabPanel value={activeTab} index={2}>
            {Object.keys(supplierGroups).length === 0 ? (
              <Alert severity="info">No supplier wise data available</Alert>
            ) : (
              <Box>
                {Object.entries(supplierGroups).map(([supplierId, group]) => (
                  <Card key={supplierId} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SupplierIcon color="primary" />
                          <Typography variant="h6">
                            {group.supplier?.name || 'Unknown Supplier'}
                          </Typography>
                          <Chip 
                            label={`${group.orders.length} POs`} 
                            size="small" 
                            color="primary"
                          />
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            setSelectedSupplier(supplierId);
                            setNewPOData({ ...newPOData, supplier: supplierId });
                            setCreatePODialog(true);
                          }}
                        >
                          Create PO
                        </Button>
                      </Box>

                      <TableContainer component={Paper} elevation={1}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>PO Number</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Date</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {group.orders.map((po) => (
                              <TableRow key={po._id}>
                                <TableCell>{po.poNumber || 'N/A'}</TableCell>
                                <TableCell>${po.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={po.status} 
                                    color={getStatusColor(po.status)}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>{format(new Date(po.createdAt), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>
                                  <Button variant="text" size="small">
                                    Edit
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Create PO Dialog */}
      <Dialog open={createPODialog} onClose={() => setCreatePODialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Purchase Order</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={newPOData.supplier}
                  onChange={(e) => setNewPOData({ ...newPOData, supplier: e.target.value })}
                  label="Supplier"
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Expected Delivery Date"
                value={newPOData.expectedDeliveryDate}
                onChange={(e) => setNewPOData({ ...newPOData, expectedDeliveryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Terms & Conditions"
                multiline
                rows={2}
                value={newPOData.terms}
                onChange={(e) => setNewPOData({ ...newPOData, terms: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={newPOData.notes}
                onChange={(e) => setNewPOData({ ...newPOData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePODialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreatePO}
            variant="contained"
            disabled={!newPOData.supplier}
          >
            Create PO
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PurchaseOrderMaster;