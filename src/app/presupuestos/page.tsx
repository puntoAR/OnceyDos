'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Plus,
  Camera,
  Search,
  CheckCircle2,
  X,
  Calendar,
  User,
  MapPin,
  Clock,
  ArrowRight,
  FileCheck,
  Send,
  Trash2,
  DollarSign,
  Eye,
} from 'lucide-react';
import {
  getQuotes,
  saveQuote,
  acceptQuoteAndCreateWorkOrder,
  getProducts,
  getClients,
  getCurrentUser,
} from '@/lib/store';
import { Quote, QuoteItem, QuotePhoto, Product, Client } from '@/types';
import { ImageUploader } from '@/components/media/ImageUploader';

export default function PresupuestosPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');
  
  // Modal de Aceptación y pase a OT
  const [quoteToAccept, setQuoteToAccept] = useState<Quote | null>(null);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [advancePayment, setAdvancePayment] = useState(0);

  const technician = getCurrentUser();

  // Formulario de presupuesto
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    clientPhone: '',
    workAddress: '',
    title: '',
    description: '',
    items: [] as QuoteItem[],
    photos: [] as string[],
    validityDays: 15,
  });

  const loadData = () => {
    setQuotes(getQuotes());
    setProducts(getProducts());
    setClients(getClients());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('onceydos_storage_update', loadData);
    return () => window.removeEventListener('onceydos_storage_update', loadData);
  }, []);

  const handleOpenNewModal = () => {
    setFormData({
      clientId: clients[0]?.id || '',
      clientName: clients[0]?.name || '',
      clientPhone: clients[0]?.phone || '',
      workAddress: clients[0]?.address || '',
      title: '',
      description: '',
      items: [
        {
          id: `qi-${Date.now()}-1`,
          type: 'LABOR',
          description: 'Mano de obra especializada en domicilio / reparación',
          quantity: 1,
          unitPrice: 35000,
          subtotal: 35000,
        },
      ],
      photos: [],
      validityDays: 15,
    });
    setIsModalOpen(true);
  };

  const handleClientChange = (clientId: string) => {
    const c = clients.find((client) => client.id === clientId);
    if (c) {
      setFormData((prev) => ({
        ...prev,
        clientId: c.id,
        clientName: c.name,
        clientPhone: c.phone,
        workAddress: c.address,
      }));
    }
  };

  const addProductItem = (p: Product) => {
    const newItem: QuoteItem = {
      id: `qi-${Date.now()}-${Math.random()}`,
      type: 'PRODUCT',
      productId: p.id,
      description: p.name,
      quantity: 1,
      unitPrice: p.salePrice,
      subtotal: p.salePrice,
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setSearchProduct('');
  };

  const addLaborItem = () => {
    const newItem: QuoteItem = {
      id: `qi-${Date.now()}-${Math.random()}`,
      type: 'LABOR',
      description: 'Mano de obra o servicio adicional',
      quantity: 1,
      unitPrice: 20000,
      subtotal: 20000,
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItemQty = (id: string, qty: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === id ? { ...it, quantity: qty, subtotal: qty * it.unitPrice } : it
      ),
    }));
  };

  const updateItemPrice = (id: string, price: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === id ? { ...it, unitPrice: price, subtotal: it.quantity * price } : it
      ),
    }));
  };

  const updateItemDesc = (id: string, desc: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, description: desc } : it)),
    }));
  };

  const removeItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((it) => it.id !== id),
    }));
  };

  const subtotalMaterials = formData.items
    .filter((it) => it.type === 'PRODUCT')
    .reduce((acc, it) => acc + it.subtotal, 0);

  const subtotalLabor = formData.items
    .filter((it) => it.type !== 'PRODUCT')
    .reduce((acc, it) => acc + it.subtotal, 0);

  const total = subtotalMaterials + subtotalLabor;

  const handleSaveQuote = (status: 'BORRADOR' | 'ENVIADO') => {
    if (!formData.title.trim()) {
      alert('Por favor ingrese el título del trabajo.');
      return;
    }

    const quoteNumber = `PRE-2026-${String(quotes.length + 1).padStart(4, '0')}`;
    const newQuote: Quote = {
      id: `quote-${Date.now()}`,
      quoteNumber,
      date: new Date().toISOString().slice(0, 10),
      technicianId: technician.id,
      technicianName: technician.name,
      clientId: formData.clientId || 'cli-generic',
      clientName: formData.clientName || 'Cliente Particular',
      clientPhone: formData.clientPhone,
      workAddress: formData.workAddress,
      title: formData.title.trim(),
      description: formData.description.trim(),
      items: formData.items,
      photos: formData.photos.map((url, i) => ({
        id: `qp-${i + 1}`,
        url,
        description: `Foto de Relevamiento In Situ #${i + 1}`,
        takenAt: new Date().toISOString(),
        stage: 'INSPECCION',
      })),
      subtotalMaterials,
      subtotalLabor,
      total,
      validityDays: formData.validityDays,
      status,
    };

    saveQuote(newQuote);
    setIsModalOpen(false);
    loadData();
  };

  // Convertir presupuesto a Orden de Trabajo (OT)
  const handleConfirmAcceptQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteToAccept || !estimatedDeliveryDate) return;

    acceptQuoteAndCreateWorkOrder(quoteToAccept.id, estimatedDeliveryDate, Number(advancePayment));
    setQuoteToAccept(null);
    setEstimatedDeliveryDate('');
    setAdvancePayment(0);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-amber-500" />
              <span>Presupuestos de Reparaciones & Obras In Situ</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
              Celular & PC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cotizaciones en el lugar con fotos tomadas con la cámara del celular. Al aceptarse generan la Orden de Trabajo con fecha tentativa de entrega.
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="flex items-center space-x-2 py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4 font-bold" />
          <span>Nuevo Presupuesto In Situ</span>
        </button>
      </div>

      {/* Listado de Presupuestos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {quotes.map((q) => {
          const isAccepted = q.status === 'ACEPTADO';

          return (
            <div
              key={q.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft-card flex flex-col justify-between hover:border-amber-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-xs text-slate-400">{q.quoteNumber}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      q.status === 'ACEPTADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : q.status === 'ENVIADO'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {q.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 mb-1 leading-snug">{q.title}</h3>
                <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{q.clientName}</span>
                </p>

                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 mb-4">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="truncate">{q.workAddress || 'En ferretería'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Técnico: {q.technicianName}</span>
                  </div>
                </div>

                {/* Galería de fotos del relevamiento */}
                {q.photos.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Relevamiento Fotográfico ({q.photos.length} fotos)
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {q.photos.map((p, idx) => (
                        <div
                          key={idx}
                          className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative"
                        >
                          <img src={p.url} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Total Cotizado</span>
                  <span className="text-xl font-mono font-black text-slate-900">
                    ${q.total.toLocaleString('es-AR')}
                  </span>
                </div>

                {!isAccepted ? (
                  <button
                    onClick={() => {
                      setQuoteToAccept(q);
                      // Sugerir fecha tentativa 3 días hábiles adelante
                      const d = new Date();
                      d.setDate(d.getDate() + 3);
                      setEstimatedDeliveryDate(d.toISOString().slice(0, 10));
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Aceptar & Generar Orden de Trabajo</span>
                  </button>
                ) : (
                  <div className="p-2 bg-emerald-50 rounded-xl text-center text-xs font-bold text-emerald-800 border border-emerald-200 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Orden de Trabajo Generada</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Crear Presupuesto In Situ con Fotos */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>Nuevo Presupuesto de Obra / Reparación In Situ</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Técnico relevador: <strong>{technician.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Fotos del lugar / Relevamiento in situ */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <ImageUploader
                  images={formData.photos}
                  onChange={(imgs) => setFormData({ ...formData, photos: imgs })}
                  maxImages={6}
                  label="Relevamiento Fotográfico (Cámara del Celular u Obra)"
                  allowCamera={true}
                />
              </div>

              {/* Datos del Cliente y Ubicación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cliente</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono de Contacto</label>
                  <input
                    type="text"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección del Trabajo / Domicilio de Obra
                </label>
                <input
                  type="text"
                  value={formData.workAddress}
                  onChange={(e) => setFormData({ ...formData, workAddress: e.target.value })}
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Cambio de colector de agua y prueba de presión"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción Técnica y Diagnóstico In Situ
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalles observados en la visita técnica..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Detalle de Materiales de Ferretería y Mano de Obra */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Materiales de Ferretería y Servicios
                  </span>
                  <button
                    type="button"
                    onClick={addLaborItem}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    + Agregar Mano de Obra
                  </button>
                </div>

                {/* Buscador de insumos de ferretería */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    placeholder="Buscar insumos del stock para añadir al presupuesto..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  {searchProduct && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto divide-y divide-slate-100">
                      {products
                        .filter((p) => p.name.toLowerCase().includes(searchProduct.toLowerCase()))
                        .slice(0, 5)
                        .map((p) => (
                          <div
                            key={p.id}
                            onClick={() => addProductItem(p)}
                            className="p-2 hover:bg-amber-50 cursor-pointer flex justify-between text-xs"
                          >
                            <span>{p.name}</span>
                            <span className="font-mono font-bold">${p.salePrice}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Lista de Items */}
                <div className="space-y-2">
                  {formData.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <input
                        type="text"
                        value={it.description}
                        onChange={(e) => updateItemDesc(it.id, e.target.value)}
                        className="flex-1 bg-transparent font-medium text-slate-800 focus:outline-none"
                      />

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] text-slate-400">Cant:</span>
                        <input
                          type="number"
                          min={1}
                          value={it.quantity}
                          onChange={(e) => updateItemQty(it.id, Number(e.target.value))}
                          className="w-12 px-1.5 py-0.5 rounded border border-slate-300 text-center font-mono"
                        />

                        <span className="text-[10px] text-slate-400">Precio $:</span>
                        <input
                          type="number"
                          min={0}
                          value={it.unitPrice}
                          onChange={(e) => updateItemPrice(it.id, Number(e.target.value))}
                          className="w-20 px-1.5 py-0.5 rounded border border-slate-300 text-right font-mono"
                        />

                        <span className="w-20 text-right font-mono font-bold text-slate-900">
                          ${it.subtotal.toLocaleString('es-AR')}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen Total */}
              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-900 block font-medium">
                    Materiales: ${subtotalMaterials.toLocaleString('es-AR')} &bull; Mano de Obra: ${subtotalLabor.toLocaleString('es-AR')}
                  </span>
                  <span className="text-sm font-black text-amber-950">TOTAL DEL PRESUPUESTO</span>
                </div>
                <span className="text-2xl font-black font-mono text-slate-900">
                  ${total.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs"
              >
                Cancelar
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleSaveQuote('BORRADOR')}
                  className="py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
                >
                  Guardar Borrador
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveQuote('ENVIADO')}
                  className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
                >
                  Guardar & Enviar al Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aceptar Presupuesto -> Generar Orden de Trabajo */}
      {quoteToAccept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base text-center mb-1">
              Aceptar Presupuesto & Generar Orden de Trabajo
            </h3>
            <p className="text-xs text-slate-500 text-center mb-5">
              Se creará la Orden de Trabajo correlativa para <strong>{quoteToAccept.title}</strong> con traspaso de fotografías y materiales.
            </p>

            <form onSubmit={handleConfirmAcceptQuote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha Tentativa de Entrega / Finalización <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Anticipo / Seña Recibida ($)
                </label>
                <input
                  type="number"
                  min={0}
                  max={quoteToAccept.total}
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs font-bold"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between font-mono">
                <span className="text-slate-500">Saldo restante al cobrar:</span>
                <span className="font-bold text-slate-900">
                  ${(quoteToAccept.total - advancePayment).toLocaleString('es-AR')}
                </span>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQuoteToAccept(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  Confirmar y Generar OT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
