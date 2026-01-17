
import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    duration?: number;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 5000, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Match animation duration
    };

    const icons = {
        success: 'fa-circle-check text-green-400',
        error: 'fa-circle-xmark text-red-400',
        info: 'fa-circle-info text-blue-400',
        warning: 'fa-triangle-exclamation text-amber-400',
    };

    const borders = {
        success: 'border-green-500/30 shadow-green-500/10',
        error: 'border-red-500/30 shadow-red-500/10',
        info: 'border-blue-500/30 shadow-blue-500/10',
        warning: 'border-amber-500/30 shadow-amber-500/10',
    };

    return (
        <div
            className={`
        fixed top-6 right-6 z-[200] flex items-center gap-4 p-5 rounded-[24px]
        bg-slate-900/60 backdrop-blur-xl border ${borders[type]}
        shadow-2xl animate-in slide-in-from-right-8 duration-300
        ${isExiting ? 'animate-out fade-out slide-out-to-right-8 fill-mode-forwards' : ''}
        max-w-md w-full sm:w-auto
      `}
        >
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl`}>
                <i className={`fa-solid ${icons[type]}`}></i>
            </div>

            <div className="flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Sistema</p>
                <p className="text-sm font-bold text-white leading-tight">{message}</p>
            </div>

            <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all"
            >
                <i className="fa-solid fa-xmark"></i>
            </button>

            {/* Progress Bar Overlay */}
            <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-white/5 overflow-hidden rounded-full">
                <div
                    className={`h-full bg-current ${type === 'success' ? 'text-green-500' : type === 'error' ? 'text-red-500' : type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`}
                    style={{
                        animation: `toast-progress ${duration}ms linear forwards`,
                        opacity: 0.5
                    }}
                ></div>
            </div>

            <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
        </div>
    );
};

export default Toast;
