'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Camera, Upload, Trash2, Eye, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/media';

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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newImages: string[] = [...images];

    for (let i = 0; i < files.length; i++) {
      if (newImages.length >= maxImages) break;
      try {
        const compressed = await compressImage(files[i], {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          format: 'image/webp',
        });
        newImages.push(compressed);
      } catch (err) {
        console.error('Error al procesar imagen:', err);
      }
    }

    onChange(newImages);
    setIsProcessing(false);
    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          {label} ({images.length}/{maxImages})
        </label>
        {isProcessing && (
          <span className="text-xs text-amber-600 font-semibold flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Optimizando imagen...
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm"
          >
            {img.startsWith('data:image/svg') ? (
              <img src={img} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
            ) : (
              <img
                src={img}
                alt={`Foto ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            )}

            <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewImage(img)}
                className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-800 transition-colors"
                title="Ampliar"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {idx === 0 && (
              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-slate-950">
                Principal
              </span>
            )}
          </div>
        ))}

        {images.length < maxImages && (
          <div className="flex flex-col gap-1.5">
            <label className="flex-1 flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/80 cursor-pointer transition-colors p-2 text-center">
              <Upload className="w-5 h-5 text-amber-600 mb-1" />
              <span className="text-[11px] font-bold text-amber-900 leading-tight">
                Subir Foto
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
              <label className="flex items-center justify-center py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 cursor-pointer transition-colors text-[10px] font-bold gap-1">
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

      {/* Modal Lightbox de previsualización */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white rounded-xl overflow-hidden p-2">
            <img
              src={previewImage}
              alt="Previsualización"
              className="max-h-[80vh] w-auto object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
