import React from 'react';
import { Star, Terminal, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// --- SVGs & Assets ---
// ... (FloatingFoodIcon and CookingPotIllustration remain unchanged)

const FloatingFoodIcon = ({ type, className, style }: { type: 'burger' | 'pizza' | 'donut' | 'taco'; className?: string; style?: React.CSSProperties }) => {
    const icons = {
        burger: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
                <path d="M12 4a5 5 0 0 0-5 5v2h10V9a5 5 0 0 0-5-5zM7 13v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2H7z" opacity="0.8" />
                <rect x="6" y="11" width="12" height="2" rx="1" fill="#FFB74D" />
            </svg>
        ),
        pizza: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
                <path d="M12 2L2 20h20L12 2zm0 4.5l5.5 10.5h-11L12 6.5z" />
                <circle cx="12" cy="10" r="1.5" fill="#EF5350" />
                <circle cx="10" cy="14" r="1.5" fill="#EF5350" />
                <circle cx="14" cy="14" r="1.5" fill="#EF5350" />
            </svg>
        ),
        donut: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
                <path d="M12 4a8 8 0 0 0-8 8 8 8 0 0 0 16 0 8 8 0 0 0-8-8zm0 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" opacity="0.7" />
                <path d="M12 7a5 5 0 0 0-5 5h10a5 5 0 0 0-5-5z" fill="#F48FB1" />
            </svg>
        ),
        taco: (
            <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
                <path d="M2 12C2 6.5 6.5 2 12 2C17.5 2 22 6.5 22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M4 12C4 16.4 7.6 20 12 20C16.4 20 20 16.4 20 12" fill="#FCD34D" opacity="0.5" />
                <circle cx="8" cy="12" r="1.5" fill="#EF4444" />
                <circle cx="12" cy="10" r="1.5" fill="#10B981" />
                <circle cx="16" cy="12" r="1.5" fill="#EF4444" />
            </svg>
        )
    };
    return icons[type] || null;
};

const CookingPotIllustration = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-2xl">
        <defs>
            <linearGradient id="potGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="50%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
            <filter id="steamBlur">
                <feGaussianBlur stdDeviation="2" />
            </filter>
        </defs>

        <ellipse cx="200" cy="260" rx="100" ry="15" fill="#000" opacity="0.1" />

        <g className="animate-bounce-subtle">
            <path d="M 100 150 Q 100 240 200 240 Q 300 240 300 150 L 300 120 L 100 120 Z" fill="url(#potGradient)" />
            <path d="M 100 120 L 300 120 L 300 130 Q 200 140 100 130 Z" fill="#C2410C" opacity="0.2" />
            <path d="M 90 140 Q 70 140 70 160 Q 70 180 95 170" fill="none" stroke="#F97316" strokeWidth="8" strokeLinecap="round" />
            <path d="M 310 140 Q 330 140 330 160 Q 330 180 305 170" fill="none" stroke="#F97316" strokeWidth="8" strokeLinecap="round" />
            <path d="M 95 120 Q 200 50 305 120" fill="#FB923C" stroke="#F97316" strokeWidth="2" />
            <rect x="190" y="70" width="20" height="15" rx="4" fill="#7C2D12" />
            <path d="M 130 150 Q 150 140 170 160" fill="none" stroke="white" strokeWidth="4" opacity="0.4" strokeLinecap="round" />
        </g>

        <g className="animate-steam-1" opacity="0.6">
            <path d="M 180 100 Q 190 80 180 60" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" filter="url(#steamBlur)" />
        </g>
        <g className="animate-steam-2" opacity="0.6">
            <path d="M 200 110 Q 210 90 200 70" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" filter="url(#steamBlur)" />
        </g>
        <g className="animate-steam-3" opacity="0.6">
            <path d="M 220 100 Q 230 80 220 60" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" filter="url(#steamBlur)" />
        </g>
    </svg>
);

interface ComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            {/* Modal Container */}
            <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-up border border-white/40 dark:border-slate-800">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
                >
                    <X size={20} />
                </button>

                {/* Background Decorative Blobs (Inside Modal) */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 dark:bg-orange-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-100 dark:bg-yellow-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                {/* --- Left Side: Visuals --- */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-slate-800 dark:to-slate-800/50 relative overflow-hidden flex items-center justify-center p-8 min-h-[240px]">

                    {/* Floating Icons */}
                    <FloatingFoodIcon type="pizza" className="absolute top-10 left-10 w-12 h-12 text-orange-400 opacity-40 animate-float" />
                    <FloatingFoodIcon type="burger" className="absolute bottom-20 right-8 w-14 h-14 text-yellow-500 opacity-40 animate-float-delayed" />
                    <FloatingFoodIcon type="taco" className="absolute top-1/2 right-4 w-10 h-10 text-green-500 opacity-30 animate-spin-slow" />

                    {/* Main Illustration */}
                    <div className="relative z-10 w-full max-w-[280px] transform hover:scale-105 transition-transform duration-500">
                        <CookingPotIllustration />
                        {/* Badge */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
                            <Terminal size={16} className="text-orange-500" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('dashboard.comingSoon.developersAtWork')}</span>
                        </div>
                    </div>
                </div>

                {/* --- Right Side: Content --- */}
                <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm text-center md:text-left">

                    <div className="mb-6">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-amber-100 dark:border-amber-900/30">
                            <Star size={10} className="fill-current" />
                            {t('dashboard.comingSoon.badge')}
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight mb-3">
                            {t('dashboard.comingSoon.title')} <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">{t('dashboard.comingSoon.titleSecondary')}</span>
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
                            {t('dashboard.comingSoon.description')}
                        </p>
                    </div>

                </div>
            </div>

            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 7s ease-in-out 1s infinite; }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        
        .animate-bounce-subtle { animation: float 3s ease-in-out infinite; }
        
        @keyframes steam {
          0% { transform: translateY(0) scale(1); opacity: 0.6; }
          100% { transform: translateY(-20px) scale(1.5); opacity: 0; }
        }
        .animate-steam-1 { animation: steam 2s infinite linear; }
        .animate-steam-2 { animation: steam 2s infinite linear 0.7s; }
        .animate-steam-3 { animation: steam 2s infinite linear 1.4s; }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        
        @keyframes scaleUp {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-up { animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
        </div>
    );
}
