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
  UserPlus,
  Edit2,
  Trash2,
  UserCheck,
  X,
  Phone,
  Mail,
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
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
  saveUser,
  deleteUser,
  setCurrentUser,
} from '@/lib/store';
import { AuditLogEntry, SystemErrorLog, RolePermissions, AppModule, UserRole, User } from '@/types';

const MODULE_DEFINITIONS: { id: AppModule; name: string; description: string; systemAdminOnly?: boolean }[] = [
  { id: 'DASHBOARD', name: 'Panel Principal', description: 'Métricas generales, accesos rápidos y estado del negocio' },
  { id: 'STOCK', name: 'Inventario & Stock (10k)', description: 'Catálogo de productos, reposición, precios y proveedores' },
  { id: 'POS', name: 'Venta Mostrador (POS)', description: 'Punto de venta directo, cobros y ticket fiscal' },
  { id: 'PRESUPUESTOS', name: 'Presupuestos In Situ', description: 'Cotizaciones en obra con fotos y envío WhatsApp/Email' },
  { id: 'ORDENES_TRABAJO', name: 'Órdenes de Trabajo', description: 'Gestión de servicios, estado de tareas y facturación' },
  { id: 'FINANZAS', name: 'Finanzas & Cheques', description: 'Control de cuentas bancarias y obligaciones financieras' },
  { id: 'BALANCE', name: 'Balance & Flujo de Caja', description: 'Consolidación de ingresos (ventas discriminadas) y egresos (compras a proveedores)' },
  { id: 'ALERTAS', name: 'Alertas de Transacción', description: 'Notificaciones obligatorias con respaldo fotográfico' },
  { id: 'LICENCIAS', name: 'Licencias & Activación', description: 'Claves de licencia y estado de validez (Solo Admin Sistema)', systemAdminOnly: true },
  { id: 'AUDITORIA', name: 'Auditoría & Diagnóstico', description: 'Logs inalterables, depuración y control de permisos (Solo Admin Sistema)', systemAdminOnly: true },
];

export default function AuditoriaPage() {
  const [tab, setTab] = useState<'AUDITORIA' | 'USUARIOS' | 'PERMISOS' | 'ERRORES'>('AUDITORIA');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [errorLogs, setErrorLogs] = useState<SystemErrorLog[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('TODAS');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Estado para gestión y Alta de Usuarios
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('TODOS');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'CAJERO' as UserRole,
    hasCustomPermissions: false,
    customModules: ['POS'] as AppModule[],
    isActive: true,
    password: '',
    mustChangePasswordOnFirstLogin: true,
  });
  const [userFormError, setUserFormError] = useState('');

  const loadData = () => {
    setAuditLogs(getAuditLogs());
    setErrorLogs(getErrorLogs());
    setRolePermissions(getRolePermissions());
    setAllUsers(getUsers());
    setCurrentUser(getCurrentUser());
  };

  useEffect(() => {
    loadData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'usuarios') setTab('USUARIOS');
      else if (tabParam === 'permisos') setTab('PERMISOS');
      else if (tabParam === 'errores') setTab('ERRORES');
      else if (tabParam === 'auditoria') setTab('AUDITORIA');
    }
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

  // --- GESTIÓN Y ALTA DE USUARIOS ---
  const openCreateUserModal = () => {
    setEditingUser(null);
    setShowPasswordInput(false);
    setUserForm({
      name: '',
      username: '',
      email: '',
      phone: '',
      role: 'CAJERO',
      hasCustomPermissions: false,
      customModules: ['POS'],
      isActive: true,
      password: '',
      mustChangePasswordOnFirstLogin: true,
    });
    setUserFormError('');
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (u: User) => {
    setEditingUser(u);
    setShowPasswordInput(false);
    const hasCustom = !!(u.customModules && u.customModules.length > 0);
    setUserForm({
      name: u.name,
      username: u.username,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      hasCustomPermissions: hasCustom,
      customModules: hasCustom ? [...(u.customModules || [])] : ['STOCK', 'POS'],
      isActive: u.isActive !== undefined ? u.isActive : true,
      password: '', // Vacío para conservar actual si no se desea cambiar
      mustChangePasswordOnFirstLogin: u.mustChangePasswordOnFirstLogin || false,
    });
    setUserFormError('');
    setIsUserModalOpen(true);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!#$';
    let res = '';
    for (let i = 0; i < 9; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setUserForm((prev) => ({ ...prev, password: res }));
    setShowPasswordInput(true);
  };

  const handleToggleUserModule = (modId: AppModule) => {
    if (modId === 'LICENCIAS' || modId === 'AUDITORIA') return; // Bloqueado por diseño
    setUserForm((prev) => {
      const exists = prev.customModules.includes(modId);
      const next = exists
        ? prev.customModules.filter((m) => m !== modId)
        : [...prev.customModules, modId];
      return { ...prev, customModules: next };
    });
  };

  const handleSaveUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');

    if (!userForm.name.trim()) {
      setUserFormError('El nombre completo es obligatorio.');
      return;
    }
    if (!userForm.username.trim()) {
      setUserFormError('El nombre de usuario para inicio de sesión es obligatorio.');
      return;
    }
    if (!userForm.email.trim()) {
      setUserFormError('El correo electrónico es obligatorio.');
      return;
    }

    if (!editingUser && !userForm.password.trim()) {
      setUserFormError('Debe definir una contraseña de acceso para el nuevo usuario (o presionar "Generar Automática").');
      return;
    }

    if (userForm.password.trim().length > 0 && userForm.password.trim().length < 4) {
      setUserFormError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    const cleanUsername = userForm.username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const exists = allUsers.some(
      (u) => u.username.toLowerCase() === cleanUsername && (!editingUser || u.id !== editingUser.id)
    );
    if (exists) {
      setUserFormError(`El nombre de usuario "${cleanUsername}" ya se encuentra registrado.`);
      return;
    }

    try {
      saveUser({
        id: editingUser?.id,
        name: userForm.name,
        username: cleanUsername,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        isActive: userForm.isActive,
        customModules: userForm.hasCustomPermissions ? userForm.customModules : undefined,
        password: userForm.password.trim() || undefined,
        mustChangePasswordOnFirstLogin: userForm.mustChangePasswordOnFirstLogin,
      });

      loadData();
      setIsUserModalOpen(false);
    } catch (err: any) {
      setUserFormError(err.message || 'Error al guardar usuario');
    }
  };

  const handleDeleteUserClick = (u: User) => {
    if (u.id === currentUser?.id) {
      alert('No puedes eliminar tu propia cuenta en uso activo.');
      return;
    }
    if (u.role === 'ADMIN_SISTEMA') {
      alert('Por directiva de seguridad no es posible eliminar a un Administrador del Sistema.');
      return;
    }

    if (confirm(`¿Está seguro de que desea dar de baja al usuario "${u.name}" (@${u.username})?`)) {
      const res = deleteUser(u.id);
      if (!res.success) {
        alert(res.message);
      } else {
        loadData();
      }
    }
  };

  const handleSwitchUserSession = (u: User) => {
    setCurrentUser(u);
    loadData();
    alert(`Sesión cambiada a: ${u.name} (${u.role})`);
  };

  const filteredUsers = allUsers.filter((u) => {
    const matchRole = userRoleFilter === 'TODOS' || u.role === userRoleFilter;
    const matchSearch =
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phone && u.phone.includes(userSearch));
    return matchRole && matchSearch;
  });

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
      <div className="flex overflow-x-auto no-scrollbar gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setTab('AUDITORIA')}
          className={`py-3 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            tab === 'AUDITORIA'
              ? 'border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Log de Auditoría ({auditLogs.length})</span>
          <span className="sm:hidden">Auditoría ({auditLogs.length})</span>
        </button>
        <button
          onClick={() => setTab('USUARIOS')}
          className={`py-3 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            tab === 'USUARIOS'
              ? 'border-amber-500 text-amber-600 bg-amber-50/60 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 shrink-0 text-amber-500" />
          <span className="hidden sm:inline">Gestión & Alta de Usuarios ({allUsers.length})</span>
          <span className="sm:hidden">Usuarios ({allUsers.length})</span>
        </button>
        <button
          onClick={() => setTab('PERMISOS')}
          className={`py-3 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            tab === 'PERMISOS'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 shrink-0 text-purple-600" />
          <span className="hidden sm:inline">Matriz de Roles Estándar (RBAC)</span>
          <span className="sm:hidden">Roles (RBAC)</span>
        </button>
        <button
          onClick={() => setTab('ERRORES')}
          className={`py-3 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
            tab === 'ERRORES'
              ? 'border-red-500 text-red-600 bg-red-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bug className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Capturador de Errores ({errorLogs.length})</span>
          <span className="sm:hidden">Errores ({errorLogs.length})</span>
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

      {/* Tab: Gestión y Alta de Usuarios */}
      {tab === 'USUARIOS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header con botón de Alta de Usuario */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-slate-50 to-purple-50 border border-amber-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">
                  Directorio & Alta de Usuarios del Sistema
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Cree usuarios personalizados (no solo genéricos) con sus credenciales de acceso y asigne permisos a medida por módulo o basados en su rol.
                </p>
              </div>
            </div>

            <button
              onClick={openCreateUserModal}
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Alta de Nuevo Usuario</span>
            </button>
          </div>

          {/* Buscador y Filtro de Usuarios */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft-card flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, usuario (@login), email o teléfono..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-400 focus:bg-white outline-hidden transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="w-full sm:w-auto py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
              >
                <option value="TODOS">Todos los Roles ({allUsers.length})</option>
                <option value="ADMIN_SISTEMA">Admin Sistema</option>
                <option value="ADMIN">Administrador</option>
                <option value="TECNICO">Técnico Obra</option>
                <option value="CAJERO">Cajero / Mostrador</option>
              </select>
            </div>
          </div>

          {/* Grilla de Usuarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No se encontraron usuarios coincidentes con el criterio de búsqueda.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                const hasCustomPerms = u.customModules && u.customModules.length > 0;

                return (
                  <div
                    key={u.id}
                    className={`bg-white rounded-2xl p-5 border shadow-soft-card flex flex-col justify-between transition-all hover:border-amber-300 ${
                      isCurrent ? 'ring-2 ring-amber-400/50 border-amber-300' : 'border-slate-200/80'
                    }`}
                  >
                    <div>
                      {/* Cabecera de la tarjeta */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                              u.role === 'ADMIN_SISTEMA'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'ADMIN'
                                ? 'bg-amber-100 text-amber-800'
                                : u.role === 'TECNICO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 leading-tight flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md">
                                  Tú
                                </span>
                              )}
                            </h3>
                            <span className="font-mono text-xs text-slate-400 block mt-0.5">
                              @{u.username}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                            u.role === 'ADMIN_SISTEMA'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : u.role === 'ADMIN'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : u.role === 'TECNICO'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-sky-100 text-sky-800 border border-sky-200'
                          }`}
                        >
                          {u.role === 'ADMIN_SISTEMA' ? 'ADMIN SISTEMA' : u.role}
                        </span>
                      </div>

                      {/* Datos de contacto */}
                      <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                        <div className="flex items-center gap-2 text-slate-600 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Estado de Permisos */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Régimen de Permisos:
                          </span>
                          {hasCustomPerms ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Personalizado ({u.customModules?.length} módulos)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              Hereda de Rol
                            </span>
                          )}
                        </div>

                        {hasCustomPerms ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {u.customModules?.map((m) => (
                              <span
                                key={m}
                                className="text-[9px] font-bold bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded-md"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">
                            Accede a los módulos autorizados en la matriz para {u.role}.
                          </p>
                        )}

                        {u.mustChangePasswordOnFirstLogin && (
                          <div className="mt-2.5 py-1 px-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[10px] font-bold text-amber-800 flex items-center gap-1.5">
                            <KeyRound className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Primer Ingreso: Debe cambiar contraseña</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones de la tarjeta */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => openEditUserModal(u)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar / Permisos</span>
                      </button>

                      {!isCurrent && (
                        <button
                          onClick={() => handleSwitchUserSession(u)}
                          className="py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs transition-colors"
                          title="Iniciar sesión rápida como este usuario"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {!isCurrent && u.role !== 'ADMIN_SISTEMA' && (
                        <button
                          onClick={() => handleDeleteUserClick(u)}
                          className="py-1.5 px-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                          title="Dar de baja usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Total: {allUsers.length} usuarios</span>
                <button
                  onClick={openCreateUserModal}
                  className="py-1 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Alta de Usuario</span>
                </button>
              </div>
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

      {/* Modal Alta / Edición de Usuario */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingUser ? `Editar Usuario: ${editingUser.name}` : 'Alta de Nuevo Usuario'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingUser
                      ? 'Modifique datos de contacto, rol y permisos específicos.'
                      : 'Cree una cuenta para un empleado y defina sus permisos de acceso.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="p-6 space-y-4 overflow-y-auto">
              {userFormError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {userFormError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-400 focus:bg-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Usuario Login * (@usuario)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. jperez"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-400 focus:bg-white outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="juan@onceydos.com.ar"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-400 focus:bg-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+54 9 11 4455-6677"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-400 focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Puesto / Rol Asignado
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-hidden"
                >
                  <option value="CAJERO">Cajero / Atención Mostrador</option>
                  <option value="TECNICO">Técnico de Obra & Presupuestos</option>
                  <option value="ADMIN">Administrador / Encargado de Sucursal</option>
                  <option value="ADMIN_SISTEMA">Administrador del Sistema (Acceso Total)</option>
                </select>
              </div>

              {/* Sección: Contraseña de Acceso y Configuración de Primer Ingreso */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                    <span>Contraseña de Acceso {editingUser ? '(Opcional al editar)' : '*'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 py-0.5 px-2 rounded-lg bg-amber-100/60 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generar Automática</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPasswordInput ? 'text' : 'password'}
                    placeholder={
                      editingUser
                        ? 'Dejar en blanco para conservar la contraseña actual...'
                        : 'Defina la contraseña (mínimo 4 caracteres)...'
                    }
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-400 outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInput(!showPasswordInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Opción de exigir cambio en primer ingreso */}
                <div className="pt-2 border-t border-slate-200/70">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userForm.mustChangePasswordOnFirstLogin}
                      onChange={(e) =>
                        setUserForm({ ...userForm, mustChangePasswordOnFirstLogin: e.target.checked })
                      }
                      className="mt-0.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">
                        Exigir cambio de contraseña en el primer ingreso
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Al iniciar sesión por primera vez con esta clave, el sistema le pedirá al usuario que defina obligatoriamente su propia contraseña personal.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Selector de modo de permisos: Genérico o Personalizado */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Régimen de Permisos de Acceso:
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-amber-400 transition-colors">
                    <input
                      type="radio"
                      name="perm_mode"
                      checked={!userForm.hasCustomPermissions}
                      onChange={() => setUserForm({ ...userForm, hasCustomPermissions: false })}
                      className="mt-0.5 text-amber-500 focus:ring-amber-400"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">
                        Permisos por defecto del Rol (Genérico)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Hereda automáticamente la matriz de accesos configurada para {userForm.role}.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-amber-400 transition-colors">
                    <input
                      type="radio"
                      name="perm_mode"
                      checked={userForm.hasCustomPermissions}
                      onChange={() => setUserForm({ ...userForm, hasCustomPermissions: true })}
                      className="mt-0.5 text-amber-500 focus:ring-amber-400"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-amber-900 block">
                        Asignar permisos individuales a medida (No genérico)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Definir de forma personalizada a qué módulos específicos tiene acceso este usuario.
                      </span>
                    </div>
                  </label>
                </div>

                {userForm.hasCustomPermissions && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-1.5 animate-in fade-in duration-150">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1">
                      Módulos Habilitados para este Usuario:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {MODULE_DEFINITIONS.filter((m) => !m.systemAdminOnly).map((m) => {
                        const isChecked = userForm.customModules.includes(m.id);
                        return (
                          <label
                            key={m.id}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleUserModule(m.id)}
                              className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                            />
                            <span className="truncate">{m.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span>Usuario Activo en el Sistema</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
