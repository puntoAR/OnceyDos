'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { setCurrentUser, getUsers, changeUserPassword, getCurrentUser, logoutUser } from '@/lib/store';
import { User } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('jroman');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [activeSessionUser, setActiveSessionUser] = useState<User | null>(null);

  // Estado para modal de cambio obligatorio de contraseña en primer ingreso
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
  const [firstLoginUser, setFirstLoginUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstLoginError, setFirstLoginError] = useState('');

  useEffect(() => {
    setAvailableUsers(getUsers());
    setActiveSessionUser(getCurrentUser());
  }, []);

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

    if (found.isActive === false) {
      setError('Esta cuenta de usuario se encuentra inactiva. Contacte a la administración.');
      setIsLoading(false);
      return;
    }

    // Verificar contraseña (si está definida, o por defecto 123456)
    const expectedPassword = found.password || '123456';
    if (password !== expectedPassword) {
      setError('Contraseña incorrecta. Por favor verifique sus datos.');
      setIsLoading(false);
      return;
    }

    // Si tiene configurado que debe cambiar la contraseña en su primer ingreso
    if (found.mustChangePasswordOnFirstLogin) {
      setIsLoading(false);
      setFirstLoginUser(found);
      setNewPassword('');
      setConfirmPassword('');
      setFirstLoginError('');
      setShowFirstLoginModal(true);
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

  const handleFirstLoginPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFirstLoginError('');

    if (newPassword.trim().length < 4) {
      setFirstLoginError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPassword.trim() === '1234') {
      setFirstLoginError('Por seguridad, la nueva contraseña no puede ser la clave provisoria temporal (1234).');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFirstLoginError('Las contraseñas no coinciden. Verifíquelas.');
      return;
    }

    if (!firstLoginUser) return;

    changeUserPassword(firstLoginUser.id, newPassword.trim());
    const updatedUser: User = {
      ...firstLoginUser,
      password: newPassword.trim(),
      mustChangePasswordOnFirstLogin: false,
    };
    setCurrentUser(updatedUser);
    setShowFirstLoginModal(false);

    // Redirigir
    if (updatedUser.role === 'TECNICO') {
      router.push('/stock');
    } else if (updatedUser.role === 'CAJERO') {
      router.push('/pos');
    } else {
      router.push('/');
    }
  };

  const handleQuickFill = (u: User) => {
    setUsername(u.username);
    setPassword(u.password || '123456');
    setError('');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-100">
      {/* Fondo con fotografía real de la fachada de Ferretería Once y Dos (Ituzaingó y Bv. López de Armenia) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/bg-login.png"
          alt="Fachada Ferretería 11 y 2 Electricidad"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay con degradado para garantizar contraste y visibilidad del local */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-slate-900/50 to-slate-950/70 backdrop-blur-[0.5px]" />
      </div>

      {/* Pilares decorativos laterales */}
      <div className="hidden lg:flex flex-col space-y-2 absolute top-1/3 left-16 z-10 text-xs font-bold tracking-widest text-white/90 drop-shadow-md uppercase">
        <span>PRODUCTOS</span>
        <span>INVENTARIO</span>
        <span>SERVICIOS</span>
        <div className="w-8 h-0.5 bg-amber-400 mt-2 shadow-xs"></div>
      </div>

      <div className="hidden lg:flex flex-col space-y-2 absolute top-1/3 right-16 z-10 text-xs font-bold tracking-widest text-white/90 drop-shadow-md uppercase text-right">
        <span>ORGANIZACIÓN</span>
        <span>EFICIENCIA</span>
        <span>RESULTADOS</span>
        <div className="w-8 h-0.5 bg-amber-400 mt-2 self-end shadow-xs"></div>
      </div>

      {/* Slogan en cursiva esquina inferior izquierda */}
      <div className="hidden md:block absolute bottom-12 left-16 z-10">
        <p className="font-serif italic text-2xl lg:text-3xl text-white/95 drop-shadow-lg tracking-wide">
          El valor de gestionar <br />
          <span className="font-sans font-bold text-amber-400">con precisión</span>
        </p>
      </div>

      {/* Tarjeta Central de Ingreso */}
      <div className="relative z-20 w-full max-w-[440px] mx-4 bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/80 animate-in fade-in zoom-in-95 duration-300">
        {/* Cabecera del formulario con Logo Oficial de Ferretería 11 y 2 */}
        <div className="text-center mb-6">
          <div className="relative w-40 h-24 mx-auto mb-2 drop-shadow-sm">
            <Image
              src="/images/logo-11y2.png"
              alt="Logo Ferretería 11 y 2 Electricidad"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Ferretería <span className="text-red-600">11</span> y <span className="text-amber-500">2</span>
          </h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
            ELECTRICIDAD &bull; STOCK &bull; SERVICIOS
          </p>
          <div className="w-12 h-1 bg-amber-500 mx-auto rounded-full mt-2.5"></div>
          <h2 className="text-xs font-semibold text-slate-600 mt-3">
            Ingreso al sistema de gestión
          </h2>
        </div>

        {/* Notificación de sesión previa si ya hay alguien conectado */}
        {activeSessionUser && (
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="truncate">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Sesión activa previa</span>
              <span className="font-bold text-slate-800">{activeSessionUser.name}</span>
              <span className="text-[10px] text-amber-800 ml-1 font-bold">({activeSessionUser.role})</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (activeSessionUser.role === 'TECNICO') router.push('/stock');
                  else if (activeSessionUser.role === 'CAJERO') router.push('/pos');
                  else router.push('/');
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] shadow-xs transition-colors"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={() => {
                  logoutUser();
                  setActiveSessionUser(null);
                }}
                className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[11px] transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
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
            Seleccionar usuario del sistema:
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 max-h-28 overflow-y-auto p-1">
            {availableUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickFill(u)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                  username.toLowerCase() === u.username.toLowerCase()
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {u.name.split(' ')[0]} (@{u.username})
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Gestión ágil hoy, mejores resultados mañana.
        </p>
      </div>

      {/* Powered by puntoAR en esquina inferior derecha */}
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

      {/* Modal: Cambio Obligatorio de Contraseña en el Primer Ingreso */}
      {showFirstLoginModal && firstLoginUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Primer Inicio de Sesión
                </h3>
                <p className="text-xs text-slate-400">
                  Defina su contraseña personal definitiva
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                Hola <strong>{firstLoginUser.name}</strong> (@{firstLoginUser.username}). Tu usuario posee nivel de <strong>{firstLoginUser.role === 'ADMIN_SISTEMA' ? 'Administrador del Sistema' : firstLoginUser.role}</strong>. Como ingresaste con la contraseña temporal inicial (<code className="font-mono font-bold text-amber-800 bg-amber-100 px-1 py-0.5 rounded">1234</code>), el sistema requiere que definas tu contraseña personal definitiva antes de continuar.
              </div>

              {firstLoginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                  {firstLoginError}
                </div>
              )}

              <form onSubmit={handleFirstLoginPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nueva Contraseña * (Mínimo 4 caracteres)
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ingrese su nueva contraseña"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirmar Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita su nueva contraseña"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFirstLoginModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar y Acceder</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
