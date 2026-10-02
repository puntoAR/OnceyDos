'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Scale,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Calendar,
  CreditCard,
  Building2,
  Receipt,
  Search,
  Filter,
  Eye,
  Plus,
  Download,
  Wallet,
  Landmark,
  ShieldAlert,
  CheckCircle2,
  X,
  FileSpreadsheet,
  FileText,
  Percent,
} from 'lucide-react';
import {
  getSales,
  getPurchases,
  getSuppliers,
  getCurrentUser,
  canUserAccessModule,
  savePurchase,
} from '@/lib/store';
import { Sale, SupplierPurchase, Supplier, PurchaseItem, PaymentMethodType } from '@/types';

type DatePreset = 'ESTE_MES' | 'MES_ANTERIOR' | 'ULTIMOS_30' | 'ANIO_ACTUAL' | 'TODO' | 'PERSONALIZADO';

export default function BalancePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<SupplierPurchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Pestaña activa dentro del módulo
  const [activeTab, setActiveTab] = useState<'CONSOLIDADO' | 'VENTAS' | 'COMPRAS'>('CONSOLIDADO');

  // Filtros de fecha (Mensualmente por defecto)
  const [datePreset, setDatePreset] = useState<DatePreset>('ESTE_MES');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtros en pestaña Ventas
  const [salesSearch, setSalesSearch] = useState('');
  const [salesPaymentFilter, setSalesPaymentFilter] = useState<string>('TODOS');

  // Filtros en pestaña Compras
  const [purchasesSearch, setPurchasesSearch] = useState('');
  const [purchasesSupplierFilter, setPurchasesSupplierFilter] = useState<string>('TODOS');

  // Modales
  const [selectedPurchase, setSelectedPurchase] = useState<SupplierPurchase | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);

  // Formulario nueva compra a proveedor
  const [newPurchaseSupplierId, setNewPurchaseSupplierId] = useState('');
  const [newPurchaseNumber, setNewPurchaseNumber] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState('');
  const [newPurchasePaymentMethod, setNewPurchasePaymentMethod] = useState<'EFECTIVO' | 'CHEQUE' | 'TRANSFERENCIA' | 'CUENTA_CORRIENTE'>('CHEQUE');
  const [newPurchaseNotes, setNewPurchaseNotes] = useState('');
  const [newPurchaseItems, setNewPurchaseItems] = useState<Array<{ description: string; quantity: number; unitCost: number }>>([
    { description: '', quantity: 1, unitCost: 0 },
  ]);

  // Inicializar rango de fechas: "mensualmente por defecto"
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-indexed

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    setStartDate(firstDay.toISOString().slice(0, 10));
    setEndDate(lastDay.toISOString().slice(0, 10));
    setNewPurchaseDate(today.toISOString().slice(0, 10));
  }, []);

  const loadData = () => {
    setCurrentUser(getCurrentUser());
    setSales(getSales());
    setPurchases(getPurchases());
    setSuppliers(getSuppliers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('onceydos_storage_update', loadData);
    return () => window.removeEventListener('onceydos_storage_update', loadData);
  }, []);

  // Manejo de presets de fechas
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    if (preset === 'ESTE_MES') {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(lastDay.toISOString().slice(0, 10));
    } else if (preset === 'MES_ANTERIOR') {
      const firstDayPrev = new Date(year, month - 1, 1);
      const lastDayPrev = new Date(year, month, 0);
      setStartDate(firstDayPrev.toISOString().slice(0, 10));
      setEndDate(lastDayPrev.toISOString().slice(0, 10));
    } else if (preset === 'ULTIMOS_30') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      setStartDate(past30.toISOString().slice(0, 10));
      setEndDate(today.toISOString().slice(0, 10));
    } else if (preset === 'ANIO_ACTUAL') {
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
    } else if (preset === 'TODO') {
      setStartDate('2020-01-01');
      setEndDate('2030-12-31');
    }
  };

  // Verificación de Acceso: Solo Administrador del Sistema y Administrador
  const isAuthorized =
    currentUser &&
    (currentUser.role === 'ADMIN_SISTEMA' ||
      currentUser.role === 'ADMIN' ||
      canUserAccessModule(currentUser, 'BALANCE'));

  if (!isAuthorized && currentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 text-center shadow-soft-card space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Acceso Restringido</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            El módulo de <strong>Balance Financiero Consolidado & Flujo de Caja</strong> está reservado exclusivamente para la Dirección y Administración de la ferretería.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex py-2.5 px-5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Regresar al Panel Principal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtrado de ventas y compras dentro del rango de fechas
  const isDateInRange = (dateStr: string) => {
    if (!startDate && !endDate) return true;
    const itemDate = dateStr.slice(0, 10);
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    return true;
  };

  const periodSales = sales.filter((s) => isDateInRange(s.date) && s.status !== 'CANCELLED');
  const periodPurchases = purchases.filter((p) => isDateInRange(p.date) && p.status !== 'ANULADA');

  // Cálculos Consolidados
  const totalIngresos = periodSales.reduce((acc, s) => acc + s.total, 0);
  const totalEgresos = periodPurchases.reduce((acc, p) => acc + p.total, 0);
  const saldoNeto = totalIngresos - totalEgresos;
  const margenBruto = totalIngresos > 0 ? (saldoNeto / totalIngresos) * 100 : 0;

  // Discriminación de Ingresos por Medio de Pago
  const breakdownPayments: Record<PaymentMethodType, { total: number; count: number }> = {
    EFECTIVO: { total: 0, count: 0 },
    CTA_CTE: { total: 0, count: 0 },
    CHEQUE: { total: 0, count: 0 },
    TARJETA: { total: 0, count: 0 },
    BILLETERA: { total: 0, count: 0 },
  };

  periodSales.forEach((s) => {
    s.payments.forEach((p) => {
      if (breakdownPayments[p.type]) {
        breakdownPayments[p.type].total += p.amount;
        breakdownPayments[p.type].count += 1;
      }
    });
  });

  // Discriminación de Egresos por Proveedor
  const supplierSpendMap: Record<string, { supplierName: string; cuit: string; total: number; count: number }> = {};
  periodPurchases.forEach((p) => {
    const key = p.supplierName;
    if (!supplierSpendMap[key]) {
      supplierSpendMap[key] = {
        supplierName: p.supplierName,
        cuit: p.supplierCuit || 'N/A',
        total: 0,
        count: 0,
      };
    }
    supplierSpendMap[key].total += p.total;
    supplierSpendMap[key].count += 1;
  });

  const supplierSpendList = Object.values(supplierSpendMap).sort((a, b) => b.total - a.total);

  // Filtrado específico de pestañas
  const filteredSalesList = periodSales.filter((s) => {
    const matchSearch =
      !salesSearch ||
      s.receiptNumber.toLowerCase().includes(salesSearch.toLowerCase()) ||
      s.clientName.toLowerCase().includes(salesSearch.toLowerCase());
    const matchPayment =
      salesPaymentFilter === 'TODOS' ||
      s.payments.some((p) => p.type === salesPaymentFilter);
    return matchSearch && matchPayment;
  });

  const filteredPurchasesList = periodPurchases.filter((p) => {
    const matchSearch =
      !purchasesSearch ||
      p.purchaseNumber.toLowerCase().includes(purchasesSearch.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(purchasesSearch.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(purchasesSearch.toLowerCase()));
    const matchSupplier =
      purchasesSupplierFilter === 'TODOS' || p.supplierName === purchasesSupplierFilter;
    return matchSearch && matchSupplier;
  });

  // Guardar nueva compra
  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === newPurchaseSupplierId);
    if (!sup) {
      alert('Por favor seleccione un proveedor válido.');
      return;
    }

    const validItems: PurchaseItem[] = newPurchaseItems
      .filter((it) => it.description.trim() && it.unitCost > 0)
      .map((it, idx) => ({
        id: `pi-${Date.now()}-${idx}`,
        description: it.description.trim(),
        quantity: Number(it.quantity) || 1,
        unitCost: Number(it.unitCost) || 0,
        subtotal: (Number(it.quantity) || 1) * (Number(it.unitCost) || 0),
      }));

    if (validItems.length === 0) {
      alert('Debe cargar al menos un ítem o producto con costo.');
      return;
    }

    const subtotal = validItems.reduce((acc, it) => acc + it.subtotal, 0);

    const newPurchase: SupplierPurchase = {
      id: `pur-${Date.now()}`,
      purchaseNumber: newPurchaseNumber.trim() || `FC-A-${Date.now().toString().slice(-8)}`,
      supplierId: sup.id,
      supplierName: sup.name,
      supplierCuit: sup.cuit,
      date: new Date(newPurchaseDate || Date.now()).toISOString(),
      paymentMethod: newPurchasePaymentMethod,
      items: validItems,
      subtotal,
      tax: 0,
      total: subtotal,
      status: 'PAGADA',
      notes: newPurchaseNotes.trim() || undefined,
    };

    savePurchase(newPurchase);
    loadData();
    setIsNewPurchaseOpen(false);

    // Reset
    setNewPurchaseSupplierId('');
    setNewPurchaseNumber('');
    setNewPurchaseNotes('');
    setNewPurchaseItems([{ description: '', quantity: 1, unitCost: 0 }]);
  };

  // Exportar reporte consolidado a formato CSV
  const handleExportCSV = () => {
    let csv = `REPORTE FINANCIERO CONSOLIDADO - FERRETERIA ONCE Y DOS\n`;
    csv += `Periodo: ${startDate} al ${endDate}\n`;
    csv += `Generado por: ${currentUser?.name} (${currentUser?.role})\n\n`;

    csv += `RESUMEN GENERAL\n`;
    csv += `Total Ingresos (Ventas): $${totalIngresos}\n`;
    csv += `Total Egresos (Compras): $${totalEgresos}\n`;
    csv += `Saldo Neto Operativo: $${saldoNeto}\n`;
    csv += `Margen Operativo Bruto: ${margenBruto.toFixed(1)}%\n\n`;

    csv += `DISCRIMINACION DE INGRESOS POR MEDIO DE PAGO\n`;
    csv += `Medio,Monto,Operaciones\n`;
    csv += `Efectivo,$${breakdownPayments.EFECTIVO.total},${breakdownPayments.EFECTIVO.count}\n`;
    csv += `Cuenta Corriente,$${breakdownPayments.CTA_CTE.total},${breakdownPayments.CTA_CTE.count}\n`;
    csv += `Cheques Recibidos,$${breakdownPayments.CHEQUE.total},${breakdownPayments.CHEQUE.count}\n`;
    csv += `Tarjetas de Credito/Debito,$${breakdownPayments.TARJETA.total},${breakdownPayments.TARJETA.count}\n`;
    csv += `Billeteras Virtuales/Transferencias,$${breakdownPayments.BILLETERA.total},${breakdownPayments.BILLETERA.count}\n\n`;

    csv += `COMPRAS A PROVEEDORES EN EL PERIODO\n`;
    csv += `Comprobante,Fecha,Proveedor,CUIT,Medio de Pago,Total\n`;
    periodPurchases.forEach((p) => {
      csv += `"${p.purchaseNumber}","${p.date.slice(0, 10)}","${p.supplierName}","${p.supplierCuit || ''}","${p.paymentMethod}",$${p.total}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `balance_once_y_dos_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Balance Financiero & Flujo de Caja</span>
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  Dirección
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidación de ingresos por ventas y egresos por compras a proveedores con discriminación de medios de pago.
              </p>
            </div>
          </div>
        </div>

        {/* Acciones de exportación y nueva compra */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            title="Descargar reporte en formato CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => setIsNewPurchaseOpen(true)}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cargar Factura Proveedor</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtro de Franja de Fechas ("Mensualmente por defecto") */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-700">Período de Análisis:</span>
            <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
              {startDate || '...'} &nbsp;&rarr;&nbsp; {endDate || '...'}
            </span>
          </div>

          {/* Presets rápidos */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ESTE_MES', label: 'Este Mes (Defecto)' },
              { id: 'MES_ANTERIOR', label: 'Mes Anterior' },
              { id: 'ULTIMOS_30', label: 'Últimos 30 días' },
              { id: 'ANIO_ACTUAL', label: 'Año 2026' },
              { id: 'TODO', label: 'Todo' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePresetChange(p.id as DatePreset)}
                className={`py-1 px-2.5 rounded-lg text-[11px] font-bold transition-colors ${
                  datePreset === p.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs personalizados para Desde / Hasta */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-400 font-medium">Franja personalizada:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset('PERSONALIZADO');
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white outline-hidden"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset('PERSONALIZADO');
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Tarjetas Principales de Consolidación */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos Totales */}
        <div className="bg-white rounded-3xl p-5 border border-emerald-200/80 shadow-soft-card relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              Ingresos (Ventas)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
              {periodSales.length} ventas
            </span>
          </div>
          <div className="text-2xl font-mono font-black text-slate-900">
            ${totalIngresos.toLocaleString('es-AR')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Total facturado en mostrador y obras
          </p>
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-emerald-600 pointer-events-none">
            <ArrowDownLeft className="w-24 h-24" />
          </div>
        </div>

        {/* Egresos Totales */}
        <div className="bg-white rounded-3xl p-5 border border-red-200/80 shadow-soft-card relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-red-600" />
              Egresos (Compras)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-bold text-[10px]">
              {periodPurchases.length} compras
            </span>
          </div>
          <div className="text-2xl font-mono font-black text-slate-900">
            ${totalEgresos.toLocaleString('es-AR')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Compras de mercadería e insumos a proveedores
          </p>
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 text-red-600 pointer-events-none">
            <ArrowUpRight className="w-24 h-24" />
          </div>
        </div>

        {/* Saldo Neto / Flujo de Caja */}
        <div
          className={`bg-white rounded-3xl p-5 border shadow-soft-card relative overflow-hidden ${
            saldoNeto >= 0 ? 'border-blue-200' : 'border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                saldoNeto >= 0 ? 'text-blue-800' : 'text-amber-800'
              }`}
            >
              <Scale className="w-4 h-4" />
              Saldo Neto
            </span>
            <span
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                saldoNeto >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {saldoNeto >= 0 ? 'Superávit' : 'Déficit'}
            </span>
          </div>
          <div
            className={`text-2xl font-mono font-black ${
              saldoNeto >= 0 ? 'text-blue-900' : 'text-red-600'
            }`}
          >
            ${saldoNeto.toLocaleString('es-AR')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Diferencia neta (Ingresos - Egresos)
          </p>
        </div>

        {/* Margen Operativo */}
        <div className="bg-white rounded-3xl p-5 border border-purple-200/80 shadow-soft-card relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-purple-600" />
              Margen Bruto
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px]">
              Rentabilidad
            </span>
          </div>
          <div className="text-2xl font-mono font-black text-purple-950">
            {margenBruto.toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Margen sobre volumen de ingresos del período
          </p>
        </div>
      </div>

      {/* Selector de Pestañas de Vista */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('CONSOLIDADO')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'CONSOLIDADO'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Consolidado & Desglose de Medios de Pago</span>
        </button>

        <button
          onClick={() => setActiveTab('VENTAS')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'VENTAS'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span>Detalle de Ventas / Ingresos ({periodSales.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('COMPRAS')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'COMPRAS'
              ? 'border-red-600 text-red-700 bg-red-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-red-600" />
          <span>Compras a Proveedores / Egresos ({periodPurchases.length})</span>
        </button>
      </div>

      {/* PESTAÑA 1: CONSOLIDADO Y DESGLOSE */}
      {activeTab === 'CONSOLIDADO' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Sección: Discriminación de Ventas por Medio de Pago */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <span>Ventas Realizadas: Discriminación por Medio de Pago</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Total ingresado distribuido según modalidad de cobro comercial.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                Total: ${totalIngresos.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Efectivo */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase">Efectivo</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-mono font-black text-emerald-950">
                  ${breakdownPayments.EFECTIVO.total.toLocaleString('es-AR')}
                </div>
                <div className="flex items-center justify-between text-[10px] text-emerald-700 font-semibold pt-1 border-t border-emerald-200/60">
                  <span>{breakdownPayments.EFECTIVO.count} operaciones</span>
                  <span>
                    {totalIngresos > 0
                      ? ((breakdownPayments.EFECTIVO.total / totalIngresos) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              {/* Cuenta Corriente */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 uppercase">Cuenta Corriente</span>
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-lg font-mono font-black text-amber-950">
                  ${breakdownPayments.CTA_CTE.total.toLocaleString('es-AR')}
                </div>
                <div className="flex items-center justify-between text-[10px] text-amber-700 font-semibold pt-1 border-t border-amber-200/60">
                  <span>{breakdownPayments.CTA_CTE.count} remitos</span>
                  <span>
                    {totalIngresos > 0
                      ? ((breakdownPayments.CTA_CTE.total / totalIngresos) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              {/* Cheques */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-900 uppercase">Cheques</span>
                  <Landmark className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-lg font-mono font-black text-blue-950">
                  ${breakdownPayments.CHEQUE.total.toLocaleString('es-AR')}
                </div>
                <div className="flex items-center justify-between text-[10px] text-blue-700 font-semibold pt-1 border-t border-blue-200/60">
                  <span>{breakdownPayments.CHEQUE.count} cheques</span>
                  <span>
                    {totalIngresos > 0
                      ? ((breakdownPayments.CHEQUE.total / totalIngresos) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              {/* Tarjetas */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-900 uppercase">Tarjetas</span>
                  <CreditCard className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-lg font-mono font-black text-purple-950">
                  ${breakdownPayments.TARJETA.total.toLocaleString('es-AR')}
                </div>
                <div className="flex items-center justify-between text-[10px] text-purple-700 font-semibold pt-1 border-t border-purple-200/60">
                  <span>{breakdownPayments.TARJETA.count} cobros</span>
                  <span>
                    {totalIngresos > 0
                      ? ((breakdownPayments.TARJETA.total / totalIngresos) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              {/* Billeteras / Transferencias */}
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-900 uppercase">Billeteras / QR</span>
                  <Wallet className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-lg font-mono font-black text-sky-950">
                  ${breakdownPayments.BILLETERA.total.toLocaleString('es-AR')}
                </div>
                <div className="flex items-center justify-between text-[10px] text-sky-700 font-semibold pt-1 border-t border-sky-200/60">
                  <span>{breakdownPayments.BILLETERA.count} pagos</span>
                  <span>
                    {totalIngresos > 0
                      ? ((breakdownPayments.BILLETERA.total / totalIngresos) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Compras Realizadas a Proveedores (Dato General con enlace a detalle) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-red-500" />
                  <span>Compras Realizadas a Distintos Proveedores (Resumen General)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Distribución de compras por proveedor en el período seleccionado.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('COMPRAS')}
                className="text-xs font-bold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition-colors"
              >
                Ver Listado & Detalle Completo de Compras &rarr;
              </button>
            </div>

            {supplierSpendList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No hay compras registradas en este período.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {supplierSpendList.map((sup, idx) => {
                  const percent = totalEgresos > 0 ? (sup.total / totalEgresos) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-amber-300 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 leading-snug">
                            {sup.supplierName}
                          </h4>
                          <span className="font-mono text-[10px] text-slate-400">CUIT: {sup.cuit}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800">
                          {percent.toFixed(1)}%
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-500">
                          {sup.count} {sup.count === 1 ? 'factura' : 'facturas'}
                        </span>
                        <span className="text-base font-mono font-black text-slate-900">
                          ${sup.total.toLocaleString('es-AR')}
                        </span>
                      </div>

                      {/* Barra de progreso visual */}
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 2: DETALLE DE VENTAS (INGRESOS) */}
      {activeTab === 'VENTAS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Barra de búsqueda y filtro */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft-card flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar venta por cliente o N° de ticket..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-400 focus:bg-white outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={salesPaymentFilter}
                onChange={(e) => setSalesPaymentFilter(e.target.value)}
                className="w-full sm:w-auto py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
              >
                <option value="TODOS">Todos los Medios de Pago</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="CTA_CTE">Cuenta Corriente</option>
                <option value="CHEQUE">Cheque</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="BILLETERA">Billetera / QR</option>
              </select>
            </div>
          </div>

          {/* Tabla de Ventas */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Ítems</th>
                    <th className="py-3 px-4">Medio(s) de Pago</th>
                    <th className="py-3 px-4 text-right">Total Cobrado</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredSalesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No se encontraron ventas para el criterio seleccionado en este período.
                      </td>
                    </tr>
                  ) : (
                    filteredSalesList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {s.receiptNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(s.date).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {s.clientName}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {s.items.length} {s.items.length === 1 ? 'producto' : 'productos'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {s.payments.map((p, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.type === 'EFECTIVO'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : p.type === 'CTA_CTE'
                                    ? 'bg-amber-100 text-amber-800'
                                    : p.type === 'CHEQUE'
                                    ? 'bg-blue-100 text-blue-800'
                                    : p.type === 'TARJETA'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-sky-100 text-sky-800'
                                }`}
                              >
                                {p.type}: ${p.amount.toLocaleString('es-AR')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          ${s.total.toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedSale(s)}
                            className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 mx-auto transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalle</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: DETALLE DE COMPRAS A PROVEEDORES (EGRESOS) */}
      {activeTab === 'COMPRAS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Barra de búsqueda y filtro */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft-card flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar compra por proveedor, N° de factura o notas..."
                value={purchasesSearch}
                onChange={(e) => setPurchasesSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-400 focus:bg-white outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={purchasesSupplierFilter}
                onChange={(e) => setPurchasesSupplierFilter(e.target.value)}
                className="w-full sm:w-auto py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
              >
                <option value="TODOS">Todos los Proveedores</option>
                {supplierSpendList.map((sup, idx) => (
                  <option key={idx} value={sup.supplierName}>
                    {sup.supplierName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla de Compras con Botón para Ver Detalle */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Comprobante N°</th>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Proveedor</th>
                    <th className="py-3 px-4">Medio de Pago</th>
                    <th className="py-3 px-4">Ítems</th>
                    <th className="py-3 px-4 text-right">Importe Total</th>
                    <th className="py-3 px-4 text-center">Detalle de Compra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredPurchasesList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No se encontraron compras a proveedores en este período.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchasesList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {p.purchaseNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {p.date.slice(0, 10)}
                        </td>
                        <td className="py-3 px-4">
                          <strong className="block text-slate-900">{p.supplierName}</strong>
                          {p.supplierCuit && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              CUIT: {p.supplierCuit}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              p.paymentMethod === 'EFECTIVO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.paymentMethod === 'CHEQUE'
                                ? 'bg-blue-100 text-blue-800'
                                : p.paymentMethod === 'TRANSFERENCIA'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {p.items.length} {p.items.length === 1 ? 'insumo' : 'insumos'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-red-700 text-sm">
                          ${p.total.toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedPurchase(p)}
                            className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 mx-auto transition-colors shadow-xs"
                            title="Ver detalle exhaustivo de la compra"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Detalle</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALLE EXHAUSTIVO DE LA COMPRA */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header del Modal */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Detalle de Factura: {selectedPurchase.purchaseNumber}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Proveedor: {selectedPurchase.supplierName} &bull; CUIT: {selectedPurchase.supplierCuit || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Fecha de Emisión</span>
                  <strong className="text-slate-800 font-mono">{selectedPurchase.date.slice(0, 10)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Medio de Pago</span>
                  <strong className="text-slate-800">{selectedPurchase.paymentMethod}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Estado</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                    {selectedPurchase.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Total de la Factura</span>
                  <strong className="text-red-700 font-mono text-sm">
                    ${selectedPurchase.total.toLocaleString('es-AR')}
                  </strong>
                </div>
              </div>

              {/* Listado de Ítems Comprados */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Ítems y Materiales Comprados ({selectedPurchase.items.length})
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3">Descripción</th>
                        <th className="py-2.5 px-3 text-center">Cantidad</th>
                        <th className="py-2.5 px-3 text-right">Costo Unitario</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPurchase.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                            {it.code || 'S/C'}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {it.description}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold">
                            {it.quantity}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">
                            ${it.unitCost.toLocaleString('es-AR')}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            ${it.subtotal.toLocaleString('es-AR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t border-slate-200">
                        <td colSpan={4} className="py-2.5 px-3 text-right text-slate-700">
                          Total Comprobante:
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-red-700 text-sm">
                          ${selectedPurchase.total.toLocaleString('es-AR')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedPurchase.notes && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-amber-900 block">Observaciones Administrativas:</span>
                  <p className="text-amber-800">{selectedPurchase.notes}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="py-2 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALLE DE TICKET DE VENTA */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Ticket: {selectedSale.receiptNumber}</h3>
                <p className="text-xs text-slate-400">
                  Cliente: {selectedSale.clientName} &bull; {new Date(selectedSale.date).toLocaleString('es-AR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Ítems Vendidos ({selectedSale.items.length})
                </h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {selectedSale.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <strong className="block text-slate-900">{it.name}</strong>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {it.quantity} x ${it.unitPrice.toLocaleString('es-AR')}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        ${it.subtotal.toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Modalidad de Pago Registrada
                </h4>
                <div className="space-y-1.5">
                  {selectedSale.payments.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{p.type}</span>
                        {p.reference && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Ref: {p.reference}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-emerald-700">
                        ${p.amount.toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-100 rounded-2xl flex items-baseline justify-between">
                <span className="font-bold text-slate-700">Total Ticket:</span>
                <span className="text-xl font-mono font-black text-slate-900">
                  ${selectedSale.total.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedSale(null)}
                className="py-2 px-5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CARGAR NUEVA FACTURA DE PROVEEDOR */}
      {isNewPurchaseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Cargar Factura de Compra</h3>
                <p className="text-xs text-slate-400">
                  Registre compras a proveedores para impactar el flujo de egresos de la ferretería.
                </p>
              </div>
              <button
                onClick={() => setIsNewPurchaseOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Proveedor *
                  </label>
                  <select
                    required
                    value={newPurchaseSupplierId}
                    onChange={(e) => setNewPurchaseSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-hidden"
                  >
                    <option value="">Seleccionar Proveedor...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.cuit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Comprobante / Factura *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. FC-A-0004-00019940"
                    value={newPurchaseNumber}
                    onChange={(e) => setNewPurchaseNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Factura *
                  </label>
                  <input
                    type="date"
                    required
                    value={newPurchaseDate}
                    onChange={(e) => setNewPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Medio de Pago
                  </label>
                  <select
                    value={newPurchasePaymentMethod}
                    onChange={(e) => setNewPurchasePaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-hidden"
                  >
                    <option value="CHEQUE">Cheque Propio</option>
                    <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                    <option value="CUENTA_CORRIENTE">Cuenta Corriente Proveedor</option>
                    <option value="EFECTIVO">Efectivo</option>
                  </select>
                </div>
              </div>

              {/* Ítems / Insumos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Detalle de Ítems / Materiales Comprados:
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewPurchaseItems([
                        ...newPurchaseItems,
                        { description: '', quantity: 1, unitCost: 0 },
                      ])
                    }
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700"
                  >
                    + Agregar Otro Ítem
                  </button>
                </div>

                {newPurchaseItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 items-center"
                  >
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Descripción del insumo..."
                        value={it.description}
                        onChange={(e) => {
                          const updated = [...newPurchaseItems];
                          updated[idx].description = e.target.value;
                          setNewPurchaseItems(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-hidden"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Cant."
                        value={it.quantity}
                        onChange={(e) => {
                          const updated = [...newPurchaseItems];
                          updated[idx].quantity = Number(e.target.value);
                          setNewPurchaseItems(updated);
                        }}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-hidden text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        placeholder="Costo unit."
                        value={it.unitCost}
                        onChange={(e) => {
                          const updated = [...newPurchaseItems];
                          updated[idx].unitCost = Number(e.target.value);
                          setNewPurchaseItems(updated);
                        }}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-hidden text-right"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {newPurchaseItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewPurchaseItems(newPurchaseItems.filter((_, i) => i !== idx));
                          }}
                          className="text-red-500 hover:text-red-700 text-xs font-bold"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas u Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre remito de entrega, cheque emitido o número de transferencia..."
                  value={newPurchaseNotes}
                  onChange={(e) => setNewPurchaseNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden"
                />
              </div>

              <div className="p-4 bg-slate-100 rounded-2xl flex items-baseline justify-between text-xs">
                <span className="font-bold text-slate-700">Total Calculado de la Factura:</span>
                <span className="text-xl font-mono font-black text-red-700">
                  $
                  {newPurchaseItems
                    .reduce((acc, it) => acc + (it.quantity || 1) * (it.unitCost || 0), 0)
                    .toLocaleString('es-AR')}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPurchaseOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                >
                  Registrar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
