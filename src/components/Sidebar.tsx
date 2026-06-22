import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import ExpenseIcon from '@mui/icons-material/AttachMoney';
import ReportIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import StoreIcon from '@mui/icons-material/Store';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  ref: React.RefObject<HTMLDivElement | null>;
}

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/clients', label: 'Clients', icon: <PeopleIcon /> },
  { path: '/products', label: 'Products', icon: <StoreIcon /> },
  { path: '/inventory', label: 'Inventory', icon: <InventoryIcon /> },
  { path: '/invoices', label: 'Invoices', icon: <ReceiptIcon /> },
  { path: '/payments', label: 'Payments', icon: <PaymentIcon /> },
  { path: '/expenses', label: 'Expenses', icon: <ExpenseIcon /> },
  { path: '/reports', label: 'Reports', icon: <ReportIcon /> },
  { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
];

export default function Sidebar({ open, onClose, ref }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!open && <Box component="span" sx={{ fontSize: 24 }}>📱</Box>}
          {open && <Box component="span" sx={{ fontWeight: 700, fontSize: 20, color: 'primary.main' }}>GST</Box>}
        </Box>
        {open && (
          <IconButton size="small" onClick={onClose}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>
      <List sx={{ flexGrow: 1, px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => { navigate(item.path); if (window.innerWidth < 900) onClose(); }}
              sx={{ borderRadius: 1, minHeight: 44, px: 2 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              {open && <ListItemText primary={item.label} />}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box ref={ref}>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? 260 : 73,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? 260 : 73,
            boxSizing: 'border-box',
            transition: 'width 0.3s',
            overflowX: 'hidden',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
