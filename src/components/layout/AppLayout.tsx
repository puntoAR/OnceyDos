'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { initStore, getLicense } from '@/lib/store';
import { LicenseInfo } from '@/types';
import Link from 'next/link';
import { ShieldAlert, KeyRound } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export function AppLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    initStore();
    setLicense(getLicense());

    const handleUpdate = () => {
      setLicense(getLicense());
    };
    window.addEventListener('onceydos_storage_update', handleUpdate);
    return () => window.removeEventListener('onceydos_storage_update', handleUpdate);
  }, []);

  // La pantalla de login y licencias se pueden ver sin el wrapper general
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  const isExpired = license && license.status === 'EXPIRED';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
          {/* Bloqueo si la licencia está vencida */}
          {isExpired && pathname !== '/licencias' ? (
            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-red-200 shadow-xl text-center">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Licencia del Sistema Vencida</h3>
                <p className="text-xs text-slate-600 mb-6">
                  El período de vigencia de su licencia ha expirado. Para continuar utilizando el sistema de gestión de ferretería, ingrese una nueva clave de licencia.
                </p>
                <Link
                  href="/licencias"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Gestionar Licencia y Activación</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
