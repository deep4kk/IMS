
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Tabs, Tab, Card, CardContent, Grid, 
  CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Divider
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import axios from 'axios';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function Reports() {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [purchaseData, setPurchaseData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [customerData, setCustomerData] = useState([]);
  const [supplierData, setSupplierData] = useState([]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, inventoryRes, financialRes, customerRes, supplierRes] = await Promise.all([
        axios.get('/api/reports/sales'),
        axios.get('/api/reports/inventory'),
        axios.get('/api/reports/financial'),
        axios.get('/api/reports/customers'),
        axios.get('/api/reports/suppliers')
      ]);

      setSalesData(salesRes.data);
      setInventoryData(inventoryRes.data);
      setFinancialData(financialRes.data);
      setCustomerData(customerRes.data);
      setSupplierData(supplierRes.data);
      
      // Mock purchase data since it's not implemented yet
      setPurchaseData({
        summary: {
          totalPurchaseOrders: 45,
          totalAmount: 125000,
          pendingOrders: 12
        },
        monthlyPurchases: [
          { month: 'Jan', amount: 15000, orders: 8 },
          { month: 'Feb', amount: 22000, orders: 12 },
          { month: 'Mar', amount: 18000, orders: 10 },
          { month: 'Apr', amount: 25000, orders: 15 }
        ]
      });
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load reports data');
      setLoading(false);
      console.error('Reports error:', err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Card elevation={0} sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ py: 3 }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <AssessmentIcon sx={{ fontSize: 40 }} />
            </Grid>
            <Grid item xs>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                Business Reports
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Comprehensive analytics and insights for your business operations
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Tabs 
          value={value} 
          onChange={handleChange} 
          aria-label="reports tabs"
          sx={{
            backgroundColor: '#f8fafc',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem'
            }
          }}
        >
          <Tab icon={<TrendingUpIcon />} label="Sales Reports" />
          <Tab icon={<InventoryIcon />} label="Inventory Reports" />
          <Tab icon={<ShoppingCartIcon />} label="Purchase Reports" />
        </Tabs>
      </Paper>

      <TabPanel value={value} index={0}>
        {/* Sales Reports */}
        <Grid container spacing={3}>
          {/* Sales Summary Cards */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#334155' }}>
                  Sales Overview
                </Typography>
                {salesData && (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Total Orders</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#059669' }}>
                        {salesData.summary.totalOrders}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Total Revenue</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: '#3b82f6' }}>
                        {formatCurrency(salesData.summary.totalAmount)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Avg. Order Value</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {formatCurrency(salesData.summary.averageOrderValue)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sales by Status */}
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#334155' }}>
                  Sales by Status
                </Typography>
                {salesData?.salesByStatus && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData.salesByStatus}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'totalAmount' ? formatCurrency(value) : value,
                        name === 'totalAmount' ? 'Amount' : 'Count'
                      ]} />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Orders Count" />
                      <Bar dataKey="totalAmount" fill="#82ca9d" name="Total Amount" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Top Customers */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#334155' }}>
                  Top Customers by Revenue
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Customer Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Total Orders</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Total Spent</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Outstanding</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customerData.slice(0, 10).map((customer, index) => (
                        <TableRow key={customer._id} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                          <TableCell>{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>
                            <Chip label={customer.totalOrders} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#059669' }}>
                            {formatCurrency(customer.totalSpent)}
                          </TableCell>
                          <TableCell sx={{ color: customer.outstandingAmount > 0 ? '#dc2626' : '#059669' }}>
                            {formatCurrency(customer.outstandingAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={value} index={1}>
        {/* Inventory Reports */}
        <Grid container spacing={3}>
          {/* Inventory Summary */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#334155' }}>
                  Inventory Summary
                </Typography>
                {inventoryData && (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: '#0369a1' }}>
                          {inventoryData.summary.totalSKUs}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">Total SKUs</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: '#d97706' }}>
                          {inventoryData.summary.lowStockItems}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">Low Stock</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fee2e2', borderRadius: '8px' }}>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: '#dc2626' }}>
                          {inventoryData.summary.outOfStockItems}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">Out of Stock</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#059669' }}>
                          {formatCurrency(inventoryData.summary.totalInventoryValue)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">Total Value</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Stock by Category */}
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#334155' }}>
                  Stock by Category
                </Typography>
                {inventoryData?.stockByCategory && (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={inventoryData.stockByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ _id, percent }) => `${_id} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalValue"
                      >
                        {inventoryData.stockByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Low Stock Items */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#334155' }}>
                  Low Stock Items
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>SKU Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>SKU Code</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Current Stock</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Min Stock</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inventoryData?.skus
                        ?.filter(sku => sku.currentStock <= sku.minStock)
                        ?.slice(0, 10)
                        ?.map((sku) => (
                        <TableRow key={sku._id} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                          <TableCell>{sku.name}</TableCell>
                          <TableCell>{sku.sku}</TableCell>
                          <TableCell>
                            <Chip 
                              label={sku.currentStock} 
                              color={sku.currentStock === 0 ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{sku.minStock}</TableCell>
                          <TableCell>{sku.category}</TableCell>
                          <TableCell>
                            <Chip 
                              label={sku.currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                              color={sku.currentStock === 0 ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={value} index={2}>
        {/* Purchase Reports */}
        <Grid container spacing={3}>
          {/* Purchase Summary */}
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#334155' }}>
                  Purchase Overview
                </Typography>
                {purchaseData && (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Total Purchase Orders</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#7c3aed' }}>
                        {purchaseData.summary.totalPurchaseOrders}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: '#059669' }}>
                        {formatCurrency(purchaseData.summary.totalAmount)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Pending Orders</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#dc2626' }}>
                        {purchaseData.summary.pendingOrders}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Purchase Trend */}
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#334155' }}>
                  Monthly Purchase Trend
                </Typography>
                {purchaseData?.monthlyPurchases && (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={purchaseData.monthlyPurchases}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'amount' ? formatCurrency(value) : value,
                        name === 'amount' ? 'Amount' : 'Orders'
                      ]} />
                      <Legend />
                      <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Purchase Amount" />
                      <Line type="monotone" dataKey="orders" stroke="#82ca9d" name="Number of Orders" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Top Suppliers */}
          <Grid item xs={12}>
            <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#334155' }}>
                  Top Suppliers by Inventory Value
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Supplier Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Total SKUs</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Inventory Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {supplierData.slice(0, 10).map((supplier) => (
                        <TableRow key={supplier._id} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                          <TableCell>{supplier.name}</TableCell>
                          <TableCell>{supplier.email}</TableCell>
                          <TableCell>{supplier.phone}</TableCell>
                          <TableCell>
                            <Chip label={supplier.totalSKUs} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#059669' }}>
                            {formatCurrency(supplier.totalInventoryValue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}

export default Reports;
