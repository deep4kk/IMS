
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  People as PeopleIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  AdminPanelSettings as AdminIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useAlert } from '../../context/AlertContext';
import axios from 'axios';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 1, sm: 3 } }}>{children}</Box>}
    </div>
  );
}

function AdminPanel() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [permissionDialog, setPermissionDialog] = useState(false);
  const [userPermissionDialog, setUserPermissionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [newPermission, setNewPermission] = useState({ name: '', route: '', description: '' });
  const [systemStats, setSystemStats] = useState({});
  const { showSuccess, showError } = useAlert();

  const defaultPermissions = [
    { name: 'Dashboard', route: '/', description: 'Access to main dashboard' },
    { name: 'SKU Management', route: '/skus', description: 'Manage SKUs' },
    { name: 'Stock Adjustments', route: '/inventory/adjustments', description: 'Manage stock adjustments' },
    { name: 'Transactions', route: '/transactions', description: 'View transactions' },
    { name: 'SKU to Vendor Mapping', route: '/vendors/sku-mapping', description: 'Manage SKU vendor mappings' },
    { name: 'Purchase Dashboard', route: '/purchase/dashboard', description: 'Access purchase dashboard' },
    { name: 'Purchase Orders', route: '/purchase/orders', description: 'Manage purchase orders' },
    { name: 'Purchase Indent', route: '/purchase/indent', description: 'Manage purchase indents' },
    { name: 'Indent Approval', route: '/purchase/indent-approval', description: 'Approve indents' },
    { name: 'Credit/Debit Note', route: '/purchase/credit-debit-note', description: 'Manage credit/debit notes' },
    { name: 'Sales Dashboard', route: '/sales/dashboard', description: 'Access sales dashboard' },
    { name: 'Sales Orders', route: '/sales/orders', description: 'Manage sales orders' },
    { name: 'Sales Returns', route: '/sales/returns', description: 'Manage sales returns' },
    { name: 'Invoice', route: '/sales/invoice', description: 'Manage invoices' },
    { name: 'Dispatch', route: '/sales/dispatch', description: 'Manage dispatch' },
    { name: 'Sales Debit Note', route: '/sales/debit-note', description: 'Manage sales debit notes' },
    { name: 'Customers', route: '/customers', description: 'Manage customers' },
    { name: 'Reports', route: '/reports', description: 'View reports' },
    { name: 'Suppliers', route: '/suppliers', description: 'Manage suppliers' },
    { name: 'Warehouses', route: '/warehouses', description: 'Manage warehouses' },
  ];

  useEffect(() => {
    fetchUsers();
    fetchPermissions();
    fetchSystemStats();
    initializePermissions();
  }, []);

  const initializePermissions = async () => {
    try {
      const response = await axios.get('/api/permissions');
      if (response.data.length === 0) {
        // Create default permissions
        for (const permission of defaultPermissions) {
          try {
            await axios.post('/api/permissions', permission);
          } catch (error) {
            // Permission might already exist
            console.log('Permission already exists:', permission.name);
          }
        }
        fetchPermissions();
      }
    } catch (error) {
      console.error('Error initializing permissions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      showError('Failed to fetch users');
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get('/api/permissions');
      setPermissions(response.data);
    } catch (error) {
      showError('Failed to fetch permissions');
    }
  };

  const fetchSystemStats = async () => {
    try {
      const [usersRes, skusRes, ordersRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/skus').catch(() => ({ data: { totalCount: 0 } })),
        axios.get('/api/sales-orders/stats').catch(() => ({ data: { totalOrders: 0 } }))
      ]);
      
      setSystemStats({
        totalUsers: usersRes.data.length,
        totalSKUs: skusRes.data.totalCount || 0,
        totalOrders: ordersRes.data.totalOrders || 0
      });
    } catch (error) {
      showError('Failed to fetch system statistics');
    }
  };

  const handleCreateUser = async () => {
    try {
      await axios.post('/api/users/admin/create', newUser);
      showSuccess('User created successfully');
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      setUserDialog(false);
      fetchUsers();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        showSuccess('User deleted successfully');
        fetchUsers();
      } catch (error) {
        showError('Failed to delete user');
      }
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await axios.put(`/api/users/${userId}`, { role: newRole });
      showSuccess('User role updated successfully');
      fetchUsers();
    } catch (error) {
      showError('Failed to update user role');
    }
  };

  const handleManageUserPermissions = async (user) => {
    try {
      setSelectedUser(user);
      const response = await axios.get(`/api/permissions/user/${user._id}`);
      setUserPermissions(response.data.map(p => p._id));
      setUserPermissionDialog(true);
    } catch (error) {
      showError('Failed to fetch user permissions');
    }
  };

  const handleUpdateUserPermissions = async () => {
    try {
      await axios.put(`/api/permissions/user/${selectedUser._id}`, {
        permissions: userPermissions
      });
      showSuccess('User permissions updated successfully');
      setUserPermissionDialog(false);
      setSelectedUser(null);
      setUserPermissions([]);
    } catch (error) {
      showError('Failed to update user permissions');
    }
  };

  const handleCreatePermission = async () => {
    try {
      await axios.post('/api/permissions', newPermission);
      showSuccess('Permission created successfully');
      setNewPermission({ name: '', route: '', description: '' });
      setPermissionDialog(false);
      fetchPermissions();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create permission');
    }
  };

  const handleDeletePermission = async (permissionId) => {
    if (window.confirm('Are you sure you want to delete this permission?')) {
      try {
        await axios.delete(`/api/permissions/${permissionId}`);
        showSuccess('Permission deleted successfully');
        fetchPermissions();
      } catch (error) {
        showError('Failed to delete permission');
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'manager': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <AdminIcon sx={{ mr: 2, fontSize: { xs: 28, sm: 32 }, color: 'primary.main' }} />
        <Typography variant={isMobile ? "h5" : "h4"} component="h1">
          Admin Panel
        </Typography>
      </Box>

      {/* System Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{systemStats.totalUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <SecurityIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{systemStats.totalSKUs}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total SKUs
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <SettingsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{systemStats.totalOrders}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Admin Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons="auto"
        >
          <Tab label="User Management" />
          <Tab label="Permissions" />
          <Tab label="System Settings" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6">User Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setUserDialog(true)}
              size={isMobile ? "small" : "medium"}
            >
              Add User
            </Button>
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell sx={{ wordBreak: 'break-all' }}>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, alignItems: 'flex-start' }}>
                        <TextField
                          select
                          size="small"
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                          sx={{ minWidth: 100 }}
                        >
                          <MenuItem value="user">User</MenuItem>
                          <MenuItem value="manager">Manager</MenuItem>
                          <MenuItem value="admin">Admin</MenuItem>
                        </TextField>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleManageUserPermissions(user)}
                        >
                          Permissions
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6">Permission Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setPermissionDialog(true)}
              size={isMobile ? "small" : "medium"}
            >
              Add Permission
            </Button>
          </Box>

          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission._id}>
                    <TableCell>{permission.name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{permission.route}</TableCell>
                    <TableCell>{permission.description}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletePermission(permission._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            System Settings
          </Typography>
          {isMobile ? (
            <Box>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Application Theme</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Configure the default theme and colors
                  </Typography>
                  <Button variant="outlined" size="small">
                    Configure
                  </Button>
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Email Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Configure SMTP settings for notifications
                  </Typography>
                  <Button variant="outlined" size="small">
                    Configure
                  </Button>
                </AccordionDetails>
              </Accordion>
              
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Backup Settings</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Configure automatic database backups
                  </Typography>
                  <Button variant="outlined" size="small">
                    Configure
                  </Button>
                </AccordionDetails>
              </Accordion>
            </Box>
          ) : (
            <List>
              <ListItem>
                <ListItemText
                  primary="Application Theme"
                  secondary="Configure the default theme and colors"
                />
                <ListItemSecondaryAction>
                  <Button variant="outlined" size="small">
                    Configure
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Email Settings"
                  secondary="Configure SMTP settings for notifications"
                />
                <ListItemSecondaryAction>
                  <Button variant="outlined" size="small">
                    Configure
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Backup Settings"
                  secondary="Configure automatic database backups"
                />
                <ListItemSecondaryAction>
                  <Button variant="outlined" size="small">
                    Configure
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          )}
        </TabPanel>
      </Paper>

      {/* Create User Dialog */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              value={newUser.role}
              label="Role"
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Create Permission Dialog */}
      <Dialog open={permissionDialog} onClose={() => setPermissionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Permission</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={newPermission.name}
            onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Route"
            fullWidth
            variant="outlined"
            value={newPermission.route}
            onChange={(e) => setNewPermission({ ...newPermission, route: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={newPermission.description}
            onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePermission} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* User Permissions Dialog */}
      <Dialog open={userPermissionDialog} onClose={() => setUserPermissionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Manage Permissions for {selectedUser?.name}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>Permissions</InputLabel>
            <Select
              multiple
              value={userPermissions}
              onChange={(e) => setUserPermissions(e.target.value)}
              input={<OutlinedInput label="Permissions" />}
              renderValue={(selected) => 
                permissions
                  .filter(p => selected.includes(p._id))
                  .map(p => p.name)
                  .join(', ')
              }
            >
              {permissions.map((permission) => (
                <MenuItem key={permission._id} value={permission._id}>
                  <ListItemIcon>
                    <Checkbox checked={userPermissions.includes(permission._id)} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={permission.name} 
                    secondary={permission.description} 
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserPermissionDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateUserPermissions} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminPanel;
