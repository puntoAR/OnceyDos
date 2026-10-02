'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Boxes,
  ShoppingCart,
  Smartphone,
  Wrench,
  AlertTriangle,
  Landmark,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  getProducts,
  getSales,
  getWorkOrders,
  getObligations,
  getNotifications,
  getCurrentUser,
  getLicense,
} from '@/lib/store';
import { MandatoryEvidenceModal } from '@/components/notifications/MandatoryEvidenceModal';
import { FinancialObligation, SystemNotification } from '@/types';

export default function DashboardPage() {
  const [productsCount, setProductsCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [todaySalesTotal, setTodaySalesTotal] = useState(0);
  const [activeWorkOrdersCount, setActiveWorkOrdersCount] = useState(0);
  const [pendingObligations, setPendingObligations] = useState<FinancialObligation[]>([]);
  const [activeNotifications, setActiveNotifications] = useState<SystemNotification[]>([]);
  
  // Modal de resolución con evidencia obligatoria
  const [selectedNotif, setSelectedNotif] = useState<SystemNotification | null>(null);
  const [selectedObligation, setSelectedObligation] = useState<FinancialObligation | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  const user = getCurrentUser();
  const license = getLicense();

  const loadData = () => {
    const products = getProducts();
    setProductsCount(products.length);
    setLowStockCount(products.filter((p) => p.currentStock <= p.minStock).length);

    const sales = getSales();
    const todayTotal = sales.reduce((acc, s) => acc + s.total, 0);
    setTodaySalesTotal(todayTotal);

    const orders = getWorkOrders();
    setActiveWorkOrdersCount(orders.filter((o) => o.status !== 'FINALIZADA' && o.status !== 'COBRADA').length);

    const obligations = getObligations().filter((o) => o.status === 'PENDIENTE');
    setPendingObligations(obligations);

    const notifs = getNotifications().filter((n) => n.active);
    setActiveNotifications(notifs);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('onceydos_storage_update', loadData);
    return () => window.removeEventListener('onceydos_storage_update', loadData);
  }, []);

  const handleResolveAlert = (notif: SystemNotification) => {
    if (notif.obligationId) {
      const obl = pendingObligations.find((o) => o.id === notif.obligationId);
      if (obl) {
        setSelectedNotif(notif);
        setSelectedObligation(obl);
        setShowEvidenceModal(true);
      }
    }
  };

  const urgentAlerts = activeNotifications.filter((n) => n.requiresEvidence || n.priority === 'URGENTE');

  return (
    <div className="space-y-6">
      {/* Banner de Bienvenida y Estado */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-14 rounded-2xl bg-white p-1 border border-slate-700 shadow-xl shrink-0 overflow-hidden hidden sm:flex items-center justify-center">
              <img
                src="/images/logo-11y2.png"
                alt="Logo Ferretería 11 y 2"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30 mb-2">
                <span>Puesto Activo: {user.name} ({user.role})</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Ferretería 11 y 2 &bull; Panel Operativo
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                Sistema integral de control de stock (10k insumos), venta mostrador, presupuestos in situ y órdenes de trabajo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/pos"
              className="flex items-center space-x-2 py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all transform active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Venta Mostrador (POS)</span>
            </Link>
            <Link
              href="/presupuestos"
              className="flex items-center space-x-2 py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all"
            >
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>Presupuesto In Situ</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ALERTA OBLIGATORIA DESTACADA: Cheques por vencer o deudas de clientes */}
      {urgentAlerts.length > 0 && (
        <div className="bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-5 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/30">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white mb-1">
                  Atención Bancaria Requerida ({urgentAlerts.length})
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {urgentAlerts[0].title}
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  {urgentAlerts[0].message}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleResolveAlert(urgentAlerts[0])}
              className="shrink-0 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Transacción</span>
            </button>
          </div>
        </div>
      )}

      {/* Tarjetas de Métricas y KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Catálogo de Stock */}
        <Link
          href="/stock"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft-card hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Catálogo de Insumos
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {productsCount.toLocaleString('es-AR')}
            </span>
            <span className="text-xs text-slate-500 font-medium">artículos</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span>Ver listado y fotos</span>
            <ArrowRight className="w-3 h-3 text-amber-500 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* Reposición Urgente */}
        <Link
          href="/stock?filter=low"
          className={`p-5 rounded-2xl border shadow-soft-card transition-all group ${
            lowStockCount > 0
              ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400'
              : 'bg-white border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Reposición Urgente
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-900 font-mono">
              {lowStockCount}
            </span>
            <span className="text-xs text-amber-700 font-medium">bajo stock mín.</span>
          </div>
          <p className="text-xs text-amber-800 font-semibold mt-2 flex items-center gap-1">
            <span>Generar orden a proveedor</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* Ventas Registradas */}
        <Link
          href="/pos"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft-card hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ventas Mostrador
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              ${todaySalesTotal.toLocaleString('es-AR')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span>Nueva venta con ticket</span>
            <ArrowRight className="w-3 h-3 text-amber-500 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>

        {/* Órdenes de Trabajo Activas */}
        <Link
          href="/ordenes-trabajo"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-soft-card hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Obras & Reparaciones
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {activeWorkOrdersCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">en ejecución</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span>Control de fechas de entrega</span>
            <ArrowRight className="w-3 h-3 text-amber-500 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>
      </div>

      {/* Sección Doble: Compromisos Bancarios vs Acciones Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cartera de Compromisos Financieros (Cheques & Cobros) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft-card">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Landmark className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-base text-slate-900">
                Compromisos Bancarios y Cobranzas Pendientes
              </h2>
            </div>
            <Link
              href="/finanzas"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>Ver Cartera Completa</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {pendingObligations.map((obl) => (
              <div
                key={obl.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 hover:bg-slate-100/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        obl.type === 'CHEQUE_EMITIDO'
                          ? 'bg-red-100 text-red-800'
                          : obl.type === 'COBRO_TRABAJO'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {obl.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">Vencimiento:</span>
                    <span className="text-xs font-bold text-slate-800">{obl.dueDate}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{obl.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {obl.entityName} {obl.bank ? `• ${obl.bank}` : ''} {obl.checkNumber ? `• Cheque N° ${obl.checkNumber}` : ''}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
                  <span className="font-mono font-black text-slate-900 text-base">
                    ${obl.amount.toLocaleString('es-AR')}
                  </span>
                  <button
                    onClick={() => {
                      const notif = activeNotifications.find((n) => n.obligationId === obl.id) || null;
                      setSelectedNotif(notif);
                      setSelectedObligation(obl);
                      setShowEvidenceModal(true);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors shadow-xs"
                  >
                    Confirmar Transacción
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Lateral de Atajos y Estado */}
        <div className="space-y-4">
          {/* Card Presupuestos Móviles */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 text-slate-950 shadow-lg shadow-amber-500/20">
            <Smartphone className="w-8 h-8 mb-3" />
            <h3 className="font-black text-lg leading-tight">
              Presupuestos In Situ desde el Celular
            </h3>
            <p className="text-xs text-slate-900/80 mt-1 mb-4 leading-relaxed font-medium">
              Saca fotos de la obra con la cámara de tu teléfono, selecciona materiales de ferretería y cotiza mano de obra al instante.
            </p>
            <Link
              href="/presupuestos"
              className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-slate-950 text-white font-bold text-xs shadow-md hover:bg-slate-900 transition-colors"
            >
              <span>Abrir Cotizador Móvil</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            </Link>
          </div>

          {/* Estado de Seguridad y Licencia */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Licencia del Sistema</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                {license.type}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Licenciado a: <strong>{license.issuedTo}</strong> ({license.daysRemaining} días restantes).
            </p>
            <Link
              href="/licencias"
              className="block text-center py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Ver Actualizaciones del Sistema
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de Evidencia Obligatoria */}
      <MandatoryEvidenceModal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        notification={selectedNotif}
        obligation={selectedObligation}
        onSuccess={loadData}
      />
    </div>
  );
}
