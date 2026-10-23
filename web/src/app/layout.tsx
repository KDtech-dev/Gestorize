import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';

export const metadata: Metadata = {
  title: 'Gestorize',
  description: 'Gestão simples para o seu negócio.',
  icons: {
    icon: [{ url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><ThemeProvider><ToastProvider><AuthProvider>{children}</AuthProvider></ToastProvider></ThemeProvider></body></html>;
}
