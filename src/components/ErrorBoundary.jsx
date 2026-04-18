import * as React from 'react';
import axiosInstance from "../services/axiosConfig";
import { AlertTriangle, RotateCw, Home, ChevronDown, ChevronRight } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report to backend
    this.reportError(error, errorInfo);
  }

  reportError = async (error, errorInfo) => {
    try {
      await axiosInstance.post('/error-logs/log', {
        message: error.message || 'Fulfillment Hub Runtime Error',
        stack: error.stack,
        component: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        metadata: {
          project: 'fulfillment-hub',
          timestamp: new Date().toISOString(),
        }
      });
    } catch (reportError) {
      console.error('Error reporting logic failed:', reportError);
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  }

  handleResetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl shadow-slate-200/50">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-100 animate-pulse">
                    <AlertTriangle className="w-10 h-10 text-rose-500" />
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">System Interruption</h2>
                <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed tracking-tight">
                    The fulfillment engine encountered an unexpected runtime exception. This incident has been logged for administrative review.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button
                        onClick={this.handleResetError}
                        className="flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 group"
                    >
                        <RotateCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> RETRY HUB
                    </button>
                    <button
                        onClick={this.handleGoHome}
                        className="flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black tracking-widest hover:bg-slate-50 transition-all group"
                    >
                        <Home size={14} className="group-hover:-translate-y-0.5 transition-transform" /> TERMINAL
                    </button>
                </div>

                <div className="text-left border-t border-slate-100 pt-6">
                    <button 
                        onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 tracking-widest transition-colors mb-4"
                    >
                        {this.state.showDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />} 
                        TECHNICAL DIAGNOSTICS
                    </button>
                    
                    {this.state.showDetails && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-hidden">
                                <p className="text-[10px] font-black text-rose-600 mb-2 truncate">
                                    {this.state.error?.toString()}
                                </p>
                                <pre className="text-[9px] text-slate-400 font-bold overflow-auto max-h-40 whitespace-pre-wrap leading-relaxed custom-scrollbar">
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <p className="mt-8 text-[10px] font-bold text-slate-400 tracking-widest uppercase opacity-50">
                ikoSoko Operational Grid • Fulfillment Layer
            </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
