import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Select, MenuItem, CircularProgress, IconButton, TextField, InputAdornment, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';

function IndentApproval() {
  const [indents, setIndents] = useState([]);
  const [approvedIndents, setApprovedIndents] = useState([]);
  const [skus, setSkus] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // indent id
  const [originalItems, setOriginalItems] = useState([]);
  const [editItems, setEditItems] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [viewingIndent, setViewingIndent] = useState(null);
  const [indentLogs, setIndentLogs] = useState([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [skuRes, vendorRes] = await Promise.all([
        axios.get('/api/skus'),
        axios.get('/api/suppliers'),
      ]);
      setSkus(skuRes.data.skus || skuRes.data);
      setVendors(vendorRes.data.suppliers || vendorRes.data);

      if (activeTab === 0) {
        const indentRes = await axios.get('/api/purchase-indents/pending-for-approval');
        setIndents(indentRes.data || []);
      } else {
        const approvedIndentRes = await axios.get('/api/purchase-indents/approved-indents');
        setApprovedIndents(approvedIndentRes.data || []);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleEdit = (indent) => {
    setEditing(indent._id);
    const items = indent.items.map(it => ({ ...it }));
    setOriginalItems(JSON.parse(JSON.stringify(items)));
    setEditItems(items);
  };

  const handleItemChange = (idx, field, value) => {
    setEditItems(items => {
      const arr = [...items];
      arr[idx][field] = value;
      if (field === 'sku') arr[idx].vendor = '';
      return arr;
    });
  };

  const handleSave = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user._id) {
        setError('User not found. Please log in again.');
        return;
      }
      await axios.put(`/api/purchase-indents/${editing}`, {
        items: editItems,
        originalItems: originalItems,
        userId: user._id
      });
      setEditing(null);
      setEditItems([]);
      setOriginalItems([]);
      fetchData();
    } catch (err) {
      setError('Failed to update indent: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleApprove = async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user._id) {
        setError('User not found. Please log in again.');
        return;
      }

      const indentToApprove = indents.find(indent => indent._id === id);
      if (!indentToApprove) {
        setError('Indent not found for approval.');
        return;
      }

      // Use editItems if this indent is currently being edited, otherwise use its original items.
      // Ensure that vendor is selected for all items before approving.
      const itemsToApprove = (editing === id ? editItems : indentToApprove.items).map(item => {
        // Ensure vendor is present, otherwise the PO creation will fail later
        if (!item.vendor) {
          // This is a client-side catch. Ideally, UI should enforce vendor selection.
          throw new Error(`Vendor not selected for SKU: ${skus.find(s=>s._id === item.sku)?.name || item.sku}`);
        }
        return {
          sku: item.sku,
          quantity: item.quantity,
          vendor: item.vendor, // Ensure vendor is included
        };
      });


      await axios.post(`/api/purchase-indents/${id}/approve`, {
        userId: user._id,
        items: itemsToApprove, // Send the items with confirmed vendors
        // approvalRemarks: "Approved via UI" // Optionally add remarks
      });

      // Reset editing state if the approved indent was being edited
      if (editing === id) {
        setEditing(null);
        setEditItems([]);
      }
      fetchData(); // Refresh data to reflect changes
    } catch (err) {
      setError(`Failed to approve indent: ${err.message || 'Server error'}`);
      console.error("Error approving indent:", err);
    }
  };

  // Filter indents by search (by indent ID or SKU name)
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const displayedIndents = (activeTab === 0 ? indents : approvedIndents).filter(i => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const idMatch = i.indentId?.toLowerCase().includes(searchLower);
    const skuMatch = (i.items || []).some(it => {
      const sku = skus.find(s => s._id === it.sku);
      return sku?.name?.toLowerCase().includes(searchLower) || sku?.sku?.toLowerCase().includes(searchLower);
    });
    return idMatch || skuMatch;
  });

  const handleViewIndent = async (indent) => {
    setViewingIndent(indent);
    try {
      const res = await axios.get(`/api/purchase-indents/${indent._id}/logs`);
      setIndentLogs(res.data);
    } catch (err) {
      console.error("Failed to fetch indent logs", err);
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Indent Approval
        </Typography>
        <TextField
          placeholder="Search by Indent ID or SKU name"
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ mb: 2, width: 350 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Paper>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="indent status tabs">
          <Tab label="Pending for Approval" />
          <Tab label="Master (Approved & Pending)" />
        </Tabs>
      </Box>

      {loading ? <CircularProgress /> : (
        displayedIndents.length === 0 ? (
          <Typography sx={{ mt: 4, textAlign: 'center', fontStyle: 'italic' }}>No Data available for the selected tab.</Typography>
        ) : (
          <TableContainer component={Paper} elevation={3}>
            <Table size="medium" aria-label="indent approval table">
              <TableHead sx={{ backgroundColor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Indent ID</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Items</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedIndents.map(indent => (
                  <TableRow key={indent._id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                    <TableCell component="th" scope="row">
                      {indent.indentId}
                    </TableCell>
                    <TableCell>{new Date(indent.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {editing === indent._id ? (
                        <Table size="small" sx={{ width: '100%' }}>
                          <TableHead>
                            <TableRow>
                              <TableCell>SKU</TableCell>
                              <TableCell>Stock</TableCell>
                              <TableCell>Qty</TableCell>
                              <TableCell>Dept</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {editItems.map((item, idx) => {
                              const skuObj = skus.find(s => s._id === item.sku);
                              return (
                                <TableRow key={idx}>
                                  <TableCell>{skuObj?.name}</TableCell>
                                  <TableCell>{skuObj?.currentStock}</TableCell>
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={item.quantity}
                                      onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                                      inputProps={{ min: 1 }}
                                      sx={{ width: 80 }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Select
                                      value={item.department}
                                      onChange={e => handleItemChange(idx, 'department', e.target.value)}
                                      size="small"
                                      fullWidth
                                    >
                                      <MenuItem value="HR">HR</MenuItem>
                                      <MenuItem value="IT">IT</MenuItem>
                                      <MenuItem value="Finance">Finance</MenuItem>
                                      <MenuItem value="Operations">Operations</MenuItem>
                                    </Select>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        (indent.items || []).length + " items"
                      )}
                    </TableCell>
                    <TableCell>{indent.status}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => handleViewIndent(indent)}>View</Button>
                      {editing === indent._id ? (
                        <>
                          <Button onClick={handleSave} size="small" variant="contained" color="primary" sx={{ ml: 1 }}>Save</Button>
                          <Button onClick={() => setEditing(null)} size="small" sx={{ ml: 1 }}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          {indent.status === 'Pending' && (
                            <>
                              <IconButton onClick={() => handleEdit(indent)} size="small" aria-label="edit indent" color="primary" sx={{ ml: 1 }}>
                                <EditIcon />
                              </IconButton>
                              <Button onClick={() => handleApprove(indent._id)} size="small" variant="contained" color="success" sx={{ ml: 1 }}>
                                Approve
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}
      {error && <Typography color="error" sx={{ mt: 2, textAlign: 'center', fontWeight: 'bold' }}>{error}</Typography>}
      <Dialog open={!!viewingIndent} onClose={() => setViewingIndent(null)} maxWidth="lg" fullWidth>
        <DialogTitle>Indent Details - {viewingIndent?.indentId}</DialogTitle>
        <DialogContent>
          {viewingIndent && (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>SKU</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Department</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewingIndent.items.map((item, idx) => {
                      const sku = skus.find(s => s._id === item.sku);
                      return (
                        <TableRow key={idx}>
                          <TableCell>{sku?.name || 'N/A'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.department}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="h6" sx={{ mt: 2 }}>Change Log</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Field</TableCell>
                      <TableCell>Old Value</TableCell>
                      <TableCell>New Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {indentLogs.map(log => log.changes.map((change, idx) => (
                      <TableRow key={`${log._id}-${idx}`}>
                        <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{log.user?.name}</TableCell>
                        <TableCell>{change.field}</TableCell>
                        <TableCell>{String(change.oldValue)}</TableCell>
                        <TableCell>{String(change.newValue)}</TableCell>
                      </TableRow>
                    )))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewingIndent(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default IndentApproval;
