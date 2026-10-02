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
  Lock,
  Unlock,
  Shield,
  Save,
  RotateCcw,
  Users,
  Check,
  Info,
  ShieldAlert,
} from 'lucide-react';
import {
  getAuditLogs,
  getErrorLogs,
  logSystemError,
  sendDevMessage,
  getRolePermissions,
  updateRolePermissions,
  resetRolePermissions,
  getUsers,
  getCurrentUser,
} from '@/lib/store';
import { AuditLogEntry, SystemErrorLog, RolePermissions, AppModule, UserRole, User } from '@/types';

const MODULE_DEFINITIONS: { id: AppModule; name: string; description: string; systemAdminOnly?: boolean }[] = [
  { id: 'DASHBOARD', name: 'Panel Principal', description: 'Métricas generales, accesos rápidos y estado del negocio' },
  { id: 'STOCK', name: 'Inventario & Stock (10k)', description: 'Catálogo de productos, reposición, precios y proveedores' },
  { id: 'POS', name: 'Venta Mostrador (POS)', description: 'Punto de venta directo, cobros y ticket fiscal' },
  { id: 'PRESUPUESTOS', name: 'Presupuestos In Situ', description: 'Cotizaciones en obra con fotos y envío WhatsApp/Email' },
  { id: 'ORDENES_TRABAJO', name: 'Órdenes de Trabajo', description: 'Gestión de servicios, estado de tareas y facturación' },
  { id: 'FINANZAS', name: 'Finanzas & Cheques', description: 'Control de cuentas bancarias y obligaciones financieras' },
  { id: 'ALERTAS', name: 'Alertas de Transacción', description: 'Notificaciones obligatorias con respaldo fotográfico' },
  { id: 'LICENCIAS', name: 'Licencias & Activación', description: 'Claves de licencia y estado de validez (Solo Admin Sistema)', systemAdminOnly: true },
  { id: 'AUDITORIA', name: 'Auditoría & Diagnóstico', description: 'Logs inalterables, depuración y control de permisos (Solo Admin Sistema)', systemAdminOnly: true },
];

export default function AuditoriaPage() {
  const [tab, setTab] = useState<'AUDITORIA' | 'ERRORES' | 'PERMISOS'>('AUDITORIA');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [errorLogs, setErrorLogs] = useState<SystemErrorLog[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  const loadData = () => {
    setAuditLogs(getAuditLogs());
    setErrorLogs(getErrorLogs());
    setRolePermissions(getRolePermissions());
    setAllUsers(getUsers());
    setCurrentUser(getCurrentUser());
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

  // Toggle module permission for a given role
  const handleToggleModule = (role: UserRole, modId: AppModule) => {
    if (role === 'ADMIN_SISTEMA') return; // Admin del sistema siempre tiene todo
    if (modId === 'LICENCIAS' || modId === 'AUDITORIA') return; // Bloqueado: solo Admin Sistema

    setRolePermissions((prev) =>
      prev.map((r) => {
        if (r.role !== role) return r;
        const exists = r.allowedModules.includes(modId);
        const newMods = exists
          ? r.allowedModules.filter((m) => m !== modId)
          : [...r.allowedModules, modId];
        return { ...r, allowedModules: newMods };
      })
    );
  };

  const handleSavePermissions = () => {
    rolePermissions.forEach((rp) => {
      updateRolePermissions(rp.role, rp.allowedModules);
    });
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleResetPermissions = () => {
    if (confirm('¿Desea restaurar todos los permisos de acceso a los valores predeterminados?')) {
      resetRolePermissions();
      setRolePermissions(getRolePermissions());
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            <span>Auditoría de Actividad, Diagnóstico & Permisos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Módulo reservado para el Administrador del Sistema: Registro inalterable, captura de excepciones y configuración de permisos de roles.
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
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('AUDITORIA')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
            tab === 'AUDITORIA'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Log de Auditoría General ({auditLogs.length})</span>
        </button>
        <button
          onClick={() => setTab('ERRORES')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
            tab === 'ERRORES'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bug className="w-4 h-4" />
          <span>Capturador de Errores & Líneas ({errorLogs.length})</span>
        </button>
        <button
          onClick={() => setTab('PERMISOS')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 ${
            tab === 'PERMISOS'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-purple-600" />
          <span>Niveles de Acceso & Permisos (RBAC)</span>
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
              <option value="SISTEMA">Sistema & Licencias</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-4">Fecha & Hora</th>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Acción</th>
                    <th className="py-3 px-4">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No se encontraron registros de auditoría.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {log.userName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              log.role === 'ADMIN_SISTEMA'
                                ? 'bg-purple-100 text-purple-800'
                                : log.role === 'ADMIN'
                                ? 'bg-amber-100 text-amber-800'
                                : log.role === 'TECNICO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {log.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            {log.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
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

      {/* Tab: Capturador de Errores con Línea Exacta */}
      {tab === 'ERRORES' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="block font-bold">Monitoreo de Excepciones Activo</strong>
                <span>
                  Cada excepción no controlada registra el archivo fuente, número de línea y componente exacto para resolución expedita por el equipo de desarrollo de puntoAR.
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {errorLogs.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="font-bold text-slate-800 text-sm">Sistema Libre de Errores</h3>
                <p className="text-xs text-slate-400 mt-1">
                  No se han registrado fallos en tiempo de ejecución.
                </p>
              </div>
            ) : (
              errorLogs.map((err) => (
                <div
                  key={err.id}
                  className="bg-white rounded-2xl p-5 border border-red-200/80 shadow-soft-card flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800 uppercase">
                        EXCEPCIÓN CRÍTICA
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

      {/* Tab: Niveles de Acceso & Matriz RBAC */}
      {tab === 'PERMISOS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Banner de información de política del negocio */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-slate-50 to-amber-50 border border-purple-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  Matriz de Control de Acceso Basado en Roles (RBAC)
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Configure de manera modular qué secciones de la ferretería puede visualizar cada puesto.
                  <strong className="text-purple-900 ml-1">
                    Directiva estricta: Los módulos de Licencias y Auditoría son exclusivos del Administrador del Sistema.
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleResetPermissions}
                className="flex-1 sm:flex-none py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                title="Restaurar valores de fábrica"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar</span>
              </button>
              <button
                onClick={handleSavePermissions}
                className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Permisos</span>
              </button>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¡Matriz de permisos guardada exitosamente! Los cambios se aplican de forma inmediata en tiempo real.</span>
            </div>
          )}

          {/* Matriz de Roles y Módulos */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Matriz de Autorización por Módulo</h3>
                <p className="text-xs text-slate-400">
                  Marque o desmarque los permisos correspondientes para cada rol operativo.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                4 Roles Activos en Ferretería Once y Dos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4 min-w-[220px]">Módulo del Sistema</th>
                    <th className="py-3.5 px-3 text-center min-w-[140px] bg-purple-50/60 text-purple-900">
                      <div className="font-black">Admin Sistema</div>
                      <div className="text-[9px] text-purple-600 font-normal">Superusuario Total</div>
                    </th>
                    <th className="py-3.5 px-3 text-center min-w-[140px] bg-amber-50/60 text-amber-900">
                      <div className="font-black">Administrador</div>
                      <div className="text-[9px] text-amber-700 font-normal">Gestión Operativa</div>
                    </th>
                    <th className="py-3.5 px-3 text-center min-w-[140px] bg-emerald-50/60 text-emerald-900">
                      <div className="font-black">Técnico de Obra</div>
                      <div className="text-[9px] text-emerald-700 font-normal">In Situ / Trabajos</div>
                    </th>
                    <th className="py-3.5 px-3 text-center min-w-[140px] bg-sky-50/60 text-sky-900">
                      <div className="font-black">Mostrador / Caja</div>
                      <div className="text-[9px] text-sky-700 font-normal">POS & Mostrador</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {MODULE_DEFINITIONS.map((mod) => {
                    return (
                      <tr key={mod.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{mod.name}</div>
                          <div className="text-[11px] text-slate-400">{mod.description}</div>
                        </td>

                        {/* Columna: ADMIN_SISTEMA (Siempre habilitado) */}
                        <td className="py-3 px-3 text-center bg-purple-50/20">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-[10px] font-black border border-purple-200">
                            <Lock className="w-3 h-3 text-purple-700" />
                            <span>Total</span>
                          </div>
                        </td>

                        {/* Columna: ADMIN */}
                        <td className="py-3 px-3 text-center bg-amber-50/20">
                          {mod.systemAdminOnly ? (
                            <div
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 bg-slate-100"
                              title="Restringido por diseño: Solo Admin Sistema"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Restringido</span>
                            </div>
                          ) : (
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={
                                  rolePermissions
                                    .find((r) => r.role === 'ADMIN')
                                    ?.allowedModules.includes(mod.id) ?? false
                                }
                                onChange={() => handleToggleModule('ADMIN', mod.id)}
                                className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                              />
                            </label>
                          )}
                        </td>

                        {/* Columna: TECNICO */}
                        <td className="py-3 px-3 text-center bg-emerald-50/20">
                          {mod.systemAdminOnly ? (
                            <div
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 bg-slate-100"
                              title="Restringido por diseño: Solo Admin Sistema"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Restringido</span>
                            </div>
                          ) : (
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={
                                  rolePermissions
                                    .find((r) => r.role === 'TECNICO')
                                    ?.allowedModules.includes(mod.id) ?? false
                                }
                                onChange={() => handleToggleModule('TECNICO', mod.id)}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </label>
                          )}
                        </td>

                        {/* Columna: CAJERO */}
                        <td className="py-3 px-3 text-center bg-sky-50/20">
                          {mod.systemAdminOnly ? (
                            <div
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 bg-slate-100"
                              title="Restringido por diseño: Solo Admin Sistema"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Restringido</span>
                            </div>
                          ) : (
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={
                                  rolePermissions
                                    .find((r) => r.role === 'CAJERO')
                                    ?.allowedModules.includes(mod.id) ?? false
                                }
                                onChange={() => handleToggleModule('CAJERO', mod.id)}
                                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                              />
                            </label>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>💡 Recuerde hacer clic en &quot;Guardar Permisos&quot; arriba para consolidar los cambios.</span>
              <button
                onClick={handleSavePermissions}
                className="py-1.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                Guardar Cambios
              </button>
            </div>
          </div>

          {/* Directorio de Cuentas de Usuario y sus Roles Asignados */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Usuarios del Sistema y Asignación de Roles
                </h3>
              </div>
              <span className="text-xs text-slate-400">Total: {allUsers.length} usuarios</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {allUsers.map((u) => (
                <div
                  key={u.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    u.role === 'ADMIN_SISTEMA'
                      ? 'border-purple-200 bg-purple-50/30'
                      : u.role === 'ADMIN'
                      ? 'border-amber-200 bg-amber-50/30'
                      : u.role === 'TECNICO'
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-sky-200 bg-sky-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] text-slate-400">@{u.username}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        u.role === 'ADMIN_SISTEMA'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'ADMIN'
                          ? 'bg-amber-100 text-amber-800'
                          : u.role === 'TECNICO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {u.role === 'ADMIN_SISTEMA' ? 'ADMIN SISTEMA' : u.role}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">{u.name}</h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{u.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
