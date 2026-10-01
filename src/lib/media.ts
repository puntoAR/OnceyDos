/**
 * Utilidad de procesamiento, optimización y compresión de imágenes en el cliente
 * Permite manejar fotos de insumos y fotos de obra sin saturar el almacenamiento
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg';
}

export async function compressImage(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    format = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular escalado manteniendo relación de aspecto
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto 2D de Canvas'));
          return;
        }

        // Renderizado suavizado de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const dataUrl = canvas.toDataURL(format, quality);
          resolve(dataUrl);
        } catch {
          // Fallback a JPEG si WebP falla en algún entorno antiguo
          const fallbackDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(fallbackDataUrl);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
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
