import React from 'react';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from "@mui/material/useMediaQuery";
import Tooltip from '@mui/material/Tooltip';
import Breadcrumbs from '@mui/material/Breadcrumbs';

import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import BusinessIcon from '@mui/icons-material/Business';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import LinkIcon from '@mui/icons-material/Link';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PeopleIcon from '@mui/icons-material/People';
import StorageIcon from '@mui/icons-material/Storage';
import AdjustIcon from '@mui/icons-material/Adjust';
import styled from '@mui/material/styles/styled';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 260;

const Main = styled('main', { 
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isMobile'
})(({ theme, open, isMobile }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && !isMobile && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
}));

const navigation = [
  {
    name: 'Dashboard',
    icon: DashboardIcon,
    href: '/',
  },
  {
    name: 'Inventory',
    icon: InventoryIcon,
    children: [
      { name: 'SKU Management', href: '/skus' },
      { name: 'Stock Adjustments', href: '/inventory/adjustments' },
      { name: 'Transactions', href: '/transactions' },
      { name: 'SKU to Vendor Mapping', href: '/vendors/sku-mapping' },
    ],
  },
  {
    name: 'Purchase',
    icon: CompareArrowsIcon,
    children: [
      { name: 'Purchase Dashboard', href: '/purchase/dashboard' },
      { name: 'Purchase Order', href: '/purchase/orders' },
      { name: 'Purchase Indent', href: '/purchase/indent' },
      { name: 'Indent Approval', href: '/purchase/indent-approval' },
      { name: 'Credit/Debit Note', href: '/purchase/credit-debit-note' },
    ],
  },
  {
    name: 'Sales',
    icon: PersonIcon,
    children: [
      { name: 'Sales Dashboard', href: '/sales/dashboard' },
      { name: 'Sales Order', href: '/sales/orders' },
      { name: 'Sales Return', href: '/sales/returns' },
      { name: 'Invoice', href: '/sales/invoice' },
      { name: 'Dispatch', href: '/sales/dispatch' },
      { name: 'Sales Debit Note', href: '/sales/debit-note' },
    ],
  },
  {
    name: 'Customers',
    icon: PersonIcon,
    href: '/customers',
  },
  {
    name: 'Reports',
    icon: AssessmentIcon,
    href: '/reports',
  },
  {
    name: 'Suppliers',
    icon: BusinessIcon,
    href: '/suppliers',
  },
  {
    name: 'Warehouses',
    icon: WarehouseIcon,
    href: '/warehouses',
  },
  {
    name: 'Admin Panel',
    icon: SettingsIcon,
    href: '/admin',
  },
];

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState({});
  const { currentUser: user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSubmenuToggle = (name) => {
    setOpenSubmenu(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

    const getPageTitle = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) {
      return 'Dashboard';
    }

    let title = pathnames[pathnames.length - 1];
    title = title.charAt(0).toUpperCase() + title.slice(1);
    title = title.replace(/-/g, ' ');

      // Handle special cases
      if (title === 'Skus') title = 'SKU Management';
      if (title === 'Po') title = 'Purchase Order';
      if (title === 'So') title = 'Sales Order';
      if (title === 'Id') title = 'Details';

    return title;
  };


const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ 
          fontSize: { xs: '1rem', sm: '1.25rem' },
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          Inventory System
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: { xs: 1, sm: 0 } }}>
        {navigation.map((item) => (
          <React.Fragment key={item.name}>
            {item.children ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleSubmenuToggle(item.name)}
                    sx={{ 
                      py: { xs: 0.5, sm: 1 },
                      minHeight: { xs: 40, sm: 48 }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: { xs: 35, sm: 56 } }}>
                      <item.icon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.name} 
                      primaryTypographyProps={{
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    />
                    {openSubmenu[item.name] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={openSubmenu[item.name]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItem key={child.name} disablePadding>
                        <ListItemButton
                          sx={{ 
                            pl: { xs: 3, sm: 4 },
                            py: { xs: 0.25, sm: 0.5 },
                            minHeight: { xs: 32, sm: 40 }
                          }}
                          component={Link}
                          to={child.href}
                          selected={location.pathname === child.href}
                          onClick={() => isMobile && setMobileOpen(false)}
                        >
                          <ListItemText 
                            primary={child.name}
                            primaryTypographyProps={{
                              fontSize: { xs: '0.8rem', sm: '0.875rem' }
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </>
            ) : (
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.href}
                  selected={location.pathname === item.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  sx={{ 
                    py: { xs: 0.5, sm: 1 },
                    minHeight: { xs: 40, sm: 48 }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: { xs: 35, sm: 56 } }}>
                    <item.icon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.name}
                    primaryTypographyProps={{
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )}
          </React.Fragment>
        ))}
      </List>
    </div>
  );

return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {getPageTitle()}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 },
            flexShrink: 0
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                fontSize: { sm: '0.875rem' }
              }}
            >
              Welcome, {user?.name}
            </Typography>
             <IconButton
                size="large"
                edge="end"
                aria-label="account"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user?.name.charAt(0)}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => {
                  handleMenuClose();
                  navigate('/profile');
                }}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => {
                  handleMenuClose();
                  navigate('/settings');
                }}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              maxWidth: '80vw'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;