'use client';

import React, { useState, useEffect } from 'react';
import {
  BellRing,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Landmark,
  FileCheck,
  AlertTriangle,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { getNotifications, getObligations, dismissNotification } from '@/lib/store';
import { SystemNotification, FinancialObligation } from '@/types';
import { MandatoryEvidenceModal } from '@/components/notifications/MandatoryEvidenceModal';

export default function AlertasPage() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [obligations, setObligations] = useState<FinancialObligation[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<SystemNotification | null>(null);
  const [selectedObligation, setSelectedObligation] = useState<FinancialObligation | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  const loadData = () => {
    setNotifications(getNotifications());
    setObligations(getObligations());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('onceydos_storage_update', loadData);
    return () => window.removeEventListener('onceydos_storage_update', loadData);
  }, []);

  const activeNotifs = notifications.filter((n) => n.active);
  const resolvedNotifs = notifications.filter((n) => !n.active);

  const handleResolveClick = (notif: SystemNotification) => {
    if (notif.obligationId) {
      const obl = obligations.find((o) => o.id === notif.obligationId) || null;
      setSelectedNotif(notif);
      setSelectedObligation(obl);
      setShowEvidenceModal(true);
    }
  };

  const handleDismissSimple = (id: string) => {
    try {
      dismissNotification(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BellRing className="w-6 h-6 text-red-600" />
            <span>Bandeja de Alertas de Transacción & Cheques</span>
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-900">
            {activeNotifs.length} activas
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Notificaciones bancarias programadas con antelación de horario bancario. Estas alertas solo se desactivan si se confirma la transacción e ingresa el número de operación correspondiente.
        </p>
      </div>

      {/* Alertas Activas */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4 text-red-600" />
          <span>Alertas Pendientes de Confirmación</span>
        </h2>

        {activeNotifs.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <span>No hay compromisos bancarios ni cobros pendientes de confirmación. ¡Todo al día!</span>
          </div>
        ) : (
          activeNotifs.map((notif) => {
            const obl = obligations.find((o) => o.id === notif.obligationId);

            return (
              <div
                key={notif.id}
                className="bg-white rounded-3xl p-5 border-2 border-red-500/30 shadow-soft-card flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                        {notif.type.replace('_', ' ')}
                      </span>
                      {notif.requiresEvidence && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                          REQUIERE CONFIRMACIÓN
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 leading-snug">{notif.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">{notif.message}</p>

                    {obl && (
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-700 mt-2 pt-2 border-t border-slate-100">
                        <span>Monto: <strong className="font-mono text-red-700">${obl.amount.toLocaleString('es-AR')}</strong></span>
                        <span>Vence: <strong className="text-slate-900">{obl.dueDate}</strong></span>
                        {obl.bank && <span>Banco: {obl.bank}</span>}
                        {obl.checkNumber && <span>Cheque N°: {obl.checkNumber}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {notif.requiresEvidence ? (
                    <button
                      onClick={() => handleResolveClick(notif)}
                      className="py-3 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30 flex items-center gap-2 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Transacción</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDismissSimple(notif.id)}
                      className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                    >
                      Marcar como leída
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Historial de Alertas Resueltas con Evidencia */}
      {resolvedNotifs.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Historial de Alertas Desactivadas ({resolvedNotifs.length})
          </h2>

          <div className="divide-y divide-slate-100 bg-white rounded-3xl border border-slate-200 shadow-soft-card overflow-hidden">
            {resolvedNotifs.map((rn) => {
              const obl = obligations.find((o) => o.id === rn.obligationId);

              return (
                <div key={rn.id} className="p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 block">{rn.title}</span>
                      <span className="text-[11px] text-slate-400">
                        Desactivada el {new Date(rn.resolvedAt || '').toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  {obl?.resolutionEvidence && (
                    <div className="text-right">
                      <span className="font-mono text-emerald-700 font-bold block">
                        N° OP: {obl.resolutionEvidence.operationNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Por: {obl.resolutionEvidence.resolvedByUserName}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
