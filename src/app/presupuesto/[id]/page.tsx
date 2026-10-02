'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Send,
  MessageSquare,
} from 'lucide-react';
import { getQuotes, respondToQuoteByClient, initStore } from '@/lib/store';
import { Quote } from '@/types';
import confetti from 'canvas-confetti';

export default function PublicQuotePage() {
  const params = useParams();
  const id = params?.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [clientNotes, setClientNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadQuote = () => {
    initStore();
    const quotes = getQuotes();
    const found = quotes.find(
      (q) => q.id === id || q.quoteNumber.toLowerCase() === id?.toLowerCase()
    );
    setQuote(found || null);
  };

  useEffect(() => {
    loadQuote();
  }, [id]);

  if (!quote) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center max-w-md w-full">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 font-black text-xl">
            11&bull;2
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Presupuesto no encontrado</h2>
          <p className="text-xs text-slate-500 mb-4">
            El enlace del presupuesto no es válido o ha sido removido del sistema.
          </p>
          <p className="text-xs text-slate-400 font-medium italic">Ferretería Once y Dos &bull; powered by puntoAR</p>
        </div>
      </div>
    );
  }

  // Cálculo de Vencimiento según validez en días
  const createdTime = new Date(quote.date).getTime();
  const expirationTime = createdTime + (quote.validityDays || 15) * 24 * 60 * 60 * 1000;
  const expirationDateStr = new Date(expirationTime).toLocaleDateString('es-AR');
  const now = Date.now();
  const isExpired = now > expirationTime;
  const daysLeft = Math.max(0, Math.ceil((expirationTime - now) / (1000 * 60 * 60 * 24)));

  const handleAccept = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = respondToQuoteByClient(quote.id, 'ACEPTADO', clientNotes.trim() || undefined);
      setQuote(updated);
      setShowAcceptModal(false);
      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      } catch {}
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = respondToQuoteByClient(quote.id, 'RECHAZADO', rejectionReason.trim() || undefined);
      setQuote(updated);
      setShowRejectModal(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/90 py-6 px-3 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Encabezado Oficial */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="relative w-16 h-12 rounded-xl bg-white p-1 border border-slate-700 shadow-lg shrink-0 overflow-hidden flex items-center justify-center">
              <Image
                src="/images/logo-11y2.png"
                alt="Logo Ferretería 11 y 2 Electricidad"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Ferretería 11 y 2
              </h1>
              <p className="text-xs text-amber-400 font-semibold">
                Electricidad &bull; Materiales &bull; Obras a Domicilio
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="font-mono font-bold text-sm text-amber-400 block">
              {quote.quoteNumber}
            </span>
            <span className="text-xs text-slate-400">
              Fecha de Emisión: {new Date(quote.date).toLocaleDateString('es-AR')}
            </span>
          </div>
        </div>

        {/* Banner de Validez y Estado */}
        <div className="px-6 sm:px-8 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>
              Validez: <strong>{quote.validityDays} días</strong> (Vence el {expirationDateStr})
            </span>
            {!isExpired && daysLeft <= 5 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900">
                ¡Quedan {daysLeft} días!
              </span>
            )}
          </div>

          <div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                quote.status === 'ACEPTADO'
                  ? 'bg-emerald-100 text-emerald-800'
                  : quote.status === 'RECHAZADO'
                  ? 'bg-red-100 text-red-800'
                  : quote.status === 'APROBADO_ADMIN' || quote.status === 'ENVIADO'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {quote.status === 'PENDIENTE_APROBACION'
                ? 'EN REVISIÓN ADMINISTRATIVA'
                : quote.status === 'APROBADO_ADMIN'
                ? 'LISTO PARA APROBACIÓN'
                : `ESTADO: ${quote.status}`}
            </span>
          </div>
        </div>

        {quote.status === 'PENDIENTE_APROBACION' && (
          <div className="mx-6 sm:mx-8 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="block">Presupuesto en Revisión Interna:</strong>
              <span>Este presupuesto fue generado y está siendo revisado por la administración para su validación oficial previa al envío.</span>
            </div>
          </div>
        )}

        {isExpired && (quote.status === 'ENVIADO' || quote.status === 'APROBADO_ADMIN') && (
          <div className="mx-6 sm:mx-8 mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              Este presupuesto ha superado su período de validez. Por favor contáctenos para confirmar disponibilidad de insumos y costos.
            </span>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Datos del Cliente y Trabajo */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 text-xs space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block mb-0.5">Cliente:</span>
                <strong className="text-slate-900 text-sm">{quote.clientName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Teléfono:</span>
                <span className="text-slate-700">{quote.clientPhone}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Dirección de obra / servicio: <strong>{quote.workAddress || 'En ferretería'}</strong></span>
            </div>
          </div>

          {/* Título y Descripción */}
          <div>
            <h2 className="text-lg font-black text-slate-900 mb-1">{quote.title}</h2>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
              {quote.description}
            </p>
          </div>

          {/* Tabla de Insumos y Servicios */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Descripción de Material / Servicio</th>
                  <th className="py-2.5 px-3 text-center">Cant.</th>
                  <th className="py-2.5 px-3 text-right">Precio Unit.</th>
                  <th className="py-2.5 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quote.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2.5 px-4 text-slate-800 font-medium">
                      {it.description}
                      <span className="text-[10px] text-slate-400 block font-normal uppercase">
                        {it.type === 'PRODUCT' ? 'Insumo de Ferretería' : 'Mano de Obra / Traslado'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">{it.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                      ${it.unitPrice.toLocaleString('es-AR')}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      ${it.subtotal.toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Relevamiento Fotográfico In Situ */}
          {quote.photos && quote.photos.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Relevamiento Fotográfico In Situ ({quote.photos.length} fotos adjuntas)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {quote.photos.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => setPreviewImage(p.url)}
                    className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity relative group"
                  >
                    <img src={p.url} alt="Relevamiento" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                      Ver foto
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liquidación Total */}
          <div className="p-5 bg-gradient-to-br from-amber-50 to-amber-100/60 rounded-3xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-amber-900 block font-semibold">
                Materiales: ${quote.subtotalMaterials.toLocaleString('es-AR')} &bull; Mano de obra: ${quote.subtotalLabor.toLocaleString('es-AR')}
              </span>
              <span className="text-sm font-black text-amber-950 uppercase">
                Importe Total Presupuestado
              </span>
            </div>
            <span className="text-3xl font-black font-mono text-slate-950">
              ${quote.total.toLocaleString('es-AR')}
            </span>
          </div>

          {/* Botones de Acción para el Cliente (Aceptar / Rechazar) */}
          {quote.status === 'APROBADO_ADMIN' || quote.status === 'ENVIADO' ? (
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setShowAcceptModal(true)}
                className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Aceptar Presupuesto</span>
              </button>

              <button
                onClick={() => setShowRejectModal(true)}
                className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center space-x-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Rechazar Presupuesto</span>
              </button>

              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto py-4 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center"
                title="Imprimir / Guardar PDF"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          ) : quote.status === 'ACEPTADO' ? (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-emerald-800 font-black text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>¡Presupuesto Aprobado con Éxito!</span>
              </div>
              <p className="text-xs text-emerald-700">
                Se generará su Orden de Trabajo y nos contactaremos con usted para confirmar la fecha tentativa de visita.
              </p>
            </div>
          ) : quote.status === 'PENDIENTE_APROBACION' ? (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center text-amber-900 text-xs font-semibold">
              <Clock className="w-4 h-4 inline-block mr-1 text-amber-700" />
              Aguardando validación de Administración. La opción de aprobación se habilitará una vez aprobado.
            </div>
          ) : (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-center text-red-800 text-xs font-bold">
              Este presupuesto fue marcado como Rechazado.
            </div>
          )}
        </div>

        {/* Footer powered by puntoAR */}
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>&copy; Ferretería Once y Dos &bull; Todos los derechos reservados.</span>
          <div className="flex items-center space-x-2">
            <span className="italic text-slate-400">powered by</span>
            <div className="relative w-24 h-6">
              <Image src="/images/logo-puntoar.png" alt="punto AR" fill className="object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Confirmar Aceptación por el Cliente */}
      {showAcceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base text-center mb-1">
              Confirmar Aceptación del Presupuesto
            </h3>
            <p className="text-xs text-slate-500 text-center mb-4">
              Al aceptar este presupuesto por <strong>${quote.total.toLocaleString('es-AR')}</strong>, la ferretería generará su Orden de Trabajo y coordinará la visita.
            </p>

            <form onSubmit={handleAccept} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Comentario u Horario de Preferencia (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  placeholder="Ej: Prefiero visita en horario de mañana..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  Sí, Aceptar Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rechazar */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base mb-2">Rechazar Presupuesto</h3>
            <p className="text-xs text-slate-500 mb-4">
              Por favor indique el motivo de rechazo (opcional) para ayudarnos a mejorar.
            </p>
            <form onSubmit={handleReject} className="space-y-3">
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Motivo (ej: Costo elevado, trabajo postergado)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2 px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer"
        >
          <img src={previewImage} alt="Foto" className="max-h-[85vh] max-w-full rounded-2xl" />
        </div>
      )}
    </div>
  );
}
