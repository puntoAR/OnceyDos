/**
 * Utilidad de procesamiento, optimización, detección de tamaño y compresión de imágenes
 * Diseñada para cumplir con los límites estrictos de despliegue en Vercel (Payload Serverless de 4.5 MB)
 * y garantizar rendimiento ultra veloz en conexiones móviles para ferretería y obras in situ.
 */

export const VERCEL_IMAGE_LIMITS = {
  // Límite duro del payload en funciones Serverless de Vercel (4.5 MB = 4,718,592 bytes)
  MAX_SERVERLESS_PAYLOAD_BYTES: 4.5 * 1024 * 1024,
  // Límite recomendado por imagen para asegurar que peticiones con múltiples fotos no saturen el payload
  RECOMMENDED_IMAGE_BYTES: 1.0 * 1024 * 1024, // 1.0 MB
  // Tamaño objetivo para insumos de ferretería (excelente nitidez y menos de 750 KB)
  TARGET_OPTIMAL_BYTES: 750 * 1024, // 750 KB
  // Dimensión máxima en píxeles (ancho o alto)
  MAX_DIMENSION: 1400,
};

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getDataUrlSizeBytes(dataUrl: string): number {
  if (!dataUrl) return 0;
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return dataUrl.length;
  const base64Str = dataUrl.slice(commaIdx + 1);
  const padding = base64Str.endsWith('==') ? 2 : base64Str.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.round((base64Str.length * 3) / 4 - padding));
}

export interface ImageInspection {
  originalSize: number;
  originalFormatted: string;
  exceedsVercelHardLimit: boolean; // > 4.5 MB
  exceedsRecommendedLimit: boolean; // > 1 MB
  statusText: string;
  statusType: 'OPTIMAL' | 'NEEDS_COMPRESSION' | 'EXCEEDS_VERCEL_LIMIT';
}

export function inspectImageFile(file: File | Blob): ImageInspection {
  const size = file.size;
  const formatted = formatBytes(size);
  const exceedsVercelHardLimit = size > VERCEL_IMAGE_LIMITS.MAX_SERVERLESS_PAYLOAD_BYTES;
  const exceedsRecommendedLimit = size > VERCEL_IMAGE_LIMITS.RECOMMENDED_IMAGE_BYTES;

  let statusText = `Tamaño apto para Vercel (${formatted})`;
  let statusType: 'OPTIMAL' | 'NEEDS_COMPRESSION' | 'EXCEEDS_VERCEL_LIMIT' = 'OPTIMAL';

  if (exceedsVercelHardLimit) {
    statusText = `Excede el límite máximo admitido por Vercel (${formatted} > 4.5 MB). Requiere compresión mandatoria.`;
    statusType = 'EXCEEDS_VERCEL_LIMIT';
  } else if (exceedsRecommendedLimit) {
    statusText = `Tamaño elevado (${formatted}). Se optimizará para evitar sobrepasar límites en Vercel.`;
    statusType = 'NEEDS_COMPRESSION';
  }

  return {
    originalSize: size,
    originalFormatted: formatted,
    exceedsVercelHardLimit,
    exceedsRecommendedLimit,
    statusText,
    statusType,
  };
}

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  originalFormatted: string;
  compressedFormatted: string;
  savingsPercent: number;
  width: number;
  height: number;
  isVercelCompliant: boolean;
  reductionText: string;
  wasCompressed: boolean;
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg';
  targetMaxBytes?: number;
}

/**
 * Comprime y optimiza una imagen en múltiples pasadas hasta asegurar que cumpla
 * con el tamaño admitido por Vercel (por debajo del límite de 4.5 MB de Serverless Functions
 * y dentro del rango óptimo de 750 KB a 1 MB para insumos).
 */
export async function compressImageForVercel(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<CompressionResult> {
  const originalSize = file.size;
  const originalFormatted = formatBytes(originalSize);
  const targetMaxBytes = options.targetMaxBytes || VERCEL_IMAGE_LIMITS.RECOMMENDED_IMAGE_BYTES;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        // Pasadas progresivas de compresión y escalado
        const passes = [
          { maxDim: options.maxWidth || VERCEL_IMAGE_LIMITS.MAX_DIMENSION, quality: options.quality || 0.82 },
          { maxDim: 1200, quality: 0.74 },
          { maxDim: 1000, quality: 0.65 },
          { maxDim: 800, quality: 0.55 },
        ];

        let finalDataUrl = '';
        let finalWidth = img.width;
        let finalHeight = img.height;
        let finalBytes = originalSize;

        for (let i = 0; i < passes.length; i++) {
          const { maxDim, quality } = passes[i];
          let w = img.width;
          let h = img.height;

          // Mantener relación de aspecto
          if (w > h) {
            if (w > maxDim) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            }
          } else {
            if (h > maxDim) {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);

          let dataUrl = '';
          try {
            dataUrl = canvas.toDataURL(options.format || 'image/webp', quality);
          } catch {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          const bytes = getDataUrlSizeBytes(dataUrl);
          finalDataUrl = dataUrl;
          finalWidth = w;
          finalHeight = h;
          finalBytes = bytes;

          // Si el tamaño ya cumple con el objetivo admitido por Vercel, no es necesario degradar más
          if (finalBytes <= targetMaxBytes) {
            break;
          }
        }

        const compressedFormatted = formatBytes(finalBytes);
        const savingsPercent =
          originalSize > 0
            ? Math.max(0, Math.round(((originalSize - finalBytes) / originalSize) * 100))
            : 0;

        const isVercelCompliant = finalBytes <= VERCEL_IMAGE_LIMITS.MAX_SERVERLESS_PAYLOAD_BYTES;

        resolve({
          dataUrl: finalDataUrl,
          originalSize,
          compressedSize: finalBytes,
          originalFormatted,
          compressedFormatted,
          savingsPercent,
          width: finalWidth,
          height: finalHeight,
          isVercelCompliant,
          reductionText: `${originalFormatted} ➔ ${compressedFormatted} (-${savingsPercent}%)`,
          wasCompressed: originalSize > finalBytes,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Función compatible con llamadas existentes que devuelve directamente el dataUrl comprimido
 */
export async function compressImage(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<string> {
  const result = await compressImageForVercel(file, options);
  return result.dataUrl;
}

/**
 * Generador de placeholders SVG vectoriales estilizados para insumos de ferretería
 */
export function getProductPlaceholderSvg(category: string, name: string): string {
  const colors: Record<string, { bg: string; text: string; icon: string }> = {
    'Herramientas Manuales': { bg: '#FEF3C7', text: '#B45309', icon: '🔧' },
    'Herramientas Eléctricas': { bg: '#FFEDD5', text: '#C2410C', icon: '⚡' },
    'Tornillería y Fijaciones': { bg: '#F1F5F9', text: '#475569', icon: '🔩' },
    'Plomería y Grifería': { bg: '#E0F2FE', text: '#0369A1', icon: '🚰' },
    'Electricidad e Iluminación': { bg: '#FEF9C3', text: '#A16207', icon: '💡' },
    'Pinturas y Adhesivos': { bg: '#FCE7F3', text: '#BE185D', icon: '🎨' },
    'Cerrajería y Seguridad': { bg: '#EDE9FE', text: '#6D28D9', icon: '🔑' },
    'Construcción y Áridos': { bg: '#F3F4F6', text: '#374151', icon: '🧱' },
  };

  const style = colors[category] || { bg: '#FEF3C7', text: '#D97706', icon: '🛠️' };
  const initials = name.slice(0, 2).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="300" height="300" fill="${style.bg}" rx="16"/>
    <circle cx="150" cy="120" r="60" fill="#FFFFFF" fill-opacity="0.8"/>
    <text x="150" y="135" font-family="system-ui, sans-serif" font-size="52" text-anchor="middle" dominant-baseline="middle">${style.icon}</text>
    <text x="150" y="220" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="${style.text}" text-anchor="middle">${initials}</text>
    <text x="150" y="245" font-family="system-ui, sans-serif" font-size="12" fill="#64748B" text-anchor="middle">Ferretería Once y Dos</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
