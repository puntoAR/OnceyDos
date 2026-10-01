'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  ShieldCheck,
  Search,
  Filter,
  Copy,
  CheckCircle2,
  Bug,
  RefreshCw,
  Send,
} from 'lucide-react';
import { getAuditLogs, getErrorLogs, logSystemError, sendDevMessage } from '@/lib/store';
import { AuditLogEntry, SystemErrorLog } from '@/types';

export default function AuditoriaPage() {
  const [tab, setTab] = useState<'AUDITORIA' | 'ERRORES'>('AUDITORIA');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [errorLogs, setErrorLogs] = useState<SystemErrorLog[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = () => {
    setAuditLogs(getAuditLogs());
    setErrorLogs(getErrorLogs());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('onceydos_storage_update', loadData);
    return () => window.removeEventListener('onceydos_storage_update', loadData);
  }, []);

  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchCat = categoryFilter === 'TODAS' || log.category === categoryFilter;
    const matchSearch =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Función para simular un error intencional y verificar la captura con archivo y línea
  const handleTriggerSimulatedError = () => {
    try {
      // Simulación de error intencional en tiempo de ejecución
      const obj: any = null;
      obj.metodoInexistente();
    } catch (err: any) {
      logSystemError({
        message: err.message || 'Error simulado de prueba',
        sourceFile: 'src/app/auditoria/page.tsx',
        lineNumber: 52,
        columnNumber: 11,
        componentStack: 'AuditoriaPage -> handleTriggerSimulatedError',
      });
      loadData();
      alert('¡Error simulado registrado exitosamente con archivo "page.tsx" y línea 52!');
    }
  };

  const handleCopyReport = (err: SystemErrorLog) => {
    const report = `[REPORTE TÉCNICO - puntoAR]
Fecha: ${new Date(err.timestamp).toLocaleString('es-AR')}
Archivo: ${err.sourceFile}
Línea: ${err.lineNumber} | Columna: ${err.columnNumber}
Fallo: ${err.message}
Detalle: ${err.componentStack || 'Sin stack secundario'}`;

    navigator.clipboard.writeText(report);
    setCopiedId(err.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendToDev = (err: SystemErrorLog) => {
    sendDevMessage(
      `🚨 Reporte de error en ${err.sourceFile} (Línea ${err.lineNumber}): ${err.message}`,
      err
    );
    alert('Reporte enviado directamente al canal de soporte del programador.');
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            <span>Auditoría de Actividad & Diagnóstico de Errores</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro cronológico inalterable de acciones de usuarios y visor técnico de excepciones con número exacto de línea.
          </p>
        </div>

        <button
          onClick={handleTriggerSimulatedError}
          className="flex items-center space-x-2 py-2.5 px-4 rounded-xl bg-red-100 hover:bg-red-200 text-red-900 font-bold text-xs transition-colors shadow-xs"
        >
          <Bug className="w-4 h-4 text-red-600" />
          <span>Simular Error de Prueba (Línea 52)</span>
        </button>
      </div>

      {/* Selector de Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setTab('AUDITORIA')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all ${
            tab === 'AUDITORIA'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Log de Auditoría General ({auditLogs.length})
        </button>
        <button
          onClick={() => setTab('ERRORES')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all ${
            tab === 'ERRORES'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Capturador de Errores & Líneas ({errorLogs.length})
        </button>
      </div>

      {/* Tab: Log de Auditoría */}
      {tab === 'AUDITORIA' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft-card flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por acción, usuario o detalle..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
            >
              <option value="TODAS">Todas las Categorías</option>
              <option value="VENTA">Ventas</option>
              <option value="STOCK">Stock & Precios</option>
              <option value="FINANZAS">Finanzas & Cheques</option>
              <option value="PRESUPUESTO">Presupuestos & OT</option>
              <option value="SEGURIDAD">Seguridad & Sesiones</option>
              <option value="SISTEMA">Sistema</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Fecha & Hora</th>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Acción</th>
                    <th className="py-3 px-4">Detalle del Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No hay registros en el log de auditoría.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {log.userName}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">({log.role})</span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              log.category === 'VENTA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.category === 'STOCK'
                                ? 'bg-amber-100 text-amber-800'
                                : log.category === 'FINANZAS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {log.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-md truncate" title={log.details}>
                          {log.details}
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

      {/* Tab: Capturador de Errores con Línea */}
      {tab === 'ERRORES' && (
        <div className="space-y-4">
          <div className="p-4 bg-red-50/70 border border-red-200/80 rounded-2xl text-xs text-red-900 leading-relaxed">
            <strong>Módulo de Diagnóstico y Telemetría:</strong> Cada excepción ocurrida en el sistema se captura identificando el componente, el archivo fuente y el <strong>número exacto de línea</strong> para que el programador pueda reparar la falla sin demoras.
          </div>

          <div className="space-y-3">
            {errorLogs.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <span>Excelente: El sistema no ha registrado fallos en tiempo de ejecución.</span>
              </div>
            ) : (
              errorLogs.map((err) => (
                <div
                  key={err.id}
                  className="bg-white rounded-3xl p-5 border border-red-200 shadow-soft-card flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white">
                        ERROR CAPTURADO
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(err.timestamp).toLocaleString('es-AR')}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 font-mono text-red-700">
                      {err.message}
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-w-lg font-mono">
                      <div>
                        <span className="text-slate-400">Archivo:</span>{' '}
                        <strong className="text-amber-700">{err.sourceFile}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Ubicación:</span>{' '}
                        <strong className="text-red-700">Línea {err.lineNumber} : Col {err.columnNumber}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyReport(err)}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copiedId === err.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === err.id ? 'Copiado' : 'Copiar Reporte'}</span>
                    </button>

                    <button
                      onClick={() => handleSendToDev(err)}
                      className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar a puntoAR</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
