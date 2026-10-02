import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { AppLayout } from '@/components/layout/AppLayout';
import { InstallAppFloating } from '@/components/pwa/InstallAppFloating';

export const metadata: Metadata = {
  title: 'Once y Dos | Sistema Integral para Ferretería - powered by puntoAR',
  description: 'Gestión de Stock de 10.000 productos, POS de Mostrador, Presupuestos Móviles In Situ, Órdenes de Trabajo y Alertas Bancarias.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#f59e0b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased text-slate-800 bg-slate-50 selection:bg-amber-400 selection:text-slate-900">
        <ErrorBoundary>
          <AppLayout>{children}</AppLayout>
          <InstallAppFloating />
        </ErrorBoundary>
      </body>
    </html>
  );
}
