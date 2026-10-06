'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  MessageSquare,
  Info,
  ShieldCheck,
  User as UserIcon,
  ChevronDown,
  Menu,
  AlertTriangle,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { getCurrentUser, logoutUser, getUsers, getNotifications, getLicense, canUserAccessModule } from '@/lib/store';
import { User, SystemNotification, LicenseInfo } from '@/types';
import { AboutModal } from '../dev-support/AboutModal';
import { DevChatModal } from '../dev-support/DevChatModal';

interface Props {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: Props) {
  const router = useRouter();
  const [currentUser, setCurrUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showDevChat, setShowDevChat] = useState(false);

  const refreshData = () => {
    setCurrUser(getCurrentUser());
    setUsers(getUsers());
    setNotifications(getNotifications().filter((n) => n.active));
    setLicense(getLicense());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('onceydos_storage_update', refreshData);
    return () => window.removeEventListener('onceydos_storage_update', refreshData);
  }, []);

  const urgentCount = notifications.filter((n) => n.requiresEvidence || n.priority === 'URGENTE').length;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo y Botón móvil */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="relative w-10 sm:w-12 h-9 sm:h-10 rounded-xl overflow-hidden bg-white border border-slate-200/90 shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform p-0.5 shrink-0">
                <Image
                  src="/images/logo-11y2.png"
                  alt="Logo Ferretería 11 y 2"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <span className="font-black text-slate-900 text-sm sm:text-lg tracking-tight block leading-none whitespace-nowrap">
                  Ferretería 11 y 2
                </span>
                <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider hidden sm:block">
                  Electricidad &bull; Gestión Integral
                </span>
              </div>
            </Link>
          </div>

          {/* Badge central powered by puntoAR (en pantallas medianas en adelante) */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/70 text-xs">
            <span className="text-slate-400 font-medium italic">powered by</span>
            <div className="relative w-24 h-5">
              <Image
                src="/images/logo-puntoar.png"
                alt="punto AR"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Acciones del Navbar */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Estado de Licencia (solo visible para Administrador del Sistema) */}
            {canUserAccessModule(currentUser, 'LICENCIAS') && license && (
              <Link
                href="/licencias"
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  license.type === 'TRIAL'
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{license.type}: {license.daysRemaining}d</span>
              </Link>
            )}

            {/* Notificaciones de Cheques / Cobros Obligatorios */}
            <Link
              href="/alertas"
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Alertas de pagos, cobros y cheques"
            >
              <Bell className="w-5 h-5" />
              {urgentCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {urgentCount}
                </span>
              )}
            </Link>

            {/* Chat con el Programador */}
            <button
              onClick={() => setShowDevChat(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-colors relative"
              title="Chat directo con el desarrollador puntoAR"
            >
              <MessageSquare className="w-5 h-5 text-amber-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>

            {/* Acerca de */}
            <button
              onClick={() => setShowAbout(true)}
              className="hidden sm:flex p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              title="Acerca del sistema Once y Dos"
            >
              <Info className="w-5 h-5" />
            </button>

            {/* Selector de Rol / Usuario Activo */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-2 p-1.5 sm:px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 transition-colors text-xs font-semibold text-slate-800"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                  {currentUser?.name.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block leading-none">{currentUser?.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-amber-700 uppercase font-black">{currentUser?.role}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {currentUser && (
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sesión Activa</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">@{currentUser.username}</p>
                      <div className="mt-1.5 inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                        Rol: {currentUser.role}
                      </div>
                    </div>
                  )}

                  <div className="p-2 space-y-1">
                    {canUserAccessModule(currentUser, 'AUDITORIA') && (
                      <Link
                        href="/auditoria?tab=usuarios"
                        onClick={() => setShowRoleMenu(false)}
                        className="flex items-center gap-2.5 w-full py-2 px-3 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>Alta & Gestión de Usuarios</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowRoleMenu(false);
                        logoutUser();
                        router.replace('/login');
                      }}
                      className="flex items-center gap-2.5 w-full py-2 px-3 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Cambiar de Cuenta</span>
                    </button>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRoleMenu(false);
                          logoutUser();
                          router.replace('/login');
                        }}
                        className="flex items-center gap-2.5 w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modales */}
      <AboutModal
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
        onOpenChat={() => setShowDevChat(true)}
      />
      <DevChatModal
        isOpen={showDevChat}
        onClose={() => setShowDevChat(false)}
      />
    </>
  );
}
