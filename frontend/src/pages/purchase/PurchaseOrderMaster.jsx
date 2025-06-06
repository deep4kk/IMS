import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, CircularProgress, IconButton, Tooltip, Chip
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper function to format date, can be moved to a utils file
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

// Professional PDF Export Function
const exportSinglePOAsPDF = (poDetails) => {
  if (!poDetails || !poDetails.vendor || !poDetails.items) {
    console.error("Cannot export PDF: PO details, vendor, or items missing.", poDetails);
    alert("Cannot export PDF: Essential details are missing for this PO.");
    return;
  }

  const doc = new jsPDF();
  const vendorDetails = poDetails.vendor;
  const itemsForPdf = poDetails.items;

  // Header with company branding
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text("PURCHASE ORDER", 14, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text("Your Company Name", 14, 28);
  
  // PO Number in top right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`PO #${poDetails.poNumber || 'N/A'}`, 140, 20);
  doc.setFontSize(10);
  doc.text(`Date: ${formatDate(poDetails.createdAt)}`, 140, 28);

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Company details section
  doc.setFontSize(10);
  doc.text("Your Company Address", 14, 45);
  doc.text("City, State - Pincode", 14, 50);
  doc.text("Phone: +91-XXXXXXXXXX", 14, 55);
  doc.text("Email: orders@yourcompany.com", 14, 60);

  // Vendor details box
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 70, 180, 45, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(14, 70, 180, 45, 'S');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("VENDOR DETAILS", 20, 80);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${vendorDetails.name || 'N/A'}`, 20, 88);
  
  if (vendorDetails.address) {
    doc.text(`Address: ${vendorDetails.address.street || ''}`, 20, 94);
    doc.text(`${vendorDetails.address.city || ''}, ${vendorDetails.address.state || ''} - ${vendorDetails.address.pincode || ''}`, 20, 100);
  } else {
    doc.text("Address: Not available", 20, 94);
  }
  
  doc.text(`Email: ${vendorDetails.email || 'Not provided'}`, 20, 106);
  doc.text(`Phone: ${vendorDetails.phone || 'Not provided'}`, 110, 106);
  doc.text(`GSTIN: ${vendorDetails.gstin || 'Not provided'}`, 20, 112);

  // Order details
  doc.setFontSize(10);
  doc.text(`Delivery Due Date: ${formatDate(poDetails.deliveryDueDate)}`, 20, 125);
  doc.text(`Status: ${poDetails.status || 'N/A'}`, 110, 125);
  doc.text(`Payment Terms: ${poDetails.paymentDays || 'As agreed'} days`, 20, 132);
  doc.text(`Freight Terms: ${poDetails.freight || 'As agreed'}`, 110, 132);

  // Items table
  const tableColumn = ["S.No", "Item Description", "SKU Code", "Quantity", "Unit", "Rate", "Amount"];
  const tableRows = [];

  let totalAmount = 0;
  itemsForPdf.forEach((item, index) => {
    const rate = item.unitPrice || 0;
    const amount = item.quantity * rate;
    totalAmount += amount;
    
    const itemData = [
      index + 1,
      item.sku?.name || "N/A",
      item.sku?.skuCode || item.sku?.sku || "N/A",
      item.quantity,
      "Nos",
      rate.toFixed(2),
      amount.toFixed(2)
    ];
    tableRows.push(itemData);
  });

  doc.autoTable({
    startY: 145,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { 
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: { 
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 30 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' }
    }
  });

  let finalY = doc.lastAutoTable.finalY || 145;

  // Total amount box
  doc.setFillColor(245, 245, 245);
  doc.rect(140, finalY + 10, 54, 20, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.rect(140, finalY + 10, 54, 20, 'S');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Total Amount:", 145, finalY + 20);
  doc.text(`₹ ${totalAmount.toFixed(2)}`, 145, finalY + 26);

  // Terms and conditions
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("Terms & Conditions:", 14, finalY + 45);
  doc.setFont('helvetica', 'normal');
  const terms = [
    "1. Please confirm receipt of this purchase order.",
    "2. Delivery should be made as per schedule mentioned above.",
    "3. Payment will be made as per agreed terms.",
    "4. Quality and quantity should be as per specifications.",
    "5. All disputes subject to local jurisdiction."
  ];
  
  terms.forEach((term, index) => {
    doc.text(term, 14, finalY + 55 + (index * 6));
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("This is a computer generated document and does not require signature.", 14, 280);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 285);

  // Save the PDF
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
    <Box sx={{ p: 3, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Enhanced Header */}
      <Paper elevation={0} sx={{ 
        mb: 3, 
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
        color: 'white',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <Box sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Purchase Order Master
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Manage and track all purchase orders with vendors
          </Typography>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3, mb: 3 }}>
        <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Total POs</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>{purchaseOrders.length}</Typography>
        </Paper>
        <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Pending</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            {purchaseOrders.filter(po => po.status === 'Pending').length}
          </Typography>
        </Paper>
        <Paper elevation={2} sx={{ p: 3, borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)', color: 'white' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Completed</Typography>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            {purchaseOrders.filter(po => po.stockInStatus === 'Stocked In').length}
          </Typography>
        </Paper>
      </Box>

      {/* Main Table */}
      {purchaseOrders.length === 0 ? (
        <Paper elevation={2} sx={{ p: 6, textAlign: 'center', borderRadius: '12px' }}>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
            No Purchase Orders Found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Create your first purchase order to get started
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>PO Number</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>Vendor</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>PO Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>Due Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>Stock-In Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem', textAlign: 'center' }}>Items</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem', textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchaseOrders.map((po, index) => (
                  <TableRow 
                    key={po._id} 
                    hover 
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: '#f8fafc' },
                      '&:hover': { backgroundColor: '#e2e8f0' },
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{po.poNumber}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {po.vendor?.name || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {po.vendor?.email || ''}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(po.createdAt)}</TableCell>
                    <TableCell>{formatDate(po.deliveryDueDate)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={po.status} 
                        size="small"
                        color={po.status === 'Approved' ? 'success' : po.status === 'Pending' ? 'warning' : 'default'}
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={po.stockInStatus} 
                        size="small"
                        color={po.stockInStatus === 'Stocked In' ? 'success' : 'info'}
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={po.items?.length || 0} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Export Professional PDF" arrow>
                        <IconButton 
                          onClick={() => exportSinglePOAsPDF(po)} 
                          size="small" 
                          sx={{ 
                            color: '#dc2626',
                            '&:hover': { 
                              backgroundColor: '#fee2e2',
                              transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <PictureAsPdfIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}

export default PurchaseOrderMaster;