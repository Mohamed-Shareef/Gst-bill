import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Card, TextField, Button, Grid, Divider, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { invoiceApi, clientApi, productApi } from '../api/client';

const schema = yup.object({
  clientId: yup.string().required('Client is required'),
  dueDate: yup.string().nullable(),
  notes: yup.string().nullable(),
  terms: yup.string().nullable(),
  discount: yup.number().min(0).nullable(),
  items: yup.array().of(yup.object({
    productId: yup.string().required('Product required'),
    quantity: yup.number().integer().min(1).required('Quantity required'),
    rate: yup.number().min(0).required('Rate required'),
    gstPercent: yup.number().min(0).required(),
    amount: yup.number().required(),
  })),
});

export default function CreateInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { data: clientsData } = useQuery({ queryKey: ['clients'], queryFn: () => clientApi.getAll({ limit: 100 }).then(r => r.data) });
  const { data: productsData } = useQuery({ queryKey: ['products'], queryFn: () => productApi.getAll({ limit: 100 }).then(r => r.data) });

  const { data: invoiceData, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceApi.getById(id!).then(r => r.data),
    enabled: isEdit,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => invoiceApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); navigate('/invoices'); },
  });

  const { register, control, handleSubmit, watch, setValue, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      clientId: '',
      dueDate: '',
      notes: '',
      terms: '',
      discount: 0,
      items: [{ productId: '', quantity: 1, rate: 0, gstPercent: 18, amount: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items') || [];

  useEffect(() => {
    if (invoiceData) {
      reset({
        clientId: invoiceData.clientId,
        dueDate: invoiceData.dueDate || '',
        notes: invoiceData.notes || '',
        terms: invoiceData.terms || '',
        discount: Number(invoiceData.discount) || 0,
        items: invoiceData.items?.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          rate: Number(item.rate),
          gstPercent: Number(item.gstPercent),
          amount: Number(item.amount),
        })) || [],
      });
    }
  }, [invoiceData]);

  const products = productsData?.products || [];
  const clients = clientsData?.clients || [];

  const subtotal = watchedItems.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
  const discount = watch('discount') || 0;
  const taxable = subtotal - discount;
  const cgst = taxable * 0.09;
  const sgst = taxable * 0.09;
  const igst = 0;
  const total = taxable + cgst + sgst + igst;

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    if (product) {
      setValue(`items.${index}.rate`, Number(product.price));
      setValue(`items.${index}.gstPercent`, Number(product.gstPercent));
      const qty = watchedItems[index]?.quantity || 1;
      setValue(`items.${index}.amount`, qty * Number(product.price));
    }
  };

  const handleQtyChange = (index: number, qty: number) => {
    const rate = watchedItems[index]?.rate || 0;
    setValue(`items.${index}.amount`, qty * rate);
  };

  if (isEdit && invoiceLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>{isEdit ? 'Invoice Details' : 'Create Invoice'}</Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Client *</InputLabel>
                    <Select {...register('clientId')} label="Client *">
                      {clients.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Due Date" type="date" {...register('dueDate')} InputLabelProps={{ shrink: true }} />
                </Grid>

                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Items</Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: '40%' }}>Product</TableCell>
                          <TableCell>Qty</TableCell>
                          <TableCell>Rate</TableCell>
                          <TableCell>GST %</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell sx={{ width: 50 }}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fields.map((field, index) => (
                          <TableRow key={field.id}>
                            <TableCell>
                              <Select {...register(`items.${index}.productId`)} fullWidth size="small" onChange={(e) => handleProductSelect(index, String(e.target.value))}>
                                <MenuItem value="">Select</MenuItem>
                                {products.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                              </Select>
                            </TableCell>
                            <TableCell>
                              <TextField type="number" size="small" {...register(`items.${index}.quantity`, { valueAsNumber: true })} onChange={(e) => handleQtyChange(index, parseInt(e.target.value) || 0)} sx={{ width: 70 }} />
                            </TableCell>
                            <TableCell>
                              <TextField type="number" size="small" {...register(`items.${index}.rate`, { valueAsNumber: true })} sx={{ width: 100 }} />
                            </TableCell>
                            <TableCell>
                              <TextField type="number" size="small" {...register(`items.${index}.gstPercent`, { valueAsNumber: true })} sx={{ width: 70 }} />
                            </TableCell>
                            <TableCell>
                              <TextField type="number" size="small" {...register(`items.${index}.amount`, { valueAsNumber: true })} sx={{ width: 100 }} />
                            </TableCell>
                            <TableCell>
                              <IconButton size="small" color="error" onClick={() => fields.length > 1 && remove(index)}>
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Button startIcon={<AddIcon />} size="small" onClick={() => append({ productId: '', quantity: 1, rate: 0, gstPercent: 18, amount: 0 })} sx={{ mt: 1 }}>
                      Add Item
                    </Button>
                  </TableCell>
                </TableRow>
              </Grid>
            </Card>

            <Card sx={{ p: 3, mt: 3 }}>
              <TextField fullWidth label="Notes" multiline rows={2} {...register('notes')} sx={{ mb: 2 }} />
              <TextField fullWidth label="Terms & Conditions" multiline rows={2} {...register('terms')} />
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal</Typography>
                <Typography>₹{subtotal.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <TextField size="small" label="Discount" type="number" {...register('discount', { valueAsNumber: true })} sx={{ width: 100 }} />
                <Typography>- ₹{discount.toLocaleString('en-IN')}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>CGST (9%)</Typography>
                <Typography>₹{cgst.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>SGST (9%)</Typography>
                <Typography>₹{sgst.toLocaleString('en-IN')}</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary.main">₹{total.toLocaleString('en-IN')}</Typography>
              </Box>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button fullWidth variant="outlined" onClick={() => navigate('/invoices')}>Cancel</Button>
              <Button fullWidth variant="contained" type="submit" startIcon={<SaveIcon />} disabled={createMutation.isPending}>
                {createMutation.isPending ? <CircularProgress size={20} /> : 'Create Invoice'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
