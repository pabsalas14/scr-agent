import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  // BUG FIX #4: Add page reload option for recovery
  handleReload = () => {
    window.location.reload();
  };

  // BUG FIX #4: Add navigation back option
  handleGoBack = () => {
    window.history.back();
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-12 h-12 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Algo salió mal</h2>
          <p className="text-sm text-[#6B7280] max-w-sm mb-6">
            {this.state.error?.message ?? 'Error inesperado en este módulo.'}
          </p>
          {/* BUG FIX #4: Multiple recovery options */}
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-[#F97316]/10 border border-[#F97316]/20 rounded-lg text-sm text-[#F97316] hover:border-[#F97316]/40 transition-all"
              title="Reintentar cargar este módulo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
            <button
              onClick={this.handleGoBack}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E1E20] border border-[#2D2D2D] rounded-lg text-sm text-[#A0A0A0] hover:border-[#404040] transition-all"
              title="Volver a la página anterior"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Atrás
            </button>
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E1E20] border border-[#2D2D2D] rounded-lg text-sm text-[#A0A0A0] hover:border-[#404040] transition-all"
              title="Recargar página completamente"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
