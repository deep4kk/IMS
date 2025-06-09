import { Box, Card, CardContent, Typography, IconButton } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

function DashboardCard({ title, value, icon, color, onClick, isWarning = false }) {
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
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          ...(isWarning && {
            borderLeft: 3,
            borderColor: 'warning.main',
          }),
        }}
      >
        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            <Box
              sx={{
                bgcolor: `${color}15`,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                p: 1,
                width: 40,
                height: 40,
              }}
            >
              {icon}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            <IconButton
              size="small"
              onClick={onClick}
              sx={{
                color: color,
                bgcolor: `${color}10`,
                '&:hover': {
                  bgcolor: `${color}20`,
                },
              }}
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default DashboardCard;