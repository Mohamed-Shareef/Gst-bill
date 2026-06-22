import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Button, Card, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AddIcon from '@mui/icons-material/Add';
import { paymentApi, invoiceApi } from '../api/client';

const schema = yup.object({
  invoiceId: yup.string().nullable(),
  amount: yup.number().min(1).required('Amount is required'),
  mode: yup.string().required('Mode is required'),
  reference: yup.string().nullable(),
});

export default function Payments() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, rowsPerPage],
    queryFn: () => paymentApi.getAll({ page: page + 1, limit: rowsPerPage }).then(r => r.data),
  });

  const { data: outstandingData } = useQuery({
    queryKey: ['outstanding'],
    queryFn: () => paymentApi.getOutstanding().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => paymentApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); queryClient.invalidateQueries({ queryKey: ['outstanding'] }); setDialogOpen(false); },
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { mode: 'CASH' },
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices-select'],
    queryFn: () => invoiceApi.getAll({ limit: 100 }).then(r => r.data),
  });

  const payments = data?.payments || [];
  const invoices = invoicesData?.invoices || [];
  const outstanding = outstandingData || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Payments</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>Record Payment</Button>
      </Box>

      {outstanding.length > 0 && (
        <Card sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Outstanding Invoices</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Outstanding</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {outstanding.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.invoiceNumber}</TableCell>
                    <TableCell>{inv.client?.name}</TableCell>
                    <TableCell>₹{inv.total.toLocaleString('en-IN')}</TableCell>
                    <TableCell>₹{inv.paid.toLocaleString('en-IN')}</TableCell>
                    <TableCell sx={{ color: 'error.main', fontWeight: 500 }}>₹{inv.outstanding.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Reference</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No payments recorded</TableCell></TableRow>
              ) : payments.map((pmt: any) => (
                <TableRow key={pmt.id}>
                  <TableCell>{new Date(pmt.date).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>{pmt.invoice?.invoiceNumber || '-'}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>₹{Number(pmt.amount).toLocaleString('en-IN')}</TableCell>
                  <TableCell>{pmt.mode}</TableCell>
                  <TableCell>{pmt.reference || '-'}</TableCell>
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
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Invoice (Optional)</InputLabel>
              <Select {...register('invoiceId')} label="Invoice (Optional)">
                <MenuItem value="">None</MenuItem>
                {invoices.map((inv: any) => <MenuItem key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.client?.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Amount *" type="number" {...register('amount', { valueAsNumber: true })} error={!!errors.amount} helperText={errors.amount?.message} />
            <FormControl>
              <InputLabel>Mode *</InputLabel>
              <Select {...register('mode')} label="Mode *">
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="BANK">Bank Transfer</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
                <MenuItem value="SPLIT">Split</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Reference" {...register('reference')} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? <CircularProgress size={20} /> : 'Record'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
