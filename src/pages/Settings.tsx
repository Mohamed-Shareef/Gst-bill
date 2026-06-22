import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Typography, Card, TextField, Button, Grid, CircularProgress, Avatar } from '@mui/material';
import { useForm } from 'react-hook-form';
import SaveIcon from '@mui/icons-material/Save';
import { businessApi } from '../api/client';

export default function Settings() {
  const queryClient = useQueryClient();

  const { data: business, isLoading } = useQuery({
    queryKey: ['business'],
    queryFn: () => businessApi.get().then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => businessApi.update(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business'] }),
  });

  const { register, handleSubmit, reset } = useForm();

  const onSubmit = (data: any) => updateMutation.mutate(data);

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Business Settings</Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Business Profile</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Business Name" defaultValue={business?.name} {...register('name')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="GST Number" defaultValue={business?.gstNumber} {...register('gstNumber')} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Address" defaultValue={business?.address} {...register('address')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="City" defaultValue={business?.city} {...register('city')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="State" defaultValue={business?.state} {...register('state')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Pincode" defaultValue={business?.pincode} {...register('pincode')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Phone" defaultValue={business?.phone} {...register('phone')} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Email" type="email" defaultValue={business?.email} {...register('email')} />
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Invoice Settings</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Invoice Prefix" defaultValue={business?.invoicePrefix} {...register('invoicePrefix')} helperText="e.g., INV, BILL" />
                </Grid>
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>Business Logo</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Avatar src={business?.logo} sx={{ width: 120, height: 120 }} variant="rounded" />
                <Button variant="outlined" size="small">Upload Logo</Button>
                <Typography variant="caption" color="text.secondary">
                  Recommended: 200x200px, PNG or JPG
                </Typography>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={() => reset()}>Reset</Button>
              <Button variant="contained" type="submit" startIcon={<SaveIcon />} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <CircularProgress size={20} /> : 'Save Changes'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
