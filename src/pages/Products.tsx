import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Card, TextField, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination, Paper, MenuItem, Select, FormControl, InputLabel, Chip
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { productApi, categoryApi } from '../api/client';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  description: yup.string().nullable(),
  price: yup.number().min(0).required('Price is required'),
  gstPercent: yup.number().min(0).max(100).required('GST % is required'),
  hsnSac: yup.string().nullable(),
  barcode: yup.string().nullable(),
  categoryId: yup.string().nullable(),
  stock: yup.number().integer().min(0).nullable(),
});

type FormData = yup.InferType<typeof schema>;

export default function Products() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, rowsPerPage, search, categoryFilter],
    queryFn: () => productApi.getAll({ page: page + 1, limit: rowsPerPage, search, categoryId: categoryFilter || undefined }).then(r => r.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getProductCategories().then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => editId ? productApi.update(editId, data) : productApi.create(data as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setDeleteDialogOpen(false); },
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { gstPercent: 18, stock: 0 },
  });

  const openDialog = (product?: any) => {
    if (product) {
      setEditId(product.id);
      reset(product);
    } else {
      setEditId(null);
      reset({ name: '', description: '', price: 0, gstPercent: 18, hsnSac: '', barcode: '', categoryId: '', stock: 0 });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); reset({}); };

  const products = data?.products || [];
  const categories = categoriesData || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Products</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>Add Product</Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
          <TextField
            fullWidth placeholder="Search by name, HSN/SAC, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
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
              <TableCell>Name</TableCell>
              <TableCell>HSN/SAC</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>GST %</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} align="center"><CircularProgress /></TableCell></TableRow>
            ) : products.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">No products found</TableCell></TableRow>
            ) : products.map((product: any) => (
              <TableRow key={product.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                <TableCell>{product.hsnSac || '-'}</TableCell>
                <TableCell>{product.barcode || '-'}</TableCell>
                <TableCell>₹{Number(product.price).toLocaleString()}</TableCell>
                <TableCell><Chip label={`${product.gstPercent}%`} size="small" color="primary" /></TableCell>
                <TableCell>
                  <Chip label={product.stock} size="small" color={product.stock <= 0 ? 'error' : product.stock < 10 ? 'warning' : 'success'} />
                </TableCell>
                <TableCell>{product.category?.name || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openDialog(product)}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => { setDeleteId(product.id); setDeleteDialogOpen(true); }}>
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
        <DialogTitle>{editId ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d as FormData))}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField label="Name *" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
            <TextField label="Description" multiline rows={2} {...register('description')} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Price *" type="number" sx={{ flex: 1 }} {...register('price', { valueAsNumber: true })} error={!!errors.price} />
              <TextField label="GST % *" type="number" sx={{ flex: 1 }} {...register('gstPercent', { valueAsNumber: true })} error={!!errors.gstPercent} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="HSN/SAC" {...register('hsnSac')} />
              <TextField label="Barcode" {...register('barcode')} />
            </Box>
            <FormControl>
              <InputLabel>Category</InputLabel>
              <Select {...register('categoryId')} label="Category" onChange={(e) => setValue('categoryId', e.target.value as string)}>
                <MenuItem value="">None</MenuItem>
                {categories.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Initial Stock" type="number" {...register('stock', { valueAsNumber: true })} />
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
        <DialogTitle>Delete Product</DialogTitle>
        <DialogContent>Are you sure you want to delete this product?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
