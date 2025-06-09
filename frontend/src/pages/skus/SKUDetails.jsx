import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  Skeleton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';

function SKUDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sku, setSku] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSKU = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/skus/${id}`);
        setSku(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load SKU details. Please try again later.');
        setLoading(false);
      }
    };

    fetchSKU();
  }, [id]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!sku) {
    return (
      <Alert severity="info">
        SKU not found.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/skus')}
        >
          Back to SKUs
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/skus/edit/${id}`)}
        >
          Edit SKU
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Main Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)' }}>
            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
              <Box
                component="img"
                src={sku.imageUrl || sku.image}
                alt={sku.name}
                sx={{
                  width: 200,
                  height: 200,
                  objectFit: 'cover',
                  borderRadius: 1
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  {sku.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  SKU: {sku.sku}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Barcode: {sku.barcode}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={sku.category}
                    color="primary"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {sku.tags && sku.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                  ))}
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={sku.isActive ? 'Active' : 'Inactive'}
                    color={sku.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {sku.description}
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mt: 3 }}>
              Additional Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1">
                  {sku.location || sku.warehouseId?.name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {sku.updatedAt ? format(new Date(sku.updatedAt), 'MMM dd, yyyy') : 'N/A'}
                </Typography>
              </Grid>
              {sku.notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body1">
                    {sku.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Recent Transactions
            </Typography>
            {/* If you have transactions from backend, map them here */}
            {sku.transactions && sku.transactions.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Reference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sku.transactions.map((transaction) => (
                      <TableRow key={transaction._id || transaction.id}>
                        <TableCell>{format(new Date(transaction.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.type}
                            color={transaction.type === 'purchase' ? 'primary' : 'secondary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{transaction.quantity}</TableCell>
                        <TableCell>{transaction.reference}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No transactions found.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Side Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Stock Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Current Stock
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {sku.currentStock}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Min Stock Level
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {sku.minStockLevel}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Pricing
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Cost Price
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  ₹{sku.costPrice}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Selling Price
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  ₹{sku.sellingPrice}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Location & Supplier
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Warehouse
            </Typography>
            <Typography variant="body1" gutterBottom>
              {sku.warehouseId?.name || 'N/A'}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Primary Supplier
            </Typography>
            <Typography variant="body1" gutterBottom>
              {sku.supplierId?.name || 'N/A'}
            </Typography>

            {sku.alternateSuppliers && sku.alternateSuppliers.length > 0 && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Alternate Suppliers
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {sku.alternateSuppliers.map((supplier) => (
                    <Chip
                      key={supplier._id || supplier}
                      label={supplier.name || supplier}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SKUDetails;