'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { initStore, getLicense, getCurrentUser, canUserAccessModule } from '@/lib/store';
import { LicenseInfo, User, AppModule } from '@/types';
import Link from 'next/link';
import { ShieldAlert, KeyRound, Lock, ArrowLeft, UserCheck } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export function AppLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const pathname = usePathname();

  const refreshData = () => {
    initStore();
    setLicense(getLicense());
    setCurrentUser(getCurrentUser());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('onceydos_storage_update', refreshData);
    return () => window.removeEventListener('onceydos_storage_update', refreshData);
  }, []);

  // La pantalla de login y el portal público de presupuesto para clientes son públicos
  const isPublicPage = pathname === '/login' || pathname.startsWith('/presupuesto/');

  if (isPublicPage) {
    return <>{children}</>;
  }

  const isExpired = license && license.status === 'EXPIRED';

  // Identificar el módulo correspondiente a la ruta actual
  const getModuleForPath = (path: string): AppModule | null => {
    if (path === '/') return 'DASHBOARD';
    if (path.startsWith('/stock')) return 'STOCK';
    if (path.startsWith('/pos')) return 'POS';
    if (path.startsWith('/presupuestos')) return 'PRESUPUESTOS';
    if (path.startsWith('/ordenes-trabajo')) return 'ORDENES_TRABAJO';
    if (path.startsWith('/finanzas')) return 'FINANZAS';
    if (path.startsWith('/alertas')) return 'ALERTAS';
    if (path.startsWith('/licencias')) return 'LICENCIAS';
    if (path.startsWith('/auditoria')) return 'AUDITORIA';
    return null;
  };

  const currentModule = getModuleForPath(pathname);
  const isAuthorized = currentUser && currentModule ? canUserAccessModule(currentUser, currentModule) : true;

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
          ) : !isAuthorized ? (
            /* Bloqueo por permisos de rol */
            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-amber-200 shadow-xl text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-700">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="inline-block px-3 py-1 bg-amber-100/80 text-amber-900 rounded-full text-[11px] font-black uppercase tracking-wider mb-2">
                  Acceso Restringido
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Permisos Insuficientes</h3>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Tu usuario actual <strong className="text-slate-800">{currentUser?.name}</strong> con el rol{' '}
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-amber-800 uppercase text-[11px]">
                    {currentUser?.role}
                  </span>{' '}
                  no tiene habilitado el acceso a este módulo.
                </p>
                {(currentModule === 'LICENCIAS' || currentModule === 'AUDITORIA') && (
                  <p className="text-[11px] text-purple-700 font-semibold bg-purple-50 p-2.5 rounded-xl border border-purple-200 mb-6">
                    🔒 Por política del sistema, los módulos de Licencias y Auditoría son exclusivos del{' '}
                    <strong>Administrador del Sistema</strong>.
                  </p>
                )}
                <div className="space-y-2 pt-2">
                  <Link
                    href={currentUser?.role === 'CAJERO' ? '/pos' : '/stock'}
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Ir a mi sección autorizada ({currentUser?.role === 'CAJERO' ? 'POS' : 'Stock'})</span>
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Cambiar de Usuario / Rol</span>
                  </Link>
                </div>
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
