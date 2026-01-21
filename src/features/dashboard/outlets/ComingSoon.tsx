import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const ComingSoon = () => {
    const { t } = useTranslation();

    // --- Load Font Awesome ---
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }, []);

    return (
        <div
            className="min-h-full w-full flex items-center justify-center font-sans bg-orange-50/30 dark:bg-slate-950 selection:bg-secondary-orange selection:text-white overflow-hidden relative transition-colors duration-300"
        >

            {/* --- Dynamic Background --- */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Floating Icons Pattern */}
                <div className="absolute inset-0 opacity-20 dark:opacity-10">
                    <i className="fa-solid fa-pizza-slice absolute top-[10%] left-[5%] text-4xl text-secondary-orange rotate-[-15deg] animate-float-slow"></i>
                    <i className="fa-solid fa-burger absolute top-[60%] right-[5%] text-5xl text-secondary-orange rotate-[15deg] animate-float-delayed"></i>
                    <i className="fa-solid fa-utensils absolute bottom-[10%] left-[15%] text-4xl text-secondary-orange rotate-[-10deg] animate-float-slower"></i>
                    <i className="fa-solid fa-pepper-hot absolute top-[20%] right-[15%] text-3xl text-secondary-orange rotate-[45deg] animate-float-slow"></i>
                    <i className="fa-solid fa-drumstick-bite absolute bottom-[25%] right-[20%] text-4xl text-secondary-orange rotate-[-20deg] animate-float-delayed"></i>
                    <i className="fa-solid fa-cheese absolute top-[40%] left-[10%] text-3xl text-secondary-orange rotate-[10deg] animate-float-slower"></i>
                </div>

                {/* Glowing blobs for added depth */}
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-orange-200/30 dark:bg-orange-900/10 rounded-full blur-[100px] animate-blob"></div>
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
            </div>

            {/* --- Main Content --- */}
            <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20">

                    {/* Visual Section */}
                    <div className="flex-shrink-0 relative">
                        {/* Main Circle */}
                        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-2xl border-4 border-white dark:border-slate-800 relative z-10">
                            <i className="fa-solid fa-kitchen-set text-7xl md:text-9xl text-primary-blue dark:text-orange-100"></i>
                        </div>

                        {/* Orbiting Elements */}
                        <div className="absolute top-0 left-0 w-full h-full animate-spin-slow pointer-events-none z-20">
                            <div className="absolute -top-4 left-1/2 -track-x-1/2 bg-secondary-orange w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white dark:border-slate-900">
                                <i className="fa-solid fa-code text-xl"></i>
                            </div>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-full animate-spin-reverse-slow pointer-events-none z-20">
                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary-blue dark:bg-slate-800 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white dark:border-slate-900">
                                <i className="fa-solid fa-hammer text-base"></i>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 text-center md:text-left max-w-xl">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-500/10 text-secondary-orange text-xs font-bold uppercase tracking-widest mb-6">
                            <span className="w-2.5 h-2.5 rounded-full bg-secondary-orange animate-pulse"></span>
                            {t('dashboard.comingSoon.badge')}
                        </div>

                        <h1 className="text-5xl md:text-6xl font-black text-primary-blue dark:text-white mb-6 tracking-tight leading-tight">
                            {t('dashboard.comingSoon.title')} <br className="hidden md:block" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary-orange to-orange-500">
                                {t('dashboard.comingSoon.titleSecondary')}
                            </span>
                        </h1>

                        <p className="text-slate-500 dark:text-slate-400 text-xl mb-12 leading-relaxed">
                            {t('dashboard.comingSoon.description')}
                        </p>

                        {/* Progress Indicator */}
                        <div className="space-y-4">
                            <div className="flex justify-between text-[11px] font-black text-primary-blue dark:text-slate-400 uppercase tracking-[0.25em]">
                                <span>{t('dashboard.comingSoon.phase')}</span>
                                <span className="text-secondary-orange">{t('dashboard.comingSoon.status')}</span>
                            </div>
                            <div className="h-4 w-full bg-slate-200/50 dark:bg-slate-800 rounded-full overflow-hidden p-1 border border-slate-200 dark:border-slate-700">
                                <div className="h-full bg-gradient-to-r from-primary-blue via-secondary-orange to-orange-400 w-[80%] rounded-full relative overflow-hidden">
                                    <div className="absolute inset-0 bg-white/25 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        /* Animations */
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
            50% { transform: translateY(-30px) rotate(var(--r, 0deg)); }
        }

        @keyframes shimmer {
            0% { transform: translateX(-100%) skewX(-15deg); }
            100% { transform: translateX(200%) skewX(-15deg); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animate-spin-slow {
            animation: spin 20s linear infinite;
        }
        
        .animate-spin-reverse-slow {
            animation: spin 25s linear infinite reverse;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .animate-float-slow { --r: -15deg; animation: float 7s ease-in-out infinite; }
        .animate-float-delayed { --r: 15deg; animation: float 8s ease-in-out infinite 1s; }
        .animate-float-slower { --r: 10deg; animation: float 9s ease-in-out infinite 2s; }
      `}</style>
        </div>
    );
};