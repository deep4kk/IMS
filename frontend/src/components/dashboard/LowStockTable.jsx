import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Box,
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

function LowStockTable({ items }) {
  const navigate = useNavigate();

  if (!items || items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body1" color="text.secondary">
          No low stock items found.
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table sx={{ minWidth: 650 }} aria-label="low stock items table">
        <TableHead>
          <TableRow sx={{ backgroundColor: 'background.default' }}>
            <TableCell sx={{ fontWeight: 600 }}>Product SKU</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Current Stock</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Reorder Point</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Supplier</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>
                <Chip 
                  label={item.current} 
                  color="error" 
                  variant="outlined" 
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </TableCell>
              <TableCell>{item.min}</TableCell>
              <TableCell>{item.supplier}</TableCell>
              <TableCell>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small"
                  onClick={() => navigate(`/stock-adjustments/add/${item.id}`)}
                >
                  Reorder
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default LowStockTable;