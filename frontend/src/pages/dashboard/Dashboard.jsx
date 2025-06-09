import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/dashboard');
        setDashboardData(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        // Simulate loading for demonstration purposes
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    };

    fetchDashboardData();
  }, []);

  // Sample data (in a real app, this would come from the API)
  const sampleDashboardData = {
    totalSKUs: 256,
    activeInventoryValue: 125000,
    lowStockItems: 15,
    pendingOrders: 8,
    monthlySales: [
      { month: 'Jan', sales: 4000 },
      { month: 'Feb', sales: 3000 },
      { month: 'Mar', sales: 5000 },
      { month: 'Apr', sales: 4500 },
      { month: 'May', sales: 6000 },
      { month: 'Jun', sales: 5500 },
    ],
    inventoryDistribution: [
      { id: 0, value: 60, label: 'Warehouse A' },
      { id: 1, value: 25, label: 'Warehouse B' },
      { id: 2, value: 15, label: 'Warehouse C' },
    ],
    categoryDistribution: [
      { name: 'Electronics', value: 30 },
      { name: 'Clothing', value: 25 },
      { name: 'Home Goods', value: 20 },
      { name: 'Sports', value: 15 },
      { name: 'Other', value: 10 },
    ],
    recentTransactions: [
      { id: 1, date: '2023-06-15', type: 'purchase', amount: 1250, supplier: 'ABC Corp' },
      { id: 2, date: '2023-06-14', type: 'sale', amount: 980, customer: 'XYZ Ltd' },
      { id: 3, date: '2023-06-13', type: 'adjustment', amount: -45, reason: 'Damaged' },
    ],
    lowStockItems: [
      { id: '001', name: 'Product A', current: 5, min: 10, supplier: 'ABC Corp' },
      { id: '002', name: 'Product B', current: 3, min: 15, supplier: 'XYZ Ltd' },
      { id: '003', name: 'Product C', current: 7, min: 20, supplier: 'DEF Inc' },
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
          <Grid item xs={12} md={6} lg={3}>
            <motion.div variants={itemVariants}>
              <DashboardCard 
                title="Total SKUs"
                value={loading ? <Skeleton width={80} /> : data.totalSKUs}
                icon={<InventoryIcon />}
                color={theme.palette.primary.main}
                onClick={() => navigate('/skus')}
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <motion.div variants={itemVariants}>
              <DashboardCard 
                title="Active Inventory Value"
                value={loading ? <Skeleton width={100} /> : `₹${data.activeInventoryValue.toLocaleString()}`}
                icon={<TrendingUpIcon />}
                color={theme.palette.secondary.main}
                onClick={() => navigate('/skus')}
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <motion.div variants={itemVariants}>
              <DashboardCard 
                title="Low Stock Items"
                value={loading ? <Skeleton width={50} /> : data.lowStockItems}
                icon={<WarningIcon />}
                color={theme.palette.warning.main}
                onClick={() => navigate('/stock-adjustments')}
                isWarning={true}
              />
            </motion.div>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <motion.div variants={itemVariants}>
              <DashboardCard 
                title="Pending Orders"
                value={loading ? <Skeleton width={50} /> : data.pendingOrders}
                icon={<RefreshIcon />}
                color={theme.palette.info.main} // <-- fixed here
                onClick={() => navigate('/transactions')}
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
                {loading ? (
                  <Box sx={{ width: '100%', height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Skeleton variant="rectangular" width="100%" height={300} />
                  </Box>
                ) : (
                  <Box sx={{ width: '100%', height: 350 }}>
                    <BarChart
                      series={[{
                        data: data.monthlySales?.map(item => item.sales) || [],
                        label: 'Sales',
                        color: theme.palette.primary.main,
                      }]}
                      xAxis={[{
                        data: data.monthlySales.map(item => item.month),
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
                  Inventory by Warehouse
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
                          data: data.inventoryDistribution,
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
                    Low Stock Items
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="small"
                    onClick={() => navigate('/stock-adjustments')}
                  >
                    Manage Stock
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