'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  Send,
  Bot,
  User as UserIcon,
  Users,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  Shield,
  Clock,
  Radio,
  Search,
} from 'lucide-react';
import {
  getDevMessages,
  sendDevMessage,
  getUserChatMessages,
  sendUserChatMessage,
  getCurrentUser,
  getUsers,
} from '@/lib/store';
import { DevMessage, UserChatMessage, User, UserRole } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function DevChatModal({ isOpen, onClose }: Props) {
  // Pestaña principal: 'TEAM' (Consultas entre usuarios) o 'DEV' (Soporte programador puntoAR)
  const [activeTab, setActiveTab] = useState<'TEAM' | 'DEV'>('TEAM');

  // Destinatario activo en chat de equipo: 'GENERAL' o ID del usuario específico
  const [teamRecipientId, setTeamRecipientId] = useState<string>('GENERAL');
  const [userSearch, setUserSearch] = useState('');

  // Mensajes y estados
  const [devMessages, setDevMessages] = useState<DevMessage[]>([]);
  const [teamMessages, setTeamMessages] = useState<UserChatMessage[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = getCurrentUser();

  const loadData = () => {
    setDevMessages(getDevMessages());
    setTeamMessages(getUserChatMessages());
    setAllUsers(getUsers());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      const interval = setInterval(loadData, 2000);
      window.addEventListener('onceydos_storage_update', loadData);
      return () => {
        clearInterval(interval);
        window.removeEventListener('onceydos_storage_update', loadData);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [devMessages, teamMessages, activeTab, teamRecipientId]);

  if (!isOpen) return null;

  // Colegas para mensajes directos (excluyendo al usuario logueado)
  const peerUsers = allUsers.filter((u) => u.id !== currentUser.id);
  const filteredPeers = peerUsers.filter(
    (u) =>
      !userSearch ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const activePeer = peerUsers.find((u) => u.id === teamRecipientId);

  // Mensajes a mostrar en Chat de Equipo según canal o usuario 1 a 1
  const displayedTeamMessages = teamMessages.filter((m) => {
    if (teamRecipientId === 'GENERAL') {
      return m.recipientId === 'GENERAL';
    }
    // Conversación privada 1 a 1 entre currentUser y activePeer
    return (
      (m.senderId === currentUser.id && m.recipientId === teamRecipientId) ||
      (m.senderId === teamRecipientId && m.recipientId === currentUser.id)
    );
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSending) return;

    setIsSending(true);

    if (activeTab === 'DEV') {
      sendDevMessage(input.trim());
    } else {
      sendUserChatMessage(teamRecipientId, input.trim());
    }

    setInput('');
    setTimeout(() => {
      loadData();
      setIsSending(false);
    }, 150);
  };

  const handleAttachDiagnostics = () => {
    const diagnostic = `Diagnóstico del Sistema:
Usuario: ${currentUser.name} (${currentUser.role})
Navegador: ${navigator.userAgent}
Fecha: ${new Date().toLocaleString('es-AR')}
Memoria/Almacenamiento: OK`;

    sendDevMessage(`📋 [DIAGNÓSTICO ENVIADO]: Se adjunta estado técnico del puesto de trabajo.\n${diagnostic}`);
    setTimeout(loadData, 300);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN_SISTEMA':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ADMIN':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'TECNICO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CAJERO':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[92vh] sm:h-[640px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Cabecera Principal del WebChat */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base tracking-tight text-white truncate">
                  WebChat Ferretería 11 y 2
                </h3>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  En línea
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Consultas operativas internas entre usuarios y soporte técnico
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Pestaña Principal: Consultas entre Usuarios vs Soporte puntoAR */}
        <div className="bg-slate-800/90 text-white px-3 sm:px-4 flex items-center justify-between border-b border-slate-700/80 shrink-0 text-xs font-bold">
          <div className="flex space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('TEAM')}
              className={`py-2.5 px-3 sm:px-4 border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'TEAM'
                  ? 'border-amber-400 text-amber-300 bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Consultas entre Usuarios</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {teamMessages.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('DEV')}
              className={`py-2.5 px-3 sm:px-4 border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'DEV'
                  ? 'border-amber-400 text-amber-300 bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span>Soporte puntoAR</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-700 text-slate-300">
                {devMessages.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Puesto:</span>
            <span className="font-bold text-amber-400">{currentUser.name.split(' ')[0]}</span>
          </div>
        </div>

        {/* CUERPO DEL CHAT SEGÚN PESTAÑA */}
        {activeTab === 'TEAM' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* BARRA LATERAL / SELECTOR DE INTERLOCUTOR (Canal General + Usuarios) */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200/80 bg-slate-50 flex flex-col shrink-0">
              {/* Buscador de usuario para escritorio */}
              <div className="p-2 sm:p-2.5 border-b border-slate-200/70 hidden md:block">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar compañero..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-hidden focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Selector tipo pills en Móvil (scroll horizontal) */}
              <div className="md:hidden flex overflow-x-auto no-scrollbar gap-1.5 p-2 bg-slate-100 border-b border-slate-200">
                <button
                  onClick={() => setTeamRecipientId('GENERAL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                    teamRecipientId === 'GENERAL'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>📢 Canal General</span>
                </button>

                {peerUsers.map((u) => {
                  const isSelected = teamRecipientId === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setTeamRecipientId(u.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-800 text-[9px] font-bold flex items-center justify-center">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Lista Vertical en Escritorio */}
              <div className="hidden md:flex flex-1 overflow-y-auto p-2 space-y-1">
                {/* Opción 1: Canal General */}
                <button
                  onClick={() => setTeamRecipientId('GENERAL')}
                  className={`w-full text-left p-2.5 rounded-2xl flex items-center justify-between transition-all ${
                    teamRecipientId === 'GENERAL'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        teamRecipientId === 'GENERAL'
                          ? 'bg-slate-950 text-amber-400'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate leading-tight">
                        📢 Canal General
                      </span>
                      <span
                        className={`text-[10px] block truncate ${
                          teamRecipientId === 'GENERAL' ? 'text-slate-900/80' : 'text-slate-400'
                        }`}
                      >
                        Todo el equipo (abierto)
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      teamRecipientId === 'GENERAL'
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {teamMessages.filter((m) => m.recipientId === 'GENERAL').length}
                  </span>
                </button>

                <div className="pt-2 px-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Mensajes Directos (1 a 1)
                </div>

                {filteredPeers.map((u) => {
                  const isSelected = teamRecipientId === u.id;
                  const directCount = teamMessages.filter(
                    (m) =>
                      (m.senderId === currentUser.id && m.recipientId === u.id) ||
                      (m.senderId === u.id && m.recipientId === currentUser.id)
                  ).length;

                  return (
                    <button
                      key={u.id}
                      onClick={() => setTeamRecipientId(u.id)}
                      className={`w-full text-left p-2.5 rounded-2xl flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isSelected
                                ? 'bg-slate-950 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate leading-tight">
                            {u.name}
                          </span>
                          <span
                            className={`text-[10px] uppercase tracking-wider block font-semibold ${
                              isSelected ? 'text-slate-900/80' : 'text-slate-400'
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                      </div>

                      {directCount > 0 && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-slate-950/20 text-slate-950'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {directCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ÁREA DE CONVERSACIÓN DE EQUIPO */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
              {/* Header de la conversación activa */}
              <div className="p-3 sm:p-3.5 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {teamRecipientId === 'GENERAL' ? (
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="relative w-8 h-8 rounded-xl bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {activePeer?.name.charAt(0) || 'U'}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate flex items-center gap-2">
                      <span>
                        {teamRecipientId === 'GENERAL'
                          ? 'Canal General de Ferretería'
                          : activePeer?.name || 'Usuario'}
                      </span>
                      {activePeer && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider border ${getRoleBadgeColor(
                            activePeer.role
                          )}`}
                        >
                          {activePeer.role}
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {teamRecipientId === 'GENERAL'
                        ? 'Mensajes y consultas visibles para todos los empleados de la ferretería'
                        : `Consulta privada y directa con @${activePeer?.username || ''}`}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Canal Activo</span>
                </div>
              </div>

              {/* Mensajes del Hilo */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
                {displayedTeamMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <MessageSquare className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
                    <p className="text-xs font-semibold text-slate-600">
                      No hay mensajes en esta conversación aún.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      Escribe abajo para enviar una consulta instantánea a{' '}
                      {teamRecipientId === 'GENERAL' ? 'todo el equipo' : activePeer?.name}.
                    </p>
                  </div>
                ) : (
                  displayedTeamMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-700">{msg.senderName}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider border ${getRoleBadgeColor(
                              msg.senderRole
                            )}`}
                          >
                            {msg.senderRole}
                          </span>
                          <span>&bull;</span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs whitespace-pre-wrap ${
                            isMe
                              ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                              : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Barra de atajos para consultas rápidas */}
              <div className="px-3 py-1.5 bg-slate-100/70 border-t border-slate-200/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-bold text-slate-400 shrink-0">Consultas rápidas:</span>
                {[
                  '¿Hay stock en depósito?',
                  '¿Cliente ya pagó anticipo?',
                  '¿Quién cubre mostrador?',
                  'Favor revisar presupuesto',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setInput(chip)}
                    className="text-[10px] font-semibold bg-white hover:bg-amber-50 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200 whitespace-nowrap transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Formulario de envío de mensaje de equipo */}
              <form
                onSubmit={handleSend}
                className="p-2.5 sm:p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    teamRecipientId === 'GENERAL'
                      ? 'Escribe tu consulta para todo el equipo...'
                      : `Escribe una consulta privada para ${activePeer?.name.split(' ')[0]}...`
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-xs sm:text-sm bg-slate-50 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="p-2.5 sm:py-2.5 sm:px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 text-xs shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* PESTAÑA: SOPORTE CON EL PROGRAMADOR puntoAR */
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-50/60">
            {/* Banner de soporte puntoAR */}
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-slate-50 border-b border-amber-200/80 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
              <div className="flex items-center gap-2 text-amber-950 font-medium">
                <Bot className="w-4 h-4 text-amber-600 shrink-0" />
                <span>¿Deseas reportar un fallo técnico o solicitar una nueva función a medida?</span>
              </div>
              <button
                onClick={handleAttachDiagnostics}
                className="self-end sm:self-auto px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 transition-colors text-[11px] shadow-2xs"
              >
                Adjuntar Diagnóstico Técnico
              </button>
            </div>

            {/* Mensajes con el programador */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {devMessages.map((msg) => {
                const isMe = msg.sender === 'USER';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                      {isMe ? <UserIcon className="w-3 h-3" /> : <Bot className="w-3 h-3 text-amber-500" />}
                      <span className="font-semibold text-slate-700">{msg.senderName}</span>
                      <span>&bull;</span>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs whitespace-pre-wrap ${
                        isMe
                          ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input para soporte puntoAR */}
            <form
              onSubmit={handleSend}
              className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje para el programador de puntoAR..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 text-xs sm:text-sm bg-slate-50 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="p-2.5 sm:py-2.5 sm:px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 text-xs shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
