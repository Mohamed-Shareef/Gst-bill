import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Card, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AddIcon from '@mui/icons-material/Add';
import { productApi } from '../api/client';

const schema = yup.object({
  quantity: yup.number().integer().min(1).required('Quantity is required'),
  type: yup.string().required('Type is required'),
  reference: yup.string().nullable(),
});

type FormData = yup.InferType<typeof schema>;

export default function Inventory() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productId, setProductId] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { type: 'IN' },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll({ limit: 100 }).then(r => r.data),
  });

  const stockMutation = useMutation({
    mutationFn: (data: FormData & { productId: string }) => productApi.updateStock(data.productId, { quantity: data.quantity, type: data.type as 'IN' | 'OUT', reference: data.reference || '' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); closeDialog(); },
  });

  const openDialog = () => setDialogOpen(true);
  const closeDialog = () => { setDialogOpen(false); reset({}); setProductId(''); };

  const products = data?.products || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Inventory</Typography>
        <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={openDialog}>Stock Adjustment</Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>HSN/SAC</TableCell>
                <TableCell>Current Stock</TableCell>
                <TableCell>Min Stock</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No products found</TableCell></TableRow>
              ) : products.map((product: any) => (
                <TableRow key={product.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                  <TableCell>{product.hsnSac || '-'}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      defaultValue={product.stock}
                      sx={{ width: 100 }}
                      onBlur={(e) => {
                        const newStock = parseInt(e.target.value, 10);
                        if (newStock !== product.stock) {
                          const diff = newStock - product.stock;
                          productApi.updateStock(product.id, {
                            quantity: Math.abs(diff),
                            type: diff > 0 ? 'IN' : 'OUT',
                            reference: 'Manual adjustment',
                          }).then(() => queryClient.invalidateQueries({ queryKey: ['products'] }));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{product.minStock || 0}</TableCell>
                  <TableCell>
                    {product.stock <= 0 ? (
                      <Typography color="error" variant="body2">Out of Stock</Typography>
                    ) : product.stock < (product.minStock || 10) ? (
                      <Typography color="warning.main" variant="body2">Low Stock</Typography>
                    ) : (
                      <Typography color="success.main" variant="body2">In Stock</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Stock Adjustment</DialogTitle>
        <form onSubmit={handleSubmit((d) => stockMutation.mutate({ ...d, productId }))}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Product</InputLabel>
              <Select value={productId} label="Product" onChange={(e) => setProductId(e.target.value)} required>
                {products.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name} (Current: {p.stock})</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>Type</InputLabel>
              <Select {...register('type')} label="Type">
                <MenuItem value="IN">Stock In</MenuItem>
                <MenuItem value="OUT">Stock Out</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Quantity *" type="number" {...register('quantity', { valueAsNumber: true })} error={!!errors.quantity} helperText={errors.quantity?.message} />
            <TextField label="Reference / Note" {...register('reference')} />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={stockMutation.isPending}>
              {stockMutation.isPending ? <CircularProgress size={20} /> : 'Submit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
