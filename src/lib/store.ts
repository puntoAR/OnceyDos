'use client';

import {
  Product,
  Supplier,
  Client,
  User,
  Sale,
  Quote,
  WorkOrder,
  FinancialObligation,
  SystemNotification,
  LicenseInfo,
  AuditLogEntry,
  SystemErrorLog,
  DevMessage,
  AppModule,
  RolePermissions,
  UserRole,
  PaymentMethodType,
  SupplierPurchase,
  UserChatMessage,
} from '@/types';
import {
  INITIAL_USERS,
  INITIAL_SUPPLIERS,
  INITIAL_CLIENTS,
  INITIAL_LICENSE,
  generateSeedProducts,
  INITIAL_OBLIGATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_QUOTES,
  INITIAL_WORK_ORDERS,
  DEFAULT_ROLE_PERMISSIONS,
  INITIAL_SALES,
  INITIAL_PURCHASES,
  INITIAL_USER_MESSAGES,
} from './seed/data';

const STORAGE_KEYS = {
  USERS: 'onceydos_users',
  CURRENT_USER: 'onceydos_current_user',
  PRODUCTS: 'onceydos_products',
  SUPPLIERS: 'onceydos_suppliers',
  CLIENTS: 'onceydos_clients',
  SALES: 'onceydos_sales',
  PURCHASES: 'onceydos_purchases',
  QUOTES: 'onceydos_quotes',
  WORK_ORDERS: 'onceydos_work_orders',
  OBLIGATIONS: 'onceydos_obligations',
  NOTIFICATIONS: 'onceydos_notifications',
  LICENSE: 'onceydos_license',
  AUDIT_LOGS: 'onceydos_audit_logs',
  ERROR_LOGS: 'onceydos_error_logs',
  DEV_MESSAGES: 'onceydos_dev_messages',
  USER_MESSAGES: 'onceydos_user_messages',
  ROLE_PERMISSIONS: 'onceydos_role_permissions',
};

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('onceydos_storage_update'));
  } catch (err) {
    console.error(`Error guardando en ${key}:`, err);
  }
}

// Inicialización de datos por defecto si está vacío
export function initStore(): void {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    const seed = generateSeedProducts(200);
    safeSet(STORAGE_KEYS.PRODUCTS, seed);
  }
  
  // Siempre asegurar los 4 roles actualizados
  const currentUsers = safeGet<User[]>(STORAGE_KEYS.USERS, []);
  if (!currentUsers.some((u) => u.role === 'ADMIN_SISTEMA')) {
    safeSet(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  // Limpiar cualquier residuo de autologin legacy en localStorage
  if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  if (!localStorage.getItem(STORAGE_KEYS.ROLE_PERMISSIONS)) {
    safeSet(STORAGE_KEYS.ROLE_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUPPLIERS)) {
    safeSet(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
    safeSet(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.OBLIGATIONS)) {
    safeSet(STORAGE_KEYS.OBLIGATIONS, INITIAL_OBLIGATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    safeSet(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.LICENSE)) {
    safeSet(STORAGE_KEYS.LICENSE, INITIAL_LICENSE);
  }
  if (!localStorage.getItem(STORAGE_KEYS.QUOTES)) {
    safeSet(STORAGE_KEYS.QUOTES, INITIAL_QUOTES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.WORK_ORDERS)) {
    safeSet(STORAGE_KEYS.WORK_ORDERS, INITIAL_WORK_ORDERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
    safeSet(STORAGE_KEYS.SALES, INITIAL_SALES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PURCHASES)) {
    safeSet(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.DEV_MESSAGES)) {
    safeSet(STORAGE_KEYS.DEV_MESSAGES, [
      {
        id: 'msg-1',
        timestamp: new Date().toISOString(),
        sender: 'DEV',
        senderName: 'Soporte Técnico puntoAR',
        message: '¡Bienvenido al sistema Once y Dos! Estamos conectados para darte asistencia técnica directa.',
      },
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.USER_MESSAGES)) {
    safeSet(STORAGE_KEYS.USER_MESSAGES, INITIAL_USER_MESSAGES);
  }
}

// --- PERMISOS Y ROLES CONFIGURABLES ---
export function getRolePermissions(): RolePermissions[] {
  return safeGet<RolePermissions[]>(STORAGE_KEYS.ROLE_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS);
}

export function updateRolePermissions(role: UserRole, allowedModules: AppModule[]): void {
  const permissions = getRolePermissions();
  const index = permissions.findIndex((p) => p.role === role);
  if (index >= 0) {
    permissions[index].allowedModules = allowedModules;
    safeSet(STORAGE_KEYS.ROLE_PERMISSIONS, permissions);

    addAuditLog({
      action: 'MODIFICAR_PERMISOS_ROL',
      details: `Permisos modificados para rol ${role}. Módulos permitidos: ${allowedModules.join(', ')}`,
      category: 'SEGURIDAD',
    });
  }
}

export function resetRolePermissions(): void {
  safeSet(STORAGE_KEYS.ROLE_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS);
  addAuditLog({
    action: 'RESTAURAR_PERMISOS',
    details: 'Permisos de roles restaurados a la configuración inicial por defecto',
    category: 'SEGURIDAD',
  });
}

export function canUserAccessModule(user: User | null, module: AppModule): boolean {
  if (!user) return false;
  if (user.isActive === false) return false;
  // Administrador del sistema siempre tiene acceso a todo
  if (user.role === 'ADMIN_SISTEMA') return true;

  // Solo Administrador del Sistema puede acceder a licencias, auditoría y configuración de accesos
  if (['LICENCIAS', 'AUDITORIA', 'ACCESOS'].includes(module)) {
    return false;
  }

  // Si el usuario posee permisos específicos asignados directamente (no genéricos):
  if (user.customModules && Array.isArray(user.customModules)) {
    return user.customModules.includes(module);
  }

  const permissions = getRolePermissions();
  const rolePerm = permissions.find((p) => p.role === user.role);
  if (!rolePerm) return false;

  return rolePerm.allowedModules.includes(module);
}

// --- USUARIO ACTUAL Y SESIÓN ---
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (err) {
    console.error('Error guardando usuario en sesión:', err);
  }
  addAuditLog({
    action: 'CAMBIO_SESION',
    details: `Inicio de sesión como ${user.name} (${user.role})`,
    category: 'SEGURIDAD',
  });
  window.dispatchEvent(new Event('onceydos_storage_update'));
}

export function logoutUser(): void {
  const current = getCurrentUser();
  if (current) {
    addAuditLog({
      action: 'CIERRE_SESION',
      details: `Cierre de sesión de ${current.name} (${current.role})`,
      category: 'SEGURIDAD',
    });
  }
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch {}
    window.dispatchEvent(new Event('onceydos_storage_update'));
  }
}

export function getUsers(): User[] {
  return safeGet<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
}

export function saveUser(userData: {
  id?: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  customModules?: AppModule[];
  password?: string;
  mustChangePasswordOnFirstLogin?: boolean;
}): User {
  const users = getUsers();
  const cleanUsername = userData.username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');

  if (userData.id) {
    const index = users.findIndex((u) => u.id === userData.id);
    if (index >= 0) {
      const updated: User = {
        ...users[index],
        name: userData.name.trim(),
        username: cleanUsername,
        role: userData.role,
        email: userData.email.trim(),
        phone: userData.phone?.trim() || '',
        avatar: userData.avatar || users[index].avatar,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        customModules: userData.customModules,
        password: userData.password?.trim() ? userData.password.trim() : users[index].password,
        mustChangePasswordOnFirstLogin:
          userData.mustChangePasswordOnFirstLogin !== undefined
            ? userData.mustChangePasswordOnFirstLogin
            : users[index].mustChangePasswordOnFirstLogin,
      };
      users[index] = updated;
      safeSet(STORAGE_KEYS.USERS, users);

      const current = getCurrentUser();
      if (current && current.id === updated.id) {
        setCurrentUser(updated);
      }

      addAuditLog({
        action: 'MODIFICAR_USUARIO',
        details: `Usuario actualizado: ${updated.name} (@${updated.username}) - Rol: ${updated.role}${
          updated.customModules ? ' (Permisos personalizados: ' + updated.customModules.join(', ') + ')' : ''
        }${userData.password?.trim() ? ' [Contraseña actualizada]' : ''}${
          userData.mustChangePasswordOnFirstLogin ? ' [Exige cambio de clave en primer ingreso]' : ''
        }`,
        category: 'SEGURIDAD',
      });

      return updated;
    }
  }

  const newUser: User = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: userData.name.trim(),
    username: cleanUsername,
    role: userData.role,
    email: userData.email.trim(),
    phone: userData.phone?.trim() || '',
    avatar: userData.avatar,
    isActive: userData.isActive !== undefined ? userData.isActive : true,
    createdAt: new Date().toISOString(),
    customModules: userData.customModules,
    password: userData.password?.trim() || '123456',
    mustChangePasswordOnFirstLogin:
      userData.mustChangePasswordOnFirstLogin !== undefined
        ? userData.mustChangePasswordOnFirstLogin
        : false,
  };

  users.push(newUser);
  safeSet(STORAGE_KEYS.USERS, users);

  addAuditLog({
    action: 'ALTA_USUARIO',
    details: `Nuevo usuario creado: ${newUser.name} (@${newUser.username}) con rol ${newUser.role}${
      newUser.customModules ? ' (Permisos personalizados: ' + newUser.customModules.join(', ') + ')' : ''
    }${newUser.mustChangePasswordOnFirstLogin ? ' [Exige cambio de clave en primer ingreso]' : ''}`,
    category: 'SEGURIDAD',
  });

  return newUser;
}

export function changeUserPassword(userId: string, newPassword: string): void {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index >= 0) {
    users[index].password = newPassword.trim();
    users[index].mustChangePasswordOnFirstLogin = false;
    safeSet(STORAGE_KEYS.USERS, users);

    const current = getCurrentUser();
    if (current && current.id === userId) {
      setCurrentUser(users[index]);
    }

    addAuditLog({
      action: 'CAMBIO_PASSWORD',
      details: `El usuario ${users[index].name} (@${users[index].username}) actualizó su contraseña personal de acceso.`,
      category: 'SEGURIDAD',
    });
  }
}

export function deleteUser(userId: string): { success: boolean; message: string } {
  const users = getUsers();
  const userToDelete = users.find((u) => u.id === userId);
  if (!userToDelete) {
    return { success: false, message: 'Usuario no encontrado.' };
  }

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    return { success: false, message: 'No puedes eliminar la cuenta actualmente en uso.' };
  }

  if (userToDelete.role === 'ADMIN_SISTEMA' && users.filter((u) => u.role === 'ADMIN_SISTEMA').length <= 1) {
    return { success: false, message: 'No se puede eliminar el único Administrador del Sistema.' };
  }

  const filtered = users.filter((u) => u.id !== userId);
  safeSet(STORAGE_KEYS.USERS, filtered);

  addAuditLog({
    action: 'BAJA_USUARIO',
    details: `Usuario eliminado: ${userToDelete.name} (@${userToDelete.username})`,
    category: 'SEGURIDAD',
  });

  return { success: true, message: 'Usuario eliminado con éxito.' };
}

// --- PRODUCTOS Y STOCK ---
export function getProducts(): Product[] {
  return safeGet<Product[]>(STORAGE_KEYS.PRODUCTS, []);
}

export function saveProduct(product: Product): void {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === product.id);
  const user = getCurrentUser();

  if (index >= 0) {
    const old = products[index];
    products[index] = { ...product, updatedAt: new Date().toISOString() };
    addAuditLog({
      action: 'MODIFICAR_PRODUCTO',
      details: `Producto modificado: ${product.code} - ${product.name}. Precio anterior: $${old.salePrice} -> Nuevo: $${product.salePrice}. Stock: ${product.currentStock}`,
      category: 'STOCK',
    });
  } else {
    products.unshift({
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    addAuditLog({
      action: 'CREAR_PRODUCTO',
      details: `Nuevo producto creado: ${product.code} - ${product.name} (PVP: $${product.salePrice})`,
      category: 'STOCK',
    });
  }
  safeSet(STORAGE_KEYS.PRODUCTS, products);
}

export function deleteProduct(id: string): void {
  const products = getProducts();
  const target = products.find((p) => p.id === id);
  if (!target) return;

  const filtered = products.filter((p) => p.id !== id);
  safeSet(STORAGE_KEYS.PRODUCTS, filtered);

  addAuditLog({
    action: 'ELIMINAR_PRODUCTO',
    details: `Producto eliminado: ${target.code} - ${target.name}`,
    category: 'STOCK',
  });
}

// --- VENTAS (POS) ---
export function getSales(): Sale[] {
  return safeGet<Sale[]>(STORAGE_KEYS.SALES, INITIAL_SALES);
}

export function registerSale(sale: Omit<Sale, 'id' | 'receiptNumber' | 'date' | 'status'>): Sale {
  const sales = getSales();
  const products = getProducts();
  const now = new Date();
  const receiptNumber = `TK-0001-${String(sales.length + 1).padStart(8, '0')}`;

  const newSale: Sale = {
    ...sale,
    id: `sale-${Date.now()}`,
    receiptNumber,
    date: now.toISOString(),
    status: 'COMPLETED',
  };

  // Descontar stock
  for (const item of newSale.items) {
    const pIndex = products.findIndex((p) => p.id === item.productId);
    if (pIndex >= 0) {
      products[pIndex].currentStock = Math.max(0, products[pIndex].currentStock - item.quantity);
      products[pIndex].updatedAt = now.toISOString();

      // Chequear si cayó por debajo de stock mínimo
      if (products[pIndex].currentStock <= products[pIndex].minStock) {
        addSystemNotification({
          title: `Stock Crítico: ${products[pIndex].name}`,
          message: `El producto ${products[pIndex].code} tiene stock actual de ${products[pIndex].currentStock} ${products[pIndex].unit} (Mínimo: ${products[pIndex].minStock}). Requiere reposición.`,
          type: 'STOCK_MINIMO',
          priority: 'ALTA',
          requiresEvidence: false,
        });
      }
    }
  }

  sales.unshift(newSale);
  safeSet(STORAGE_KEYS.SALES, sales);
  safeSet(STORAGE_KEYS.PRODUCTS, products);

  // Si pagó con cuenta corriente, impactar en saldo del cliente
  const ctaCtePayment = newSale.payments.find((p) => p.type === 'CTA_CTE');
  if (ctaCtePayment && newSale.clientId) {
    const clients = getClients();
    const cIndex = clients.findIndex((c) => c.id === newSale.clientId);
    if (cIndex >= 0) {
      clients[cIndex].currentBalance += ctaCtePayment.amount;
      safeSet(STORAGE_KEYS.CLIENTS, clients);
    }
  }

  addAuditLog({
    action: 'VENTA_MOSTRADOR',
    details: `Venta registrada ${receiptNumber} por total $${newSale.total}. Cliente: ${newSale.clientName}. Ítems: ${newSale.items.length}`,
    category: 'VENTA',
  });

  return newSale;
}

// --- COMPRAS A PROVEEDORES (EGRESOS) ---
export function getPurchases(): SupplierPurchase[] {
  return safeGet<SupplierPurchase[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
}

export function savePurchase(purchase: SupplierPurchase): void {
  const purchases = getPurchases();
  const index = purchases.findIndex((p) => p.id === purchase.id);
  if (index >= 0) {
    purchases[index] = purchase;
    addAuditLog({
      action: 'MODIFICAR_COMPRA',
      details: `Factura de compra modificada: ${purchase.purchaseNumber} de ${purchase.supplierName} por $${purchase.total.toLocaleString('es-AR')}`,
      category: 'FINANZAS',
    });
  } else {
    purchases.unshift(purchase);
    addAuditLog({
      action: 'REGISTRAR_COMPRA',
      details: `Nueva compra a proveedor registrada: ${purchase.supplierName} por $${purchase.total.toLocaleString('es-AR')} (Comprobante: ${purchase.purchaseNumber})`,
      category: 'FINANZAS',
    });
  }
  safeSet(STORAGE_KEYS.PURCHASES, purchases);
}

export function deletePurchase(id: string): void {
  const purchases = getPurchases();
  const target = purchases.find((p) => p.id === id);
  if (!target) return;
  const filtered = purchases.filter((p) => p.id !== id);
  safeSet(STORAGE_KEYS.PURCHASES, filtered);
  addAuditLog({
    action: 'ELIMINAR_COMPRA',
    details: `Factura de compra eliminada: ${target.purchaseNumber} de ${target.supplierName}`,
    category: 'FINANZAS',
  });
}

// --- PRESUPUESTOS Y ÓRDENES DE TRABAJO ---
export function getQuotes(): Quote[] {
  return safeGet<Quote[]>(STORAGE_KEYS.QUOTES, []);
}

export function saveQuote(quote: Quote): void {
  const quotes = getQuotes();
  const index = quotes.findIndex((q) => q.id === quote.id);

  if (index >= 0) {
    quotes[index] = quote;
  } else {
    quotes.unshift(quote);
  }
  safeSet(STORAGE_KEYS.QUOTES, quotes);

  addAuditLog({
    action: index >= 0 ? 'MODIFICAR_PRESUPUESTO' : 'CREAR_PRESUPUESTO',
    details: `Presupuesto ${quote.quoteNumber}: ${quote.title} - Total: $${quote.total} (${quote.status}). Validez: ${quote.validityDays} días`,
    category: 'PRESUPUESTO',
  });
}

export function isUserAdmin(user?: User | null): boolean {
  const target = user || getCurrentUser();
  return target?.role === 'ADMIN_SISTEMA' || target?.role === 'ADMIN';
}

export function approveQuoteByAdmin(quoteId: string, adminUser?: User): Quote {
  const quotes = getQuotes();
  const qIndex = quotes.findIndex((q) => q.id === quoteId || q.quoteNumber === quoteId);
  if (qIndex < 0) throw new Error('Presupuesto no encontrado');

  const user = adminUser || getCurrentUser();
  if (!user || !isUserAdmin(user)) {
    throw new Error('Solo los administradores pueden aprobar presupuestos.');
  }

  const quote = quotes[qIndex];
  quote.status = 'APROBADO_ADMIN';
  quote.adminApprovedAt = new Date().toISOString();
  quote.adminApprovedByName = user.name;

  quotes[qIndex] = quote;
  safeSet(STORAGE_KEYS.QUOTES, quotes);

  addAuditLog({
    action: 'APROBACION_ADMIN_PRESUPUESTO',
    details: `El administrador ${user.name} aprobó el presupuesto ${quote.quoteNumber} para ${quote.clientName} ($${quote.total.toLocaleString('es-AR')}). Habilitado para envío al cliente.`,
    category: 'PRESUPUESTO',
  });

  addSystemNotification({
    title: `Presupuesto ${quote.quoteNumber} Aprobado por Administración`,
    message: `Aprobado por ${user.name}. El presupuesto para ${quote.clientName} ya puede ser enviado al cliente por WhatsApp o Email.`,
    type: 'SISTEMA',
    priority: 'NORMAL',
    requiresEvidence: false,
  });

  return quote;
}

export function respondToQuoteByClient(
  quoteId: string,
  response: 'ACEPTADO' | 'RECHAZADO',
  clientNotes?: string
): Quote {
  const quotes = getQuotes();
  const qIndex = quotes.findIndex((q) => q.id === quoteId || q.quoteNumber === quoteId);
  if (qIndex < 0) throw new Error('Presupuesto no encontrado');

  const quote = quotes[qIndex];
  quote.status = response;
  if (response === 'ACEPTADO') {
    quote.clientApprovedAt = new Date().toISOString();
  }
  if (clientNotes) {
    quote.description = `${quote.description}\n[Nota del Cliente al ${response}]: ${clientNotes}`;
  }

  quotes[qIndex] = quote;
  safeSet(STORAGE_KEYS.QUOTES, quotes);

  addAuditLog({
    action: `RESPUESTA_CLIENTE_PRESUPUESTO_${response}`,
    details: `El cliente respondió al presupuesto ${quote.quoteNumber}: ${response}. ${clientNotes ? `Nota: ${clientNotes}` : ''}`,
    category: 'PRESUPUESTO',
  });

  addSystemNotification({
    title: `Presupuesto ${quote.quoteNumber} ${response} por el cliente`,
    message: `El cliente ${quote.clientName} ha respondido '${response}' al presupuesto '${quote.title}' por $${quote.total.toLocaleString('es-AR')}. Listo para generar Orden de Trabajo.`,
    type: response === 'ACEPTADO' ? 'COBRO_OT' : 'SISTEMA',
    priority: response === 'ACEPTADO' ? 'ALTA' : 'NORMAL',
    requiresEvidence: false,
  });

  return quote;
}

export function acceptQuoteAndCreateWorkOrder(
  quoteId: string,
  estimatedDeliveryDate: string,
  advancePayment: number = 0
): WorkOrder {
  const quotes = getQuotes();
  const workOrders = getWorkOrders();
  const qIndex = quotes.findIndex((q) => q.id === quoteId);

  if (qIndex < 0) throw new Error('Presupuesto no encontrado');
  const quote = quotes[qIndex];

  const otNumber = `OT-2026-${String(workOrders.length + 1).padStart(4, '0')}`;
  const newOrder: WorkOrder = {
    id: `ot-${Date.now()}`,
    orderNumber: otNumber,
    quoteId: quote.id,
    clientId: quote.clientId,
    clientName: quote.clientName,
    clientPhone: quote.clientPhone,
    workAddress: quote.workAddress,
    title: quote.title,
    description: quote.description,
    technicianId: quote.technicianId,
    technicianName: quote.technicianName,
    estimatedDeliveryDate,
    status: 'EN_PROCESO',
    totalAmount: quote.total,
    advancePayment,
    remainingBalance: quote.total - advancePayment,
    photos: [...quote.photos],
    createdAt: new Date().toISOString(),
  };

  quotes[qIndex].status = 'ACEPTADO';
  quotes[qIndex].workOrderId = newOrder.id;

  workOrders.unshift(newOrder);
  safeSet(STORAGE_KEYS.QUOTES, quotes);
  safeSet(STORAGE_KEYS.WORK_ORDERS, workOrders);

  addAuditLog({
    action: 'ACEPTACION_PRESUPUESTO_OT',
    details: `Presupuesto ${quote.quoteNumber} aceptado. Se generó ${otNumber} con entrega pactada ${estimatedDeliveryDate}. Anticipo: $${advancePayment}. Saldo restante: $${newOrder.remainingBalance}`,
    category: 'PRESUPUESTO',
  });

  return newOrder;
}

export function getWorkOrders(): WorkOrder[] {
  return safeGet<WorkOrder[]>(STORAGE_KEYS.WORK_ORDERS, []);
}

export function addWorkOrderDirect(order: Omit<WorkOrder, 'id' | 'orderNumber' | 'createdAt'>): WorkOrder {
  const workOrders = getWorkOrders();
  const otNumber = `OT-2026-${String(workOrders.length + 1).padStart(4, '0')}`;

  const newOrder: WorkOrder = {
    ...order,
    id: `ot-${Date.now()}`,
    orderNumber: otNumber,
    createdAt: new Date().toISOString(),
  };

  workOrders.unshift(newOrder);
  safeSet(STORAGE_KEYS.WORK_ORDERS, workOrders);

  addAuditLog({
    action: 'CREAR_OT_DIRECTA',
    details: `Orden de Trabajo directa creada ${otNumber}: ${newOrder.title}. Cliente: ${newOrder.clientName}. Entrega estimada: ${newOrder.estimatedDeliveryDate}. Total: $${newOrder.totalAmount}`,
    category: 'PRESUPUESTO',
  });

  return newOrder;
}

// Paso 5: El usuario confirma la finalización de la tarea
export function confirmWorkOrderCompletionByUser(
  orderId: string,
  completionNotes?: string,
  completionPhotos?: any[]
): WorkOrder {
  const orders = getWorkOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index < 0) throw new Error('Orden de trabajo no encontrada');

  const order = orders[index];
  const user = getCurrentUser();
  const now = new Date().toISOString();

  order.status = 'FINALIZADA_USUARIO';
  order.userCompletedAt = now;
  order.userCompletedByName = user?.name || 'Usuario';
  if (completionNotes) {
    order.completionNotes = completionNotes;
  }
  if (completionPhotos && completionPhotos.length > 0) {
    order.photos = [...order.photos, ...completionPhotos];
  }

  orders[index] = order;
  safeSet(STORAGE_KEYS.WORK_ORDERS, orders);

  addAuditLog({
    action: 'CONFIRMAR_FINALIZACION_TAREA_USUARIO',
    details: `El usuario ${user?.name || 'Usuario'} confirmó la finalización de la tarea en la orden ${order.orderNumber} (${order.title}). Saldo restante adeudado: $${order.remainingBalance.toLocaleString('es-AR')}`,
    category: 'PRESUPUESTO',
  });

  addSystemNotification({
    title: `TAREA FINALIZADA: Orden ${order.orderNumber} por ${user?.name || 'Técnico'}`,
    message: `La tarea '${order.title}' fue completada por el usuario/técnico. Saldo restante adeudado por facturar: $${order.remainingBalance.toLocaleString('es-AR')}. Pendiente de aprobación administrativa de obra.`,
    type: 'COBRO_OT',
    priority: 'ALTA',
    requiresEvidence: false,
  });

  return order;
}

// Paso 6: El administrador aprueba la finalización de obra y se genera la factura por el monto restante adeudado
export function adminApproveCompletionAndInvoice(
  orderId: string,
  paymentMethod: { type: PaymentMethodType; reference?: string },
  adminNotes?: string
): { order: WorkOrder; sale: Sale } {
  const orders = getWorkOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index < 0) throw new Error('Orden de trabajo no encontrada');

  const user = getCurrentUser();
  if (!user || !isUserAdmin(user)) {
    throw new Error('Solo los administradores pueden aprobar la finalización de obra y generar la factura.');
  }

  const order = orders[index];
  const now = new Date().toISOString();

  order.status = 'COBRADA';
  order.completedAt = now;
  order.adminApprovedAt = now;
  order.adminApprovedByName = user.name;
  if (adminNotes) {
    order.completionNotes = order.completionNotes
      ? `${order.completionNotes}\n[Aprobación Admin]: ${adminNotes}`
      : `[Aprobación Admin]: ${adminNotes}`;
  }

  const remainingAmount = order.remainingBalance;
  order.remainingBalance = 0;

  // Generar Factura / Venta oficial por el saldo restante adeudado
  const sale = registerSale({
    cashierId: user.id,
    cashierName: user.name,
    clientId: order.clientId,
    clientName: order.clientName,
    items: [
      {
        productId: 'serv-ot',
        code: order.orderNumber,
        name: `Servicio / Obra: ${order.title}`,
        unitPrice: order.totalAmount,
        quantity: 1,
        subtotal: order.totalAmount,
      },
    ],
    subtotal: order.totalAmount,
    discount: order.advancePayment, // El anticipo figura como deducción del cobro final
    total: remainingAmount,
    payments: [
      {
        type: paymentMethod.type,
        amount: remainingAmount,
        reference: paymentMethod.reference || `Facturación y liquidación final de ${order.orderNumber}`,
      },
    ],
  });

  order.invoiceReceiptNumber = sale.receiptNumber;
  orders[index] = order;
  safeSet(STORAGE_KEYS.WORK_ORDERS, orders);

  addAuditLog({
    action: 'APROBACION_ADMIN_FINALIZACION_Y_FACTURACION',
    details: `Administrador ${user.name} aprobó finalización de obra para ${order.orderNumber}. Factura ${sale.receiptNumber} generada por el saldo restante adeudado de $${remainingAmount} vía ${paymentMethod.type}`,
    category: 'VENTA',
  });

  return { order, sale };
}

// Compatibilidad
export function finalizeWorkOrderAndInvoice(
  orderId: string,
  paymentMethod: { type: PaymentMethodType; reference?: string },
  completionNotes?: string,
  completionPhotos?: any[]
): { order: WorkOrder; sale: Sale } {
  // Si no estaba marcada como finalizada por el usuario, registrar la finalización
  const orders = getWorkOrders();
  const found = orders.find((o) => o.id === orderId);
  if (found && found.status !== 'FINALIZADA_USUARIO') {
    confirmWorkOrderCompletionByUser(orderId, completionNotes, completionPhotos);
  }
  return adminApproveCompletionAndInvoice(orderId, paymentMethod, completionNotes);
}

export function updateWorkOrder(order: WorkOrder): void {
  const orders = getWorkOrders();
  const index = orders.findIndex((o) => o.id === order.id);
  if (index >= 0) {
    orders[index] = order;
    safeSet(STORAGE_KEYS.WORK_ORDERS, orders);

    // Si pasó a FINALIZADA y tiene saldo pendiente, alertar cobro
    if (order.status === 'FINALIZADA' && order.remainingBalance > 0) {
      addSystemNotification({
        title: `COBRO PENDIENTE: Orden ${order.orderNumber} Finalizada`,
        message: `El trabajo '${order.title}' fue completado. Saldo por cobrar: $${order.remainingBalance.toLocaleString('es-AR')}.`,
        type: 'COBRO_OT',
        priority: 'ALTA',
        requiresEvidence: true,
      });
    }

    addAuditLog({
      action: 'ACTUALIZAR_OT',
      details: `Orden de Trabajo ${order.orderNumber} actualizada a estado: ${order.status}`,
      category: 'PRESUPUESTO',
    });
  }
}

// --- PROVEEDORES Y CLIENTES ---
export function getSuppliers(): Supplier[] {
  return safeGet<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
}

export function saveSupplier(supplier: Supplier): void {
  const suppliers = getSuppliers();
  const index = suppliers.findIndex((s) => s.id === supplier.id);
  if (index >= 0) {
    suppliers[index] = supplier;
  } else {
    suppliers.unshift(supplier);
  }
  safeSet(STORAGE_KEYS.SUPPLIERS, suppliers);
}

export function getClients(): Client[] {
  return safeGet<Client[]>(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
}

export function saveClient(client: Client): void {
  const clients = getClients();
  const index = clients.findIndex((c) => c.id === client.id);
  if (index >= 0) {
    clients[index] = client;
  } else {
    clients.unshift(client);
  }
  safeSet(STORAGE_KEYS.CLIENTS, clients);
}

// --- OBLIGACIONES FINANCIERAS Y CHEQUES (CON EVIDENCIA OBLIGATORIA) ---
export function getObligations(): FinancialObligation[] {
  return safeGet<FinancialObligation[]>(STORAGE_KEYS.OBLIGATIONS, INITIAL_OBLIGATIONS);
}

export function addObligation(obl: Omit<FinancialObligation, 'id' | 'status'>): FinancialObligation {
  const obligations = getObligations();
  const newObl: FinancialObligation = {
    ...obl,
    id: `obl-${Date.now()}`,
    status: 'PENDIENTE',
  };
  obligations.unshift(newObl);
  safeSet(STORAGE_KEYS.OBLIGATIONS, obligations);

  // Crear notificación si vence pronto
  addSystemNotification({
    title: `Compromiso Financiero: ${newObl.title}`,
    message: `${newObl.description} - Vencimiento: ${newObl.dueDate} - Monto: $${newObl.amount.toLocaleString('es-AR')}`,
    type: newObl.type === 'CHEQUE_EMITIDO' ? 'CHEQUE_COBERTURA' : 'SISTEMA',
    priority: 'URGENTE',
    obligationId: newObl.id,
    requiresEvidence: newObl.requiresMandatoryEvidence,
  });

  return newObl;
}

export function resolveObligationWithEvidence(
  obligationId: string,
  operationNumber: string,
  notes?: string,
  proofUrl?: string
): void {
  if (!operationNumber || operationNumber.trim().length === 0) {
    throw new Error('Es OBLIGATORIO ingresar el número de operación bancaria o comprobante para desactivar esta alerta.');
  }

  const obligations = getObligations();
  const index = obligations.findIndex((o) => o.id === obligationId);
  if (index < 0) throw new Error('Obligación no encontrada');

  const user = getCurrentUser();
  const now = new Date().toISOString();

  obligations[index].status = 'RESUELTO';
  obligations[index].resolutionEvidence = {
    resolvedAt: now,
    resolvedByUserId: user?.id || 'sys-admin',
    resolvedByUserName: user?.name || 'Administrador',
    operationNumber: operationNumber.trim(),
    notes,
    proofUrl,
  };
  safeSet(STORAGE_KEYS.OBLIGATIONS, obligations);

  // Desactivar notificación asociada
  const notifications = getNotifications();
  const nIndex = notifications.findIndex((n) => n.obligationId === obligationId);
  if (nIndex >= 0) {
    notifications[nIndex].active = false;
    notifications[nIndex].resolvedAt = now;
    safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  addAuditLog({
    action: 'RESOLUCION_OBLIGACION_BANCARIA',
    details: `Obligación resuelta: '${obligations[index].title}' por $${obligations[index].amount.toLocaleString('es-AR')}. Evidencia/N° Operación: ${operationNumber.trim()}`,
    category: 'FINANZAS',
  });
}

// --- NOTIFICACIONES ---
export function getNotifications(): SystemNotification[] {
  return safeGet<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
}

export function addSystemNotification(
  notif: Omit<SystemNotification, 'id' | 'createdAt' | 'active'>
): SystemNotification {
  const notifications = getNotifications();
  const newNotif: SystemNotification = {
    ...notif,
    id: `notif-${Date.now()}`,
    createdAt: new Date().toISOString(),
    active: true,
  };
  notifications.unshift(newNotif);
  safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
  return newNotif;
}

export function dismissNotification(id: string): void {
  const notifications = getNotifications();
  const target = notifications.find((n) => n.id === id);
  if (!target) return;

  if (target.requiresEvidence) {
    throw new Error('Esta notificación requiere confirmación de transacción con evidencia obligatoria (N° de operación).');
  }

  target.active = false;
  target.resolvedAt = new Date().toISOString();
  safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
}

// --- LICENCIA ---
export function getLicense(): LicenseInfo {
  return safeGet<LicenseInfo>(STORAGE_KEYS.LICENSE, INITIAL_LICENSE);
}

export function updateLicenseKey(key: string, type: 'TRIAL' | 'ANUAL' | 'LIBRE'): LicenseInfo {
  const now = new Date();
  const validUntil = type === 'LIBRE' ? undefined : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const newLicense: LicenseInfo = {
    type,
    status: 'ACTIVE',
    issuedTo: 'Ferretería Once y Dos',
    licenseKey: key,
    validFrom: now.toISOString().slice(0, 10),
    validUntil,
    daysRemaining: type === 'LIBRE' ? 9999 : 365,
    allowedFeatures: [
      'stock_unlimited',
      'pos_counter',
      'mobile_quotes',
      'work_orders',
      'financial_checks',
      'audit_logging',
      'dev_chat',
    ],
  };

  safeSet(STORAGE_KEYS.LICENSE, newLicense);
  addAuditLog({
    action: 'ACTUALIZAR_LICENCIA',
    details: `Licencia actualizada a tipo: ${type} con clave ${key}`,
    category: 'SISTEMA',
  });
  return newLicense;
}

// --- AUDITORÍA Y REGISTRO DE ERRORES ---
export function getAuditLogs(): AuditLogEntry[] {
  return safeGet<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOGS, []);
}

export function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'userName' | 'role'>): void {
  const logs = getAuditLogs();
  const user = getCurrentUser();
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    userId: user?.id || 'sys',
    userName: user?.name || 'Sistema',
    role: user?.role || 'ADMIN_SISTEMA',
  };
  logs.unshift(newEntry);
  // Mantener últimos 1000 registros
  if (logs.length > 1000) logs.pop();
  safeSet(STORAGE_KEYS.AUDIT_LOGS, logs);
}

export function getErrorLogs(): SystemErrorLog[] {
  return safeGet<SystemErrorLog[]>(STORAGE_KEYS.ERROR_LOGS, []);
}

export function logSystemError(error: Omit<SystemErrorLog, 'id' | 'timestamp' | 'resolved'>): SystemErrorLog {
  const errors = getErrorLogs();
  const newErr: SystemErrorLog = {
    ...error,
    id: `err-${Date.now()}`,
    timestamp: new Date().toISOString(),
    resolved: false,
  };
  errors.unshift(newErr);
  safeSet(STORAGE_KEYS.ERROR_LOGS, errors);

  addAuditLog({
    action: 'FALLO_DEL_SISTEMA',
    details: `Error capturado en ${error.sourceFile} (Línea: ${error.lineNumber}): ${error.message}`,
    category: 'SISTEMA',
  });

  return newErr;
}

// --- CHAT CON EL PROGRAMADOR ---
export function getDevMessages(): DevMessage[] {
  return safeGet<DevMessage[]>(STORAGE_KEYS.DEV_MESSAGES, []);
}

export function sendDevMessage(message: string, attachmentData?: any): DevMessage {
  const messages = getDevMessages();
  const user = getCurrentUser();
  const newMsg: DevMessage = {
    id: `msg-${Date.now()}`,
    timestamp: new Date().toISOString(),
    sender: 'USER',
    senderName: user ? user.name : 'Usuario',
    message,
    hasAttachment: !!attachmentData,
    attachmentData,
  };
  messages.push(newMsg);
  safeSet(STORAGE_KEYS.DEV_MESSAGES, messages);

  // Respuesta simulada inteligente del programador puntoAR
  setTimeout(() => {
    const updated = getDevMessages();
    updated.push({
      id: `msg-reply-${Date.now()}`,
      timestamp: new Date().toISOString(),
      sender: 'DEV',
      senderName: 'puntoAR Dev Team',
      message: `Hola ${user ? user.name : 'Usuario'}, recibimos tu consulta sobre: "${message.slice(0, 60)}...". Nuestro equipo técnico está revisando los registros y te responderá a la brevedad. Gracias por comunicarte con soporte de puntoAR.`,
    });
    safeSet(STORAGE_KEYS.DEV_MESSAGES, updated);
  }, 1200);

  return newMsg;
}

// --- CHAT INTERNO ENTRE USUARIOS ---
export function getUserChatMessages(): UserChatMessage[] {
  return safeGet<UserChatMessage[]>(STORAGE_KEYS.USER_MESSAGES, INITIAL_USER_MESSAGES);
}

export function sendUserChatMessage(recipientId: string, message: string): UserChatMessage {
  const messages = getUserChatMessages();
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('Debe iniciar sesión para enviar mensajes');
  }
  const users = getUsers();
  const recipient = recipientId === 'GENERAL' ? null : users.find((u) => u.id === recipientId);

  const newMsg: UserChatMessage = {
    id: `umsg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    senderId: currentUser.id,
    senderUsername: currentUser.username,
    senderName: currentUser.name,
    senderRole: currentUser.role,
    recipientId: recipientId,
    recipientName: recipient ? recipient.name : 'Canal General (Equipo)',
    message: message.trim(),
    timestamp: new Date().toISOString(),
  };

  messages.push(newMsg);
  safeSet(STORAGE_KEYS.USER_MESSAGES, messages);

  addAuditLog({
    action: 'CHAT_INTERNO_ENVIADO',
    details: `Mensaje interno enviado por ${currentUser.name} a ${newMsg.recipientName}: "${message.slice(0, 50)}..."`,
    category: 'SISTEMA',
  });

  return newMsg;
}
