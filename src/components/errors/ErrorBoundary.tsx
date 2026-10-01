'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Copy, Send, RefreshCw, CheckCircle2 } from 'lucide-react';
import { logSystemError, sendDevMessage } from '@/lib/store';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  sourceFile: string;
  lineNumber: number;
  columnNumber: number;
  copied: boolean;
  sentToDev: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    sourceFile: 'Desconocido',
    lineNumber: 0,
    columnNumber: 0,
    copied: false,
    sentToDev: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Parsear el stack trace para extraer archivo y número de línea exacto
    let sourceFile = 'app/page.tsx';
    let lineNumber = 0;
    let columnNumber = 0;

    if (error.stack) {
      const match = error.stack.match(/(?:at\s+.*?\s+\()?((?:https?:\/\/|\/|[a-zA-Z]:\\)[\w\d_./\\-]+\.[jt]sx?):(\d+):(\d+)\)?/);
      if (match) {
        sourceFile = match[1].split('/').pop()?.split('\\').pop() || match[1];
        lineNumber = parseInt(match[2], 10);
        columnNumber = parseInt(match[3], 10);
      }
    }

    this.setState({
      errorInfo,
      sourceFile,
      lineNumber,
      columnNumber,
    });

    // Registrar en el log del sistema
    logSystemError({
      message: error.message || 'Error no controlado en la interfaz',
      sourceFile,
      lineNumber,
      columnNumber,
      componentStack: errorInfo.componentStack || undefined,
    });
  }

  private handleCopy = () => {
    const { error, sourceFile, lineNumber, columnNumber, errorInfo } = this.state;
    const report = `[REPORTE DE ERROR SISTEMA ONCE Y DOS - puntoAR]
Fecha: ${new Date().toLocaleString('es-AR')}
Mensaje: ${error?.message}
Archivo: ${sourceFile}
Línea: ${lineNumber} Columna: ${columnNumber}
Componente: ${errorInfo?.componentStack?.slice(0, 300) || 'N/A'}
`;
    navigator.clipboard.writeText(report);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 3000);
  };

  private handleSendToDev = () => {
    const { error, sourceFile, lineNumber, columnNumber } = this.state;
    sendDevMessage(
      `🚨 [REPORTE AUTOMÁTICO DE ERROR]: Ocurrió un fallo en "${sourceFile}" en la línea ${lineNumber}:${columnNumber}. Detalle: ${error?.message}`,
      { sourceFile, lineNumber, columnNumber, message: error?.message }
    );
    this.setState({ sentToDev: true });
    setTimeout(() => this.setState({ sentToDev: false }), 3500);
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const { error, sourceFile, lineNumber, columnNumber, copied, sentToDev } = this.state;

      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-slate-800/90 border border-amber-500/40 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Manejador Centralizado de Errores
                </h2>
                <p className="text-slate-400 text-sm">
                  Ferretería Once y Dos &bull; Monitoreo Activo de Estabilidad
                </p>
              </div>
            </div>

            <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-300 font-semibold mb-2">
                Fallo capturado: {error?.message || 'Error en tiempo de ejecución'}
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-black/40 p-3 rounded-lg border border-slate-700/50">
                <div>
                  <span className="text-slate-400">Archivo afectado:</span>{' '}
                  <span className="text-amber-400 font-bold">{sourceFile}</span>
                </div>
                <div>
                  <span className="text-slate-400">Ubicación exacta:</span>{' '}
                  <span className="text-amber-400 font-bold">Línea {lineNumber} : Col {columnNumber}</span>
                </div>
              </div>
            </div>

            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              El sistema ha aislado la falla para evitar daños en la base de datos o en los registros contables. Puedes copiar este reporte o enviarlo directamente al desarrollador para su solución inmediata.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={this.handleCopy}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm transition-all"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado al portapapeles' : 'Copiar Reporte'}</span>
              </button>

              <button
                onClick={this.handleSendToDev}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20"
              >
                {sentToDev ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                <span>{sentToDev ? 'Enviado a puntoAR' : 'Enviar a puntoAR'}</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all ml-auto"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reiniciar Módulo</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
