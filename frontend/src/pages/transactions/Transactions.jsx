import { useState } from 'react';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';

function Transactions() {
  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom>
        Transactions
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Transaction management interface coming soon...
        </Typography>
      </Paper>
    </Box>
  );
}

export default Transactions;