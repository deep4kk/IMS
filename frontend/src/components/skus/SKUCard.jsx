import { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

function SKUCard({ sku, onEdit, onView, onDelete }) {
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleEdit = (event) => {
    event.stopPropagation();
    handleMenuClose();
    onEdit();
  };
  
  const handleDelete = (event) => {
    event.stopPropagation();
    handleMenuClose();
    onDelete();
  };
  
  const isLowStock = sku.currentStock < sku.minStockLevel;
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'visible',
          borderRadius: 2,
          ...(isLowStock && {
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: 'inherit',
              boxShadow: (theme) => `0 0 0 2px ${theme.palette.warning.main}`,
              pointerEvents: 'none',
            },
          }),
        }}
        onClick={onView}
      >
        <CardMedia
          component="img"
          height="140"
          image={sku.image}
          alt={sku.name}
          sx={{ objectFit: 'cover' }}
        />
        {isLowStock && (
          <Chip
            label="Low Stock"
            color="warning"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontWeight: 'medium',
            }}
          />
        )}
        <CardContent sx={{ flexGrow: 1, pb: '16px !important' }}>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {sku.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
            ID: {sku._id}
          </Typography>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Stock:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {sku.currentStock}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary" align="right">
                Price:
              </Typography>
              <Typography variant="body1" fontWeight="medium" align="right">
                ₹{sku.sellingPrice}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mt: 2 
          }}>
            <Chip 
              label={sku.category} 
              size="small" 
              sx={{ 
                bgcolor: 'primary.50', 
                color: 'primary.main',
                height: 24
              }} 
            />
            <Tooltip title="Options" arrow>
              <IconButton 
                size="small"
                onClick={handleMenuOpen}
                sx={{ 
                  ml: 1,
                  bgcolor: 'action.hover'
                }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          TransitionComponent={Fade}
        >
          <MenuItem onClick={(e) => { e.stopPropagation(); onView(); handleMenuClose(); }}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Delete" primaryTypographyProps={{ color: 'error' }} />
          </MenuItem>
        </Menu>
      </Card>
    </motion.div>
  );
}

export default SKUCard;