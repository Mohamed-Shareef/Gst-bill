import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Button, Card, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper, TextField, IconButton, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { expenseApi, categoryApi } from '../api/client';

const schema = yup.object({
  categoryId: yup.string().required('Category is required'),
  amount: yup.number().min(1).required('Amount is required'),
  description: yup.string().nullable(),
  date: yup.string().required('Date is required'),
});

export default function Expenses() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, rowsPerPage, categoryFilter],
    queryFn: () => expenseApi.getAll({ page: page + 1, limit: rowsPerPage, categoryId: categoryFilter || undefined }).then(r => r.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => categoryApi.getExpenseCategories().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => editId ? expenseApi.update(editId, data) : expenseApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setDeleteDialogOpen(false); },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { date: new Date().toISOString().split('T')[0] },
  });

  const openDialog = (expense?: any) => {
    if (expense) {
      setEditId(expense.id);
      reset({ ...expense, date: expense.date?.split('T')[0] });
    } else {
      setEditId(null);
      reset({ categoryId: '', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); reset({}); };

  const expenses = data?.expenses || [];
  const categories = categoriesData || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Expenses</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>Add Expense</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {categories.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
            ) : expenses.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">No expenses found</TableCell></TableRow>
            ) : expenses.map((exp: any) => (
              <TableRow key={exp.id}>
                <TableCell>{new Date(exp.date).toLocaleDateString('en-IN')}</TableCell>
                <TableCell>{exp.category?.name}</TableCell>
                <TableCell>{exp.description || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>₹{Number(exp.amount).toLocaleString('en-IN')}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openDialog(exp)}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => { setDeleteId(exp.id); setDeleteDialogOpen(true); }}><DeleteIcon /></IconButton>
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

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Category *</InputLabel>
              <Select {...register('categoryId')} label="Category *">
                {categories.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Amount *" type="number" {...register('amount', { valueAsNumber: true })} error={!!errors.amount} helperText={errors.amount?.message} />
            <TextField label="Description" multiline rows={2} {...register('description')} />
            <TextField label="Date *" type="date" {...register('date')} InputLabelProps={{ shrink: true }} error={!!errors.date} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? <CircularProgress size={20} /> : editId ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>Are you sure?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
