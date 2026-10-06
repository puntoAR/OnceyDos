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
  ShieldCheck,
} from 'lucide-react';
import {
  getWorkOrders,
  updateWorkOrder,
  addWorkOrderDirect,
  confirmWorkOrderCompletionByUser,
  adminApproveCompletionAndInvoice,
  finalizeWorkOrderAndInvoice,
  isUserAdmin,
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

  // Modal Paso 5: Usuario confirma finalización de tarea
  const [orderToConfirmByUser, setOrderToConfirmByUser] = useState<WorkOrder | null>(null);
  const [userCompletionNotes, setUserCompletionNotes] = useState('');
  const [userCompletionPhotos, setUserCompletionPhotos] = useState<string[]>([]);

  // Modal Paso 6: Administrador aprueba fin de obra y factura saldo restante
  const [orderToApproveByAdmin, setOrderToApproveByAdmin] = useState<WorkOrder | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentMethodType>('EFECTIVO');
  const [paymentRef, setPaymentRef] = useState('');
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
      technicianId: currentUser?.id || 'usr-tecnico',
      technicianName: currentUser?.name || 'Técnico de Obra',
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
    if (newStatus === 'FINALIZADA_USUARIO') {
      setOrderToConfirmByUser(order);
      return;
    }
    if (newStatus === 'FINALIZADA' || newStatus === 'COBRADA') {
      if (isUserAdmin(currentUser)) {
        setOrderToApproveByAdmin(order);
      } else {
        alert('Solo los administradores pueden aprobar la finalización de obra y generar la factura.');
      }
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

  // Paso 5: Usuario confirma finalización de tarea
  const handleConfirmCompletionByUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToConfirmByUser) return;

    const formattedCompPhotos = userCompletionPhotos.map((url, idx) => ({
      id: `comp-photo-${Date.now()}-${idx}`,
      url,
      description: `Foto de Fin de Obra / Control de Calidad #${idx + 1}`,
      takenAt: new Date().toISOString(),
      stage: 'FINALIZADO' as const,
    }));

    confirmWorkOrderCompletionByUser(
      orderToConfirmByUser.id,
      userCompletionNotes.trim() || undefined,
      formattedCompPhotos
    );

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {}

    setOrderToConfirmByUser(null);
    setActiveOrderModal(null);
    setUserCompletionNotes('');
    setUserCompletionPhotos([]);
    loadData();
  };

  // Paso 6: Administrador aprueba fin de obra y genera la factura
  const handleAdminApproveAndInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToApproveByAdmin) return;

    try {
      const result = adminApproveCompletionAndInvoice(
        orderToApproveByAdmin.id,
        { type: paymentType, reference: paymentRef.trim() || undefined },
        adminNotes.trim() || undefined
      );

      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      } catch {}

      setCompletedInvoice(result);
      setOrderToApproveByAdmin(null);
      setActiveOrderModal(null);
      setAdminNotes('');
      setPaymentRef('');
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
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
              <option value="FINALIZADA_USUARIO">Paso 5: Finalizadas por Técnico</option>
              <option value="COBRADA">Paso 6: Aprobadas & Facturadas</option>
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
          const isUserCompleted = order.status === 'FINALIZADA_USUARIO';
          const isFullyDone = order.status === 'FINALIZADA' || order.status === 'COBRADA';
          const isAdmin = isUserAdmin(currentUser);

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
                        : isUserCompleted
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : order.status === 'ESPERA_REPUESTOS'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isUserCompleted
                      ? '5. TAREA FINALIZADA (PENDIENTE ADMIN)'
                      : isFullyDone
                      ? '6. OBRA FACTURADA'
                      : order.status.replace('_', ' ')}
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

                {/* Botón de Paso 5 o Paso 6 */}
                {isUserCompleted ? (
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Completada por {order.userCompletedByName?.split(' ')[0] || 'el técnico'}</span>
                    </div>
                    {isAdmin ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderToApproveByAdmin(order);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Paso 6: Aprobar Fin de Obra & Facturar</span>
                      </button>
                    ) : (
                      <span className="block text-center text-[10px] text-slate-400 italic">
                        Aguardando aprobación del administrador para facturar.
                      </span>
                    )}
                  </div>
                ) : !isFullyDone ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOrderToConfirmByUser(order);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Paso 5: Confirmar Finalización de Tarea</span>
                  </button>
                ) : (
                  <div className="p-2 bg-blue-50 rounded-xl text-center text-xs font-bold text-blue-900 border border-blue-200 flex items-center justify-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-blue-600" />
                    <span>Obra Aprobada & Facturada ({order.invoiceReceiptNumber || 'OK'})</span>
                  </div>
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
                  {(['EN_PROCESO', 'ESPERA_REPUESTOS', 'FINALIZADA_USUARIO', 'COBRADA'] as WorkOrderStatus[]).map(
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
                        {st === 'FINALIZADA_USUARIO'
                          ? '5. FINALIZADA POR TÉCNICO'
                          : st === 'COBRADA'
                          ? '6. APROBADA & FACTURADA'
                          : st.replace('_', ' ')}
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

              {/* Botón según Paso 5 o Paso 6 */}
              {activeOrderModal.status === 'FINALIZADA_USUARIO' ? (
                isUserAdmin(currentUser) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const target = activeOrderModal;
                      setActiveOrderModal(null);
                      setOrderToApproveByAdmin(target);
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Paso 6: Aprobar Fin de Obra & Generar Factura</span>
                  </button>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center text-xs text-amber-900 font-semibold">
                    Tarea finalizada por el técnico. Aguardando aprobación de administración para facturar.
                  </div>
                )
              ) : activeOrderModal.status !== 'COBRADA' && activeOrderModal.status !== 'FINALIZADA' ? (
                <button
                  type="button"
                  onClick={() => {
                    const target = activeOrderModal;
                    setActiveOrderModal(null);
                    setOrderToConfirmByUser(target);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Paso 5: Confirmar Finalización de Tarea</span>
                </button>
              ) : (
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-center text-xs text-blue-900 font-bold">
                  Obra Aprobada por Administración & Facturada ({activeOrderModal.invoiceReceiptNumber || 'OK'})
                </div>
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

      {/* MODAL PASO 5: EL USUARIO CONFIRMA LA FINALIZACIÓN DE LA TAREA */}
      {orderToConfirmByUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="bg-amber-500 text-slate-950 p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-900 block">
                    Paso 5 del Flujo de Trabajo
                  </span>
                  <h3 className="font-bold text-base text-slate-950 leading-tight">
                    Confirmar Finalización de la Tarea (Usuario / Técnico)
                  </h3>
                  <p className="text-xs text-slate-800">
                    Orden N° {orderToConfirmByUser.orderNumber} &bull; {orderToConfirmByUser.clientName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrderToConfirmByUser(null)}
                className="p-1 rounded-lg text-slate-800 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletionByUser} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                <strong>Confirmación de Cierre Técnico:</strong> Como usuario o técnico ejecutor, confirma que la obra <strong>{orderToConfirmByUser.title}</strong> fue finalizada. A continuación, el Administrador aprobará la finalización de obra para generar la factura por el saldo adeudado.
              </div>

              {/* Fotos de Control de Fin de Obra */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <ImageUploader
                  images={userCompletionPhotos}
                  onChange={setUserCompletionPhotos}
                  maxImages={4}
                  label="Fotografías de Tarea Concluida (Cámara o Archivo)"
                  allowCamera={true}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones Técnicas de Finalización <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={userCompletionNotes}
                  onChange={(e) => setUserCompletionNotes(e.target.value)}
                  placeholder="Detalle de tareas concluidas, pruebas realizadas y conformidad del trabajo..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between font-mono">
                <span className="text-slate-500">Saldo restante adeudado por facturar:</span>
                <span className="font-bold text-slate-900">
                  ${orderToConfirmByUser.remainingBalance.toLocaleString('es-AR')}
                </span>
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOrderToConfirmByUser(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Finalización de Tarea</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PASO 6: EL ADMINISTRADOR APRUEBA LA FINALIZACIÓN DE OBRA Y GENERA LA FACTURA */}
      {orderToApproveByAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-200 block">
                    Paso 6 del Flujo de Trabajo
                  </span>
                  <h3 className="font-bold text-base text-white leading-tight">
                    Aprobación Administrativa de Obra & Emisión de Factura
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Orden N° {orderToApproveByAdmin.orderNumber} &bull; {orderToApproveByAdmin.clientName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrderToApproveByAdmin(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminApproveAndInvoice} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Información de Tarea Concluida por el usuario */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800 block">Informe del técnico/usuario:</span>
                <p className="text-slate-600 italic">
                  &ldquo;{orderToApproveByAdmin.completionNotes || 'Trabajo ejecutado según especificaciones técnicas.'}&rdquo;
                </p>
                {orderToApproveByAdmin.userCompletedByName && (
                  <span className="text-[10px] text-slate-400 block pt-1">
                    Completada por: <strong>{orderToApproveByAdmin.userCompletedByName}</strong>
                  </span>
                )}
              </div>

              {/* Resumen de Cobro y Facturación del Saldo Restante Adeudado */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Monto Total de la Orden:</span>
                  <span className="font-mono font-bold">${orderToApproveByAdmin.totalAmount.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Anticipo / Entrega Recibida:</span>
                  <span className="font-mono font-bold">-${orderToApproveByAdmin.advancePayment.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-emerald-200">
                  <span>MONTO RESTANTE ADEUDADO A FACTURAR:</span>
                  <span className="font-mono text-emerald-900 text-base">
                    ${orderToApproveByAdmin.remainingBalance.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Selector de Medio de Cobro */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Medio de Cobro del Monto Restante
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
                  Referencia / N° de Comprobante o Transacción
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Ej: Cobrado en mano o OP-482910"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones de Cierre Administrativo (Opcional)
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ej: Obra aprobada satisfactoriamente por administración..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOrderToApproveByAdmin(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center space-x-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Aprobar Obra & Generar Factura</span>
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
