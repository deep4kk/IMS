import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import Box from '@mui/material/Box';

function SKUTableView({ skus, onEdit, onView, onDelete }) {
  return (
    <TableContainer 
      component={Paper} 
      sx={{ 
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Table aria-label="SKU table">
        <TableHead>
          <TableRow sx={{ bgcolor: 'background.default' }}>
            <TableCell sx={{ fontWeight: 600 }}>SKU ID</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Stock</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {skus.map((sku) => {
            const isLowStock = sku.currentStock < sku.minStockLevel;
            
            return (
              <TableRow
                key={sku.id}
                sx={{
                  '&:hover': { bgcolor: 'action.hover' },
                  ...(isLowStock && {
                    borderLeft: '3px solid',
                    borderColor: 'warning.main',
                  }),
                }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="body2" fontWeight="medium">
                    {sku.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img 
                      src={sku.image} 
                      alt={sku.name} 
                      style={{ 
                        width: 40, 
                        height: 40, 
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                    <Typography variant="body2">
                      {sku.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={sku.category} 
                    size="small" 
                    sx={{ 
                      bgcolor: 'primary.50', 
                      color: 'primary.main',
                      height: 24
                    }} 
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={sku.currentStock}
                    size="small"
                    color={isLowStock ? 'warning' : 'default'}
                    variant={isLowStock ? 'outlined' : 'filled'}
                    sx={{ fontWeight: isLowStock ? 600 : 400 }}
                  />
                </TableCell>
                <TableCell>₹{sku.sellingPrice}</TableCell>
                <TableCell>{sku.location}</TableCell>
                <TableCell>
                  {sku.lastUpdated ? format(new Date(sku.lastUpdated), 'MMM dd, yyyy') : 'N/A'}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => onView(sku.id)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton 
                        size="small" 
                        color="secondary"
                        onClick={() => onEdit(sku.id)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => onDelete(sku)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SKUTableView;