'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Clock,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Camera,
  ChevronRight,
  DollarSign,
  FileText,
  Filter,
  X,
} from 'lucide-react';
import { getWorkOrders, updateWorkOrder } from '@/lib/store';
import { WorkOrder, WorkOrderStatus } from '@/types';
import { ImageUploader } from '@/components/media/ImageUploader';

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('TODAS');
  const [activeOrderModal, setActiveOrderModal] = useState<WorkOrder | null>(null);

  const loadData = () => {
    setOrders(getWorkOrders());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('onceydos_storage_update', loadData);
    return () => window.removeEventListener('onceydos_storage_update', loadData);
  }, []);

  const filteredOrders = orders.filter(
    (o) => selectedStatus === 'TODAS' || o.status === selectedStatus
  );

  const handleStatusChange = (order: WorkOrder, newStatus: WorkOrderStatus) => {
    const updated: WorkOrder = {
      ...order,
      status: newStatus,
      completedAt: newStatus === 'FINALIZADA' ? new Date().toISOString() : order.completedAt,
    };
    updateWorkOrder(updated);
    if (activeOrderModal?.id === order.id) {
      setActiveOrderModal(updated);
    }
    loadData();
  };

  const handleAddPhotos = (newPhotos: string[]) => {
    if (!activeOrderModal) return;
    const formatted = newPhotos.map((url, i) => ({
      id: `otp-${Date.now()}-${i}`,
      url,
      description: `Foto de control de obra #${i + 1}`,
      takenAt: new Date().toISOString(),
      stage: 'PROCESO' as const,
    }));
    const updated: WorkOrder = {
      ...activeOrderModal,
      photos: formatted,
    };
    updateWorkOrder(updated);
    setActiveOrderModal(updated);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-6 h-6 text-amber-500" />
            <span>Órdenes de Trabajo & Servicios (OT)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Seguimiento de reparaciones domiciliarias y obras con fecha pactada de entrega y galería de control.
          </p>
        </div>

        {/* Filtro de Estado */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
          >
            <option value="TODAS">Todos los Estados ({orders.length})</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="ESPERA_REPUESTOS">En Espera de Repuestos</option>
            <option value="FINALIZADA">Finalizadas</option>
            <option value="COBRADA">Cobradas</option>
          </select>
        </div>
      </div>

      {/* Grid de OTs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOrders.map((order) => {
          const isDone = order.status === 'FINALIZADA' || order.status === 'COBRADA';

          return (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft-card flex flex-col justify-between hover:border-amber-300 transition-all cursor-pointer"
              onClick={() => setActiveOrderModal(order)}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-black text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                    {order.orderNumber}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      order.status === 'FINALIZADA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'COBRADA'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'ESPERA_REPUESTOS'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 mb-1 leading-snug">{order.title}</h3>
                <p className="text-xs text-slate-600 mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.clientName} &bull; {order.clientPhone}</span>
                </p>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5 mb-4">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">{order.workAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Fecha tentativa: </span>
                    <span className="text-amber-800 font-bold">{order.estimatedDeliveryDate}</span>
                  </div>
                </div>

                {/* Miniaturas de fotos */}
                {order.photos.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    {order.photos.slice(0, 3).map((p, i) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0"
                      >
                        <img src={p.url} alt="Foto" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {order.photos.length > 3 && (
                      <span className="text-[11px] font-bold text-slate-400">
                        +{order.photos.length - 3} fotos
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Saldo Pendiente:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    ${order.remainingBalance.toLocaleString('es-AR')}
                  </span>
                </div>

                <span className="text-amber-600 font-bold flex items-center gap-1">
                  <span>Ver Gestión</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Detalle de OT */}
      {activeOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-amber-400">
                    {activeOrderModal.orderNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                    {activeOrderModal.status}
                  </span>
                </div>
                <h3 className="font-bold text-base text-white mt-1">{activeOrderModal.title}</h3>
              </div>
              <button
                onClick={() => setActiveOrderModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Selector de Cambiar Estado */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Actualizar Estado de la Orden de Trabajo:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(['EN_PROCESO', 'ESPERA_REPUESTOS', 'FINALIZADA', 'COBRADA'] as WorkOrderStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(activeOrderModal, st)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                          activeOrderModal.status === st
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Información y Dirección */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Cliente & Teléfono:</span>
                  <strong className="text-slate-900 block text-sm">{activeOrderModal.clientName}</strong>
                  <span className="text-slate-600">{activeOrderModal.clientPhone}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Fecha Tentativa Pactada:</span>
                  <strong className="text-amber-800 block text-sm">
                    {activeOrderModal.estimatedDeliveryDate}
                  </strong>
                  <span className="text-slate-500">Técnico: {activeOrderModal.technicianName}</span>
                </div>
              </div>

              {/* Liquidación Económica */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Total del Trabajo:</span>
                  <span className="font-mono font-bold text-slate-800 text-base">
                    ${activeOrderModal.totalAmount.toLocaleString('es-AR')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Anticipo Recibido:</span>
                  <span className="font-mono font-bold text-emerald-700 text-base">
                    ${activeOrderModal.advancePayment.toLocaleString('es-AR')}
                  </span>
                </div>
                <div>
                  <span className="text-red-700 font-bold block">Saldo por Cobrar:</span>
                  <span className="font-mono font-black text-red-900 text-lg">
                    ${activeOrderModal.remainingBalance.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Galería y Subida de Fotos */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <ImageUploader
                  images={activeOrderModal.photos.map((p) => p.url)}
                  onChange={handleAddPhotos}
                  maxImages={8}
                  label="Relevamiento y Fotos de Fin de Obra"
                  allowCamera={true}
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setActiveOrderModal(null)}
                className="py-2.5 px-6 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
