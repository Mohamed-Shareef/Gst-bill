import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(data);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ p: 4, width: '100%', maxWidth: 420 }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>GST Billing</Typography>
          <Typography color="text.secondary">Sign in to your account</Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth label="Email" type="email" margin="normal"
            {...register('email')} error={!!errors.email} helperText={errors.email?.message}
          />
          <TextField
            fullWidth label="Password" type="password" margin="normal"
            {...register('password')} error={!!errors.password} helperText={errors.password?.message}
          />
          <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </form>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
          Don't have an account?{' '}
          <Button variant="text" size="small" onClick={() => navigate('/register')}>Register</Button>
        </Typography>
      </Card>
    </Box>
  );
}
