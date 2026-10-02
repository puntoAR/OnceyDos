'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Boxes,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  Download,
  Upload,
  Eye,
  X,
  CheckCircle2,
  Barcode,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { getProducts, saveProduct, deleteProduct, getSuppliers } from '@/lib/store';
import { Product, Supplier } from '@/types';
import { ImageUploader } from '@/components/media/ImageUploader';
import { getProductPlaceholderSvg, formatBytes, getDataUrlSizeBytes } from '@/lib/media';

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Formulario de Producto
  const [formData, setFormData] = useState({
    code: '',
    barcode: '',
    name: '',
    description: '',
    category: 'Herramientas Manuales',
    brand: 'Bremen',
    supplierId: '',
    costPrice: 0,
    markupPercentage: 45,
    vatPercentage: 21,
    salePrice: 0,
    currentStock: 0,
    minStock: 5,
    unit: 'u',
    location: '',
    images: [] as string[],
  });

  const loadData = () => {
    setProducts(getProducts());
    setSuppliers(getSuppliers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('onceydos_storage_update', loadData);
    return () => window.removeEventListener('onceydos_storage_update', loadData);
  }, []);

  // Categorías únicas
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['TODAS', ...Array.from(set)];
  }, [products]);

  // Filtrado de alto rendimiento
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q);

      const matchCategory = selectedCategory === 'TODAS' || p.category === selectedCategory;
      const matchLowStock = !onlyLowStock || p.currentStock <= p.minStock;

      return matchSearch && matchCategory && matchLowStock;
    });
  }, [products, search, selectedCategory, onlyLowStock]);

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Abrir modal de creación / edición
  const handleOpenModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setFormData({
        code: prod.code,
        barcode: prod.barcode,
        name: prod.name,
        description: prod.description,
        category: prod.category,
        brand: prod.brand,
        supplierId: prod.supplierId,
        costPrice: prod.costPrice,
        markupPercentage: prod.markupPercentage,
        vatPercentage: prod.vatPercentage,
        salePrice: prod.salePrice,
        currentStock: prod.currentStock,
        minStock: prod.minStock,
        unit: prod.unit,
        location: prod.location,
        images: prod.imageUrl ? [prod.imageUrl, ...(prod.imageGallery || [])] : [],
      });
    } else {
      setEditingProduct(null);
      const nextNum = products.length + 1;
      const defaultSupplier = suppliers[0];
      setFormData({
        code: `FER-${1000 + nextNum}`,
        barcode: `779${String(1000000000 + nextNum).slice(1)}`,
        name: '',
        description: '',
        category: 'Herramientas Manuales',
        brand: 'Bremen',
        supplierId: defaultSupplier ? defaultSupplier.id : '',
        costPrice: 5000,
        markupPercentage: 45,
        vatPercentage: 21,
        salePrice: Math.round(5000 * 1.45 * 1.21),
        currentStock: 10,
        minStock: 5,
        unit: 'u',
        location: 'Pasillo 1 - Góndola A',
        images: [],
      });
    }
    setIsModalOpen(true);
  };

  // Recalcular PVP al cambiar costo o márgenes
  const handleCostOrMarginChange = (cost: number, markup: number, vat: number) => {
    const calculatedPvp = Math.round(cost * (1 + markup / 100) * (1 + vat / 100));
    setFormData((prev) => ({
      ...prev,
      costPrice: cost,
      markupPercentage: markup,
      vatPercentage: vat,
      salePrice: calculatedPvp,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === formData.supplierId) || suppliers[0];
    const primaryImg = formData.images[0] || getProductPlaceholderSvg(formData.category, formData.name || 'Insumo');
    const extraGallery = formData.images.slice(1);

    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      code: formData.code.trim().toUpperCase(),
      barcode: formData.barcode.trim(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
      brand: formData.brand.trim(),
      supplierId: sup ? sup.id : 'sup-1',
      supplierName: sup ? sup.name : 'Distribuidora Mayorista Ferretera',
      costPrice: Number(formData.costPrice),
      markupPercentage: Number(formData.markupPercentage),
      vatPercentage: Number(formData.vatPercentage),
      salePrice: Number(formData.salePrice),
      currentStock: Number(formData.currentStock),
      minStock: Number(formData.minStock),
      unit: formData.unit,
      location: formData.location.trim(),
      imageUrl: primaryImg,
      imageGallery: extraGallery,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProduct(productToSave);
    setIsModalOpen(false);
    loadData();
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      setProductToDelete(null);
      loadData();
    }
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = 'ID,Codigo,CodigoBarras,Nombre,Categoria,Marca,Proveedor,Costo,PVP,Stock,StockMinimo,Ubicacion\n';
    const rows = products
      .map(
        (p) =>
          `"${p.id}","${p.code}","${p.barcode}","${p.name.replace(/"/g, '""')}","${p.category}","${p.brand}","${p.supplierName.replace(/"/g, '""')}",${p.costPrice},${p.salePrice},${p.currentStock},${p.minStock},"${p.location}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `catalogo_ferreteria_onceydos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Inventario & Catálogo de Insumos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
              {products.length} codificados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de precios de lista, PVP con margen, reposición de stock mínimo y fotos de insumos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 py-2.5 px-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros Rápidos */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft-card space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por código SKU (FER-...), código de barras (779...), nombre, marca o proveedor..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-xs sm:text-sm text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setOnlyLowStock(!onlyLowStock);
                setCurrentPage(1);
              }}
              className={`flex items-center space-x-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-colors ${
                onlyLowStock
                  ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Bajo Stock Mínimo</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Mostrando <strong>{filteredProducts.length}</strong> de <strong>{products.length}</strong> insumos
          </span>
          {onlyLowStock && (
            <span className="text-amber-700 font-semibold">
              Filtro activo: Solo artículos que requieren reposición
            </span>
          )}
        </div>
      </div>

      {/* Tabla de Productos con miniaturas de fotos */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Foto</th>
                <th className="py-3 px-4">Código / Barras</th>
                <th className="py-3 px-4">Descripción & Marca</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4 text-right">Costo Lista</th>
                <th className="py-3 px-4 text-right">PVP (Venta)</th>
                <th className="py-3 px-4 text-center">Stock / Mín.</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No se encontraron insumos con los criterios de búsqueda.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod) => {
                  const isLow = prod.currentStock <= prod.minStock;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4">
                        <div
                          onClick={() => prod.imageUrl && setPreviewImage(prod.imageUrl)}
                          className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer relative shrink-0"
                          title="Click para ampliar foto"
                        >
                          {prod.imageUrl ? (
                            <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">
                              11&bull;2
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 font-mono">
                        <span className="font-bold text-slate-900 block">{prod.code}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Barcode className="w-3 h-3 text-slate-400" />
                          {prod.barcode}
                        </span>
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="font-bold text-slate-900 block max-w-xs truncate" title={prod.name}>
                          {prod.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Marca: {prod.brand} &bull; {prod.location}
                        </span>
                      </td>

                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {prod.category}
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-slate-600 max-w-[140px] truncate" title={prod.supplierName}>
                        {prod.supplierName}
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                        ${prod.costPrice.toLocaleString('es-AR')}
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        ${prod.salePrice.toLocaleString('es-AR')}
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                            isLow
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />}
                          <span>{prod.currentStock}</span>
                          <span className="text-[10px] font-normal text-slate-500">/ mín {prod.minStock}</span>
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenModal(prod)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                            title="Editar insumo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Eliminar insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 font-semibold"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 font-semibold"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Alta / Edición de Producto con Imágenes */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">
                  {editingProduct ? 'Editar Insumo de Ferretería' : 'Nuevo Insumo para Stock'}
                </h3>
                <p className="text-xs text-amber-400">
                  {editingProduct ? `Código: ${editingProduct.code}` : 'Asignación de código y fotografía'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Fotos del Producto */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <ImageUploader
                  images={formData.images}
                  onChange={(imgs) => setFormData({ ...formData, images: imgs })}
                  maxImages={4}
                  label="Fotografías del Insumo / Repuesto"
                  allowCamera={true}
                />
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Compresión automática para Vercel activa</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    Límite Serverless: 4.5 MB &bull; Salida WebP: &lt;1 MB
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código Interno (SKU) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código de Barras (EAN-13)
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Insumo / Herramienta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Llave Francesa 10 Pulgadas Fosfatizada"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rubro / Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-amber-500/50"
                  >
                    {[
                      'Herramientas Manuales',
                      'Herramientas Eléctricas',
                      'Tornillería y Fijaciones',
                      'Plomería y Grifería',
                      'Electricidad e Iluminación',
                      'Pinturas y Adhesivos',
                      'Cerrajería y Seguridad',
                      'Construcción y Áridos',
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Marca</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proveedor Asociado</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-amber-500/50"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Precios y Margen de Venta */}
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/70">
                <span className="block text-xs font-bold text-amber-900 mb-3">
                  Cálculo de Precios y Margen de Utilidad:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Costo Proveedor ($)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.costPrice}
                      onChange={(e) =>
                        handleCostOrMarginChange(
                          Number(e.target.value),
                          formData.markupPercentage,
                          formData.vatPercentage
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Margen Utilidad %
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formData.markupPercentage}
                      onChange={(e) =>
                        handleCostOrMarginChange(
                          formData.costPrice,
                          Number(e.target.value),
                          formData.vatPercentage
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">IVA %</label>
                    <input
                      type="number"
                      required
                      value={formData.vatPercentage}
                      onChange={(e) =>
                        handleCostOrMarginChange(
                          formData.costPrice,
                          formData.markupPercentage,
                          Number(e.target.value)
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      PVP al Público ($)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border-2 border-amber-500 font-mono font-bold text-xs bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Stock y Ubicación */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidad</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="u, kg, mt, pack"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ubicación</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Pasillo 2 - Estante C"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Crear Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">¿Eliminar insumo del stock?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Se eliminará <strong>{productToDelete.name}</strong> ({productToDelete.code}). Esta acción quedará registrada en el log de auditoría.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2 px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lightbox de Foto */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer"
        >
          <div className="relative max-w-xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-4 space-y-2">
            <img src={previewImage} alt="Foto de Insumo" className="max-h-[75vh] w-auto object-contain mx-auto rounded-xl" />
            <div className="flex items-center justify-between text-xs text-slate-600 px-1 pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-800">Fotografía de Insumo</span>
              <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Peso optimizado: {formatBytes(getDataUrlSizeBytes(previewImage))} (Apta para Vercel)</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
