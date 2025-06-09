import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Select, MenuItem, Checkbox, ListItemText, Button, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';

function SKUToVendorMapping() {
  const [skus, setSkus] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [editVendors, setEditVendors] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    // Fetch all SKUs with their mapped vendors
    axios.get('/api/skus', { params: { populate: 'alternateSuppliers,primarySupplier' } })
      .then(res => setSkus(res.data.skus || res.data));
    axios.get('/api/suppliers').then(res => setSuppliers(res.data));
  }, []);

  const handleEdit = (sku) => {
    setEditRow(sku);
    setEditVendors(sku.alternateSuppliers?.map(s => s._id) || []);
  };

  const handleVendorChange = (event) => {
    setEditVendors(event.target.value);
  };

  const handleSave = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    await axios.put(`/api/skus/${editRow._id}`, { alternateSuppliers: editVendors });
    setSkus(skus =>
      skus.map(sku =>
        sku._id === editRow._id
          ? { ...sku, alternateSuppliers: suppliers.filter(s => editVendors.includes(s._id)) }
          : sku
      )
    );
    setEditRow(null);
    setEditVendors([]);
    setConfirmOpen(false);
  };

  const handleCancel = () => {
    setEditRow(null);
    setEditVendors([]);
    setConfirmOpen(false);
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>SKU Name</TableCell>
            <TableCell>SKU Code</TableCell>
            <TableCell>SKU ID</TableCell>
            <TableCell>Vendors</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {skus.map((sku) => (
            <TableRow key={sku._id}>
              <TableCell>{sku.name}</TableCell>
              <TableCell>{sku.sku}</TableCell>
              <TableCell>{sku._id}</TableCell>
              <TableCell>
                {editRow && editRow._id === sku._id ? (
                  <Select
                    multiple
                    value={editVendors}
                    onChange={handleVendorChange}
                    renderValue={(selected) =>
                      suppliers
                        .filter(s => selected.includes(s._id))
                        .map(s => s.name)
                        .join(', ')
                    }
                    size="small"
                    style={{ minWidth: 200 }}
                  >
                    {suppliers.map(supplier => (
                      <MenuItem key={supplier._id} value={supplier._id}>
                        <Checkbox checked={editVendors.includes(supplier._id)} />
                        <ListItemText primary={supplier.name} />
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  (sku.alternateSuppliers && sku.alternateSuppliers.length > 0)
                    ? sku.alternateSuppliers.map(s => s.name).join(', ')
                    : <span style={{ color: '#888' }}>No vendors mapped</span>
                )}
              </TableCell>
              <TableCell>
                {editRow && editRow._id === sku._id ? (
                  <>
                    <Button variant="contained" color="primary" size="small" onClick={handleSave}>
                      Save
                    </Button>
                    <Button variant="outlined" size="small" onClick={handleCancel} style={{ marginLeft: 8 }}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="outlined" size="small" onClick={() => handleEdit(sku)}>
                    Edit
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={handleCancel}>
        <DialogTitle>Confirm Vendor Mapping Change</DialogTitle>
        <DialogContent>
          Are you sure you want to update the vendor mapping for <b>{editRow?.name}</b>?
          <br />
          <br />
          <b>New Vendors:</b> {suppliers.filter(s => editVendors.includes(s._id)).map(s => s.name).join(', ') || 'None'}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained" color="primary">Confirm</Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  );
}

export default SKUToVendorMapping;