import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper function to format date, can be moved to a utils file
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

// PDF Export Function (adapted from PO.jsx)
// This function will need access to vendor details and items for the specific PO.
// We might need to fetch full PO details if the master list doesn't contain everything.
const exportSinglePOAsPDF = (poDetails) => {
  if (!poDetails || !poDetails.vendor || !poDetails.items) {
    console.error("Cannot export PDF: PO details, vendor, or items missing.", poDetails);
    alert("Cannot export PDF: Essential details are missing for this PO.");
    return;
  }

  const doc = new jsPDF();
  const vendorDetails = poDetails.vendor;
  const itemsForPdf = poDetails.items;

  doc.setFontSize(18);
  doc.text("Purchase Order", 14, 22);
  doc.setFontSize(11);
  doc.text(`PO Number: ${poDetails.poNumber || 'N/A'}`, 14, 30);
  doc.text(`PO Date: ${formatDate(poDetails.createdAt)}`, 14, 36);
  doc.text(`Delivery Due: ${formatDate(poDetails.deliveryDueDate)}`, 120, 36);
  doc.text(`Status: ${poDetails.status || 'N/A'}`, 14, 42);


  doc.setFontSize(12);
  doc.text("Vendor Details:", 14, 54); // Adjusted Y position
  doc.setFontSize(10);
  doc.text(vendorDetails.name || 'N/A', 14, 60);
  if (vendorDetails.address) {
    doc.text(`${vendorDetails.address.street || ''}`, 14, 66);
    doc.text(`${vendorDetails.address.city || ''}, ${vendorDetails.address.state || ''} - ${vendorDetails.address.pincode || ''}`, 14, 72);
  } else {
    doc.text("Address not available", 14, 66);
  }
  doc.text(`Email: ${vendorDetails.email || '-'}`, 14, 78);
  doc.text(`Phone: ${vendorDetails.phone || '-'}`, 14, 84);
  doc.text(`GSTIN: ${vendorDetails.gstin || '-'}`, 14, 90);

  const tableColumn = ["#", "SKU Name", "SKU Code", "Quantity"];
  const tableRows = [];

  itemsForPdf.forEach((item, index) => {
    const itemData = [
      index + 1,
      item.sku?.name || "N/A",
      item.sku?.skuCode || item.sku?.sku || "N/A", // Prefer skuCode if available
      item.quantity,
    ];
    tableRows.push(itemData);
  });

  doc.autoTable({
    startY: 98, // Adjusted Y position
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [22, 160, 133] }, // A greenish color
    styles: { fontSize: 9 },
  });

  let finalY = doc.lastAutoTable.finalY || 98;

  doc.setFontSize(10);
  doc.text(`Payment Days: ${poDetails.paymentDays || '-'}`, 14, finalY + 10);
  doc.text(`Freight: ${poDetails.freight || '-'}`, 14, finalY + 16);
  doc.text(`Stock-In Status: ${poDetails.stockInStatus || '-'}`, 14, finalY + 22);


  // Placeholder for Terms & Conditions and Total Amount
  // doc.text("Terms & Conditions: ...", 14, finalY + 30);
  // doc.text("Total Amount: ...", 150, finalY + 30, { align: 'right' });

  doc.save(`PO_${poDetails.poNumber}_${vendorDetails.name.replace(/\s+/g, '_')}.pdf`);
};


function PurchaseOrderMaster() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        // The GET /api/purchase-orders route populates vendor and items.sku
        const response = await axios.get('/api/purchase-orders');
        setPurchaseOrders(response.data || []);
      } catch (err) {
        console.error("Error fetching purchase orders:", err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch purchase orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrders();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>Error: {error}</Typography>;
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Purchase Order Master
        </Typography>
      </Paper>
      {purchaseOrders.length === 0 ? (
        <Typography sx={{mt: 4, textAlign: 'center', fontStyle: 'italic'}}>No purchase orders found.</Typography>
      ) : (
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ backgroundColor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>PO Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vendor</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>PO Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Due Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stock-In Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Items</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchaseOrders.map((po) => (
              <TableRow key={po._id} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                <TableCell>{po.poNumber}</TableCell>
                <TableCell>{po.vendor?.name || 'N/A'}</TableCell>
                <TableCell>{formatDate(po.createdAt)}</TableCell>
                <TableCell>{formatDate(po.deliveryDueDate)}</TableCell>
                <TableCell>{po.status}</TableCell>
                <TableCell>{po.stockInStatus}</TableCell>
                <TableCell align="center">{po.items?.length || 0}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Export PDF">
                    <IconButton onClick={() => exportSinglePOAsPDF(po)} size="small" color="primary">
                      <PictureAsPdfIcon />
                    </IconButton>
                  </Tooltip>
                  {/* Add more actions here like View Details, Edit (if applicable) */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      )}
    </Box>
  );
}

export default PurchaseOrderMaster;