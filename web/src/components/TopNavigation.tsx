'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Avatar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Tab, Tabs, Typography } from '@mui/material';

export type NavigationItem = {
  href: string;
  title: string;
  icon: string;
  permission?: string;
};

type TopNavigationProps = {
  items: NavigationItem[];
  name: string;
  email: string;
  imageUrl?: string | null;
  darkMode: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
};

export function TopNavigation({ items, name, email, imageUrl, darkMode, onToggleTheme, onSignOut }: TopNavigationProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const selected = items.find((item) => pathname === item.href || (item.href === '/clientes' && pathname.startsWith('/clientes/')))?.href ?? false;

  return (
    <>
    <Tabs
      className="top-nav"
      value={selected}
      variant="scrollable"
      scrollButtons={false}
      aria-label="Navegação principal"
      sx={{
        minWidth: 0,
        flex: 'none',
        width: 'max-content',
        maxWidth: '100%',
        '& .MuiTabs-flexContainer': { justifyContent: 'center', gap: { xs: 0.5, md: 1 } },
        '& .MuiTabs-indicator': { display: 'none' },
        '& .MuiTab-root': {
          minWidth: { xs: 60, md: 70 },
          minHeight: 78,
          height: 78,
          px: { xs: 0.625, md: 1.125 },
          py: 0.875,
          gap: 0.75,
          borderRadius: '12px',
          color: '#cdd9f1',
          fontFamily: 'DM Sans, Arial, sans-serif',
          fontSize: { xs: 10, md: 11 },
          fontWeight: 700,
          lineHeight: 1.2,
          textTransform: 'none',
          transition: 'background .16s, color .16s',
          '&:hover': { backgroundColor: '#ffffff1f', color: '#fff' },
          '&.Mui-selected': {
            backgroundColor: '#005CE4',
            color: '#fff',
            boxShadow: 'inset 0 0 0 1px #005CE4',
          },
          '&.Mui-selected:hover': { backgroundColor: '#0048b8' },
        },
        '& .MuiTab-iconWrapper': { fontSize: 21, lineHeight: 1 },
        '.theme-root[data-theme="dark"] & .MuiTab-root': {
          color: '#475569',
          '&:hover': { backgroundColor: '#f1f5f9', color: '#062046' },
          '&.Mui-selected': {
            backgroundColor: '#062046',
            color: '#fff',
            boxShadow: 'inset 0 0 0 1px #31537f',
          },
          '&.Mui-selected:hover': { backgroundColor: '#062046' },
        },
      }}
    >
      {items.map((item) => (
        <Tab
          key={item.href}
          component={Link}
          href={item.href}
          value={item.href}
          icon={<Icon icon={item.icon} width={21} height={21} aria-hidden="true" />}
          iconPosition="top"
          label={item.title}
          aria-label={item.title}
        />
      ))}
    </Tabs>
    <IconButton className="top-nav-avatar-trigger" aria-label="Abrir navegação e opções da conta" onClick={() => setMenuOpen(true)} sx={{ display: 'none', p: 0.4, border: '2px solid #ffffff80', borderRadius: '50%' }}>
      <Avatar src={imageUrl ?? undefined} alt={name} sx={{ width: 38, height: 38, bgcolor: 'var(--primary)', color: 'var(--card)', fontSize: 15, fontWeight: 800 }}>{name.trim().charAt(0).toUpperCase()}</Avatar>
    </IconButton>
    <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)} slotProps={{ paper: { sx: { width: 290, maxWidth: '85vw', bgcolor: 'var(--card)', color: 'var(--ink)' } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2 }}>
        <Avatar src={imageUrl ?? undefined} alt={name} sx={{ width: 44, height: 44, bgcolor: 'var(--primary)', color: 'var(--card)', fontWeight: 800 }}>{name.trim().charAt(0).toUpperCase()}</Avatar>
        <Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ fontWeight: 800, fontSize: 14 }}>{name}</Typography><Typography noWrap sx={{ color: 'var(--muted)', fontSize: 12 }}>{email}</Typography></Box>
      </Box>
      <Divider />
      <List component="nav" aria-label="Navegação principal" sx={{ display: 'grid', gap: 0.5 }}>
        {items.map((item) => {
          const active = item.href === selected;
          return <ListItemButton key={item.href} component={Link} href={item.href} selected={active} onClick={() => setMenuOpen(false)} sx={{ minHeight: 48, gap: 1.25, borderRadius: '11px', color: 'var(--muted)', '&.Mui-selected': { bgcolor: 'var(--surface-soft)', color: 'var(--primary)', fontWeight: 700 }, '&.Mui-selected:hover': { bgcolor: 'var(--surface-soft)' } }}>
            <ListItemIcon sx={{ minWidth: 24, color: 'inherit' }}><Icon icon={item.icon} width={20} height={20} /></ListItemIcon>
            <ListItemText primary={item.title} slotProps={{ primary: { sx: { fontSize: 14, fontWeight: active ? 700 : 600 } } }} />
          </ListItemButton>;
        })}
      </List>
      <Box sx={{ mt: 'auto' }}><Divider />
        <List sx={{ display: 'grid', gap: 0.5 }}>
          <ListItemButton onClick={() => { onToggleTheme(); setMenuOpen(false); }} sx={{ minHeight: 48, gap: 1.25, borderRadius: '11px', color: 'var(--muted)' }}>
            <ListItemIcon sx={{ minWidth: 24, color: 'inherit' }}><Icon icon={darkMode ? 'mdi:white-balance-sunny' : 'mdi:moon-waning-crescent'} width={20} height={20} /></ListItemIcon>
            <ListItemText primary={darkMode ? 'Tema claro' : 'Tema escuro'} slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 600 } } }} />
          </ListItemButton>
          <ListItemButton onClick={() => { setMenuOpen(false); onSignOut(); }} sx={{ minHeight: 48, gap: 1.25, borderRadius: '11px', color: 'var(--muted)', '&:hover': { color: '#dc2626' } }}>
            <ListItemIcon sx={{ minWidth: 24, color: 'inherit' }}><Icon icon="mdi:logout" width={20} height={20} /></ListItemIcon>
            <ListItemText primary="Sair da conta" slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 600 } } }} />
          </ListItemButton>
        </List>
      </Box>
    </Drawer>
    </>
  );
}
