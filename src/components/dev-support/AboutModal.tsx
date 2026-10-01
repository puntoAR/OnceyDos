'use client';

import React from 'react';
import Image from 'next/image';
import { X, ExternalLink, ShieldCheck, Code2, Globe, Heart, MessageSquare } from 'lucide-react';
import { getLicense } from '@/lib/store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: () => void;
}

export function AboutModal({ isOpen, onClose, onOpenChat }: Props) {
  if (!isOpen) return null;
  const license = getLicense();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header con gradiente suave estilo puntoAR */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white">
                Ferretería Once y Dos
              </h3>
              <p className="text-xs text-amber-400 font-medium">
                Sistema Integral de Gestión de Stock, POS y Servicios
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          {/* Logo oficial puntoAR y detalle powered by */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
            <div className="relative w-48 h-14 mb-2">
              <Image
                src="/images/logo-puntoar.png"
                alt="punto AR Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Desarrollo de Software a Medida &bull; Soluciones Tecnológicas
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 font-medium block">Versión del Sistema</span>
              <span className="font-bold text-slate-800">v1.2.0 (Build 2026.10)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-400 font-medium block">Estado de Licencia</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                {license.type} ({license.daysRemaining} días)
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 bg-amber-50/50 p-4 rounded-xl border border-amber-100/60">
            <p className="font-semibold text-amber-900">Repositorio Oficial & Despliegue:</p>
            <a
              href="https://github.com/puntoAR/OnceyDos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-amber-700 hover:text-amber-800 font-mono underline break-all"
            >
              https://github.com/puntoAR/OnceyDos
              <ExternalLink className="w-3.5 h-3.5 ml-1 shrink-0" />
            </a>
            <p className="text-slate-500 pt-1">
              Desplegable y optimizado para <strong>Vercel</strong> con soporte multi-dispositivo y arquitectura 100% modular.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenChat();
              }}
              className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contactar con el Programador</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} puntoAR. Todos los derechos reservados.</span>
          <span className="flex items-center gap-1 text-slate-500">
            Hecho con <Heart className="w-3 h-3 text-red-500 fill-red-500" /> en Argentina
          </span>
        </div>
      </div>
    </div>
  );
}
