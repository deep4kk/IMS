
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  GetApp as ExportIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function IndentApproval() {
  const [activeTab, setActiveTab] = useState(0);
  const [pendingIndents, setPendingIndents] = useState([]);
  const [approvedIndents, setApprovedIndents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndent, setSelectedIndent] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', indent: null });
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editableItems, setEditableItems] = useState([]);

  useEffect(() => {
    fetchPendingIndents();
    fetchApprovedIndents();
  }, []);

  const fetchPendingIndents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/purchase-indents/approval/pending');
      setPendingIndents(response.data.indents || []);
    } catch (error) {
      console.error('Error fetching pending indents:', error);
    }
    setLoading(false);
  };

  const fetchApprovedIndents = async () => {
    try {
      const response = await axios.get('/api/purchase-indents/approval/approved');
      setApprovedIndents(response.data.indents || []);
    } catch (error) {
      console.error('Error fetching approved indents:', error);
    }
  };

  const handleAction = async () => {
    if (!actionDialog.indent) return;

    setSubmitting(true);
    try {
      const endpoint = actionDialog.type === 'approve' ? 'approve' : 'reject';
      const payload = { remarks };
      
      // Include edited items if approving
      if (actionDialog.type === 'approve' && editableItems.length > 0) {
        payload.items = editableItems;
      }
      
      await axios.put(`/api/purchase-indents/approval/${actionDialog.indent._id}/${endpoint}`, payload);

      // Refresh data
      await fetchPendingIndents();
      await fetchApprovedIndents();

      setActionDialog({ open: false, type: '', indent: null });
      setRemarks('');
    } catch (error) {
      console.error(`Error ${actionDialog.type}ing indent:`, error);
    }
    setSubmitting(false);
  };

  const exportToPDF = (indentsList, title) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    
    const tableColumn = ['Indent ID', 'Requested By', 'Total Items', 'Status', 'Date'];
    const tableRows = indentsList.map(indent => [
      indent.indentId || 'N/A',
      indent.requestedBy?.name || 'Unknown',
      indent.items?.length || 0,
      indent.status,
      format(new Date(indent.createdAt), 'dd/MM/yyyy')
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
    });

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_approval': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Purchase Indent Approvals
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ExportIcon />}
          onClick={() => exportToPDF(
            activeTab === 0 ? pendingIndents : approvedIndents,
            activeTab === 0 ? 'Pending Indents' : 'Approved Indents'
          )}
        >
          Export PDF
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label={`Pending Approval (${pendingIndents.length})`} />
            <Tab label={`Approved/Rejected (${approvedIndents.length})`} />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : pendingIndents.length === 0 ? (
              <Alert severity="info">No pending indents for approval</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Indent ID</TableCell>
                      <TableCell>Requested By</TableCell>
                      <TableCell>Total Items</TableCell>
                      <TableCell>Request Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingIndents.map((indent) => (
                      <TableRow key={indent._id} hover>
                        <TableCell>{indent.indentId || 'N/A'}</TableCell>
                        <TableCell>{indent.requestedBy?.name || 'Unknown'}</TableCell>
                        <TableCell>{indent.items?.length || 0}</TableCell>
                        <TableCell>{format(new Date(indent.createdAt), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Chip 
                            label={indent.status} 
                            color={getStatusColor(indent.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Tooltip title="Approve">
                              <IconButton
                                color="success"
                                onClick={() => setActionDialog({ 
                                  open: true, 
                                  type: 'approve', 
                                  indent 
                                })}
                              >
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                color="error"
                                onClick={() => setActionDialog({ 
                                  open: true, 
                                  type: 'reject', 
                                  indent 
                                })}
                              >
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View Details">
                              <IconButton
                                onClick={() => setSelectedIndent(indent)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {approvedIndents.length === 0 ? (
              <Alert severity="info">No approved/rejected indents</Alert>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Indent ID</TableCell>
                      <TableCell>Requested By</TableCell>
                      <TableCell>Approved By</TableCell>
                      <TableCell>Total Items</TableCell>
                      <TableCell>Action Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {approvedIndents.map((indent) => (
                      <TableRow key={indent._id} hover>
                        <TableCell>{indent.indentId || 'N/A'}</TableCell>
                        <TableCell>{indent.requestedBy?.name || 'Unknown'}</TableCell>
                        <TableCell>{indent.approvedBy?.name || 'N/A'}</TableCell>
                        <TableCell>{indent.items?.length || 0}</TableCell>
                        <TableCell>
                          {indent.approvedAt ? format(new Date(indent.approvedAt), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={indent.status} 
                            color={getStatusColor(indent.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{indent.approvalRemarks || 'No remarks'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, type: '', indent: null })}>
        <DialogTitle>
          {actionDialog.type === 'approve' ? 'Approve' : 'Reject'} Indent
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to {actionDialog.type} this indent?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Remarks (Optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, type: '', indent: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            color={actionDialog.type === 'approve' ? 'success' : 'error'}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 
             (actionDialog.type === 'approve' ? 'Approve' : 'Reject')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog 
        open={Boolean(selectedIndent)} 
        onClose={() => setSelectedIndent(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Indent Details</DialogTitle>
        <DialogContent>
          {selectedIndent && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Indent ID:</Typography>
                <Typography>{selectedIndent.indentId || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Requested By:</Typography>
                <Typography>{selectedIndent.requestedBy?.name || 'Unknown'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Items:</Typography>
                <TableContainer component={Paper} elevation={1}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>SKU</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedIndent.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.sku?.name || 'Unknown SKU'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit || 'pcs'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedIndent(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default IndentApproval;
