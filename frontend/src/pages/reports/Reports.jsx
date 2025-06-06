import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Card, CardContent, Grid } from '@mui/material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function Reports() {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Reports</Typography>
      <Paper>
        <Tabs value={value} onChange={handleChange} aria-label="reports tabs">
          <Tab label="Sales" />
          <Tab label="Inventory" />
          <Tab label="Purchase" />
        </Tabs>
      </Paper>
      <TabPanel value={value} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Sales By Customer</Typography>
                {/* Placeholder for report content */}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Sales By Item</Typography>
                {/* Placeholder for report content */}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Sales By Sales Person</Typography>
                {/* Placeholder for report content */}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Sales Return</Typography>
                {/* Placeholder for report content */}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6">Inventory Summary</Typography>
            {/* Placeholder for report content */}
          </CardContent>
        </Card>
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Purchase By Item</Typography>
                {/* Placeholder for report content */}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Returns History</Typography>
                {/* Placeholder for report content */}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Purchase By Vendor</Typography>
                {/* Placeholder for report content */}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
}

export default Reports;