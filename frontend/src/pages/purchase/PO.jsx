import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Select, MenuItem, CircularProgress, TextField, Tabs, Tab, Alert, AlertTitle
} from '@mui/material';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Correct import for autoTable

function PO() {
  const [indents, setIndents] = useState([]); // For "Pending for PO" tab
  const [skus, setSkus] = useState([]); // For SKU details in "Pending for PO" tab
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [poItemsForVendor, setPoItemsForVendor] = useState([]);
  const [loadingPoItems, setLoadingPoItems] = useState(false);
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({
    deliveryDueDate: '',
    paymentDays: '',
    freight: '',
  });
  const [loading, setLoading] = useState(true); // General loading for initial data
  const [error, setError] = useState(null); // General error
  const [poCreationError, setPoCreationError] = useState(null);
  const [poSuccessMessage, setPoSuccessMessage] = useState(null);
  const [isSubmittingPO, setIsSubmittingPO] = useState(false);
  const [createdPoDetails, setCreatedPoDetails] = useState(null); // Store created PO
  const [isMarkingStockIn, setIsMarkingStockIn] = useState(false);

  useEffect(() => {
    // Fetch initial data: vendors, all indents (for tab 2), and skus (for tab 2)
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [indentRes, vendorRes, skuRes] = await Promise.all([
          axios.get('/api/purchase-indents'), // For "Pending for PO" tab
          axios.get('/api/suppliers'),
          axios.get('/api/skus'), // For SKU details in "Pending for PO" tab
        ]);
        setIndents(indentRes.data || []);
        setVendors(vendorRes.data.suppliers || vendorRes.data || []);
        setSkus(skuRes.data.skus || skuRes.data || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load initial data. Please try refreshing.');
        console.error("Error fetching initial data:", err);
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchPoItemsForVendor = async (vendorId) => {
    if (!vendorId) {
      setPoItemsForVendor([]);
      return;
    }
    setLoadingPoItems(true);
    setPoCreationError(null);
    setPoSuccessMessage(null);
    setCreatedPoDetails(null); // Clear previous PO details when vendor changes
    // setError(null);
    try {
      const response = await axios.get(`/api/purchase-orders/approved-items-by-vendor/${vendorId}`);
      setPoItemsForVendor(response.data || []);
    } catch (err) {
      console.error("Error fetching PO items for vendor:", err);
      setPoItemsForVendor([]);
      // Set a more specific error or use poCreationError for this context
      setPoCreationError(`Failed to load items for vendor: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoadingPoItems(false);
    }
  };

  // Filter indents for "Pending for PO" tab
  const pendingIndentsForTab = indents.filter(i => i.status === 'approved' || i.status === 'PO Pending');


  const handleVendorSelect = (e) => {
    const newVendorId = e.target.value;
    setSelectedVendor(newVendorId);
    fetchPoItemsForVendor(newVendorId);
  };

  const handleFormChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const selectedVendorObj = vendors.find(v => v._id === selectedVendor);

  // --- All handler functions go here ---
  const handleGeneratePO = async () => {
    setPoCreationError(null);
    setPoSuccessMessage(null);
    setCreatedPoDetails(null);
    setError(null);

    if (!selectedVendor || poItemsForVendor.length === 0 || !form.deliveryDueDate) {
      setPoCreationError("Vendor, items, and delivery due date are required.");
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user._id) {
      setPoCreationError('User not found. Please log in again.');
      return;
    }
    setIsSubmittingPO(true);

    const poPayload = {
      vendor: selectedVendor,
      items: poItemsForVendor.map(item => ({
        sku: item.sku._id,
        quantity: item.quantity,
      })),
      createdBy: user._id,
      indentApprovalIds: [...new Set(poItemsForVendor.map(item => item.indentApprovalId).filter(id => id))],
      deliveryDueDate: form.deliveryDueDate,
      paymentDays: form.paymentDays,
      freight: form.freight,
    };

    try {
      const response = await axios.post('/api/purchase-orders', poPayload);
      const createdPO = response.data.purchaseOrder;
      setPoSuccessMessage(`PO #${createdPO.poNumber} created successfully!`);
      setCreatedPoDetails(createdPO);
      const indentRes = await axios.get('/api/purchase-indents');
      setIndents(indentRes.data || []);
      fetchPoItemsForVendor(selectedVendor);
    } catch (err) {
      console.error("Error creating PO:", err);
      setPoCreationError(err.response?.data?.error || err.response?.data?.message || 'Failed to create Purchase Order.');
    } finally {
      setIsSubmittingPO(false);
    }
  };

  const handleExportPDF = (poDetails, vendorDetails, itemsForPdf) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Purchase Order", 14, 22);
    doc.setFontSize(11);
    doc.text(`PO Number: ${poDetails.poNumber}`, 14, 30);
    doc.text(`PO Date: ${new Date(poDetails.createdAt).toLocaleDateString()}`, 14, 36);
    doc.text(`Delivery Due: ${new Date(poDetails.deliveryDueDate).toLocaleDateString()}`, 120, 36);


    doc.setFontSize(12);
    doc.text("Vendor Details:", 14, 48);
    doc.setFontSize(10);
    doc.text(vendorDetails.name, 14, 54);
    if (vendorDetails.address) {
      doc.text(`${vendorDetails.address.street || ''}`, 14, 60);
      doc.text(`${vendorDetails.address.city || ''}, ${vendorDetails.address.state || ''} - ${vendorDetails.address.pincode || ''}`, 14, 66);
    }
    doc.text(`Email: ${vendorDetails.email || '-'}`, 14, 72);
    doc.text(`Phone: ${vendorDetails.phone || '-'}`, 14, 78);
    doc.text(`GSTIN: ${vendorDetails.gstin || '-'}`, 14, 84);
    
    // TODO: Add Company Details (Ship To / Bill To)

    const tableColumn = ["#", "SKU Name", "SKU Code", "Quantity"];
    const tableRows = [];

    itemsForPdf.forEach((item, index) => {
      const itemData = [
        index + 1,
        item.sku?.name || "N/A",
        item.sku?.sku || item.sku?.skuCode || "N/A",
        item.quantity,
        // Add price columns here if available
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      startY: 90,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133] },
      styles: { fontSize: 9 },
    });

    let finalY = doc.lastAutoTable.finalY || 90; // Get Y position after table

    doc.setFontSize(10);
    doc.text(`Payment Days: ${poDetails.paymentDays || '-'}`, 14, finalY + 10);
    doc.text(`Freight: ${poDetails.freight || '-'}`, 14, finalY + 16);

    // TODO: Add Terms & Conditions, Total Amount

    doc.save(`PO_${poDetails.poNumber}_${vendorDetails.name}.pdf`);
  };

  const handleEmailToVendor = (poDetails, vendorDetails) => {
    if (!vendorDetails || !vendorDetails.email) {
      setPoCreationError("Vendor email is not available."); // Or use general error
      return;
    }
    const subject = `Purchase Order #${poDetails.poNumber} from YourCompany`; // Replace YourCompany
    const body = `Dear ${vendorDetails.name || 'Vendor'},

Please find attached Purchase Order #${poDetails.poNumber}.

Delivery Due Date: ${new Date(poDetails.deliveryDueDate).toLocaleDateString()}

Items:
${poItemsForVendor.map(item => `- ${item.sku?.name || 'SKU'} (Code: ${item.sku?.sku || item.sku?.skuCode || 'N/A'}) x ${item.quantity}`).join('\n')}

Please confirm receipt of this PO.

Regards,
YourCompany Purchase Team`; // Replace YourCompany

    const mailtoLink = `mailto:${vendorDetails.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const handleMarkAsStockedIn = async (poId) => {
    if (!poId) return;
    setIsMarkingStockIn(true);
    setPoCreationError(null); // Clear previous errors
    // setPoSuccessMessage(null); // Clear previous success messages or use a different one

    try {
      const response = await axios.put(`/api/purchase-orders/${poId}/stock-in`);
      setCreatedPoDetails(response.data.purchaseOrder); // Update the PO details with the new status
      setPoSuccessMessage(response.data.message || 'PO marked as Stocked In successfully!'); // Or a more specific success message
    } catch (err) {
      console.error("Error marking PO as Stocked In:", err);
      setPoCreationError(err.response?.data?.error || err.response?.data?.message || 'Failed to mark PO as Stocked In.');
    } finally {
      setIsMarkingStockIn(false);
    }
  };

  // --- Now the return statement ---
  return (
    <Box sx={{ p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Create Purchase Order
        </Typography>
      </Paper>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Create PO" />
        <Tab label="Pending for PO" />
      </Tabs>
      {tab === 0 && (
        <Box>
          <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: 'white' }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.dark' }}>PO Details</Typography>
            <Select
              value={selectedVendor}
              onChange={handleVendorSelect}
              displayEmpty
              fullWidth
              sx={{ mb: 2 }}
              size="small"
            >
              <MenuItem value="" disabled>Select Vendor</MenuItem>
              {vendors.map(v => (
                <MenuItem key={v._id} value={v._id}>{v.name}</MenuItem>
              ))}
            </Select>
            {selectedVendorObj && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Vendor Details:</Typography>
                <Typography variant="body2">Address: {selectedVendorObj.address ? `${selectedVendorObj.address.street}, ${selectedVendorObj.address.city}, ${selectedVendorObj.address.state} - ${selectedVendorObj.address.pincode}` : '-'}</Typography>
                <Typography variant="body2">Phone: {selectedVendorObj.phone || '-'}</Typography>
                <Typography variant="body2">Email: {selectedVendorObj.email || '-'}</Typography>
                <Typography variant="body2">GSTIN: {selectedVendorObj.gstin || '-'}</Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Delivery Due Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.deliveryDueDate}
                onChange={e => handleFormChange('deliveryDueDate', e.target.value)}
                sx={{ minWidth: 220 }}
                size="small"
                required
              />
              <TextField
                label="Payment Days"
                value={form.paymentDays}
                onChange={e => handleFormChange('paymentDays', e.target.value)}
                sx={{ minWidth: 220 }}
                size="small"
              />
              <TextField
                label="Freight Terms/Cost"
                value={form.freight}
                onChange={e => handleFormChange('freight', e.target.value)}
                sx={{ minWidth: 220 }}
                size="small"
              />
            </Box>
          </Paper>

          {/* Show items for this vendor from pending indents */}
          <Typography variant="h6" sx={{ mt: 2, mb: 1, color: 'primary.dark' }}>Approved Items for PO</Typography>
          {loadingPoItems ? <CircularProgress /> : (
            poItemsForVendor.length > 0 ? (
              <TableContainer component={Paper} elevation={3} sx={{ mt: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>SKU Name</TableCell>
                      <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>SKU Code</TableCell>
                      <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Quantity</TableCell>
                      <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Indent ID</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {poItemsForVendor.map((item, idx) => (
                      <TableRow key={item._id || idx} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                        <TableCell>{item.sku?.name || 'N/A'}</TableCell>
                        <TableCell>{item.sku?.sku || item.sku?.skuCode || 'N/A'}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.indentId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : <Typography sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 2 }}>{selectedVendor ? 'No approved items pending PO for this vendor.' : 'Please select a vendor to see items.'}</Typography>
          )}

          {poCreationError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {poCreationError}
            </Alert>
          )}
          {poSuccessMessage && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <AlertTitle>Success</AlertTitle>
              {poSuccessMessage}
            </Alert>
          )}

          <Button
            variant="contained"
            sx={{ mt: 3, fontWeight: 'bold' }}
            onClick={handleGeneratePO}
            disabled={
              !selectedVendor ||
              poItemsForVendor.length === 0 ||
              !form.deliveryDueDate || // Basic check for a required field
              loadingPoItems ||
              isSubmittingPO
            }
          >
            {isSubmittingPO ? <CircularProgress size={24} /> : "Generate PO"}
          </Button>

          {createdPoDetails && selectedVendorObj && (
            <Paper elevation={3} sx={{ mt: 3, p: 2, backgroundColor: '#e8f5e9' }}>
              <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>PO #{createdPoDetails.poNumber} Created!</Typography>
              <Typography variant="body1" sx={{ mt: 0.5 }}>Status: {createdPoDetails.status}</Typography>
              <Typography variant="body1" sx={{ mt: 0.5, mb: 2 }}>Stock-In Status: {createdPoDetails.stockInStatus}</Typography>
              <Button onClick={() => handleExportPDF(createdPoDetails, selectedVendorObj, poItemsForVendor)} sx={{ mr: 1 }} variant="outlined">Export PDF</Button>
              <Button onClick={() => handleEmailToVendor(createdPoDetails, selectedVendorObj)} variant="outlined" sx={{ mr: 1 }}>Email to Vendor</Button>
              {createdPoDetails.stockInStatus !== 'Stocked In' && (
                <Button
                  onClick={() => handleMarkAsStockedIn(createdPoDetails._id)}
                  variant="contained"
                  color="secondary"
                  disabled={isMarkingStockIn}
                  sx={{ ml: 1 }}
                >
                  {isMarkingStockIn ? <CircularProgress size={24} /> : "Mark as Stocked In"}
                </Button>
              )}
            </Paper>
          )}
        </Box>
      )}
      {tab === 1 && ( // "Pending for PO" Tab
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ color: 'primary.dark' }}>Indents Pending PO Creation</Typography>
          {loading ? <CircularProgress /> : (
            pendingIndentsForTab.length === 0 ? <Typography sx={{ fontStyle: 'italic', mt: 2 }}>No indents are currently pending PO creation.</Typography> : (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Indent ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Items</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingIndentsForTab.map(indent => (
                      <TableRow key={indent._id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                        <TableCell>{indent.indentId || indent._id}</TableCell> {/* Use indent.indentId if available (from schema) */}
                        <TableCell>{indent.status}</TableCell>
                        <TableCell>{new Date(indent.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          {(indent.items || []).map((it, i) => {
                            const skuDetail = skus.find(s => s._id === it.sku);
                            const vendorDetail = vendors.find(v => v._id === it.vendor);
                            return (
                              <div key={i}>
                                {skuDetail?.name || it.sku} ({skuDetail?.sku || ''})
                                {vendorDetail ? ` - ${vendorDetail.name}` : (it.vendor ? ` - VendorID: ${it.vendor}`: ' - No Vendor')}
                                {' x '}{it.quantity}
                              </div>
                            );
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </Paper>
      )}
      {error && !poCreationError && <Typography color="error" sx={{mt:1}}>{error}</Typography>} {/* Show general error if no specific PO creation error */}
    </Box>
  );
}

export default PO;
