import { useQuery } from '@tanstack/react-query';
import { Box, Grid, Card, CardContent, Typography, Skeleton } from '@mui/material';
import { reportApi } from '../api/client';

function StatCard({ title, value, subtitle, color }: { title: string; value: string | number; subtitle?: string; color: string }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, color, my: 1 }}>
          {typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value}
        </Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportApi.getDashboard().then(r => r.data),
  });

  if (isLoading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const stats = data || {
    thisMonth: { sales: 0, invoices: 0, paidInvoices: 0, growth: 0 },
    pendingInvoices: 0,
    expenses: 0,
    profit: 0,
    collectionRate: 0,
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Dashboard</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="This Month Sales"
            value={stats.thisMonth.sales}
            subtitle={`${stats.thisMonth.invoices} invoices`}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Growth"
            value={`${stats.thisMonth.growth >= 0 ? '+' : ''}${stats.thisMonth.growth.toFixed(1)}%`}
            subtitle={`${stats.thisMonth.paidInvoices} paid`}
            color={stats.thisMonth.growth >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Invoices"
            value={stats.pendingInvoices}
            subtitle="Awaiting payment"
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Profit"
            value={stats.profit}
            subtitle={`Collection: ${stats.collectionRate.toFixed(0)}%`}
            color={stats.profit >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
