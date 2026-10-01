'use client';

import React from 'react';
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
  ShieldAlert,
} from 'lucide-react';
import { getCurrentUser, getNotifications } from '@/lib/store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: Props) {
  const pathname = usePathname();
  const user = getCurrentUser();
  const activeAlerts = getNotifications().filter((n) => n.active && (n.requiresEvidence || n.priority === 'URGENTE')).length;

  const navItems = [
    { label: 'Panel Principal', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'CAJERO', 'TECNICO', 'DEPOSITO'] },
    { label: 'Inventario & Stock (10k)', href: '/stock', icon: Boxes, roles: ['ADMIN', 'CAJERO', 'TECNICO', 'DEPOSITO'] },
    { label: 'Venta Mostrador (POS)', href: '/pos', icon: ShoppingCart, roles: ['ADMIN', 'CAJERO'] },
    { label: 'Presupuestos In Situ', href: '/presupuestos', icon: Smartphone, roles: ['ADMIN', 'TECNICO'] },
    { label: 'Órdenes de Trabajo', href: '/ordenes-trabajo', icon: Wrench, roles: ['ADMIN', 'TECNICO', 'DEPOSITO'] },
    { label: 'Finanzas & Cheques', href: '/finanzas', icon: Landmark, roles: ['ADMIN'] },
    {
      label: 'Alertas de Transacción',
      href: '/alertas',
      icon: BellRing,
      roles: ['ADMIN', 'CAJERO'],
      badge: activeAlerts > 0 ? activeAlerts : undefined,
    },
    { label: 'Licencia & Actualizaciones', href: '/licencias', icon: KeyRound, roles: ['ADMIN'] },
    { label: 'Auditoría & Diagnóstico', href: '/auditoria', icon: FileText, roles: ['ADMIN'] },
  ];

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

        {/* Lista de navegación */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isAuthorized = item.roles.includes(user.role);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : isAuthorized
                    ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    : 'text-slate-500 hover:bg-slate-800/40 opacity-70'
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
