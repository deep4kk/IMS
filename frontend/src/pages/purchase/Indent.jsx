import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, TextField, IconButton, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

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
      const res = await axios.get(`/api/purchase-indents/sku/${skuId}/vendors`);
      setVendors(v => ({ ...v, [skuId]: res.data }));
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

  return (
    <Box sx={{ p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Purchase Indents
          </Typography>
          <Button variant="contained" color="primary" onClick={handleOpenCreateDialog}>
            Create New Indent
          </Button>
        </Box>
      </Paper>

      <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
          Create New Indent
          {nextIndentId && <Typography variant="body1" sx={{ float: 'right', color: 'white', mt: 1 }}>Indent No: {nextIndentId}</Typography>}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ backgroundColor: '#f9f9f9' }}>
            <Typography variant="h6" sx={{ mt: 2, mb: 2, color: 'primary.dark' }}>Items</Typography>
            <TableContainer component={Paper} elevation={2} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: 'primary.light' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Current Stock</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Vendor</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Quantity</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(form.items || []).map((item, idx) => {
                    const skuObj = skus.find(s => s._id === item.sku);
                    const itemVendors = vendors[item.sku] || [];
                    return (
                      <TableRow key={idx} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f3f3f3' } }}>
                        <TableCell>
                          <Select
                            value={item.sku}
                            onChange={e => handleItemChange(idx, 'sku', e.target.value)}
                            displayEmpty
                            size="small"
                            fullWidth
                            sx={{ minWidth: 200, backgroundColor: 'white' }}
                          >
                            <MenuItem value="" disabled>Select SKU</MenuItem>
                            {skus.map(sku => (
                              <MenuItem key={sku._id} value={sku._id}>{sku.name} ({sku.sku})</MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell align="center">{skuObj?.currentStock ?? '-'}</TableCell>
                        <TableCell>
                          <Select
                            value={item.vendor}
                            onChange={e => handleItemChange(idx, 'vendor', e.target.value)}
                            displayEmpty
                            size="small"
                            fullWidth
                            disabled={!item.sku || itemVendors.length === 0}
                            sx={{ minWidth: 180, backgroundColor: 'white' }}
                          >
                            <MenuItem value="" disabled>
                              {item.sku ? (itemVendors.length > 0 ? 'Select Vendor' : 'No vendors') : 'Select SKU first'}
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
                            sx={{ minWidth: 160, backgroundColor: 'white' }}
                          >
                            <MenuItem value="" disabled>Select Department</MenuItem>
                            <MenuItem value="HR">HR</MenuItem>
                            <MenuItem value="IT">IT</MenuItem>
                            <MenuItem value="Finance">Finance</MenuItem>
                            <MenuItem value="Operations">Operations</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity}
                            onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                            inputProps={{ min: 1 }}
                            sx={{ width: 90, backgroundColor: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleRemoveItem(idx)} size="small" color="error"><DeleteIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Button onClick={handleAddItem} variant="outlined" size="small">Add Item</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            {error && <Typography color="error" sx={{ mb: 2, fontWeight: 'bold' }}>{error}</Typography>}
          </DialogContent>
          <DialogActions sx={{ p: '16px 24px', backgroundColor: '#f0f0f0' }}>
            <Button onClick={handleCloseCreateDialog} color="secondary">Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={form.items.length === 0 || form.items.some(item => !item.sku || !item.quantity || !item.department || !item.vendor)}
            >
              Save Indent
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={!!viewIndent} onClose={() => setViewIndent(null)} maxWidth="md" fullWidth>
        <DialogTitle>Indent Details</DialogTitle>
        <DialogContent>
          {viewIndent && (
            <Box>
              <Typography variant="h6">Indent ID: {viewIndent.indentId}</Typography>
              <Typography>Status: {viewIndent.status}</Typography>
              <Typography>Created At: {new Date(viewIndent.createdAt).toLocaleString()}</Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>SKU</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Department</TableCell>
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
        <DialogActions>
          <Button onClick={() => setViewIndent(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">All Indents</Typography>
        {loading ? <CircularProgress /> : (
          indents.length === 0 ? <Typography>No Data available</Typography> : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Indent ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {indents.map(indent => (
                    <TableRow key={indent._id}>
                      <TableCell>{indent.indentId}</TableCell>
                      <TableCell>{indent.status}</TableCell>
                      <TableCell>{new Date(indent.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{indent.items.length}</TableCell>
                      <TableCell>
                        <Button variant="outlined" size="small" onClick={() => setViewIndent(indent)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}
      </Box>
      {error && <Typography color="error">{error}</Typography>}
    </Box>
  );
}

export default Indent;
