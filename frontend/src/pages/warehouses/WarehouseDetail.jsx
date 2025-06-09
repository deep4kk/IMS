import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';

function WarehouseDetail() {
  const { id } = useParams();
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        const { data } = await axios.get(`/api/warehouses/${id}`);
        setWarehouse(data);
      } catch (err) {
        setError('Failed to load warehouse details');
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouse();
  }, [id]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4">{warehouse.name}</Typography>
      <Typography>Code: {warehouse.code}</Typography>
      {/* Add more fields as needed */}
    </Box>
  );
}

export default WarehouseDetail;