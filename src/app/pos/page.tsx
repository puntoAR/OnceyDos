'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ShoppingCart,
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
  User,
  ArrowRight,
  X,
} from 'lucide-react';
import { getProducts, getClients, registerSale, getCurrentUser } from '@/lib/store';
import { Product, Client, SaleItem, PaymentEntry, PaymentMethodType, Sale } from '@/types';
import confetti from 'canvas-confetti';

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Métodos de Pago
  const [paymentType, setPaymentType] = useState<PaymentMethodType>('EFECTIVO');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [reference, setReference] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [checkNumber, setCheckNumber] = useState<string>('');

  // Ticket Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const cashier = getCurrentUser();

  const loadData = () => {
    setProducts(getProducts());
    setClients(getClients());
  };

  useEffect(() => {
    loadData();
    barcodeInputRef.current?.focus();
  }, []);

  // Búsqueda de productos rápida
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return products
      .filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          p.name.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [products, search]);

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          code: product.code,
          name: product.name,
          unitPrice: product.salePrice,
          quantity: 1,
          subtotal: product.salePrice,
          imageUrl: product.imageUrl,
        },
      ]);
    }
    setSearch('');
    barcodeInputRef.current?.focus();
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    // Buscar coincidencia exacta por código de barras o SKU
    const exact = products.find(
      (p) =>
        p.barcode === search.trim() ||
        p.code.toLowerCase() === search.trim().toLowerCase()
    );

    if (exact) {
      addToCart(exact);
    } else if (searchResults.length > 0) {
      addToCart(searchResults[0]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = Math.max(1, item.quantity + delta);
            return { ...item, quantity: nextQty, subtotal: nextQty * item.unitPrice };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.subtotal, 0), [cart]);
  const discountAmount = useMemo(() => Math.round((subtotal * discountPercent) / 100), [subtotal, discountPercent]);
  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);
  const changeDue = useMemo(() => Math.max(0, cashGiven - total), [cashGiven, total]);

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const client = clients.find((c) => c.id === selectedClientId);
    const clientName = client ? client.name : 'Consumidor Final';

    const payment: PaymentEntry = {
      type: paymentType,
      amount: total,
      reference: reference || (paymentType === 'CHEQUE' ? `Cheque N° ${checkNumber} - ${bankName}` : undefined),
    };

    const newSale = registerSale({
      cashierId: cashier?.id || 'cajero-pos',
      cashierName: cashier?.name || 'Cajero de Turno',
      clientId: client?.id,
      clientName,
      items: cart,
      subtotal,
      discount: discountAmount,
      total,
      payments: [payment],
    });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}

    setCompletedSale(newSale);
    setShowReceipt(true);
    setCart([]);
    setCashGiven(0);
    setReference('');
    setCheckNumber('');
    setBankName('');
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-amber-500" />
            <span>Punto de Venta Mostrador (POS)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cajero en turno: <strong>{cashier?.name || 'Cajero'}</strong> &bull; Cobro con efectivo, cheque, Mercado Pago, tarjetas y cuenta corriente.
          </p>
        </div>

        {/* Selector de Cliente */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-soft-card">
          <User className="w-4 h-4 text-slate-400 ml-2" />
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none pr-4"
          >
            <option value="">Consumidor Final</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.hasCurrentAccount ? `(Cta Cte: $${c.currentBalance.toLocaleString('es-AR')})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Escáner de código y Búsqueda */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft-card">
            <form onSubmit={handleBarcodeSubmit} className="relative">
              <Barcode className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Escanear código de barras con lector o buscar por SKU / nombre..."
                className="w-full pl-11 pr-24 py-3 rounded-2xl border-2 border-amber-300 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 text-sm font-semibold text-slate-800"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs"
              >
                Agregar
              </button>
            </form>

            {/* Sugerencias de búsqueda rápida */}
            {searchResults.length > 0 && (
              <div className="mt-3 divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                {searchResults.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => addToCart(prod)}
                    className="p-3 hover:bg-amber-50/80 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                            11&bull;2
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{prod.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {prod.code} &bull; Stock: {prod.currentStock} {prod.unit}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ${prod.salePrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabla del Carrito */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Detalle de Venta ({cart.length} artículos)
              </span>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold"
                >
                  Vaciar carrito
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Escanea un código de barras o busca un insumo para comenzar el ticket.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-[10px]">
                            11&bull;2
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.code}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      {/* Control de Cantidad */}
                      <div className="flex items-center space-x-1 bg-slate-100 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 rounded-lg hover:bg-white text-slate-700 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-mono font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 rounded-lg hover:bg-white text-slate-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="w-20 text-right font-mono font-bold text-slate-900 text-sm">
                        ${item.subtotal.toLocaleString('es-AR')}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Liquidación y Métodos de Cobro */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft-card space-y-5">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Forma de Cobro y Facturación
            </h3>

            {/* Selector de Medios de Pago */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                { type: 'BILLETERA', label: 'Billetera (MP)', icon: Smartphone },
                { type: 'CHEQUE', label: 'Cheque', icon: Landmark },
                { type: 'TARJETA', label: 'Tarjeta Créd/Déb', icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentType === m.type;

                return (
                  <button
                    key={m.type}
                    type="button"
                    onClick={() => setPaymentType(m.type as PaymentMethodType)}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center space-x-2 transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md shadow-amber-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Opción Cuenta Corriente si el cliente la tiene habilitada */}
            {selectedClient?.hasCurrentAccount && (
              <button
                type="button"
                onClick={() => setPaymentType('CTA_CTE')}
                className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                  paymentType === 'CTA_CTE'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/20'
                    : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                }`}
              >
                <span>Imputar a Cuenta Corriente</span>
                <span className="font-mono text-[11px]">
                  Límite disp: ${(selectedClient.creditLimit - selectedClient.currentBalance).toLocaleString('es-AR')}
                </span>
              </button>
            )}

            {/* Campos condicionales según medio de pago */}
            {paymentType === 'EFECTIVO' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Monto Abonado:</span>
                  <input
                    type="number"
                    min={0}
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    placeholder="0"
                    className="w-32 px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-right text-sm"
                  />
                </div>
                {cashGiven > total && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 text-emerald-700 font-bold">
                    <span>Vuelto a Entregar:</span>
                    <span className="font-mono text-base font-black">
                      ${changeDue.toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {paymentType === 'CHEQUE' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">Datos del Cheque Recibido:</span>
                <input
                  type="text"
                  placeholder="Banco emisor (ej: Banco Galicia)"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                />
                <input
                  type="text"
                  placeholder="Número de cheque (ej: 04829102)"
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
            )}

            {paymentType === 'BILLETERA' && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Comprobante de Transferencia / MP:</span>
                <input
                  type="text"
                  placeholder="N° de Operación / Código de autorización"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>
            )}

            {/* Resumen de Totales */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Descuento %</span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 rounded-lg border border-slate-200 text-right font-mono"
                />
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>TOTAL A COBRAR</span>
                <span className="font-mono text-xl text-amber-900 font-black">
                  ${total.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Botón de Finalizar Venta */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Confirmar Venta & Emitir Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Ticket de Venta */}
      {showReceipt && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 flex flex-col items-center text-center font-mono">
            <button
              onClick={() => setShowReceipt(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Ticket Header */}
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center mb-3">
              11&bull;2
            </div>
            <h3 className="font-sans font-black text-slate-900 text-lg">ONCE Y DOS</h3>
            <p className="text-[10px] text-slate-500 font-sans">Ferretería &bull; Materiales &bull; Servicios</p>
            <p className="text-[10px] text-slate-500 pt-1">CUIT: 30-71984210-2 &bull; IVA Resp. Inscripto</p>
            <p className="text-[10px] text-slate-400">Venta: {completedSale.receiptNumber}</p>
            <p className="text-[10px] text-slate-400">{new Date(completedSale.date).toLocaleString('es-AR')}</p>

            <div className="w-full border-b border-dashed border-slate-300 my-3"></div>

            {/* Ticket Items */}
            <div className="w-full text-left text-[11px] space-y-1.5 max-h-48 overflow-y-auto">
              {completedSale.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="pr-2">
                    <span>{it.quantity}x {it.name}</span>
                  </div>
                  <span className="font-bold shrink-0">${it.subtotal.toLocaleString('es-AR')}</span>
                </div>
              ))}
            </div>

            <div className="w-full border-b border-dashed border-slate-300 my-3"></div>

            <div className="w-full text-xs space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${completedSale.subtotal.toLocaleString('es-AR')}</span>
              </div>
              {completedSale.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span>-${completedSale.discount.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
                <span>TOTAL:</span>
                <span>${completedSale.total.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                <span>Medio de Pago:</span>
                <span className="uppercase">{completedSale.payments[0]?.type}</span>
              </div>
            </div>

            <div className="w-full border-b border-dashed border-slate-300 my-3"></div>

            <p className="text-[10px] text-slate-400 font-sans italic">
              ¡Gracias por su compra en Ferretería Once y Dos! <br />
              powered by puntoAR
            </p>

            <div className="flex items-center gap-3 w-full mt-4 font-sans">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
