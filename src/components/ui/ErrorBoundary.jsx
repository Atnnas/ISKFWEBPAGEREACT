import React, { Component } from 'react';
import { motion } from 'framer-motion';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        // You can also log the error to an error reporting service here
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-iskf-dark flex items-center justify-center p-6 text-white text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl"
                    >
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h1 className="text-2xl font-bold mb-4">Algo salió mal</h1>
                        <p className="text-gray-400 mb-6">
                            Ha ocurrido un error inesperado en la aplicación. Hemos registrado el problema.
                        </p>

                        <button
                            onClick={this.handleReload}
                            className="w-full py-3 bg-iskf-red text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg uppercase tracking-wider text-sm"
                        >
                            Recargar Página
                        </button>

                        <details className="mt-8 text-left bg-black/30 p-4 rounded-lg border border-white/5 overflow-auto max-h-40">
                            <summary className="cursor-pointer text-xs text-gray-500 font-mono mb-2 hover:text-white transition">Ver detalles técnicos</summary>
                            <pre className="text-[10px] text-red-400 font-mono whitespace-pre-wrap">
                                {this.state.error && this.state.error.toString()}
                                <br />
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
