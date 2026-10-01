# Once y Dos &bull; Sistema Integral para Ferretería, Stock y Servicios
> **Desarrollado y respaldado por [puntoAR](https://github.com/puntoAR/OnceyDos)**  
> *Gestión ágil hoy, mejores resultados mañana.*

![Once y Dos - powered by puntoAR](/public/images/logo-puntoar.png)

Sistema web profesional, 100% modular, responsivo y escalable diseñado especialmente para la gestión integral de ferreterías con un catálogo de más de **10.000 productos codificados**, ventas de mostrador (POS), presupuestos móviles in situ con fotos de obras, órdenes de trabajo, control de finanzas con cheques a cubrir y cobros bloqueantes con evidencia obligatoria.

---

## 🌟 Características Principales

### 1. 📦 Inventario & Stock de 10.000 Productos
- **Codificación Completa**: SKU interno, código de barras EAN-13, nombre, marca, categoría, proveedor y ubicación en depósito/góndola.
- **Precios Dinámicos**: Costo de lista, margen de ganancia %, IVA % y cálculo automático de PVP al público.
- **Alertas de Reposición Urgente**: Filtro instantáneo de insumos cuyo stock sea menor o igual al stock mínimo.
- **Soporte de Fotografías**: Carga de fotos desde archivos o cámara del celular con compresión automática en el navegador (WebP/JPEG) para rendimiento ultrarrápido con 10k artículos.
- **Importación y Exportación**: Descarga en formato CSV compatible con Excel.

### 2. 💳 Punto de Venta Mostrador (POS / Facturación)
- **Escáner de Código de Barras**: Entrada rápida mediante lectores de código de barras USB/Bluetooth o búsqueda instantánea por teclado.
- **Multi-método de Pago**:
  - Efectivo (con cálculo de vuelto).
  - Cheque (banco, número y fecha de cobro).
  - Billetera Virtual (Mercado Pago / transferencia bancaria con alias/CBU).
  - Tarjetas de Crédito y Débito.
  - Cuenta Corriente de clientes autorizados.
- **Emisión de Ticket**: Formato digital imprimible en impresoras térmicas de 80mm o formato estándar.

### 3. 📱 Presupuestos In Situ (100% Responsivo Móvil)
- Diseñado para técnicos que realizan visitas a domicilio u obras.
- **Relevamiento Fotográfico**: Toma de fotos con la cámara del celular para documentar instalaciones, fallas y avances.
- **Cotizador Mixto**: Selección de insumos de ferretería del stock + mano de obra y traslados.
- **Ciclo de Estados**: Borrador &rarr; Enviado &rarr; Aceptado &rarr; Rechazado.
- **Generación de Orden de Trabajo (OT)**: Al aceptarse el presupuesto, se genera automáticamente la OT asignando fecha tentativa de entrega, técnico y registro de anticipos.

### 4. 🛠️ Órdenes de Trabajo (OT)
- Seguimiento de obra (En Proceso, Espera de Repuestos, Finalizada, Cobrada).
- Traspaso de fotografías y carga de fotos de fin de obra.
- Alerta automática de saldo pendiente al finalizar los trabajos.

### 5. 🚨 Notificaciones Bancarias Bloqueantes con Evidencia Obligatoria
- **Aviso con 1 Día de Antelación**: Notifica en horario bancario cuando se deba cubrir un cheque entregado a un proveedor o cobrar deudas de clientes.
- **Regla Estricta de Desactivación**: La notificación **no se puede cerrar pasivamente**. Exige que el usuario confirme formalmente haber hecho la transacción e ingrese la **evidencia obligatoria** (N° de operación bancaria, recibo o comprobante).
- Queda registrado de forma inmutable en el Log de Auditoría.

### 6. 🔐 Licenciamiento y Actualizaciones del Sistema
- Modos de licencia configurables:
  - `TRIAL`: Prueba por 30 días con contador visible.
  - `ANUAL`: Licencia con clave de activación por 1 año.
  - `LIBRE`: Licencia permanente sin límites temporales.
- Bloqueo de seguridad si la licencia vence.
- Módulo de "Actualizaciones del Sistema" para verificar versiones y changelog con el equipo de puntoAR.

### 7. 📜 Diagnóstico de Errores con Línea de Código y Auditoría
- **Manejador Global de Excepciones**: Captura cualquier error en tiempo de ejecución e identifica el archivo de origen y el **número exacto de línea y columna**.
- Botón de 1-click para copiar reporte o enviarlo directamente al desarrollador.
- **Log de Auditoría**: Registro de quién modificó precios, eliminó productos, resolvió compromisos de cheques o generó tickets de venta.

### 8. 💬 Soporte y Chat con el Programador
- Ventana **"Acerca de"** con datos del equipo de desarrollo, versión y enlaces al repositorio oficial.
- **Chat Web Integrado**: Canal de mensajería directa entre el usuario y el programador de **puntoAR** para asistencia técnica y diagnósticos en tiempo real.

---

## 🚀 Despliegue en Vercel

Este proyecto está construido sobre **Next.js 14 (App Router)** y optimizado nativamente para **Vercel**:

1. Conecta el repositorio de GitHub: [https://github.com/puntoAR/OnceyDos](https://github.com/puntoAR/OnceyDos)
2. En el panel de Vercel, crea un nuevo proyecto seleccionando este repositorio.
3. El framework preset detectará automáticamente `Next.js`.
4. Haz clic en **Deploy**. ¡Tu sistema estará activo en segundos con certificado SSL gratuito y CDN global!

---

## 💻 Ejecución en Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir en el navegador
http://localhost:3000
```

### Usuarios y Roles de Demostración:
- **Administrador (Dueño)**: `admin` (Contraseña: `123456`)
- **Cajero (POS Mostrador)**: `cajero` (Contraseña: `123456`)
- **Técnico de Obras In Situ**: `tecnico` (Contraseña: `123456`)
- **Encargada de Depósito / Stock**: `deposito` (Contraseña: `123456`)

---

## 🎨 Identidad Visual y Créditos
- Desarrollado por **puntoAR**.
- Paleta: Ámbar (`#F59E0B`), Azul Marino (`#0F172A`) y Blanco Neutro.
- Logotipo oficial de puntoAR integrado en login, navegación y pie de página.
