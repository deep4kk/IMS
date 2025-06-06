import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

// PDF Export Function for Sales Order
const exportSingleSOAsPDF = (soDetails) => {
  if (!soDetails || !soDetails.customer || !soDetails.items) {
    console.error("Cannot export PDF: SO details, customer, or items missing.", soDetails);
    alert("Cannot export PDF: Essential details are missing for this SO.");
    return;
  }

  const doc = new jsPDF();
  const customerDetails = soDetails.customer; // Assuming customer is populated
  const itemsForPdf = soDetails.items;

  doc.setFontSize(18);
  doc.text("Sales Order", 14, 22);
  doc.setFontSize(11);
  doc.text(`SO Number: ${soDetails.orderNumber || 'N/A'}`, 14, 30);
  doc.text(`Order Date: ${formatDate(soDetails.orderDate)}`, 14, 36);
  doc.text(`Status: ${soDetails.status || 'N/A'}`, 14, 42);
  if (soDetails.expectedDeliveryDate) {
    doc.text(`Expected Delivery: ${formatDate(soDetails.expectedDeliveryDate)}`, 120, 36);
  }


  doc.setFontSize(12);
  doc.text("Customer Details:", 14, 54);
  doc.setFontSize(10);
  doc.text(customerDetails.name || 'N/A', 14, 60);
  if (customerDetails.shippingAddress) { // Assuming shippingAddress object
    doc.text(`Ship to: ${customerDetails.shippingAddress.street || ''}`, 14, 66);
    doc.text(`${customerDetails.shippingAddress.city || ''}, ${customerDetails.shippingAddress.state || ''} - ${customerDetails.shippingAddress.pincode || ''}`, 14, 72);
  } else if (customerDetails.address) { // Fallback to general address
     doc.text(`Address: ${customerDetails.address.street || ''}`, 14, 66);
     doc.text(`${customerDetails.address.city || ''}, ${customerDetails.address.state || ''} - ${customerDetails.address.pincode || ''}`, 14, 72);
  }else {
    doc.text("Address not available", 14, 66);
  }
  doc.text(`Email: ${customerDetails.email || '-'}`, 14, 78);
  doc.text(`Phone: ${customerDetails.phone || '-'}`, 14, 84);


  const tableColumn = ["#", "SKU Name", "SKU Code", "Quantity", "Unit Price", "Total Price"];
  const tableRows = [];
  let overallTotal = 0;

  itemsForPdf.forEach((item, index) => {
    const unitPrice = item.unitPrice || 0;
    const totalPrice = item.quantity * unitPrice;
    overallTotal += totalPrice;
    const itemData = [
      index + 1,
      item.sku?.name || "N/A",
      item.sku?.skuCode || item.sku?.sku || "N/A",
      item.quantity,
      unitPrice.toFixed(2),
      totalPrice.toFixed(2),
    ];
    tableRows.push(itemData);
  });

  doc.autoTable({
    startY: 92, // Adjusted Y position
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] }, // A blueish color for sales
    styles: { fontSize: 9 },
    didDrawPage: (data) => {
        // Footer for total
        doc.setFontSize(10);
        doc.text(`Subtotal: ${overallTotal.toFixed(2)}`, data.settings.margin.left, doc.internal.pageSize.height - 30);
        // You can add tax, shipping, grand total here
        doc.text(`Grand Total: ${soDetails.totalAmount?.toFixed(2) || overallTotal.toFixed(2)}`, data.settings.margin.left, doc.internal.pageSize.height - 20);
    }
  });

  let finalY = doc.lastAutoTable.finalY || 92;
   if (finalY > doc.internal.pageSize.height - 40) { // Check if new page was added by autoTable
    finalY = 30; // Reset Y for new page if footer pushed it
  } else {
    finalY += 10; // Space after table before notes
  }


  doc.setFontSize(10);
  doc.text(`Payment Terms: ${soDetails.paymentTerms || '-'}`, 14, finalY);
  if(soDetails.notes) {
    doc.text(`Notes: ${soDetails.notes}`, 14, finalY + 6);
  }

  doc.save(`SO_${soDetails.orderNumber}_${customerDetails.name.replace(/\s+/g, '_')}.pdf`);
};


function SalesOrderMaster() {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalesOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        // Assuming GET /api/sales-orders populates customer and items.sku
        const response = await axios.get('/api/sales-orders');
        setSalesOrders(response.data.salesOrders || response.data || []); // Adjust based on actual API response
      } catch (err) {
        console.error("Error fetching sales orders:", err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch sales orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesOrders();
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
          Sales Order Master
        </Typography>
      </Paper>
      {salesOrders.length === 0 ? (
        <Typography sx={{mt: 4, textAlign: 'center', fontStyle: 'italic'}}>No sales orders found.</Typography>
      ) : (
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ backgroundColor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>SO Number</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Customer</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Order Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total Amount</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Items</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {salesOrders.map((so) => (
              <TableRow key={so._id} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                <TableCell>{so.orderNumber}</TableCell>
                <TableCell>{so.customer?.name || 'N/A'}</TableCell>
                <TableCell>{formatDate(so.orderDate)}</TableCell>
                <TableCell>₹{so.totalAmount?.toFixed(2) || 'N/A'}</TableCell>
                <TableCell>{so.status}</TableCell>
                <TableCell align="center">{so.items?.length || 0}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Export PDF">
                    <IconButton onClick={() => exportSingleSOAsPDF(so)} size="small" color="secondary">
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

export default SalesOrderMaster;