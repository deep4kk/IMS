import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, CircularProgress, IconButton, Dialog, DialogActions,
  DialogContent, DialogTitle, TextField, Grid, Checkbox, FormControlLabel, Chip, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAlert } from '../../context/AlertContext'; // Assuming you have an AlertContext

const initialAddress = { street: '', city: '', state: '', pincode: '', country: 'India' };
const initialFormState = {
  name: '',
  email: '',
  phone: '',
  alternatePhone: '',
  companyName: '',
  contactPerson: '',
  contactPersonPhone: '',
  gstin: '',
  address: { ...initialAddress },
  billingAddress: { ...initialAddress },
  shippingAddress: { ...initialAddress },
  customerType: '',
  creditLimit: 0,
  paymentTerms: '',
  isActive: true,
  notes: '',
  sameAsGeneralAddressBilling: false,
  sameAsGeneralAddressShipping: false,
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const { showAlert } = useAlert();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/customers');
      setCustomers(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch customers.');
      showAlert('error', err.response?.data?.error || err.message || 'Failed to fetch customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setIsEditing(true);
      setCurrentCustomer(customer);
      setFormData({
        ...initialFormState,
        ...customer,
        address: { ...initialAddress, ...customer.address },
        billingAddress: { ...initialAddress, ...customer.billingAddress },
        shippingAddress: { ...initialAddress, ...customer.shippingAddress },
        sameAsGeneralAddressBilling: JSON.stringify(customer.address) === JSON.stringify(customer.billingAddress),
        sameAsGeneralAddressShipping: JSON.stringify(customer.address) === JSON.stringify(customer.shippingAddress),
      });
    } else {
      setIsEditing(false);
      setCurrentCustomer(null);
      setFormData(initialFormState);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCustomer(null);
    setFormData(initialFormState);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'creditLimit') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleAddressChange = (addressType, field, value) => {
    setFormData(prev => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value
      }
    }));
  };

  const handleSameAddressCheckbox = (type, checked) => {
    setFormData(prev => {
      const updatedData = { ...prev };
      if (type === 'billing') {
        updatedData.sameAsGeneralAddressBilling = checked;
        if (checked) updatedData.billingAddress = { ...prev.address };
        else updatedData.billingAddress = { ...initialAddress }; // Reset if unchecked
      } else if (type === 'shipping') {
        updatedData.sameAsGeneralAddressShipping = checked;
        if (checked) updatedData.shippingAddress = { ...prev.address };
        else updatedData.shippingAddress = { ...initialAddress }; // Reset if unchecked
      }
      return updatedData;
    });
  };

  const handleSubmit = async () => {
    setError(null);
    const payload = { ...formData };
    // Remove helper flags before submitting
    delete payload.sameAsGeneralAddressBilling;
    delete payload.sameAsGeneralAddressShipping;

    try {
      if (isEditing && currentCustomer) {
        await axios.put(`/api/customers/${currentCustomer._id}`, payload);
        showAlert('success', 'Customer updated successfully!');
      } else {
        await axios.post('/api/customers', payload);
        showAlert('success', 'Customer created successfully!');
      }
      fetchCustomers();
      handleCloseDialog();
    } catch (err) {
      console.error("Error saving customer:", err);
      const errMsg = err.response?.data?.error || err.message || 'Failed to save customer.';
      setError(errMsg); // Show error in dialog
      showAlert('error', errMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to mark this customer as inactive?')) {
      try {
        await axios.delete(`/api/customers/${id}`);
        showAlert('success', 'Customer marked as inactive.');
        fetchCustomers();
      } catch (err) {
        console.error("Error deleting customer:", err);
        const errMsg = err.response?.data?.error || err.message || 'Failed to delete customer.';
        setError(errMsg); // Show error in dialog
        showAlert('error', errMsg);
      }
    }
  };

  const renderAddressFields = (addressType, title) => (
    <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1, mt: 1, mb:2 }}>
      <Typography variant="subtitle2" gutterBottom>{title}</Typography>
      {addressType !== 'address' && (
        <FormControlLabel
          control={
            <Checkbox
              checked={formData[addressType === 'billingAddress' ? 'sameAsGeneralAddressBilling' : 'sameAsGeneralAddressShipping']}
              onChange={(e) => handleSameAddressCheckbox(addressType === 'billingAddress' ? 'billing' : 'shipping', e.target.checked)}
            />
          }
          label={`Same as General Address`}
          sx={{mb:1}}
        />
      )}
      { (addressType === 'address' || 
        (addressType === 'billingAddress' && !formData.sameAsGeneralAddressBilling) ||
        (addressType === 'shippingAddress' && !formData.sameAsGeneralAddressShipping)
        ) && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Street" name="street" value={formData[addressType].street} onChange={(e) => handleAddressChange(addressType, 'street', e.target.value)} fullWidth margin="dense" size="small"/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="City" name="city" value={formData[addressType].city} onChange={(e) => handleAddressChange(addressType, 'city', e.target.value)} fullWidth margin="dense" size="small"/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="State" name="state" value={formData[addressType].state} onChange={(e) => handleAddressChange(addressType, 'state', e.target.value)} fullWidth margin="dense" size="small"/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Pincode" name="pincode" value={formData[addressType].pincode} onChange={(e) => handleAddressChange(addressType, 'pincode', e.target.value)} fullWidth margin="dense" size="small"/>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Country" name="country" value={formData[addressType].country} onChange={(e) => handleAddressChange(addressType, 'country', e.target.value)} fullWidth margin="dense" size="small"/>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  if (loading && !openDialog) { // Don't show main loading if dialog is open
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Customer Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add New Customer
        </Button>
      </Box>

      {/* Main page error display */}
      {!loading && error && !openDialog && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

      <TableContainer component={Paper} elevation={3}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Cust. Code</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Phone</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>GSTIN</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>City</TableCell>
              <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer._id} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                <TableCell>{customer.customerCode}</TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.email || '-'}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>
                  <Chip 
                    label={customer.customerType || 'Retail'} 
                    size="small" 
                    color={customer.customerType === 'Wholesale' ? 'primary' : 'default'}
                  />
                </TableCell>
                <TableCell>{customer.gstin || '-'}</TableCell>
                <TableCell>{customer.address?.city || customer.shippingAddress?.city || '-'}</TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleOpenDialog(customer)} size="small" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(customer._id)} size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
        <DialogContent>
          {/* Dialog specific error */}
          {error && openDialog && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
          <Grid container spacing={2} sx={{mt:1}}>
            <Grid item xs={12} sm={6}>
              <TextField label="Customer Name*" name="name" value={formData.name} onChange={handleInputChange} fullWidth required margin="dense" size="small"/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Customer Code" name="customerCode" value={formData.customerCode} onChange={handleInputChange} fullWidth margin="dense" size="small" helperText="Auto-generated if left blank"/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Phone*" name="phone" value={formData.phone} onChange={handleInputChange} fullWidth required margin="dense" size="small"/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Alternate Phone" name="alternatePhone" value={formData.alternatePhone} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Company Name" name="companyName" value={formData.companyName} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Person Phone" name="contactPersonPhone" value={formData.contactPersonPhone} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="GSTIN" name="gstin" value={formData.gstin} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Customer Type" name="customerType" value={formData.customerType} onChange={handleInputChange} fullWidth margin="dense" size="small" helperText="e.g., Retail, Wholesale"/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                select
                label="Customer Segment" 
                name="customerSegment" 
                value={formData.customerSegment || ''} 
                onChange={handleInputChange} 
                fullWidth 
                margin="dense" 
                size="small"
              >
                <MenuItem value="Regular">Regular</MenuItem>
                <MenuItem value="Premium">Premium</MenuItem>
                <MenuItem value="VIP">VIP</MenuItem>
                <MenuItem value="Corporate">Corporate</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Credit Limit" name="creditLimit" type="number" value={formData.creditLimit} onChange={handleInputChange} fullWidth margin="dense" size="small"/>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Payment Terms" name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange} fullWidth margin="dense" size="small" helperText="e.g., Net 30, Due on Receipt"/>
            </Grid>
          </Grid>
          
          {renderAddressFields('address', 'General Address')}
          {renderAddressFields('billingAddress', 'Billing Address')}
          {renderAddressFields('shippingAddress', 'Shipping Address')}

          <TextField label="Notes" name="notes" value={formData.notes} onChange={handleInputChange} fullWidth multiline rows={2} margin="dense" size="small"/>
          <FormControlLabel
            control={<Checkbox checked={formData.isActive} onChange={(e) => setFormData(prev => ({...prev, isActive: e.target.checked}))} name="isActive" />}
            label="Active Customer"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {isEditing ? 'Save Changes' : 'Create Customer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Customers;