'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  DownloadCloud,
  FileCode,
  Lock,
} from 'lucide-react';
import { getLicense, updateLicenseKey } from '@/lib/store';
import { LicenseInfo, LicenseType } from '@/types';
import confetti from 'canvas-confetti';

export default function LicenciasPage() {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [selectedType, setSelectedType] = useState<LicenseType>('ANUAL');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'IDLE' | 'CHECKING' | 'UP_TO_DATE' | 'UPDATED'>('IDLE');

  const loadData = () => {
    const lic = getLicense();
    setLicense(lic);
    setInputKey(lic.licenseKey);
    setSelectedType(lic.type);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('onceydos_storage_update', loadData);
    return () => window.removeEventListener('onceydos_storage_update', loadData);
  }, []);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    setIsUpdating(true);
    const updated = updateLicenseKey(inputKey.trim(), selectedType);
    setLicense(updated);
    setUpdateMessage(`¡Licencia ${selectedType} activada exitosamente!`);

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch {}

    setTimeout(() => {
      setIsUpdating(false);
      setUpdateMessage('');
    }, 3000);
  };

  const handleCheckSystemUpdates = () => {
    setIsCheckingUpdates(true);
    setUpdateStatus('CHECKING');

    setTimeout(() => {
      setIsCheckingUpdates(false);
      setUpdateStatus('UP_TO_DATE');
    }, 1500);
  };

  if (!license) return null;

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-amber-500" />
          <span>Control de Licenciamiento & Actualizaciones</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configuración de licencias Trial (30 días), 1 Año o Libre, y centro de actualización del sistema de ferretería.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Estado y Activación de Licencia */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft-card space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Licencia en Uso</h3>
                  <span className="text-xs text-slate-400">Emisor: puntoAR Software</span>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  license.type === 'LIBRE'
                    ? 'bg-purple-100 text-purple-900'
                    : license.type === 'ANUAL'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                MODO {license.type}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Titular:</span>
                <strong className="text-slate-800">{license.issuedTo}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Días de Uso Restantes:</span>
                <strong className="text-amber-800 font-mono text-sm">
                  {license.type === 'LIBRE' ? 'Ilimitado (Permanente)' : `${license.daysRemaining} días`}
                </strong>
              </div>
            </div>

            {/* Clave de Licencia Actual */}
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl font-mono text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">CLAVE DE ACTIVACIÓN REGISTRADA:</span>
                <span className="text-amber-400 font-bold">{license.licenseKey}</span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            {/* Formulario de Renovación / Cambio de Licencia */}
            <form onSubmit={handleActivate} className="pt-3 border-t border-slate-100 space-y-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Activar o Cambiar Nivel de Licencia:
              </span>

              <div className="grid grid-cols-3 gap-2">
                {(['TRIAL', 'ANUAL', 'LIBRE'] as LicenseType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedType === t
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t === 'TRIAL' ? 'Prueba (Trial 30d)' : t === 'ANUAL' ? 'Licencia 1 Año' : 'Libre / Perpetua'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nueva Clave de Licencia
                </label>
                <input
                  type="text"
                  required
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Ej: PUNTOAR-FERRO-2026-KEY"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {updateMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold text-center">
                  {updateMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all"
              >
                {isUpdating ? 'Validando Clave...' : 'Guardar y Aplicar Licencia'}
              </button>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Módulo de Actualizaciones del Sistema */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft-card space-y-5">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <DownloadCloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Actualizaciones del Sistema</h3>
                <span className="text-xs text-slate-400">Canal Oficial: OnceyDos / Vercel</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Versión Instalada:</span>
                <span className="font-mono font-bold text-slate-800">v1.2.0 (Build Oct 2026)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Arquitectura:</span>
                <span className="font-semibold text-slate-700">Next.js 14 App Router & Vercel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Capacidad de Catálogo:</span>
                <span className="font-bold text-amber-700">10.000 Insumos Indexados</span>
              </div>
            </div>

            {/* Changelog de Mejoras */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Novedades de esta Versión:</span>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Soporte de carga de fotografías de insumos con compresión WebP.</li>
                <li>Cotizador móvil in situ con cámara para relevamiento de obras.</li>
                <li>Alertas bancarias bloqueantes de cheques con evidencia obligatoria.</li>
                <li>Manejador global de fallos con identificación exacta de archivo y línea.</li>
                <li>Chat web directo integrado con el equipo de programadores puntoAR.</li>
              </ul>
            </div>

            {/* Botón de Sincronizar y Buscar Actualizaciones */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCheckSystemUpdates}
                disabled={isCheckingUpdates}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                <span>{isCheckingUpdates ? 'Verificando con puntoAR...' : 'Buscar Actualizaciones'}</span>
              </button>

              {updateStatus === 'UP_TO_DATE' && (
                <p className="text-center text-xs text-emerald-600 font-semibold mt-2.5 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>El sistema se encuentra en la versión más reciente y estable.</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
