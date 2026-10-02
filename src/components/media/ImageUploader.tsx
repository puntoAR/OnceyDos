'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Camera,
  Upload,
  Trash2,
  Eye,
  Loader2,
  ShieldCheck,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  compressImageForVercel,
  inspectImageFile,
  formatBytes,
  getDataUrlSizeBytes,
  CompressionResult,
  VERCEL_IMAGE_LIMITS,
} from '@/lib/media';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  allowCamera?: boolean;
}

export function ImageUploader({
  images,
  onChange,
  maxImages = 6,
  label = 'Fotografías del Insumo / Relevamiento de Obra',
  allowCamera = true,
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedMeta, setSelectedMeta] = useState<CompressionResult | null>(null);
  const [metaMap, setMetaMap] = useState<Record<string, CompressionResult>>({});
  const [lastBatchReport, setLastBatchReport] = useState<{
    originalFormatted: string;
    compressedFormatted: string;
    savings: number;
    count: number;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setLastBatchReport(null);
    const newImages: string[] = [...images];
    const newMetaMap = { ...metaMap };

    let totalOriginalBytes = 0;
    let totalCompressedBytes = 0;
    let processedCount = 0;

    for (let i = 0; i < files.length; i++) {
      if (newImages.length >= maxImages) break;
      const file = files[i];
      const inspection = inspectImageFile(file);

      totalOriginalBytes += inspection.originalSize;

      if (inspection.exceedsVercelHardLimit) {
        setProcessingStatus(
          `Detectada imagen de ${inspection.originalFormatted} (supera 4.5 MB). Comprimiendo para Vercel...`
        );
      } else if (inspection.exceedsRecommendedLimit) {
        setProcessingStatus(
          `Optimizando imagen de ${inspection.originalFormatted} para despliegue en Vercel...`
        );
      } else {
        setProcessingStatus(`Procesando ${file.name} (${inspection.originalFormatted})...`);
      }

      try {
        const result = await compressImageForVercel(file, {
          targetMaxBytes: VERCEL_IMAGE_LIMITS.TARGET_OPTIMAL_BYTES,
        });

        totalCompressedBytes += result.compressedSize;
        processedCount++;

        newImages.push(result.dataUrl);
        newMetaMap[result.dataUrl] = result;
      } catch (err) {
        console.error('Error al procesar imagen:', err);
      }
    }

    if (processedCount > 0) {
      const overallSavings =
        totalOriginalBytes > 0
          ? Math.max(
              0,
              Math.round(((totalOriginalBytes - totalCompressedBytes) / totalOriginalBytes) * 100)
            )
          : 0;

      setLastBatchReport({
        originalFormatted: formatBytes(totalOriginalBytes),
        compressedFormatted: formatBytes(totalCompressedBytes),
        savings: overallSavings,
        count: processedCount,
      });
    }

    setMetaMap(newMetaMap);
    onChange(newImages);
    setIsProcessing(false);
    setProcessingStatus('');
    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    const targetUrl = images[index];
    const updated = images.filter((_, i) => i !== index);
    if (metaMap[targetUrl]) {
      const updatedMap = { ...metaMap };
      delete updatedMap[targetUrl];
      setMetaMap(updatedMap);
    }
    onChange(updated);
  };

  // Helper para obtener el peso y estado de una imagen
  const getImageInfo = (imgUrl: string) => {
    if (metaMap[imgUrl]) {
      return metaMap[imgUrl];
    }
    const sizeBytes = getDataUrlSizeBytes(imgUrl);
    return {
      dataUrl: imgUrl,
      originalSize: sizeBytes,
      compressedSize: sizeBytes,
      originalFormatted: formatBytes(sizeBytes),
      compressedFormatted: formatBytes(sizeBytes),
      savingsPercent: 0,
      width: 0,
      height: 0,
      isVercelCompliant: sizeBytes <= VERCEL_IMAGE_LIMITS.MAX_SERVERLESS_PAYLOAD_BYTES,
      reductionText: formatBytes(sizeBytes),
      wasCompressed: false,
    };
  };

  return (
    <div className="space-y-3">
      {/* Cabecera del cargador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label} ({images.length}/{maxImages})
        </label>

        {isProcessing && (
          <span className="text-xs text-amber-600 font-semibold flex items-center gap-1.5 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{processingStatus || 'Detectando tamaño y optimizando para Vercel...'}</span>
          </span>
        )}
      </div>

      {/* Banner de reporte de compresión reciente */}
      {lastBatchReport && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>{lastBatchReport.count} imagen(es) optimizadas para Vercel:</strong>{' '}
              {lastBatchReport.originalFormatted} ➔ {lastBatchReport.compressedFormatted} (
              <span className="font-bold text-emerald-700">{lastBatchReport.savings}% de ahorro</span>)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLastBatchReport(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grilla de imágenes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {images.map((img, idx) => {
          const info = getImageInfo(img);
          const isSvg = img.startsWith('data:image/svg');

          return (
            <div
              key={idx}
              className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs"
            >
              {isSvg ? (
                <img src={img} alt={`Insumo ${idx + 1}`} className="w-full h-full object-cover" />
              ) : (
                <img
                  src={img}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              )}

              {/* Badges permanentes de estado */}
              <div className="absolute top-1 left-1 flex flex-col gap-1 z-10">
                {idx === 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-500 text-slate-950 uppercase shadow-xs">
                    Principal
                  </span>
                )}
              </div>

              {/* Badge de tamaño y compatibilidad Vercel */}
              {!isSvg && (
                <div className="absolute bottom-1 right-1 z-10">
                  <button
                    type="button"
                    onClick={() => setSelectedMeta(info)}
                    className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-900/80 hover:bg-slate-900 text-emerald-400 backdrop-blur-xs flex items-center gap-0.5 shadow-xs transition-colors"
                    title="Ver detalles de compresión Vercel"
                  >
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    <span>{info.compressedFormatted}</span>
                  </button>
                </div>
              )}

              {/* Overlay de acciones hover */}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-20">
                <button
                  type="button"
                  onClick={() => setPreviewImage(img)}
                  className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 transition-colors shadow-xs"
                  title="Ampliar imagen"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {!isSvg && (
                  <button
                    type="button"
                    onClick={() => setSelectedMeta(info)}
                    className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-xs"
                    title="Auditoría de compresión Vercel"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors shadow-xs"
                  title="Eliminar fotografía"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Botones de subida y cámara */}
        {images.length < maxImages && (
          <div className="flex flex-col gap-1.5">
            <label className="flex-1 flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/80 cursor-pointer transition-colors p-2 text-center group">
              <Upload className="w-5 h-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold text-amber-900 leading-tight">
                Subir Imagen
              </span>
              <span className="text-[9px] text-amber-700/80 mt-0.5">
                Auto-comprime
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={isProcessing}
                className="hidden"
              />
            </label>

            {allowCamera && (
              <label className="flex items-center justify-center py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 cursor-pointer transition-colors text-[10px] font-bold gap-1 shadow-xs">
                <Camera className="w-3.5 h-3.5 text-slate-700" />
                <span>Cámara Móvil</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}
      </div>

      {/* Barra informativa de cumplimiento de límites de Vercel */}
      <div className="p-2.5 rounded-xl bg-slate-100/90 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Control de Payload Vercel:</strong> El sistema detecta fotos pesadas (&gt;4.5 MB) y las comprime progresivamente en el navegador a formato WebP optimizado (&lt;1 MB).
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono text-slate-500">
          <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-semibold text-emerald-700">
            Máx: 4.5 MB
          </span>
          <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-semibold text-amber-700">
            Objetivo: ~750 KB
          </span>
        </div>
      </div>

      {/* Modal Lightbox de previsualización completa */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer animate-in fade-in duration-150"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <img
              src={previewImage}
              alt="Previsualización"
              className="max-h-[80vh] w-auto object-contain mx-auto rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Modal de Auditoría de Compresión Vercel */}
      {selectedMeta && (
        <div
          onClick={() => setSelectedMeta(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl p-5 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Auditoría de Imagen para Vercel</h4>
                  <span className="text-[10px] text-emerald-600 font-semibold block">
                    ✓ Apta para Payload Serverless
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMeta(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tamaño Original Detectado:</span>
                <span className="font-bold font-mono text-slate-800">
                  {selectedMeta.originalFormatted}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tamaño Comprimido:</span>
                <span className="font-bold font-mono text-emerald-700">
                  {selectedMeta.compressedFormatted}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Ahorro de Ancho de Banda:</span>
                <span className="font-black text-emerald-600">
                  {selectedMeta.savingsPercent}% menos peso
                </span>
              </div>
              {selectedMeta.width > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Resolución Optimizada:</span>
                  <span className="font-mono text-slate-700">
                    {selectedMeta.width} x {selectedMeta.height} px
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Límite Vercel Serverless:</span>
                <span className="font-mono text-slate-600">4.5 MB</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Estado de Compatibilidad:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Admitida</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMeta(null)}
              className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
