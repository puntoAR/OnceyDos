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
  Plus,
  Receipt,
  Printer,
  Banknote,
  Smartphone,
  Landmark,
  CreditCard,
} from 'lucide-react';
import {
  getWorkOrders,
  updateWorkOrder,
  addWorkOrderDirect,
  finalizeWorkOrderAndInvoice,
  getClients,
  getCurrentUser,
} from '@/lib/store';
import { WorkOrder, WorkOrderStatus, Client, Sale, PaymentMethodType } from '@/types';
import { ImageUploader } from '@/components/media/ImageUploader';
import confetti from 'canvas-confetti';

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('TODAS');
  const [activeOrderModal, setActiveOrderModal] = useState<WorkOrder | null>(null);

  // Modal para Creación Directa de OT (PC y Celular)
  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);
  const [directForm, setDirectForm] = useState({
    clientId: '',
    clientName: '',
    clientPhone: '',
    workAddress: '',
    title: '',
    description: '',
    estimatedDeliveryDate: '',
    totalAmount: 50000,
    advancePayment: 0,
    photos: [] as string[],
  });

  // Modal para Finalización de Tarea & Facturación Automática
  const [orderToInvoice, setOrderToInvoice] = useState<WorkOrder | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentMethodType>('EFECTIVO');
  const [paymentRef, setPaymentRef] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);
  const [completedInvoice, setCompletedInvoice] = useState<{ order: WorkOrder; sale: Sale } | null>(null);

  const currentUser = getCurrentUser();

  const loadData = () => {
    setOrders(getWorkOrders());
    setClients(getClients());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('onceydos_storage_update', loadData);
    return () => window.removeEventListener('onceydos_storage_update', loadData);
  }, []);

  const filteredOrders = orders.filter(
    (o) => selectedStatus === 'TODAS' || o.status === selectedStatus
  );

  const handleOpenDirectModal = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const defaultClient = clients[0];

    setDirectForm({
      clientId: defaultClient?.id || '',
      clientName: defaultClient?.name || 'Cliente Particular',
      clientPhone: defaultClient?.phone || '',
      workAddress: defaultClient?.address || '',
      title: '',
      description: '',
      estimatedDeliveryDate: d.toISOString().slice(0, 10),
      totalAmount: 60000,
      advancePayment: 20000,
      photos: [],
    });
    setIsDirectModalOpen(true);
  };

  const handleCreateDirectOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directForm.title.trim() || !directForm.estimatedDeliveryDate) return;

    const formattedPhotos = directForm.photos.map((url, idx) => ({
      id: `otp-d-${Date.now()}-${idx}`,
      url,
      description: `Foto de relevamiento inicial #${idx + 1}`,
      takenAt: new Date().toISOString(),
      stage: 'INSPECCION' as const,
    }));

    addWorkOrderDirect({
      quoteId: `dir-${Date.now()}`,
      clientId: directForm.clientId || 'cli-direct',
      clientName: directForm.clientName,
      clientPhone: directForm.clientPhone,
      workAddress: directForm.workAddress,
      title: directForm.title.trim(),
      description: directForm.description.trim(),
      technicianId: currentUser.id,
      technicianName: currentUser.name,
      estimatedDeliveryDate: directForm.estimatedDeliveryDate,
      status: 'EN_PROCESO',
      totalAmount: Number(directForm.totalAmount),
      advancePayment: Number(directForm.advancePayment),
      remainingBalance: Number(directForm.totalAmount) - Number(directForm.advancePayment),
      photos: formattedPhotos,
    });

    setIsDirectModalOpen(false);
    loadData();
  };

  const handleStatusChange = (order: WorkOrder, newStatus: WorkOrderStatus) => {
    if (newStatus === 'FINALIZADA') {
      // Si el usuario quiere marcarla finalizada, abrir modal de facturación directa
      setOrderToInvoice(order);
      return;
    }

    const updated: WorkOrder = {
      ...order,
      status: newStatus,
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

  // Confirmar finalización de tarea y generar factura/ticket
  const handleConfirmFinalizeAndInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToInvoice) return;

    const formattedCompPhotos = completionPhotos.map((url, idx) => ({
      id: `comp-photo-${Date.now()}-${idx}`,
      url,
      description: `Foto de Fin de Obra / Control de Calidad #${idx + 1}`,
      takenAt: new Date().toISOString(),
      stage: 'FINALIZADO' as const,
    }));

    const result = finalizeWorkOrderAndInvoice(
      orderToInvoice.id,
      { type: paymentType, reference: paymentRef.trim() || undefined },
      completionNotes.trim() || undefined,
      formattedCompPhotos
    );

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch {}

    setCompletedInvoice(result);
    setOrderToInvoice(null);
    setActiveOrderModal(null);
    setCompletionNotes('');
    setCompletionPhotos([]);
    setPaymentRef('');
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
            Gestión de tareas de reparaciones y obras in situ con fecha de entrega y facturación automática al finalizar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro de Estado */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              <option value="TODAS">Todos los Estados ({orders.length})</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="ESPERA_REPUESTOS">En Espera de Repuestos</option>
              <option value="FINALIZADA">Finalizadas</option>
              <option value="COBRADA">Cobradas</option>
            </select>
          </div>

          {/* Botón Nueva OT Directa (PC y Móvil) */}
          <button
            onClick={handleOpenDirectModal}
            className="flex items-center space-x-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4 font-bold" />
            <span>+ Nueva OT Directa</span>
          </button>
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
                      order.status === 'COBRADA'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'FINALIZADA'
                        ? 'bg-emerald-100 text-emerald-800'
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

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5 mb-3">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">{order.workAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Fecha pactada: </span>
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

              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Saldo Pendiente:</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      ${order.remainingBalance.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <span className="text-amber-600 font-bold flex items-center gap-1">
                    <span>Gestionar</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>

                {/* Botón de Finalizar y Facturar directo si está en proceso */}
                {!isDone && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOrderToInvoice(order);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Finalizar Tarea & Facturar</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CREAR OT DIRECTA (PC & CELULAR) */}
      {isDirectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Nueva Orden de Trabajo Directa</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Alta inmediata de reparación u obra desde PC o celular sin presupuesto previo
                </p>
              </div>
              <button
                onClick={() => setIsDirectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDirectOrder} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Fotos iniciales del relevamiento */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <ImageUploader
                  images={directForm.photos}
                  onChange={(imgs) => setDirectForm({ ...directForm, photos: imgs })}
                  maxImages={6}
                  label="Relevamiento Fotográfico (Cámara del Celular)"
                  allowCamera={true}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cliente</label>
                  <select
                    value={directForm.clientId}
                    onChange={(e) => {
                      const c = clients.find((cl) => cl.id === e.target.value);
                      setDirectForm({
                        ...directForm,
                        clientId: e.target.value,
                        clientName: c ? c.name : 'Cliente Particular',
                        clientPhone: c ? c.phone : '',
                        workAddress: c ? c.address : '',
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={directForm.clientPhone}
                    onChange={(e) => setDirectForm({ ...directForm, clientPhone: e.target.value })}
                    placeholder="+54 11 ..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección de la Obra / Domicilio del Servicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={directForm.workAddress}
                  onChange={(e) => setDirectForm({ ...directForm, workAddress: e.target.value })}
                  placeholder="Calle, Número, Localidad"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título del Trabajo / Reparación <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={directForm.title}
                  onChange={(e) => setDirectForm({ ...directForm, title: e.target.value })}
                  placeholder="Ej: Reparación urgente de caño principal y válvula"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción Técnica de las Tareas
                </label>
                <textarea
                  rows={2}
                  value={directForm.description}
                  onChange={(e) => setDirectForm({ ...directForm, description: e.target.value })}
                  placeholder="Detalle de materiales requeridos y tareas a ejecutar..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha Tentativa Pactada <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={directForm.estimatedDeliveryDate}
                    onChange={(e) => setDirectForm({ ...directForm, estimatedDeliveryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Pactado ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={directForm.totalAmount}
                    onChange={(e) => setDirectForm({ ...directForm, totalAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Anticipo / Seña ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={directForm.totalAmount}
                    value={directForm.advancePayment}
                    onChange={(e) => setDirectForm({ ...directForm, advancePayment: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs flex justify-between font-mono font-bold text-slate-900">
                <span>Saldo pendiente al finalizar:</span>
                <span>${(directForm.totalAmount - directForm.advancePayment).toLocaleString('es-AR')}</span>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDirectModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
                >
                  Crear Orden de Trabajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE OT */}
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
                  label="Relevamiento y Fotos de Control de Obra"
                  allowCamera={true}
                />
              </div>

              {/* Botón de Finalización & Facturación */}
              {activeOrderModal.status !== 'COBRADA' && (
                <button
                  type="button"
                  onClick={() => {
                    setOrderToInvoice(activeOrderModal);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Confirmar Finalización de Tarea & Generar Factura</span>
                </button>
              )}
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

      {/* MODAL FINALIZAR TAREA Y GENERAR FACTURA */}
      {orderToInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Finalización de Tarea & Facturación Automática
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Orden N° {orderToInvoice.orderNumber} &bull; {orderToInvoice.clientName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrderToInvoice(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmFinalizeAndInvoice} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Fotos de Control de Fin de Obra */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <ImageUploader
                  images={completionPhotos}
                  onChange={setCompletionPhotos}
                  maxImages={4}
                  label="Fotografías de Obra Terminada / Control de Calidad"
                  allowCamera={true}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones de Cierre de Tarea
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Trabajo ejecutado según especificaciones técnicas pactadas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Resumen de Cobro y Facturación */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Monto Total de la Orden:</span>
                  <span className="font-mono font-bold">${orderToInvoice.totalAmount.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Anticipo ya Cobrado:</span>
                  <span className="font-mono font-bold">-${orderToInvoice.advancePayment.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-emerald-200">
                  <span>SALDO A FACTURAR Y COBRAR:</span>
                  <span className="font-mono text-emerald-900 text-base">
                    ${orderToInvoice.remainingBalance.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Selector de Medio de Cobro */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Medio de Cobro del Saldo
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { type: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                    { type: 'BILLETERA', label: 'Billetera (MP)', icon: Smartphone },
                    { type: 'CHEQUE', label: 'Cheque', icon: Landmark },
                    { type: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentType === m.type;

                    return (
                      <button
                        key={m.type}
                        type="button"
                        onClick={() => setPaymentType(m.type as PaymentMethodType)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Referencia / N° de Comprobante de Cobro
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Ej: Cobrado en mano o OP-482910"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOrderToInvoice(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Emitir Factura y Cobrar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FACTURA / TICKET EMITIDO TRAS CONCLUIR TAREA */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 flex flex-col items-center text-center font-mono">
            <button
              onClick={() => setCompletedInvoice(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white font-black text-lg flex items-center justify-center mb-2">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-sans font-black text-slate-900 text-lg">ONCE Y DOS</h3>
            <p className="text-[10px] text-slate-500 font-sans">Factura de Reparación / Obra Terminada</p>
            <p className="text-[10px] text-slate-500 pt-1">CUIT: 30-71984210-2 &bull; IVA Resp. Inscripto</p>
            <p className="text-[10px] text-slate-400">Comprobante: {completedInvoice.sale.receiptNumber}</p>
            <p className="text-[10px] text-slate-400">Orden: {completedInvoice.order.orderNumber}</p>

            <div className="w-full border-b border-dashed border-slate-300 my-3"></div>

            <div className="w-full text-left text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="font-bold">{completedInvoice.order.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Servicio:</span>
                <span className="truncate max-w-[150px]">{completedInvoice.order.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Trabajo:</span>
                <span>${completedInvoice.order.totalAmount.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Anticipo Deducido:</span>
                <span>-${completedInvoice.order.advancePayment.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-200">
                <span>SALDO COBRADO:</span>
                <span>${completedInvoice.sale.total.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <div className="w-full border-b border-dashed border-slate-300 my-3"></div>

            <p className="text-[10px] text-slate-400 font-sans italic">
              Tarea concluida satisfactoriamente. <br />
              powered by puntoAR
            </p>

            <div className="flex items-center gap-3 w-full mt-4 font-sans">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Factura</span>
              </button>
              <button
                onClick={() => setCompletedInvoice(null)}
                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
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
