'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge, Box, ButtonBase, Divider, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from '@mui/material';
import { UserAvatar } from '@/components/UserAvatar';

const menuItems = [
  { href: '/perfil', label: 'Meu perfil', icon: '◉' },
  { href: '/configuracoes', label: 'Configurações', icon: '⚙' },
  { href: '/ajuda', label: 'Central de ajuda', icon: '?' },
];

export function UserMenu({ name, email, role, imageUrl, signOut }: { name: string; email: string; role: string; imageUrl?: string | null; signOut: () => Promise<void> }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <>
      <ButtonBase
        className="top-account"
        aria-label="Abrir menu do usuário"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={openMenu}
        onMouseEnter={openMenu}
        onFocus={(event) => setAnchorEl(event.currentTarget)}
        sx={{ borderRadius: 1.5, px: 1.25, py: 0.75, font: 'inherit' }}
      >
        <UserAvatar name={name} imageUrl={imageUrl} className="top-avatar" />
      </ButtonBase>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          list: {
            'aria-label': 'Menu do usuário',
            sx: { py: 0.75 },
          },
          paper: {
            sx: {
              width: 260,
              maxWidth: 'calc(100vw - 24px)',
              mt: 1.5,
              border: '1px solid var(--line)',
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: 'var(--card)',
              color: 'var(--ink)',
              boxShadow: '0 12px 32px #0003',
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <Badge
              overlap="circular"
              variant="dot"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              sx={{ '& .MuiBadge-badge': { backgroundColor: '#16a34a', boxShadow: '0 0 0 2px var(--card)' } }}
            >
              <UserAvatar name={name} imageUrl={imageUrl} size={34} />
            </Badge>
            <Box sx={{ display: 'flex', ml: 1.5, minWidth: 0, flexDirection: 'column' }}>
              <Typography sx={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 700, lineHeight: 1.25 }}>
                {name.trim().split(/\s+/)[0] || name}
              </Typography>
              <Typography sx={{ width: '100%', mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: 11, lineHeight: 1.25 }}>
                {email || role}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider />
        {menuItems.slice(0, 1).map((item) => (
          <MenuItem key={item.href} component={Link} href={item.href} onClick={() => setAnchorEl(null)} sx={{ minHeight: 42, gap: 1.25, '&:hover': { backgroundColor: 'var(--surface)' } }}>
            <ListItemIcon sx={{ minWidth: '24px !important', color: 'inherit', fontSize: 17, justifyContent: 'center' }}>
              <Box component="span" aria-hidden="true">{item.icon}</Box>
            </ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 600 } } }} />
          </MenuItem>
        ))}
        <Divider />
        {menuItems.slice(1).map((item) => (
          <MenuItem key={item.href} component={Link} href={item.href} onClick={() => setAnchorEl(null)} sx={{ minHeight: 42, gap: 1.25, '&:hover': { backgroundColor: 'var(--surface)' } }}>
            <ListItemIcon sx={{ minWidth: '24px !important', color: 'inherit', fontSize: 17, justifyContent: 'center' }}>
              <Box component="span" aria-hidden="true">{item.icon}</Box>
            </ListItemIcon>
            <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 600 } } }} />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => { setAnchorEl(null); void signOut(); }}
          sx={{
            minHeight: 42,
            gap: 1.25,
            '&:hover': { backgroundColor: '#ef44441a', color: '#dc2626' },
            '&:hover .MuiListItemText-primary': { color: '#dc2626' },
          }}
        >
          <ListItemIcon sx={{ minWidth: '24px !important', color: 'inherit', fontSize: 17, justifyContent: 'center' }}>
            <Box component="span" aria-hidden="true">↪</Box>
          </ListItemIcon>
          <ListItemText primary="Sair" slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 600 } } }} />
        </MenuItem>
      </Menu>
    </>
  );
}
