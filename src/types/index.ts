export type UserRole = 'ADMIN_SISTEMA' | 'ADMIN' | 'TECNICO' | 'CAJERO';

export type AppModule =
  | 'DASHBOARD'
  | 'STOCK'
  | 'POS'
  | 'PRESUPUESTOS'
  | 'ORDENES_TRABAJO'
  | 'FINANZAS'
  | 'BALANCE'
  | 'ALERTAS'
  | 'LICENCIAS'
  | 'AUDITORIA'
  | 'ACCESOS';

export interface RolePermissions {
  role: UserRole;
  label: string;
  description: string;
  allowedModules: AppModule[];
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  createdAt?: string;
  customModules?: AppModule[]; // Permisos individuales específicos por usuario (no genéricos)
  password?: string; // Contraseña de acceso personalizada
  mustChangePasswordOnFirstLogin?: boolean; // Exigir cambio de clave en el primer ingreso
}

export interface Product {
  id: string;
  code: string; // SKU interno ej: "FER-1001"
  barcode: string; // EAN-13 ej: "7791234567890"
  name: string;
  description: string;
  category: string;
  brand: string;
  supplierId: string;
  supplierName: string;
  costPrice: number; // Precio de lista del proveedor
  markupPercentage: number; // Margen % ej: 45%
  vatPercentage: number; // IVA % ej: 21%
  salePrice: number; // PVP calculado o fijado
  currentStock: number;
  minStock: number; // Stock mínimo para alerta de reposición
  unit: string; // "u", "m", "kg", "pack", "l"
  location: string; // "Pasillo A - Góndola 3", "Depósito B"
  imageUrl?: string; // Imagen principal del insumo
  imageGallery?: string[]; // Galería adicional
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  cuit: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  notes?: string;
  bankAccountInfo?: string;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  cuitDni: string;
  phone: string;
  email: string;
  address: string;
  hasCurrentAccount: boolean;
  creditLimit: number;
  currentBalance: number; // Saldo deudor positivo si nos debe dinero
  notes?: string;
}

export type PaymentMethodType = 'EFECTIVO' | 'CHEQUE' | 'BILLETERA' | 'TARJETA' | 'CTA_CTE';

export interface PaymentEntry {
  type: PaymentMethodType;
  amount: number;
  reference?: string;
  details?: Record<string, any>;
}

export interface SaleItem {
  productId: string;
  code: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
}

export interface Sale {
  id: string;
  receiptNumber: string; // "TK-0001-00001234"
  date: string;
  cashierId: string;
  cashierName: string;
  clientId?: string;
  clientName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  payments: PaymentEntry[];
  status: 'COMPLETED' | 'CANCELLED';
}

export interface PurchaseItem {
  id: string;
  productId?: string;
  code?: string;
  description: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface SupplierPurchase {
  id: string;
  purchaseNumber: string; // "FC-A-0004-00012845" o "RE-0001-00004512"
  supplierId: string;
  supplierName: string;
  supplierCuit?: string;
  date: string; // ISO date string
  paymentMethod: 'EFECTIVO' | 'CHEQUE' | 'TRANSFERENCIA' | 'CUENTA_CORRIENTE';
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'PAGADA' | 'PENDIENTE' | 'ANULADA';
  notes?: string;
  receiptUrl?: string;
}

export interface QuotePhoto {
  id: string;
  url: string;
  description: string;
  takenAt: string;
  stage: 'INSPECCION' | 'PROCESO' | 'FINALIZADO';
}

export interface QuoteItem {
  id: string;
  type: 'PRODUCT' | 'LABOR' | 'TRANSPORT';
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type QuoteStatus =
  | 'BORRADOR'
  | 'PENDIENTE_APROBACION'
  | 'APROBADO_ADMIN'
  | 'ENVIADO'
  | 'ACEPTADO'
  | 'RECHAZADO';

export interface Quote {
  id: string;
  quoteNumber: string; // "PRE-2026-0042"
  date: string;
  technicianId: string;
  technicianName: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  workAddress: string;
  title: string;
  description: string;
  items: QuoteItem[];
  photos: QuotePhoto[];
  subtotalMaterials: number;
  subtotalLabor: number;
  total: number;
  validityDays: number;
  status: QuoteStatus;
  workOrderId?: string;
  adminApprovedAt?: string;
  adminApprovedByName?: string;
  clientApprovedAt?: string;
}

export type WorkOrderStatus =
  | 'PENDIENTE'
  | 'EN_PROCESO'
  | 'ESPERA_REPUESTOS'
  | 'FINALIZADA_USUARIO'
  | 'FINALIZADA'
  | 'COBRADA';

export interface WorkOrder {
  id: string;
  orderNumber: string; // "OT-2026-0018"
  quoteId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  workAddress: string;
  title: string;
  description: string;
  technicianId: string;
  technicianName: string;
  estimatedDeliveryDate: string; // Fecha tentativa de entrega pactada
  status: WorkOrderStatus;
  totalAmount: number;
  advancePayment: number;
  remainingBalance: number;
  photos: QuotePhoto[];
  completionNotes?: string;
  userCompletedAt?: string;
  userCompletedByName?: string;
  adminApprovedAt?: string;
  adminApprovedByName?: string;
  invoiceReceiptNumber?: string;
  createdAt: string;
  completedAt?: string;
}

export type ObligationType = 'CHEQUE_EMITIDO' | 'CHEQUE_RECIBIDO' | 'CUENTA_CORRIENTE_DEUDA' | 'COBRO_TRABAJO';

export interface FinancialObligation {
  id: string;
  type: ObligationType;
  title: string;
  description: string;
  entityName: string; // Proveedor, Cliente o Banco
  amount: number;
  dueDate: string; // YYYY-MM-DD
  bank?: string;
  checkNumber?: string;
  status: 'PENDIENTE' | 'RESUELTO' | 'VENCIDO';
  requiresMandatoryEvidence: boolean;
  resolutionEvidence?: {
    resolvedAt: string;
    resolvedByUserId: string;
    resolvedByUserName: string;
    operationNumber: string; // N° de operación bancaria o recibo
    notes?: string;
    proofUrl?: string;
  };
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'CHEQUE_COBERTURA' | 'COBRO_OT' | 'DEUDA_CLIENTE' | 'STOCK_MINIMO' | 'SISTEMA';
  priority: 'URGENTE' | 'ALTA' | 'NORMAL';
  obligationId?: string;
  active: boolean;
  requiresEvidence: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export type LicenseType = 'TRIAL' | 'ANUAL' | 'LIBRE';

export interface LicenseInfo {
  type: LicenseType;
  status: 'ACTIVE' | 'EXPIRED' | 'WARNING';
  issuedTo: string;
  licenseKey: string;
  validFrom: string;
  validUntil?: string;
  daysRemaining: number;
  allowedFeatures: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  category: 'VENTA' | 'STOCK' | 'FINANZAS' | 'PRESUPUESTO' | 'SEGURIDAD' | 'SISTEMA';
}

export interface SystemErrorLog {
  id: string;
  timestamp: string;
  message: string;
  sourceFile: string;
  lineNumber: number;
  columnNumber: number;
  componentStack?: string;
  resolved: boolean;
}

export interface DevMessage {
  id: string;
  timestamp: string;
  sender: 'USER' | 'DEV';
  senderName: string;
  message: string;
  hasAttachment?: boolean;
  attachmentData?: any;
}

export interface UserChatMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string; // 'GENERAL' para el canal de equipo o id de usuario para chat 1 a 1
  recipientName?: string;
  message: string;
  timestamp: string;
}
