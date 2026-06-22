import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Card, Grid, TextField, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tabs, Tab, CardContent } from '@mui/material';
import { reportApi } from '../api/client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function BarChart3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(300, 250);
    mountRef.current.appendChild(renderer.domElement);

    const barGeometry = new THREE.BoxGeometry(1, 1, 1);
    const colors = [0x2563eb, 0x7c3aed, 0x10b981, 0xf59e0b, 0xef4444];
    const bars = colors.map((c, i) => {
      const mat = new THREE.MeshBasicMaterial({ color: c });
      const bar = new THREE.Mesh(barGeometry, mat);
      bar.position.set(i * 1.5 - 3, 0.5, 0);
      bar.scale.y = Math.random() * 2 + 0.5;
      scene.add(bar);
      return bar;
    });

    camera.position.z = 5;
    let frame = 0;
    const animate = () => {
      frame++;
      bars.forEach((bar, i) => {
        bar.rotation.y += 0.01;
        bar.position.y = 0.5 + Math.sin(frame * 0.02 + i) * 0.1;
      });
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      renderer.dispose();
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} />;
}

function ProfitLossGauge({ value }: { value: number }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(200, 200);
    mountRef.current.appendChild(renderer.domElement);

    const torus = new THREE.TorusGeometry(1, 0.1, 16, 100);
    const mat = new THREE.MeshBasicMaterial({ color: value >= 0 ? 0x10b981 : 0xef4444 });
    const mesh = new THREE.Mesh(torus, mat);
    scene.add(mesh);
    camera.position.z = 3;

    const animate = () => {
      mesh.rotation.z += 0.01;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      renderer.dispose();
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, [value]);

  return <div ref={mountRef} />;
}

export default function Reports() {
  const [tab, setTab] = useState(0);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['reports-sales', dateRange],
    queryFn: () => reportApi.getSales(dateRange).then(r => r.data),
  });

  const { data: gstData, isLoading: gstLoading } = useQuery({
    queryKey: ['reports-gst', dateRange],
    queryFn: () => reportApi.getGST(dateRange).then(r => r.data),
  });

  const { data: plData } = useQuery({
    queryKey: ['reports-profit-loss', dateRange],
    queryFn: () => reportApi.getProfitLoss(dateRange).then(r => r.data),
  });

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Reports</Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField type="date" label="Start Date" InputLabelProps={{ shrink: true }}
          value={dateRange.startDate} onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))} />
        <TextField type="date" label="End Date" InputLabelProps={{ shrink: true }}
          value={dateRange.endDate} onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))} />
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Sales" />
        <Tab label="GST" />
        <Tab label="Profit & Loss" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Subtotal</TableCell>
                  <TableCell>CGST</TableCell>
                  <TableCell>SGST</TableCell>
                  <TableCell>IGST</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salesLoading ? <TableRow><TableCell colSpan={10} align="center"><CircularProgress /></TableCell></TableRow>
                  : (salesData || []).length === 0 ? <TableRow><TableCell colSpan={10} align="center">No data</TableCell></TableRow>
                  : (salesData || []).map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.invoiceNumber}</TableCell>
                      <TableCell>{new Date(inv.date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>{inv.client}</TableCell>
                      <TableCell>{inv.items}</TableCell>
                      <TableCell>₹{inv.subtotal.toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{inv.cgst.toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{inv.sgst.toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{inv.igst.toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>₹{inv.total.toLocaleString('en-IN')}</TableCell>
                      <TableCell>{inv.status}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          {gstData?.summary && (
            <CardContent sx={{ display: 'flex', gap: 4, mb: 3, flexWrap: 'wrap' }}>
              <Box><Typography variant="body2" color="text.secondary">Total Taxable</Typography><Typography variant="h6">₹{gstData.summary.totalTaxable.toLocaleString('en-IN')}</Typography></Box>
              <Box><Typography variant="body2" color="text.secondary">CGST</Typography><Typography variant="h6">₹{gstData.summary.totalCGST.toLocaleString('en-IN')}</Typography></Box>
              <Box><Typography variant="body2" color="text.secondary">SGST</Typography><Typography variant="h6">₹{gstData.summary.totalSGST.toLocaleString('en-IN')}</Typography></Box>
              <Box><Typography variant="body2" color="text.secondary">IGST</Typography><Typography variant="h6">₹{gstData.summary.totalIGST.toLocaleString('en-IN')}</Typography></Box>
              <Box><Typography variant="body2" color="text.secondary">Total Tax</Typography><Typography variant="h6" color="primary.main">₹{gstData.summary.totalTax.toLocaleString('en-IN')}</Typography></Box>
            </CardContent>
          )}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Client GST</TableCell>
                  <TableCell>Taxable</TableCell>
                  <TableCell>CGST</TableCell>
                  <TableCell>SGST</TableCell>
                  <TableCell>IGST</TableCell>
                  <TableCell>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gstLoading ? <TableRow><TableCell colSpan={9} align="center"><CircularProgress /></TableCell></TableRow>
                  : (gstData?.data || []).length === 0 ? <TableRow><TableCell colSpan={9} align="center">No data</TableCell></TableRow>
                  : gstData?.data?.map((inv: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell>{inv.invoiceNumber}</TableCell>
                      <TableCell>{new Date(inv.date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>{inv.client}</TableCell>
                      <TableCell>{inv.clientGst || '-'}</TableCell>
                      <TableCell>₹{inv.taxableAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{inv.cgst.toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{inv.sgst.toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{inv.igst.toLocaleString('en-IN')}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>₹{inv.total.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {tab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <ProfitLossGauge value={plData?.netProfit || 0} />
              <Typography variant="h4" sx={{ mt: 2 }} color={plData?.netProfit >= 0 ? 'success.main' : 'error.main'}>
                ₹{plData?.netProfit?.toLocaleString('en-IN') || 0}
              </Typography>
              <Typography color="text.secondary">Net Profit</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <TableContainer>
                <Table>
                  <TableBody>
                    <TableRow><TableCell>Total Sales</TableCell><TableCell sx={{ fontWeight: 500 }}>₹{plData?.sales?.toLocaleString('en-IN') || 0}</TableCell></TableRow>
                    <TableRow><TableCell>Tax Collected</TableCell><TableCell sx={{ fontWeight: 500 }}>₹{plData?.tax?.toLocaleString('en-IN') || 0}</TableCell></TableRow>
                    <TableRow><TableCell>Total Expenses</TableCell><TableCell sx={{ fontWeight: 500, color: 'error.main' }}>-₹{plData?.totalExpenses?.toLocaleString('en-IN') || 0}</TableCell></TableRow>
                    <TableRow><TableCell>Gross Profit</TableCell><TableCell sx={{ fontWeight: 500 }}>₹{plData?.grossProfit?.toLocaleString('en-IN') || 0}</TableCell></TableRow>
                    <TableRow><TableCell>Net Profit</TableCell><TableCell sx={{ fontWeight: 600, fontSize: '1.2rem', color: plData?.netProfit >= 0 ? 'success.main' : 'error.main' }}>₹{plData?.netProfit?.toLocaleString('en-IN') || 0}</TableCell></TableRow>
                    <TableRow><TableCell>Profit Margin</TableCell><TableCell sx={{ fontWeight: 500 }}>{(plData?.profitMargin || 0).toFixed(1)}%</TableCell></TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card><Box sx={{ p: 3 }}><BarChart3D /></Box></Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
