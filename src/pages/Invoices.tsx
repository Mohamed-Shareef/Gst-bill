import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Button, Card, TextField, InputAdornment, Chip, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { invoiceApi } from '../api/client';

const statusColors: Record<string, any> = {
  DRAFT: 'default', SENT: 'info', PAID: 'success', PARTIAL: 'warning', OVERDUE: 'error', CANCELLED: 'error',
};

export default function Invoices() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, rowsPerPage, search],
    queryFn: () => invoiceApi.getAll({ page: page + 1, limit: rowsPerPage, search }).then(r => r.data),
  });

  const invoices = data?.invoices || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Invoices</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/invoices/create')}>
          Create Invoice
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth placeholder="Search by invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
        </Box>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
            ) : invoices.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No invoices found</TableCell></TableRow>
            ) : invoices.map((inv: any) => (
              <TableRow key={inv.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{inv.invoiceNumber}</TableCell>
                <TableCell>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</TableCell>
                <TableCell>{inv.client?.name || '-'}</TableCell>
                <TableCell>₹{Number(inv.total).toLocaleString('en-IN')}</TableCell>
                <TableCell><Chip label={inv.status} size="small" color={statusColors[inv.status]} /></TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => navigate(`/invoices/${inv.id}`)}><VisibilityIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={data?.total || 0}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />
    </Box>
  );
}
