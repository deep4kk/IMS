
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Receipt,
  Inventory,
  LocalShipping,
  Assignment
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';
import { useAlert } from '../../context/AlertContext';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

function PurchaseDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalPOs: 0,
    totalSpent: 0,
    pendingReceiving: 0,
    completedPOs: 0,
    statusBreakdown: [],
    recentPOs: [],
    monthlySpending: [],
    topVendors: []
  });
  const [timeFilter, setTimeFilter] = useState('30days');
  const { showError } = useAlert();

  useEffect(() => {
    fetchDashboardData();
  }, [timeFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [posRes, indentsRes] = await Promise.all([
        axios.get('/api/purchase-orders', { params: { limit: 10 } }),
        axios.get('/api/purchase-indents', { params: { limit: 5 } })
      ]);

      // Mock data for demonstration - replace with actual API calls
      const mockStats = {
        totalPOs: posRes.data?.length || 0,
        totalSpent: 125000,
        pendingReceiving: 8,
        completedPOs: 45,
        statusBreakdown: [
          { _id: 'issued', count: 12, name: 'Issued' },
          { _id: 'received', count: 45, name: 'Received' },
          { _id: 'partially_received', count: 8, name: 'Partially Received' },
          { _id: 'cancelled', count: 3, name: 'Cancelled' }
        ],
        monthlySpending: [
          { month: 'Jan', spending: 15000 },
          { month: 'Feb', spending: 18000 },
          { month: 'Mar', spending: 22000 },
          { month: 'Apr', spending: 19000 },
          { month: 'May', spending: 25000 },
          { month: 'Jun', spending: 21000 }
        ],
        topVendors: [
          { name: 'Supplier A', amount: 45000 },
          { name: 'Supplier B', amount: 32000 },
          { name: 'Supplier C', amount: 28000 },
          { name: 'Supplier D', amount: 20000 }
        ]
      };

      setDashboardData({
        ...mockStats,
        recentPOs: posRes.data || []
      });
    } catch (error) {
      showError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      issued: 'primary',
      received: 'success',
      partially_received: 'warning',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Purchase Dashboard
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={timeFilter}
            label="Time Period"
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <MenuItem value="7days">Last 7 Days</MenuItem>
            <MenuItem value="30days">Last 30 Days</MenuItem>
            <MenuItem value="90days">Last 90 Days</MenuItem>
            <MenuItem value="1year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: 'Total Purchase Orders', value: dashboardData.totalPOs, icon: <Receipt sx={{ fontSize: 40 }} />, color: 'primary.main' },
          { title: 'Total Spent', value: `₹${dashboardData.totalSpent.toLocaleString()}`, icon: <Inventory sx={{ fontSize: 40 }} />, color: 'info.main' },
          { title: 'Pending Receiving', value: dashboardData.pendingReceiving, icon: <LocalShipping sx={{ fontSize: 40 }} />, color: 'warning.main' },
          { title: 'Completed POs', value: dashboardData.completedPOs, icon: <Assignment sx={{ fontSize: 40 }} />, color: 'success.main' }
        ].map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={3} sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <Box sx={{ color: item.color, mr: 2 }}>{item.icon}</Box>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {item.value}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* PO Status Breakdown */}
        <Grid item xs={12} md={6} lg={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                Purchase Order Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {dashboardData.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Spending Trend */}
        <Grid item xs={12} md={6} lg={8}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                Monthly Spending Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardData.monthlySpending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="spending" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Vendors */}
        <Grid item xs={12} lg={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                Top Vendors by Spending
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.topVendors} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Purchase Orders */}
        <Grid item xs={12} lg={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                Recent Purchase Orders
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>PO Number</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Vendor</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentPOs.slice(0, 5).map((po, index) => (
                      <TableRow key={po._id || index} hover>
                        <TableCell>{po.poNumber || `PO-${1000 + index}`}</TableCell>
                        <TableCell>{po.vendor?.name || 'Vendor Name'}</TableCell>
                        <TableCell>
                          {po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={po.status || 'issued'}
                            color={getStatusColor(po.status || 'issued')}
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
    </Box>
  );
}

export default PurchaseDashboard;
