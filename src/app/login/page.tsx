'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { setCurrentUser, getUsers } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin_sistema');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const users = getUsers();
    const found = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());

    if (!found) {
      setError('Usuario no registrado en el sistema.');
      setIsLoading(false);
      return;
    }

    // Login exitoso
    setTimeout(() => {
      setCurrentUser(found);
      // Redirigir según el rol
      if (found.role === 'TECNICO') {
        router.push('/stock');
      } else if (found.role === 'CAJERO') {
        router.push('/pos');
      } else {
        router.push('/');
      }
    }, 400);
  };

  const handleQuickFill = (userType: string) => {
    setUsername(userType);
    setPassword('123456');
    setError('');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-100">
      {/* Fondo con imagen de referencia estilizada */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/bg-login.png"
          alt="Fondo Sistema"
          fill
          className="object-cover opacity-85 filter blur-[0.5px]"
          priority
        />
        {/* Overlay degradado suave para asegurar contraste */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/70 via-white/50 to-white/75 backdrop-blur-[2px]" />
      </div>

      {/* Pilares decorativos laterales (como en la referencia) */}
      <div className="hidden lg:flex flex-col space-y-2 absolute top-1/3 left-16 z-10 text-xs font-semibold tracking-widest text-slate-500 uppercase">
        <span>PRODUCTOS</span>
        <span>INVENTARIO</span>
        <span>SERVICIOS</span>
        <div className="w-8 h-0.5 bg-amber-500 mt-2"></div>
      </div>

      <div className="hidden lg:flex flex-col space-y-2 absolute top-1/3 right-16 z-10 text-xs font-semibold tracking-widest text-slate-500 uppercase text-right">
        <span>ORGANIZACIÓN</span>
        <span>EFICIENCIA</span>
        <span>RESULTADOS</span>
        <div className="w-8 h-0.5 bg-amber-500 mt-2 self-end"></div>
      </div>

      {/* Slogan en cursiva esquina inferior izquierda (como en la referencia) */}
      <div className="hidden md:block absolute bottom-12 left-16 z-10">
        <p className="font-serif italic text-2xl lg:text-3xl text-slate-600/80 tracking-wide">
          El valor de gestionar <br />
          <span className="font-sans font-semibold text-slate-700">con precisión</span>
        </p>
      </div>

      {/* Tarjeta Central de Ingreso */}
      <div className="relative z-20 w-full max-w-[440px] mx-4 bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/80 animate-in fade-in zoom-in-95 duration-300">
        {/* Cabecera del formulario */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/25 mb-3">
            11&bull;2
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Once<span className="text-amber-500">y</span>Dos
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            FERRETERÍA &bull; STOCK &bull; SERVICIOS
          </p>
          <div className="w-12 h-1 bg-amber-500 mx-auto rounded-full mt-3"></div>
          <h2 className="text-sm font-semibold text-slate-700 mt-4">
            Ingreso al sistema
          </h2>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Usuario</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese su usuario"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500 text-sm transition-all text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Contraseña</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500 text-sm transition-all text-slate-800 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98] disabled:opacity-50 mt-6"
          >
            <span>{isLoading ? 'Accediendo...' : 'Ingresar'}</span>
            {!isLoading && <ArrowRight className="w-4 h-4 font-bold" />}
          </button>
        </form>

        {/* Acceso rápido a roles de prueba */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium mb-2.5">
            Seleccionar rol de demostración:
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {[
              { id: 'admin_sistema', label: 'Admin Sistema' },
              { id: 'admin', label: 'Administrador' },
              { id: 'tecnico', label: 'Técnico Obra' },
              { id: 'cajero', label: 'Mostrador / Caja' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleQuickFill(r.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  username === r.id
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Gestión ágil hoy, mejores resultados mañana.
        </p>
      </div>

      {/* Powered by puntoAR en esquina inferior derecha (exacto como en la referencia) */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center space-x-2">
        <span className="text-xs text-slate-500 font-medium italic">powered by</span>
        <div className="relative w-36 h-9">
          <Image
            src="/images/logo-puntoar.png"
            alt="punto AR Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
