'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, FileText, AlertCircle, Camera, Upload } from 'lucide-react';
import { resolveObligationWithEvidence } from '@/lib/store';
import { FinancialObligation, SystemNotification } from '@/types';
import { compressImage } from '@/lib/media';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notification: SystemNotification | null;
  obligation: FinancialObligation | null;
  onSuccess: () => void;
}

export function MandatoryEvidenceModal({
  isOpen,
  onClose,
  notification,
  obligation,
  onSuccess,
}: Props) {
  const [operationNumber, setOperationNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !obligation) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, { maxWidth: 1000, quality: 0.8 });
        setProofImage(compressed);
      } catch (err) {
        console.error('Error comprimiendo comprobante:', err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!confirmedCheck) {
      setErrorMsg('Debes tildar la casilla de confirmación formal para continuar.');
      return;
    }

    if (!operationNumber.trim()) {
      setErrorMsg('El número de operación bancaria o recibo es OBLIGATORIO para desactivar esta alerta.');
      return;
    }

    try {
      setIsSubmitting(true);
      resolveObligationWithEvidence(
        obligation.id,
        operationNumber.trim(),
        notes.trim() || undefined,
        proofImage || undefined
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar la evidencia');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-red-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header con advertencia estricta */}
        <div className="bg-red-600 text-white p-5 flex items-start justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/25 text-white mb-1">
                Alerta con Evidencia Obligatoria
              </span>
              <h3 className="font-bold text-lg leading-snug">
                Resolución de Compromiso Financiero
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Detalle del compromiso */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-slate-800 text-base">{obligation.title}</span>
              <span className="font-mono font-black text-amber-900 text-base">
                ${obligation.amount.toLocaleString('es-AR')}
              </span>
            </div>
            <p className="text-slate-600 text-xs mb-2">{obligation.description}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-2 border-t border-amber-200/50">
              <div>
                <span className="text-slate-500">Destinatario/Entidad:</span>{' '}
                <strong className="text-slate-900">{obligation.entityName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Vencimiento:</span>{' '}
                <strong className="text-red-700">{obligation.dueDate}</strong>
              </div>
              {obligation.bank && (
                <div>
                  <span className="text-slate-500">Banco:</span> {obligation.bank}
                </div>
              )}
              {obligation.checkNumber && (
                <div>
                  <span className="text-slate-500">Cheque N°:</span>{' '}
                  <strong className="font-mono">{obligation.checkNumber}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>
              <strong>Regla de Seguridad del Sistema:</strong> Esta notificación solo se desactivará de forma permanente si ingresas el número de operación bancaria real y confirmas la realización del pago/cobro.
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-900 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                N° de Operación Bancaria / Transferencia / Recibo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={operationNumber}
                onChange={(e) => setOperationNumber(e.target.value)}
                placeholder="Ej: OP-98214382 o Transf. Santander #482910"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Observaciones / Detalle adicional (Opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Cubierto con fondos de recaudación del día"
                className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
              />
            </div>

            {/* Carga de comprobante / foto de ticket */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Comprobante Digital / Foto de ticket (Opcional)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 transition-colors">
                  <Upload className="w-4 h-4 text-amber-600" />
                  <span>Subir Comprobante</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {proofImage && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Comprobante adjuntado
                  </span>
                )}
              </div>
            </div>

            {/* Checkbox de confirmación obligatoria */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmedCheck}
                  onChange={(e) => setConfirmedCheck(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                />
                <span className="text-xs text-slate-800 font-medium">
                  Confirmo bajo declaración jurada que la transacción fue realizada y los fondos fueron transferidos o acreditados formalmente.
                </span>
              </label>
            </div>

            <div className="flex items-center space-x-3 pt-3">
              <button
                type="submit"
                disabled={isSubmitting || !confirmedCheck || !operationNumber.trim()}
                className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar y Desactivar Alerta</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
