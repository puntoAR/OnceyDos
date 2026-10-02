import { Product, Supplier, Client, User, FinancialObligation, SystemNotification, LicenseInfo, Quote, WorkOrder, RolePermissions, AppModule, UserRole } from '@/types';
import { getProductPlaceholderSvg } from '../media';

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'ADMIN_SISTEMA',
    label: 'Administrador del Sistema',
    description: 'Acceso total a todo el sistema y todas las configuraciones avanzadas, licencias y auditoría.',
    allowedModules: [
      'DASHBOARD',
      'STOCK',
      'POS',
      'PRESUPUESTOS',
      'ORDENES_TRABAJO',
      'FINANZAS',
      'ALERTAS',
      'LICENCIAS',
      'AUDITORIA',
      'ACCESOS',
    ],
  },
  {
    role: 'ADMIN',
    label: 'Administrador',
    description: 'Acceso operativo completo: panel principal, inventario, venta mostrador, presupuestos in situ y órdenes de trabajo.',
    allowedModules: [
      'DASHBOARD',
      'STOCK',
      'POS',
      'PRESUPUESTOS',
      'ORDENES_TRABAJO',
      'FINANZAS',
      'ALERTAS',
    ],
  },
  {
    role: 'TECNICO',
    label: 'Técnico de Obra',
    description: 'Acceso restringido a inventario/stock de insumos y presupuestos in situ para obras.',
    allowedModules: [
      'STOCK',
      'PRESUPUESTOS',
    ],
  },
  {
    role: 'CAJERO',
    label: 'Mostrador / Caja',
    description: 'Acceso a inventario/stock y venta de mostrador (POS / facturación).',
    allowedModules: [
      'STOCK',
      'POS',
    ],
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u-1',
    username: 'admin_sistema',
    name: 'Carlos Arrieta (Admin Sistema)',
    role: 'ADMIN_SISTEMA',
    email: 'sistemas@onceydos.com.ar',
  },
  {
    id: 'u-2',
    username: 'admin',
    name: 'Mariana Gerente (Administradora)',
    role: 'ADMIN',
    email: 'administracion@onceydos.com.ar',
  },
  {
    id: 'u-3',
    username: 'tecnico',
    name: 'Gonzalo Fernández (Técnico de Obra)',
    role: 'TECNICO',
    email: 'obras@onceydos.com.ar',
  },
  {
    id: 'u-4',
    username: 'cajero',
    name: 'Martín Gómez (Mostrador / Caja)',
    role: 'CAJERO',
    email: 'caja@onceydos.com.ar',
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Distribuidora Mayorista Ferretera S.A.',
    cuit: '30-71124567-8',
    contactName: 'Roberto Mendoza',
    phone: '+54 11 4756-1122',
    whatsapp: '+54 9 11 5566-7788',
    email: 'ventas@distrimayor.com.ar',
    address: 'Av. Juan B. Justo 4520, CABA',
    notes: 'Entrega los días martes y jueves. Pago a 30 días con cheque.',
    bankAccountInfo: 'Banco Santander - CBU: 0720123988000034567890 - Alias: DISTRI.FERRO.BSAS',
    active: true,
  },
  {
    id: 'sup-2',
    name: 'Bremen Tools Argentina',
    cuit: '30-68954123-4',
    contactName: 'Valeria Rossi',
    phone: '+54 11 4899-3300',
    whatsapp: '+54 9 11 4455-6677',
    email: 'comercial@brementools.com.ar',
    address: 'Parque Industrial Pilar, Calle 4 Lote 12',
    notes: 'Herramientas manuales y neumáticas de alta gama.',
    bankAccountInfo: 'Banco Galicia - CBU: 0070198820000049281726 - Alias: BREMEN.OFICIAL.ARG',
    active: true,
  },
  {
    id: 'sup-3',
    name: 'Tigre Plásticos & Griferías',
    cuit: '30-55421980-3',
    contactName: 'Esteban Morales',
    phone: '+54 11 4200-9800',
    whatsapp: '+54 9 11 3322-1100',
    email: 'pedidos@tigreplast.com.ar',
    address: 'Colectora Panamericana Km 34.5',
    notes: 'Cañerías termofusión, PVC sanitarios y accesorios.',
    bankAccountInfo: 'Banco Macro - CBU: 2850100640000012984756 - Alias: TIGRE.PAGOS.BANCO',
    active: true,
  },
  {
    id: 'sup-4',
    name: 'Electro Materiales Sur S.R.L.',
    cuit: '30-70984321-9',
    contactName: 'Claudio Navarro',
    phone: '+54 11 4654-7890',
    whatsapp: '+54 9 11 9988-7766',
    email: 'ventas@electrosur.com',
    address: 'Av. Rivadavia 14200, Ramos Mejía',
    notes: 'Cables normalizados, llaves térmicas y tableros Schneider.',
    bankAccountInfo: 'Banco BBVA - CBU: 0170098420000098765432 - Alias: ELECTROSUR.PAGOS',
    active: true,
  },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Constructora del Plata S.A.',
    cuitDni: '30-71458962-1',
    phone: '+54 11 4322-5544',
    email: 'compras@constructoradelplata.com',
    address: 'Av. Del Libertador 6200, Piso 4, CABA',
    hasCurrentAccount: true,
    creditLimit: 3500000,
    currentBalance: 1425000, // Deuda de cuenta corriente
    notes: 'Cliente preferencial. Cierre de cuenta quincenal.',
  },
  {
    id: 'cli-2',
    name: 'Dr. Alejandro Varela (Particular)',
    cuitDni: '20-24558912-3',
    phone: '+54 11 5849-2104',
    email: 'a.varela@gmail.com',
    address: 'Calle Güemes 1480, San Isidro',
    hasCurrentAccount: false,
    creditLimit: 0,
    currentBalance: 0,
    notes: 'Cliente de reparaciones a domicilio y bombas de agua.',
  },
  {
    id: 'cli-3',
    name: 'Talleres Mecánicos San Cayetano',
    cuitDni: '33-69874120-9',
    phone: '+54 11 4755-3211',
    email: 'contacto@tallersancayetano.com',
    address: 'Av. Mitre 890, Florida',
    hasCurrentAccount: true,
    creditLimit: 1200000,
    currentBalance: 480000, // Deuda pendiente
    notes: 'Retiran tornillería y herramientas los lunes.',
  },
  {
    id: 'cli-4',
    name: 'Consorcio Edificio Balcarce 540',
    cuitDni: '30-65889922-4',
    phone: '+54 11 4342-9988',
    email: 'administracion@balcarce540.com',
    address: 'Balcarce 540, Monserrat, CABA',
    hasCurrentAccount: true,
    creditLimit: 800000,
    currentBalance: 0,
    notes: 'Facturar con detalle de mano de obra y materiales.',
  },
];

export const INITIAL_LICENSE: LicenseInfo = {
  type: 'TRIAL',
  status: 'ACTIVE',
  issuedTo: 'Ferretería Once y Dos',
  licenseKey: 'PUNTOAR-ONCEYDOS-TRIAL-2026',
  validFrom: '2026-10-01',
  validUntil: '2026-10-31',
  daysRemaining: 30,
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

// Generador de catálogo representativo de ferretería con 100 productos base extensibles a 10.000
const BASE_CATEGORIES = [
  'Herramientas Manuales',
  'Herramientas Eléctricas',
  'Tornillería y Fijaciones',
  'Plomería y Grifería',
  'Electricidad e Iluminación',
  'Pinturas y Adhesivos',
  'Cerrajería y Seguridad',
  'Construcción y Áridos',
];

const SAMPLE_PRODUCTS_DEF = [
  { name: 'Martillo Galponero 16oz Mango Fibra', cat: 'Herramientas Manuales', brand: 'Bremen', cost: 14500, markup: 45, unit: 'u', loc: 'Pasillo 1 - Estante A' },
  { name: 'Juego Llaves Combinadas 6 a 22mm x 12pzs', cat: 'Herramientas Manuales', brand: 'Bremen', cost: 38200, markup: 50, unit: 'juego', loc: 'Pasillo 1 - Estante B' },
  { name: 'Pinza Universal 8 Pulgadas Aislada 1000V', cat: 'Herramientas Manuales', brand: 'Bremen', cost: 18900, markup: 45, unit: 'u', loc: 'Pasillo 1 - Estante A' },
  { name: 'Destornillador Punta Imantada PH2 x 100mm', cat: 'Herramientas Manuales', brand: 'Bremen', cost: 4200, markup: 50, unit: 'u', loc: 'Pasillo 1 - Estante C' },
  { name: 'Nivel Torpedo Magnético 230mm 3 Gotas', cat: 'Herramientas Manuales', brand: 'Stanley', cost: 11500, markup: 40, unit: 'u', loc: 'Pasillo 1 - Estante D' },
  
  { name: 'Amoladora Angular 4-1/2 850W con Disco', cat: 'Herramientas Eléctricas', brand: 'DeWalt', cost: 89000, markup: 35, unit: 'u', loc: 'Vitrina 1' },
  { name: 'Taladro Percutor 13mm 710W Velocidad Variable', cat: 'Herramientas Eléctricas', brand: 'Bosch', cost: 98500, markup: 35, unit: 'u', loc: 'Vitrina 1' },
  { name: 'Rotomartillo SDS Plus 800W con Maletín', cat: 'Herramientas Eléctricas', brand: 'DeWalt', cost: 195000, markup: 35, unit: 'u', loc: 'Vitrina 2' },
  { name: 'Sierra Caladora 650W Guía Láser', cat: 'Herramientas Eléctricas', brand: 'Black+Decker', cost: 72000, markup: 40, unit: 'u', loc: 'Vitrina 2' },
  
  { name: 'Tornillo Autoperforante T1 Punta Aguja x 100u', cat: 'Tornillería y Fijaciones', brand: 'Sintex', cost: 3100, markup: 60, unit: 'caja', loc: 'Góndola Central - Fila 1' },
  { name: 'Tornillo Drywall T2 Fosfatizado x 1000u', cat: 'Tornillería y Fijaciones', brand: 'Sintex', cost: 16800, markup: 55, unit: 'caja', loc: 'Góndola Central - Fila 2' },
  { name: 'Tarugo Nylon N° 8 con Tope x 100u', cat: 'Tornillería y Fijaciones', brand: 'Fischer', cost: 4500, markup: 55, unit: 'bolsa', loc: 'Góndola Central - Fila 3' },
  { name: 'Broca Hormigón Widia 8mm x 120mm', cat: 'Tornillería y Fijaciones', brand: 'Irwin', cost: 3900, markup: 45, unit: 'u', loc: 'Góndola Central - Fila 4' },
  { name: 'Tirafondo Zincado 1/4 x 2 Pulgadas x 50u', cat: 'Tornillería y Fijaciones', brand: 'Sintex', cost: 7900, markup: 50, unit: 'bolsa', loc: 'Góndola Central - Fila 5' },
  
  { name: 'Caño Termofusión Agua 20mm x 4mts PN20', cat: 'Plomería y Grifería', brand: 'Tigre', cost: 6800, markup: 40, unit: 'tira', loc: 'Depósito Fondo - Tubera' },
  { name: 'Caño Termofusión Agua 25mm x 4mts PN20', cat: 'Plomería y Grifería', brand: 'Tigre', cost: 9900, markup: 40, unit: 'tira', loc: 'Depósito Fondo - Tubera' },
  { name: 'Codo Termofusión 20mm a 90 Grados', cat: 'Plomería y Grifería', brand: 'Tigre', cost: 480, markup: 50, unit: 'u', loc: 'Pasillo 3 - Cajonera 2' },
  { name: 'Válvula Esférica Metálica Paso Total 3/4 Pulgada', cat: 'Plomería y Grifería', brand: 'Genebre', cost: 14200, markup: 45, unit: 'u', loc: 'Pasillo 3 - Estante B' },
  { name: 'Canilla de Pared Bronce Cromado 1/2 Pico Manguera', cat: 'Plomería y Grifería', brand: 'Latyn', cost: 11900, markup: 45, unit: 'u', loc: 'Pasillo 3 - Estante C' },
  { name: 'Bomba Sumergible Pozo Profundo 1 HP', cat: 'Plomería y Grifería', brand: 'Motorarg', cost: 310000, markup: 30, unit: 'u', loc: 'Depósito A' },
  
  { name: 'Cable Unipolar 2.5 mm² Normalizado IRAM x 100m', cat: 'Electricidad e Iluminación', brand: 'Prysmian', cost: 48900, markup: 35, unit: 'rollo', loc: 'Pasillo 4 - Racks Cables' },
  { name: 'Cable Unipolar 4.0 mm² Normalizado IRAM x 100m', cat: 'Electricidad e Iluminación', brand: 'Prysmian', cost: 74200, markup: 35, unit: 'rollo', loc: 'Pasillo 4 - Racks Cables' },
  { name: 'Interruptor Termomagnético Bipolar 2x20A Curva C', cat: 'Electricidad e Iluminación', brand: 'Schneider', cost: 12400, markup: 40, unit: 'u', loc: 'Pasillo 4 - Tablero' },
  { name: 'Disyuntor Diferencial Bipolar 2x25A 30mA', cat: 'Electricidad e Iluminación', brand: 'Schneider', cost: 28900, markup: 40, unit: 'u', loc: 'Pasillo 4 - Tablero' },
  { name: 'Reflector LED Exterior 50W IP65 Luz Fría', cat: 'Electricidad e Iluminación', brand: 'Macroled', cost: 16500, markup: 45, unit: 'u', loc: 'Pasillo 4 - Iluminación' },
  { name: 'Cinta Aisladora PVC 20 Metros Negra', cat: 'Electricidad e Iluminación', brand: '3M', cost: 2100, markup: 50, unit: 'u', loc: 'Caja Mostrador' },
  
  { name: 'Pintura Látex Interior Mate Blanco x 20 Lts', cat: 'Pinturas y Adhesivos', brand: 'Alba', cost: 68500, markup: 35, unit: 'balde', loc: 'Sector Pinturas - Base' },
  { name: 'Esmalte Sintético Satinado Blanco x 4 Lts', cat: 'Pinturas y Adhesivos', brand: 'Alba', cost: 34200, markup: 35, unit: 'lata', loc: 'Sector Pinturas - Estante 2' },
  { name: 'Adhesivo Sellador Silicona Neutra Transparente 280ml', cat: 'Pinturas y Adhesivos', brand: 'Siloc', cost: 6200, markup: 45, unit: 'pomo', loc: 'Sector Adhesivos' },
  { name: 'Cinta Enmascarar Pintor 24mm x 50m', cat: 'Pinturas y Adhesivos', brand: 'Dobleak', cost: 2900, markup: 50, unit: 'rollo', loc: 'Sector Pinturas - Mostrador' },
  
  { name: 'Cerradura Seguridad Doble Perno Frente Angosto', cat: 'Cerrajería y Seguridad', brand: 'Prive', cost: 24500, markup: 40, unit: 'u', loc: 'Pasillo 2 - Cerrajería' },
  { name: 'Candado Bronce Macizo 50mm con 3 Llaves', cat: 'Cerrajería y Seguridad', brand: 'Yale', cost: 18200, markup: 45, unit: 'u', loc: 'Pasillo 2 - Vitrina' },
  { name: 'Cerrojo Pasador Simple Cilindro Seguridad', cat: 'Cerrajería y Seguridad', brand: 'Kallay', cost: 16800, markup: 40, unit: 'u', loc: 'Pasillo 2 - Cerrajería' },
  
  { name: 'Cemento Portland Normal x 50 Kg', cat: 'Construcción y Áridos', brand: 'Loma Negra', cost: 8900, markup: 25, unit: 'bolsa', loc: 'Depósito Patio' },
  { name: 'Cal Hidráulica Común x 25 Kg', cat: 'Construcción y Áridos', brand: 'El Milagro', cost: 4200, markup: 30, unit: 'bolsa', loc: 'Depósito Patio' },
  { name: 'Hidrófugo Pasta Hidrófuga Impermeable x 5 Kg', cat: 'Construcción y Áridos', brand: 'Sika', cost: 11500, markup: 35, unit: 'balde', loc: 'Sector Construcción' },
];

export function generateSeedProducts(count: number = 250): Product[] {
  const products: Product[] = [];
  
  // Añadir primero los productos definidos con datos precisos
  SAMPLE_PRODUCTS_DEF.forEach((p, idx) => {
    const cost = p.cost;
    const markup = p.markup;
    const vat = 21;
    const sale = Math.round(cost * (1 + markup / 100) * (1 + vat / 100));
    const minStock = idx % 5 === 0 ? 15 : 8;
    // Algunos con stock bajo el mínimo intencionalmente para disparar alertas de reposición
    const currentStock = idx === 0 ? 3 : idx === 3 ? 2 : idx === 10 ? 4 : (idx * 7) % 45 + 5;
    const sku = `FER-${1000 + idx + 1}`;
    const barcode = `779${String(1000000000 + idx).slice(1)}`;

    products.push({
      id: `prod-${idx + 1}`,
      code: sku,
      barcode: barcode,
      name: p.name,
      description: `${p.name} - Calidad garantizada marca ${p.brand}. Para uso profesional y de obra.`,
      category: p.cat,
      brand: p.brand,
      supplierId: idx % 2 === 0 ? 'sup-1' : 'sup-2',
      supplierName: idx % 2 === 0 ? 'Distribuidora Mayorista Ferretera S.A.' : 'Bremen Tools Argentina',
      costPrice: cost,
      markupPercentage: markup,
      vatPercentage: vat,
      salePrice: sale,
      currentStock: currentStock,
      minStock: minStock,
      unit: p.unit,
      location: p.loc,
      imageUrl: getProductPlaceholderSvg(p.cat, p.name),
      createdAt: '2026-09-15T10:00:00Z',
      updatedAt: '2026-10-01T15:30:00Z',
    });
  });

  // Generar el remanente hasta el count solicitado para disponer de miles de items con indexación instantánea
  const remaining = count - products.length;
  for (let i = 0; i < remaining; i++) {
    const num = products.length + 1;
    const cat = BASE_CATEGORIES[i % BASE_CATEGORIES.length];
    const supId = `sup-${(i % 4) + 1}`;
    const supName = INITIAL_SUPPLIERS[(i % 4)].name;
    const cost = 1500 + ((i * 370) % 85000);
    const markup = 35 + ((i * 7) % 30);
    const vat = 21;
    const sale = Math.round(cost * (1 + markup / 100) * (1 + vat / 100));
    const minStock = 5 + (i % 10);
    const currentStock = (i % 7 === 0) ? Math.floor(minStock / 2) : 10 + (i % 60);

    const name = `${cat} Ítem Técnico Industrial Mod. ${num} (Cod. AR-${2000 + i})`;
    const sku = `FER-${2000 + i}`;
    const barcode = `779${String(2000000000 + i).slice(1)}`;

    products.push({
      id: `prod-${num}`,
      code: sku,
      barcode: barcode,
      name: name,
      description: `Insumo estándar de ferretería codificado según norma técnica nacional. Categoría: ${cat}.`,
      category: cat,
      brand: ['Bremen', 'Stanley', 'Schneider', 'Tigre', 'Alba', 'Sintex', 'Bosch'][i % 7],
      supplierId: supId,
      supplierName: supName,
      costPrice: cost,
      markupPercentage: markup,
      vatPercentage: vat,
      salePrice: sale,
      currentStock: currentStock,
      minStock: minStock,
      unit: 'u',
      location: `Pasillo ${(i % 6) + 1} - Góndola ${(i % 8) + 1}`,
      imageUrl: getProductPlaceholderSvg(cat, name),
      createdAt: '2026-09-20T08:00:00Z',
      updatedAt: '2026-10-01T12:00:00Z',
    });
  }

  return products;
}

export const INITIAL_OBLIGATIONS: FinancialObligation[] = [
  {
    id: 'obl-1',
    type: 'CHEQUE_EMITIDO',
    title: 'Cubrir Cheque Entregado a Distribuidora Ferretera',
    description: 'Cheque N° 00482910 emitido contra Banco Santander para cancelar factura A-0004-9812.',
    entityName: 'Distribuidora Mayorista Ferretera S.A.',
    amount: 1450000,
    dueDate: '2026-10-02', // Vence mañana -> Dispara alerta bancaria obligatoria
    bank: 'Banco Santander',
    checkNumber: '00482910',
    status: 'PENDIENTE',
    requiresMandatoryEvidence: true,
  },
  {
    id: 'obl-2',
    type: 'COBRO_TRABAJO',
    title: 'Cobro de Reparación de Bomba en San Isidro',
    description: 'Trabajo finalizado en domicilio de Dr. Varela. Saldo pendiente de cobro contra entrega de conformidad.',
    entityName: 'Dr. Alejandro Varela',
    amount: 185000,
    dueDate: '2026-10-01',
    status: 'PENDIENTE',
    requiresMandatoryEvidence: true,
  },
  {
    id: 'obl-3',
    type: 'CUENTA_CORRIENTE_DEUDA',
    title: 'Cobro Cuenta Corriente Vencida',
    description: 'Facturas quincenales vencidas de materiales de obra para Constructora del Plata.',
    entityName: 'Constructora del Plata S.A.',
    amount: 1425000,
    dueDate: '2026-09-28', // Ya vencida
    status: 'PENDIENTE',
    requiresMandatoryEvidence: true,
  },
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'ALERTA BANCARIA: Cheque por Vencer Mañana',
    message: 'Se debe cubrir el Cheque N° 00482910 por $1.450.000 en Banco Santander para Distribuidora Mayorista Ferretera S.A. Esta alerta requiere registrar el N° de operación bancaria para desactivarse.',
    type: 'CHEQUE_COBERTURA',
    priority: 'URGENTE',
    obligationId: 'obl-1',
    active: true,
    requiresEvidence: true,
    createdAt: '2026-10-01T09:15:00Z',
  },
  {
    id: 'notif-2',
    title: 'COBRO PENDIENTE: Orden de Trabajo Finalizada',
    message: 'La reparación en domicilio del Dr. Alejandro Varela (San Isidro) fue finalizada. Resta cobrar el saldo de $185.000.',
    type: 'COBRO_OT',
    priority: 'ALTA',
    obligationId: 'obl-2',
    active: true,
    requiresEvidence: true,
    createdAt: '2026-10-01T11:00:00Z',
  },
  {
    id: 'notif-3',
    title: 'ALERTA DE STOCK: 4 Productos bajo el mínimo',
    message: 'Martillos galponeros, rotomartillos y tornillos T1 requieren reposición inmediata.',
    type: 'STOCK_MINIMO',
    priority: 'NORMAL',
    active: true,
    requiresEvidence: false,
    createdAt: '2026-10-01T14:30:00Z',
  },
];

export const INITIAL_QUOTES: Quote[] = [
  {
    id: 'quote-1',
    quoteNumber: 'PRE-2026-0041',
    date: '2026-10-01',
    technicianId: 'u-3',
    technicianName: 'Gonzalo Fernández',
    clientId: 'cli-2',
    clientName: 'Dr. Alejandro Varela',
    clientPhone: '+54 11 5849-2104',
    workAddress: 'Calle Güemes 1480, San Isidro',
    title: 'Reemplazo de Bomba Sumergible y Renovación de Cañerías',
    description: 'Diagnóstico in situ: la bomba centrífuga anterior sufrió cortocircuito por filtración. Se cotiza reemplazo por bomba sumergible Motorarg 1HP con cañería termofusión PN20 y válvula esférica.',
    items: [
      { id: 'qi-1', type: 'PRODUCT', productId: 'prod-20', description: 'Bomba Sumergible Pozo Profundo 1 HP Motorarg', quantity: 1, unitPrice: 487630, subtotal: 487630 },
      { id: 'qi-2', type: 'PRODUCT', productId: 'prod-15', description: 'Caño Termofusión Agua 25mm x 4mts PN20 Tigre', quantity: 4, unitPrice: 16890, subtotal: 67560 },
      { id: 'qi-3', type: 'PRODUCT', productId: 'prod-18', description: 'Válvula Esférica Metálica Paso Total 3/4 Pulgada', quantity: 2, unitPrice: 24900, subtotal: 49800 },
      { id: 'qi-4', type: 'LABOR', description: 'Mano de obra especializada: extracción de equipo anterior, montaje de cañería e instalación eléctrica con prueba hidráulica', quantity: 1, unitPrice: 150000, subtotal: 150000 },
    ],
    photos: [
      {
        id: 'photo-1',
        url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23e2e8f0"/><text x="200" y="140" font-family="sans-serif" font-size="16" fill="%23475569" text-anchor="middle">Foto Relevamiento In Situ</text><text x="200" y="170" font-family="sans-serif" font-size="13" fill="%2364748b" text-anchor="middle">Bomba dañada y pozo inspeccionado</text></svg>',
        description: 'Bomba anterior dañada por sobrecalentamiento y cables corroídos.',
        takenAt: '2026-10-01T10:15:00Z',
        stage: 'INSPECCION',
      },
    ],
    subtotalMaterials: 604990,
    subtotalLabor: 150000,
    total: 754990,
    validityDays: 10,
    status: 'ACEPTADO',
    workOrderId: 'ot-1',
  },
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'ot-1',
    orderNumber: 'OT-2026-0018',
    quoteId: 'quote-1',
    clientId: 'cli-2',
    clientName: 'Dr. Alejandro Varela',
    clientPhone: '+54 11 5849-2104',
    workAddress: 'Calle Güemes 1480, San Isidro',
    title: 'Reemplazo de Bomba Sumergible y Renovación de Cañerías',
    description: 'Reemplazo completo con prueba de caudal y presión.',
    technicianId: 'u-3',
    technicianName: 'Gonzalo Fernández',
    estimatedDeliveryDate: '2026-10-05',
    status: 'EN_PROCESO',
    totalAmount: 754990,
    advancePayment: 300000,
    remainingBalance: 454990,
    photos: [
      {
        id: 'photo-1',
        url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23e2e8f0"/><text x="200" y="140" font-family="sans-serif" font-size="16" fill="%23475569" text-anchor="middle">Relevamiento Inicial</text><text x="200" y="170" font-family="sans-serif" font-size="13" fill="%2364748b" text-anchor="middle">Zona de pozo y tablero</text></svg>',
        description: 'Zona de pozo y cañerías antes de iniciar el desmontaje.',
        takenAt: '2026-10-01T10:15:00Z',
        stage: 'INSPECCION',
      },
    ],
    createdAt: '2026-10-01T11:30:00Z',
  },
];
