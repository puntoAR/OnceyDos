'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Users,
  CreditCard,
  Calendar,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Search,
  Phone,
  Mail,
  FileCheck,
} from 'lucide-react';
import {
  getObligations,
  getSuppliers,
  getClients,
  addObligation,
  saveSupplier,
} from '@/lib/store';
import { FinancialObligation, Supplier, Client, ObligationType } from '@/types';
import { MandatoryEvidenceModal } from '@/components/notifications/MandatoryEvidenceModal';

export default function FinanzasPage() {
  const [tab, setTab] = useState<'CHEQUES' | 'PROVEEDORES' | 'CUENTAS_CORRIENTES'>('CHEQUES');
  const [obligations, setObligations] = useState<FinancialObligation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Modal para resolver con evidencia obligatoria
  const [selectedObligation, setSelectedObligation] = useState<FinancialObligation | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  // Modal Nuevo Cheque / Obligación
  const [isNewObligationOpen, setIsNewObligationOpen] = useState(false);
  const [newOblType, setNewOblType] = useState<ObligationType>('CHEQUE_EMITIDO');
  const [oblTitle, setOblTitle] = useState('');
  const [oblAmount, setOblAmount] = useState(0);
  const [oblDueDate, setOblDueDate] = useState('');
  const [oblEntity, setOblEntity] = useState('');
  const [oblBank, setOblBank] = useState('');
  const [oblCheckNumber, setOblCheckNumber] = useState('');

  const loadData = () => {
    setObligations(getObligations());
    setSuppliers(getSuppliers());
    setClients(getClients());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('onceydos_storage_update', loadData);
    return () => window.removeEventListener('onceydos_storage_update', loadData);
  }, []);

  const handleCreateObligation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oblTitle || !oblAmount || !oblDueDate) return;

    addObligation({
      type: newOblType,
      title: oblTitle,
      description: `${newOblType.replace('_', ' ')} para ${oblEntity}. Banco: ${oblBank || 'N/A'}. Cheque N°: ${oblCheckNumber || 'N/A'}`,
      entityName: oblEntity,
      amount: Number(oblAmount),
      dueDate: oblDueDate,
      bank: oblBank,
      checkNumber: oblCheckNumber,
      requiresMandatoryEvidence: true,
    });

    setIsNewObligationOpen(false);
    setOblTitle('');
    setOblAmount(0);
    setOblDueDate('');
    setOblEntity('');
    setOblBank('');
    setOblCheckNumber('');
    loadData();
  };

  // Métricas
  const totalChequesPorCubrir = obligations
    .filter((o) => o.status === 'PENDIENTE' && o.type === 'CHEQUE_EMITIDO')
    .reduce((acc, o) => acc + o.amount, 0);

  const totalCuentasCorrientesDeuda = clients
    .filter((c) => c.hasCurrentAccount)
    .reduce((acc, c) => acc + c.currentBalance, 0);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-amber-500" />
            <span>Gestión Financiera, Cheques & Cuentas Corrientes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Control de cheques entregados a cubrir, pagos a proveedores y deudas de clientes con cuentas corrientes.
          </p>
        </div>

        <button
          onClick={() => {
            // Sugerir fecha de mañana
            const d = new Date();
            d.setDate(d.getDate() + 1);
            setOblDueDate(d.toISOString().slice(0, 10));
            setIsNewObligationOpen(true);
          }}
          className="flex items-center space-x-2 py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Cheque / Obligación</span>
        </button>
      </div>

      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-red-50/80 border border-red-200/80 shadow-soft-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-900 uppercase">
              Cheques Emitidos por Cubrir
            </span>
            <ArrowUpRight className="w-4 h-4 text-red-600" />
          </div>
          <span className="text-2xl font-mono font-black text-red-900 block">
            ${totalChequesPorCubrir.toLocaleString('es-AR')}
          </span>
          <span className="text-[11px] text-red-700 font-medium">
            Notificación automática con 1 día de antelación
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-blue-50/80 border border-blue-200/80 shadow-soft-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900 uppercase">
              Deudas en Cuenta Corriente
            </span>
            <ArrowDownLeft className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-2xl font-mono font-black text-blue-900 block">
            ${totalCuentasCorrientesDeuda.toLocaleString('es-AR')}
          </span>
          <span className="text-[11px] text-blue-700 font-medium">
            Saldos a cobrar de clientes ferreteros
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-soft-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase">
              Proveedores Registrados
            </span>
            <Building className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-2xl font-mono font-black text-white block">
            {suppliers.length}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Con listas de precios y datos bancarios
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        {[
          { id: 'CHEQUES', label: 'Cartera de Cheques & Compromisos' },
          { id: 'CUENTAS_CORRIENTES', label: 'Cuentas Corrientes Clientes' },
          { id: 'PROVEEDORES', label: 'Directorio de Proveedores' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition-all ${
              tab === t.id
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido de Tab: Cheques y Compromisos */}
      {tab === 'CHEQUES' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Título / Compromiso</th>
                  <th className="py-3 px-4">Entidad / Destinatario</th>
                  <th className="py-3 px-4">Banco & N° Cheque</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acción Obligatoria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {obligations.map((obl) => {
                  const isPending = obl.status === 'PENDIENTE';

                  return (
                    <tr key={obl.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
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
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">{obl.title}</td>

                      <td className="py-3 px-4 text-slate-700">{obl.entityName}</td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {obl.bank || '—'} {obl.checkNumber ? `#${obl.checkNumber}` : ''}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">{obl.dueDate}</td>

                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        ${obl.amount.toLocaleString('es-AR')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {obl.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isPending ? (
                          <button
                            onClick={() => {
                              setSelectedObligation(obl);
                              setShowEvidenceModal(true);
                            }}
                            className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs"
                          >
                            Confirmar
                          </button>
                        ) : (
                          <div className="text-[11px] text-emerald-700 font-semibold" title={obl.resolutionEvidence?.operationNumber}>
                            Resuelto OP: {obl.resolutionEvidence?.operationNumber}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contenido de Tab: Cuentas Corrientes */}
      {tab === 'CUENTAS_CORRIENTES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-base text-slate-900">{c.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      c.hasCurrentAccount ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {c.hasCurrentAccount ? 'Cta Cte Activa' : 'Sin Cta Cte'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mb-3">CUIT/DNI: {c.cuitDni}</p>

                <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 rounded-xl mb-3">
                  <div>
                    <span className="text-slate-400 block">Límite Otorgado:</span>
                    <strong className="font-mono">${c.creditLimit.toLocaleString('es-AR')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Saldo Deudor:</span>
                    <strong className="font-mono text-red-600">${c.currentBalance.toLocaleString('es-AR')}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">{c.phone}</span>
                <span className="text-amber-600 font-bold">Ver Estado de Cuenta</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contenido de Tab: Proveedores */}
      {tab === 'PROVEEDORES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft-card space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{s.name}</h3>
                  <span className="text-xs text-slate-400 font-mono">CUIT: {s.cuit}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Activo
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-600">
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-amber-600" />
                  <span>{s.phone} &bull; WhatsApp: {s.whatsapp}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.email}</span>
                </p>
                <p className="text-[11px] text-slate-500 pt-1 font-mono">{s.bankAccountInfo}</p>
              </div>

              <p className="text-xs text-slate-500 italic">{s.notes}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal Registrar Cheque / Obligación */}
      {isNewObligationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base mb-4">
              Registrar Cheque o Compromiso de Pago
            </h3>

            <form onSubmit={handleCreateObligation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Operación</label>
                <select
                  value={newOblType}
                  onChange={(e) => setNewOblType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="CHEQUE_EMITIDO">Cheque Emitido (A Cubrir)</option>
                  <option value="CHEQUE_RECIBIDO">Cheque Recibido (A Depositar)</option>
                  <option value="CUENTA_CORRIENTE_DEUDA">Cobro de Cuenta Corriente</option>
                  <option value="COBRO_TRABAJO">Cobro de Trabajo / Obra</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título / Concepto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={oblTitle}
                  onChange={(e) => setOblTitle(e.target.value)}
                  placeholder="Ej: Cubrir Cheque Factura Bremen"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Destinatario / Proveedor / Cliente <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={oblEntity}
                  onChange={(e) => setOblEntity(e.target.value)}
                  placeholder="Ej: Bremen Tools Argentina"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monto ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={oblAmount || ''}
                    onChange={(e) => setOblAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Vencimiento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={oblDueDate}
                    onChange={(e) => setOblDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Banco</label>
                  <input
                    type="text"
                    value={oblBank}
                    onChange={(e) => setOblBank(e.target.value)}
                    placeholder="Ej: Santander"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">N° de Cheque</label>
                  <input
                    type="text"
                    value={oblCheckNumber}
                    onChange={(e) => setOblCheckNumber(e.target.value)}
                    placeholder="00482910"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewObligationOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Evidencia Obligatoria */}
      <MandatoryEvidenceModal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        notification={null}
        obligation={selectedObligation}
        onSuccess={loadData}
      />
    </div>
  );
}
