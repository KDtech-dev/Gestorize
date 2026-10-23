'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Tab, Tabs } from '@mui/material';

export type NavigationItem = {
  href: string;
  title: string;
  icon: string;
  permission?: string;
};

export function TopNavigation({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname();
  const selected = items.find((item) => pathname === item.href)?.href ?? false;

  return (
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
          icon={<Box component="span" aria-hidden="true">{item.icon}</Box>}
          iconPosition="top"
          label={item.title}
          aria-label={item.title}
        />
      ))}
    </Tabs>
  );
}
