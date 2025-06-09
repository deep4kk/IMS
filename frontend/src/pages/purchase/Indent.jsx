
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, TextField, IconButton, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Chip, Divider, Card, CardContent, Grid, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InventoryIcon from '@mui/icons-material/Inventory';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';

function Indent() {
  const [skus, setSkus] = useState([]);
  const [vendors, setVendors] = useState({}); // Changed to an object to store vendors by SKU
  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ items: [] });
  const [error, setError] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [nextIndentId, setNextIndentId] = useState('');
  const [viewIndent, setViewIndent] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [skuRes, indentRes] = await Promise.all([
        axios.get('/api/skus'),
        axios.get('/api/purchase-indents'),
      ]);
      setSkus(skuRes.data.skus || skuRes.data);
      setIndents(indentRes.data || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const fetchNextIndentId = async () => {
    try {
      const res = await axios.get('/api/purchase-indents/next-indent-id');
      setNextIndentId(res.data.nextIndentId);
    } catch (err) {
      console.error('Failed to fetch next indent ID', err);
    }
  };

  const fetchVendorsForSku = async (skuId) => {
    if (!skuId || vendors[skuId]) return; // Don't fetch if already fetched
    try {
      // Use the SKU endpoint to get vendors from alternateSuppliers
      const res = await axios.get(`/api/skus/${skuId}`, { params: { populate: 'alternateSuppliers' } });
      const skuData = res.data;
      const skuVendors = skuData.alternateSuppliers || [];
      setVendors(v => ({ ...v, [skuId]: skuVendors }));
    } catch (err) {
      console.error(`Failed to fetch vendors for SKU ${skuId}`, err);
      // Set empty array on failure to prevent re-fetching
      setVendors(v => ({ ...v, [skuId]: [] }));
    }
  };

  const handleOpenCreateDialog = () => {
    fetchNextIndentId();
    setOpenCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    // Reset form when closing dialog
    setForm({ items: [] });
    setError(null);
  };

  const handleAddItem = () => {
    setForm(f => ({ ...f, items: [...(f.items || []), { sku: '', quantity: 1, department: '', vendor: '' }] }));
  };

  const handleItemChange = (idx, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[idx][field] = value;
      if (field === 'sku') {
        items[idx].vendor = ''; // Reset vendor if SKU changes
        fetchVendorsForSku(value);
      }
      return { ...f, items };
    });
  };

  const handleRemoveItem = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (form.items.length === 0) {
        setError("Please add at least one item.");
        return;
      }

      for (const item of form.items) {
        if (!item.sku || !item.quantity || !item.department || !item.vendor) {
          setError("All items must have an SKU, quantity, department, and vendor.");
          return;
        }
      }

      // Get user ID from localStorage (adjust if you use context or another method)
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user._id) {
        setError('User not found. Please log in again.');
        return;
      }
      const payload = { ...form, createdBy: user._id };
      await axios.post('/api/purchase-indents', payload);
      fetchData(); // Refresh indent list
      handleCloseCreateDialog(); // Close dialog and reset form
      // TODO: Show success message with indent number
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create indent');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'success';
      case 'PO Created': return 'info';
      case 'Deleted': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <Card elevation={0} sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ py: 3 }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <InventoryIcon sx={{ fontSize: 40 }} />
            </Grid>
            <Grid item xs>
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                Purchase Indents
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Create and manage purchase requisitions for inventory replenishment
              </Typography>
            </Grid>
            <Grid item>
              <Button 
                variant="contained" 
                size="large"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateDialog}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  backdropFilter: 'blur(10px)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                }}
              >
                Create New Indent
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Create Indent Dialog */}
      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Create New Purchase Indent</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Fill in the details below to create a new indent</Typography>
          </Box>
          {nextIndentId && (
            <Chip 
              label={`Indent No: ${nextIndentId}`} 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 600
              }} 
            />
          )}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ backgroundColor: '#f8fafc', p: 0 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <CategoryIcon sx={{ mr: 1 }} />
                Indent Items
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TableContainer 
                component={Paper} 
                elevation={0} 
                sx={{ 
                  mb: 2, 
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
              >
                <Table>
                  <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>SKU Details</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Current Stock</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Vendor</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(form.items || []).map((item, idx) => {
                      const skuObj = skus.find(s => s._id === item.sku);
                      const itemVendors = vendors[item.sku] || [];
                      return (
                        <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                          <TableCell sx={{ py: 2 }}>
                            <Select
                              value={item.sku}
                              onChange={e => handleItemChange(idx, 'sku', e.target.value)}
                              displayEmpty
                              size="small"
                              fullWidth
                              sx={{ 
                                minWidth: 250, 
                                backgroundColor: 'white',
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px'
                                }
                              }}
                            >
                              <MenuItem value="" disabled>
                                <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>
                                  <InventoryIcon sx={{ mr: 1, fontSize: 16 }} />
                                  Select SKU
                                </Box>
                              </MenuItem>
                              {skus.map(sku => (
                                <MenuItem key={sku._id} value={sku._id}>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{sku.name}</Typography>
                                    <Typography variant="caption" color="textSecondary">SKU: {sku.sku}</Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={skuObj?.currentStock ?? '0'} 
                              size="small"
                              color={skuObj?.currentStock > 0 ? 'success' : 'error'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.vendor}
                              onChange={e => handleItemChange(idx, 'vendor', e.target.value)}
                              displayEmpty
                              size="small"
                              fullWidth
                              disabled={!item.sku || itemVendors.length === 0}
                              sx={{ 
                                minWidth: 200, 
                                backgroundColor: 'white',
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px'
                                }
                              }}
                            >
                              <MenuItem value="" disabled>
                                <Box sx={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>
                                  <BusinessIcon sx={{ mr: 1, fontSize: 16 }} />
                                  {item.sku ? (itemVendors.length > 0 ? 'Select Vendor' : 'No vendors') : 'Select SKU first'}
                                </Box>
                              </MenuItem>
                              {itemVendors.map(v => (
                                <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.department}
                              onChange={e => handleItemChange(idx, 'department', e.target.value)}
                              displayEmpty
                              size="small"
                              fullWidth
                              sx={{ 
                                minWidth: 160, 
                                backgroundColor: 'white',
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px'
                                }
                              }}
                            >
                              <MenuItem value="" disabled>Select Department</MenuItem>
                              <MenuItem value="HR">HR</MenuItem>
                              <MenuItem value="IT">IT</MenuItem>
                              <MenuItem value="Finance">Finance</MenuItem>
                              <MenuItem value="Operations">Operations</MenuItem>
                              <MenuItem value="Marketing">Marketing</MenuItem>
                              <MenuItem value="Sales">Sales</MenuItem>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                              inputProps={{ min: 1 }}
                              sx={{ 
                                width: 90, 
                                backgroundColor: 'white',
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: '8px'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              onClick={() => handleRemoveItem(idx)} 
                              size="small" 
                              color="error"
                              sx={{ 
                                '&:hover': { 
                                  backgroundColor: '#fee2e2' 
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Button 
                          onClick={handleAddItem} 
                          variant="outlined" 
                          startIcon={<AddIcon />}
                          sx={{ 
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 500
                          }}
                        >
                          Add Item
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <Button 
              onClick={handleCloseCreateDialog} 
              color="inherit"
              sx={{ 
                textTransform: 'none',
                fontWeight: 500,
                px: 3
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={form.items.length === 0 || form.items.some(item => !item.sku || !item.quantity || !item.department || !item.vendor)}
              sx={{ 
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                borderRadius: '8px'
              }}
            >
              Create Indent
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Indent Dialog */}
      <Dialog open={!!viewIndent} onClose={() => setViewIndent(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white' 
        }}>
          Indent Details
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {viewIndent && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Indent ID</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>{viewIndent.indentId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Status</Typography>
                  <Chip 
                    label={viewIndent.status} 
                    color={getStatusColor(viewIndent.status)}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Created At</Typography>
                  <Typography variant="body1">{new Date(viewIndent.createdAt).toLocaleString()}</Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewIndent.items.map((item, index) => {
                      const sku = skus.find(s => s._id === item.sku);
                      return (
                        <TableRow key={index}>
                          <TableCell>{sku?.name || 'N/A'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.department}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewIndent(null)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Indents List */}
      <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#334155' }}>
              All Purchase Indents
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage and track all purchase requisitions
            </Typography>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : indents.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <InventoryIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">No indents found</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Create your first purchase indent to get started
              </Typography>
              <Button 
                variant="contained" 
                onClick={handleOpenCreateDialog}
                startIcon={<AddIcon />}
              >
                Create Indent
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Indent ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Created Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Items Count</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {indents.map(indent => (
                    <TableRow key={indent._id} sx={{ '&:hover': { backgroundColor: '#f8fafc' } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {indent.indentId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={indent.status} 
                          color={getStatusColor(indent.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {new Date(indent.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={indent.items.length} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => setViewIndent(indent)}
                          sx={{ 
                            textTransform: 'none',
                            borderRadius: '6px'
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Indent;
