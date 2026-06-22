import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Card, TextField, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { clientApi } from '../api/client';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').nullable(),
  phone: yup.string().nullable(),
  address: yup.string().nullable(),
  city: yup.string().nullable(),
  state: yup.string().nullable(),
  pincode: yup.string().nullable(),
  gstNumber: yup.string().nullable(),
});

type FormData = yup.InferType<typeof schema>;

export default function Clients() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, rowsPerPage, search],
    queryFn: () => clientApi.getAll({ page: page + 1, limit: rowsPerPage, search }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => editId ? clientApi.update(editId, data) : clientApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setDeleteDialogOpen(false); },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const openDialog = (client?: any) => {
    if (client) {
      setEditId(client.id);
      reset(client);
    } else {
      setEditId(null);
      reset({});
    }
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); reset({}); };

  const clients = data?.clients || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Clients</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>
          Add Client
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth placeholder="Search by name, email, phone, or GST number..."
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
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>GST Number</TableCell>
              <TableCell>City</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
            ) : clients.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No clients found</TableCell></TableRow>
            ) : clients.map((client: any) => (
              <TableRow key={client.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{client.name}</TableCell>
                <TableCell>{client.email || '-'}</TableCell>
                <TableCell>{client.phone || '-'}</TableCell>
                <TableCell>{client.gstNumber || '-'}</TableCell>
                <TableCell>{client.city || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openDialog(client)}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => { setDeleteId(client.id); setDeleteDialogOpen(true); }}>
                    <DeleteIcon />
                  </IconButton>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Client' : 'Add Client'}</DialogTitle>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d as FormData))}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField label="Name *" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
            <TextField label="Email" type="email" {...register('email')} error={!!errors.email} />
            <TextField label="Phone" {...register('phone')} />
            <TextField label="Address" multiline rows={2} {...register('address')} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="City" sx={{ flex: 1 }} {...register('city')} />
              <TextField label="State" sx={{ flex: 1 }} {...register('state')} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Pincode" {...register('pincode')} />
              <TextField label="GST Number" {...register('gstNumber')} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? <CircularProgress size={20} /> : editId ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Client</DialogTitle>
        <DialogContent>Are you sure you want to delete this client? This action cannot be undone.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
