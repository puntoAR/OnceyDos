'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Laptop,
  X,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Share2,
  PlusSquare,
  HelpCircle,
  Monitor,
  ExternalLink,
} from 'lucide-react';

export function InstallAppFloating() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'PC' | 'ANDROID' | 'IOS'>('PC');
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada / modo PWA independiente
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    // Detectar dispositivo móvil
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    setIsMobileDevice(isMobile);
    if (/iPhone|iPad|iPod/i.test(ua)) {
      setActiveTab('IOS');
    } else if (/Android/i.test(ua)) {
      setActiveTab('ANDROID');
    } else {
      setActiveTab('PC');
    }

    // Verificar si el usuario lo descartó temporalmente en esta sesión
    const dismissed = sessionStorage.getItem('onceydos_install_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Escuchar el evento PWA nativo del navegador
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Si ya está ejecutándose como aplicación instalada, no mostramos el banner
  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsStandalone(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error al invocar instalación nativa:', err);
        setShowGuideModal(true);
      }
    } else {
      // Si el navegador no soporta el prompt automático (iOS Safari, etc.), abrimos la guía interactiva
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('onceydos_install_dismissed', 'true');
  };

  return (
    <>
      {/* WIDGET FLOTANTE */}
      {!isDismissed ? (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100vw-2rem)] sm:w-88 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-slate-700/80 relative overflow-hidden">
            {/* Brillo decorativo ámbar */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Botón cerrar */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Minimizar botón"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/25">
                11&bull;2
              </div>
              <div className="pr-6">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-white text-xs sm:text-sm leading-tight">
                    Instalar en PC o Celular
                  </h4>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                    App
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Acceso directo sin barra de navegador, inicio rápido y pantalla completa.
                </p>
              </div>
            </div>

            <div className="mt-3.5 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all transform active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar Aplicación</span>
              </button>

              <button
                onClick={() => setShowGuideModal(true)}
                className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 transition-colors"
                title="Ver pasos según tu dispositivo"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Guía</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* BOTÓN FLOTANTE MINIMIZADO */
        <button
          onClick={() => {
            setIsDismissed(false);
            sessionStorage.removeItem('onceydos_install_dismissed');
          }}
          className="fixed bottom-4 right-4 z-40 py-2 px-3 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white border border-amber-500/40 shadow-xl backdrop-blur-md flex items-center gap-2 text-xs font-bold transition-all transform hover:scale-105 active:scale-95 group"
          title="Instalar aplicación en PC o celular"
        >
          <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[10px]">
            11&bull;2
          </div>
          <span className="text-[11px] text-slate-200 group-hover:text-amber-400 transition-colors">
            Instalar App
          </span>
          <Download className="w-3.5 h-3.5 text-amber-400" />
        </button>
      )}

      {/* MODAL CON GUÍA PASO A PASO POR DISPOSITIVO */}
      {showGuideModal && (
        <div
          onClick={() => setShowGuideModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md shadow-amber-500/25">
                  11&bull;2
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                    Cómo Instalar Once y Dos
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Disponible para PC, Android y iPhone
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas por dispositivo */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
              <button
                onClick={() => setActiveTab('PC')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'PC'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-amber-600" />
                <span>PC (Windows/Mac)</span>
              </button>
              <button
                onClick={() => setActiveTab('ANDROID')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'ANDROID'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Android</span>
              </button>
              <button
                onClick={() => setActiveTab('IOS')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'IOS'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                <span>iPhone (iOS)</span>
              </button>
            </div>

            {/* Contenido según pestaña */}
            {activeTab === 'PC' && (
              <div className="space-y-3 pt-1 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p>
                    En <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>, mira el extremo derecho de la <strong>barra de direcciones (URL)</strong> arriba.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p>
                    Haz clic en el ícono de instalación <strong className="text-amber-700">⊕ Instalar</strong> o en el monitor con flecha hacia abajo.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p>
                    Selecciona <strong>&quot;Instalar&quot;</strong>. La app se abrirá en su propia ventana y creará un acceso directo en tu Escritorio de Windows.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'ANDROID' && (
              <div className="space-y-3 pt-1 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p>
                    Abre el navegador <strong>Chrome</strong> en tu celular y pulsa el botón de <strong>tres puntos (⋮)</strong> en la esquina superior derecha.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p>
                    En el menú, toca la opción <strong>&quot;Instalar aplicación&quot;</strong> o <strong>&quot;Agregar a la pantalla principal&quot;</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p>
                    Confirma con <strong>Instalar</strong>. El ícono de <strong>Once y Dos</strong> se agregará automáticamente al cajón de aplicaciones de tu teléfono.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'IOS' && (
              <div className="space-y-3 pt-1 text-xs text-slate-700">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-800 font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </div>
                  <p>
                    Abre la aplicación en <strong>Safari</strong> y presiona el botón de <strong>Compartir</strong> (cuadrado con flecha hacia arriba <Share2 className="w-3.5 h-3.5 inline text-sky-600" />) en la barra inferior.
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-800 font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </div>
                  <p>
                    Desliza hacia abajo en las opciones y selecciona <strong>&quot;Agregar al inicio&quot;</strong> (con el ícono <PlusSquare className="w-3.5 h-3.5 inline text-slate-700" />).
                  </p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-800 font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </div>
                  <p>
                    Toca <strong>&quot;Agregar&quot;</strong> arriba a la derecha. Listo, tendrás acceso directo en tu pantalla de inicio como una App nativa.
                  </p>
                </div>
              </div>
            )}

            {/* Botón de acción */}
            <div className="pt-2 flex items-center gap-2">
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Instalar Ahora con 1 Clic</span>
                </button>
              )}
              <button
                onClick={() => setShowGuideModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
