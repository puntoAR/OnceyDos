'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Smartphone,
  Wrench,
  Landmark,
  BellRing,
  KeyRound,
  FileText,
  X,
  ShieldCheck,
} from 'lucide-react';
import { getCurrentUser, getNotifications, canUserAccessModule } from '@/lib/store';
import { User, AppModule } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<number>(0);

  const refreshData = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    const alerts = getNotifications().filter(
      (n) => n.active && (n.requiresEvidence || n.priority === 'URGENTE')
    ).length;
    setActiveAlerts(alerts);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('onceydos_storage_update', refreshData);
    return () => window.removeEventListener('onceydos_storage_update', refreshData);
  }, []);

  const navItems: {
    label: string;
    href: string;
    icon: any;
    module: AppModule;
    badge?: number;
  }[] = [
    { label: 'Panel Principal', href: '/', icon: LayoutDashboard, module: 'DASHBOARD' },
    { label: 'Inventario & Stock (10k)', href: '/stock', icon: Boxes, module: 'STOCK' },
    { label: 'Venta Mostrador (POS)', href: '/pos', icon: ShoppingCart, module: 'POS' },
    { label: 'Presupuestos In Situ', href: '/presupuestos', icon: Smartphone, module: 'PRESUPUESTOS' },
    { label: 'Órdenes de Trabajo', href: '/ordenes-trabajo', icon: Wrench, module: 'ORDENES_TRABAJO' },
    { label: 'Finanzas & Cheques', href: '/finanzas', icon: Landmark, module: 'FINANZAS' },
    {
      label: 'Alertas de Transacción',
      href: '/alertas',
      icon: BellRing,
      module: 'ALERTAS',
      badge: activeAlerts > 0 ? activeAlerts : undefined,
    },
    { label: 'Licencia & Actualizaciones', href: '/licencias', icon: KeyRound, module: 'LICENCIAS' },
    { label: 'Auditoría & Permisos', href: '/auditoria', icon: FileText, module: 'AUDITORIA' },
  ];

  const visibleNavItems = navItems.filter((item) =>
    currentUser ? canUserAccessModule(currentUser, item.module) : false
  );

  return (
    <>
      {/* Backdrop móvil */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera del sidebar */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-500/20">
              11&bull;2
            </div>
            <div>
              <h2 className="font-bold text-white text-sm tracking-tight">Once y Dos</h2>
              <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
                Ferretería &bull; Gestión
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de rol activo */}
        {currentUser && (
          <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">Puesto actual:</span>
            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
              {currentUser.role}
            </span>
          </div>
        )}

        {/* Lista de navegación */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer con branding "powered by puntoAR" */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex flex-col items-center justify-center space-y-1.5 text-center">
            <span className="text-[10px] text-slate-500 tracking-wider uppercase font-semibold">
              Desarrollado y respaldado por
            </span>
            <div className="relative w-32 h-8">
              <Image
                src="/images/logo-puntoar.png"
                alt="punto AR"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-[10px] text-amber-500 font-semibold font-mono">
              v1.2.0 &bull; Vercel Ready
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
