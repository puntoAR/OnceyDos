'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Send, Paperclip, Bot, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { getDevMessages, sendDevMessage, getCurrentUser } from '@/lib/store';
import { DevMessage } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function DevChatModal({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<DevMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getCurrentUser();

  const loadMessages = () => {
    setMessages(getDevMessages());
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const interval = setInterval(loadMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSending) return;

    setIsSending(true);
    sendDevMessage(input.trim());
    setInput('');
    setTimeout(() => {
      loadMessages();
      setIsSending(false);
    }, 200);
  };

  const handleAttachDiagnostics = () => {
    const diagnostic = `Diagnóstico del Sistema:
Usuario: ${user.name} (${user.role})
Navegador: ${navigator.userAgent}
Fecha: ${new Date().toLocaleString('es-AR')}
Memoria/Almacenamiento: OK`;

    sendDevMessage(`📋 [DIAGNÓSTICO ENVIADO]: Se adjunta estado técnico del puesto de trabajo.\n${diagnostic}`);
    setTimeout(loadMessages, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl h-[620px] bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Header estilo puntoAR */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Bot className="w-5 h-5" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-white">
                  Soporte Técnico puntoAR
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  En línea
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Canal de enlace directo entre el usuario y el programador
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner de soporte directo */}
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
          <span>¿Necesitas una función nueva o reportar un error? Escríbenos aquí.</span>
          <button
            onClick={handleAttachDiagnostics}
            className="px-2.5 py-1 rounded bg-amber-200/80 hover:bg-amber-300 font-semibold text-amber-900 transition-colors text-[11px]"
          >
            Adjuntar Diagnóstico
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
          {messages.map((msg) => {
            const isMe = msg.sender === 'USER';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                  {isMe ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-amber-500" />}
                  <span>{msg.senderName}</span>
                  <span>&bull;</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap ${
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

        {/* Input y envío */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje para el programador de puntoAR..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
