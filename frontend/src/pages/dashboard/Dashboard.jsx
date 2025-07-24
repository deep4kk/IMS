import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Button,
  useTheme,
  Skeleton,
  Divider,
  Alert
} from '@mui/material';
import { 
  PieChart,
  BarChart,
  LineChart
} from '@mui/x-charts';
import { 
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';

import DashboardCard from '../../components/dashboard/DashboardCard';
import LowStockTable from '../../components/dashboard/LowStockTable';

function Dashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user?.token) {
          setError('Please log in to view the dashboard');
          return;
        }
        
        setLoading(true);
        const response = await axios.get('/api/dashboard', {
          headers: {
            Authorization: `Bearer ${user.token}`
          }
        });
        setDashboardData(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.response?.data?.message || 'Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Sample ecommerce data (in a real app, this would come from the API)
  const sampleDashboardData = {
    totalProducts: 1256,
    activeInventoryValue: 525000,
    lowStockItems: 23,
    pendingOrders: 47,
    onlineOrders: 156,
    totalRevenue: 89500,
    conversionRate: 3.2,
    avgOrderValue: 574,
    monthlySales: [
      { month: 'Jan', sales: 45000, orders: 78 },
      { month: 'Feb', sales: 52000, orders: 91 },
      { month: 'Mar', sales: 67000, orders: 117 },
      { month: 'Apr', sales: 58000, orders: 101 },
      { month: 'May', sales: 73000, orders: 127 },
      { month: 'Jun', sales: 89500, orders: 156 },
    ],
    channelDistribution: [
      { id: 0, value: 45, label: 'Website' },
      { id: 1, value: 30, label: 'Mobile App' },
      { id: 2, value: 15, label: 'Marketplace' },
      { id: 3, value: 10, label: 'Social Commerce' },
    ],
    categoryDistribution: [
      { name: 'Electronics', value: 30 },
      { name: 'Fashion', value: 25 },
      { name: 'Home & Living', value: 20 },
      { name: 'Beauty & Personal Care', value: 15 },
      { name: 'Other', value: 10 },
    ],
    recentOrders: [
      { id: 1, date: '2023-06-15', type: 'online', amount: 1250, customer: 'John Doe', status: 'processing' },
      { id: 2, date: '2023-06-14', type: 'mobile', amount: 980, customer: 'Jane Smith', status: 'shipped' },
      { id: 3, date: '2023-06-13', type: 'marketplace', amount: 745, customer: 'Mike Johnson', status: 'delivered' },
    ],
    lowStockItems: [
      { id: 'SKU001', name: 'Wireless Headphones', current: 5, min: 10, supplier: 'TechCorp' },
      { id: 'SKU002', name: 'Smart Watch', current: 3, min: 15, supplier: 'GadgetCo' },
      { id: 'SKU003', name: 'Bluetooth Speaker', current: 7, min: 20, supplier: 'AudioTech' },
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  // Merge sample data with API data to ensure all keys exist
  const data = { ...sampleDashboardData, ...dashboardData };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} sm={6} lg={3}>
            <motion.div variants={itemVariants}>
              <DashboardCard 
                title="Total Products"
                value={loading ? <Skeleton width={80} /> : typeof data.totalProducts === 'number' ? data.totalProducts.toString() : data.totalProducts}
                icon={<InventoryIcon />}
                color="primary"
                onClick={() => navigate('/skus')}
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <motion.div variants={itemVariants}>
              <DashboardCard 
                title="Total Revenue"
                value={loading ? <Skeleton width={120} /> : typeof data.totalRevenue === 'number' ? `₹${data.totalRevenue.toLocaleString()}` : data.totalRevenue}
                icon={<TrendingUpIcon />}
                color="success"
                onClick={() => navigate('/sales/dashboard')}
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <motion.div variants={itemVariants}>
              <DashboardCard 
                title="Online Orders"
                value={loading ? <Skeleton width={80} /> : typeof data.onlineOrders === 'number' ? data.onlineOrders.toString() : data.onlineOrders}
                icon={<WarningIcon />}
                color="info"
                onClick={() => navigate('/sales/orders')}
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <motion.div variants={itemVariants}>
              <DashboardCard 
                title="Pending Orders"
                value={loading ? <Skeleton width={80} /> : typeof data.pendingOrders === 'number' ? data.pendingOrders.toString() : data.pendingOrders}
                icon={<RefreshIcon />}
                color="info"
                onClick={() => navigate('/orders')}
              />
            </motion.div>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} lg={8}>
            <motion.div variants={itemVariants}>
              <Paper 
                sx={{ 
                  p: 3, 
                  height: '100%',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Monthly Sales Trend
                </Typography>
                  <Box sx={{ width: '100%', height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Skeleton variant="rectangular" width="100%" height={300} />
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: 350 }}>
                    <BarChart
                      series={[{
                        data: data.monthlyRevenue?.map(item => item.revenue) || [],
                        label: 'Revenue (₹)',
                        color: theme.palette.primary.main,
                      }]}
                      xAxis={[{
                        data: data.monthlyRevenue.map(item => item.month),
                        scaleType: 'band',
                      }]}
                      height={300}
                    />
                  </Box>
                )}
              </Paper>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <motion.div variants={itemVariants}>
              <Paper 
                sx={{ 
                  p: 3,
                  height: '100%',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                  borderRadius: 2
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Sales by Channel
                </Typography>
                {loading ? (
                  <Box sx={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Skeleton variant="circular" width={250} height={250} />
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center' }}>
                    <PieChart
                      series={[
                        {
                          data: data.channelDistribution,
                          innerRadius: 60,
                          paddingAngle: 2,
                          cornerRadius: 4,
                        },
                      ]}
                      height={300}
                    />
                  </Box>
                )}
              </Paper>
            </motion.div>
          </Grid>

          {/* Low Stock Items */}
          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <Paper 
                sx={{ 
                  p: 3, 
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Low Stock Products
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="small"
                    onClick={() => navigate('/inventory/adjustments')}
                  >
                    Restock Products
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {loading ? (
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant="rectangular" width="100%" height={50} sx={{ mb: 1 }} />
                    <Skeleton variant="rectangular" width="100%" height={50} sx={{ mb: 1 }} />
                    <Skeleton variant="rectangular" width="100%" height={50} />
                  </Box>
                ) : (
                  <LowStockTable items={data.lowStockItems} />
                )}
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
}

export default Dashboard;