import { useNavigate, useRouteError } from 'react-router-dom';
import { useState } from 'react';
import { Home, Headphones, RotateCw, AlertTriangle, ChefHat, Utensils, UtensilsCrossed, ChevronDown } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Logo } from '@/components/ui/logo';

interface GlobalErrorBoundaryProps {
    error?: any;
}

export const GlobalErrorBoundary = ({ error: propError }: GlobalErrorBoundaryProps) => {
    const navigate = useNavigate();
    const routeError = useRouteError();
    const { theme } = useTheme();

    const [showDetails, setShowDetails] = useState(false);

    // Resolve which error we are rendering
    const error = propError || routeError;

    // Determine if we are in dark mode
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleGoHome = () => {
        window.location.href = '/';
    };

    // Get a clean error message and stack if available
    const errorMessage = error?.message || error?.statusText || 'An unexpected kitchen accident occurred.';
    const errorStack = error?.stack || JSON.stringify(error, null, 2);

    return (
        <div className={`min-h-screen transition-colors duration-300 font-sans text-primary-blue dark:text-gray-200 bg-background-white dark:bg-[#0A121E]`}>
            <style>{`
                .bg-pattern {
                    background-image: radial-gradient(#e5e7eb 0.5px, transparent 0.5px);
                    background-size: 24px 24px;
                }
                .dark .bg-pattern {
                    background-image: radial-gradient(#1e293b 0.5px, transparent 0.5px);
                }
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&display=swap');
                .font-serif { font-family: 'Playfair Display', serif; }
            `}</style>

            {/* Header */}
            <header className="fixed top-0 w-full z-50 px-6 py-6 lg:px-12 flex justify-between items-center bg-background-white/80 dark:bg-[#0A121E]/80 backdrop-blur-md">
                <div className="flex items-center space-x-2">
                    <Logo color={isDark ? '#FFFFFF' : 'var(--color-primary-blue)'} />
                </div>
            </header>

            {/* Main */}
            <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-28 pb-12 px-6 bg-pattern">
                {/* Floating Culinary Icons Background */}
                <div className="absolute top-1/4 left-10 opacity-10 dark:opacity-5 animate-bounce duration-[4000ms]">
                    <ChefHat className="w-24 h-24" />
                </div>
                <div className="absolute bottom-1/4 right-10 opacity-10 dark:opacity-5 animate-bounce duration-[5000ms]">
                    <Utensils className="w-24 h-24" />
                </div>
                <div className="absolute top-1/3 right-20 opacity-10 dark:opacity-5 transform rotate-12">
                    <UtensilsCrossed className="w-20 h-20" />
                </div>

                <div className="relative max-w-2xl w-full text-center z-10 space-y-8">
                    {/* SVG Illustration - Spilled Culinary Fail */}
                    <div className="flex justify-center">
                        <div className="w-48 h-48 md:w-56 md:h-56 rounded-[36px] border-8 border-gray-100 dark:border-gray-800 bg-background-white dark:bg-gray-900 shadow-2xl flex items-center justify-center relative transform hover:scale-105 transition-transform duration-500 overflow-hidden">
                            <svg className="w-32 h-32 text-secondary-orange animate-pulse" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Spilled Soup bowl */}
                                <path d="M50 110 C50 150 130 150 130 110 Z" fill="var(--color-primary-blue)" stroke="var(--color-dark-gray)" strokeWidth="4"/>
                                <path d="M40 105 L140 105" stroke="var(--color-dark-gray)" strokeWidth="4" strokeLinecap="round"/>
                                {/* Spillage fluid */}
                                <path d="M30 130 C45 135 60 120 75 138 C90 156 120 135 145 140 C160 142 170 130 180 135" stroke="var(--color-secondary-orange)" strokeWidth="6" strokeLinecap="round"/>
                                {/* Spilled drops */}
                                <circle cx="150" cy="155" r="4" fill="var(--color-secondary-orange)"/>
                                <circle cx="165" cy="148" r="3" fill="var(--color-secondary-orange)"/>
                                <circle cx="95" cy="162" r="5" fill="var(--color-secondary-orange)"/>
                                {/* Steam / Heat Waves */}
                                <path d="M70 85 Q75 70 70 55" stroke="var(--color-slate)" strokeWidth="3" strokeLinecap="round"/>
                                <path d="M90 88 Q95 73 90 58" stroke="var(--color-slate)" strokeWidth="3" strokeLinecap="round"/>
                                <path d="M110 85 Q115 70 110 55" stroke="var(--color-slate)" strokeWidth="3" strokeLinecap="round"/>
                            </svg>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-primary-blue dark:text-background-white leading-tight">
                            Something went wrong in <span className="text-secondary-orange">our kitchen!</span>
                        </h1>

                        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed font-medium">
                            Our digital chefs encountered an unexpected cooking error while preparing this page. Rest assured, we are cleaning up the spill!
                        </p>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                        <button
                            onClick={handleRefresh}
                            className="w-full sm:w-auto bg-primary-blue hover:bg-[#1a3a5f] text-background-white px-8 py-4 rounded-full font-bold text-base transition-all shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <RotateCw className="w-5 h-5" />
                            Refresh Kitchen
                        </button>

                        <button
                            onClick={handleGoHome}
                            className="w-full sm:w-auto bg-secondary-orange hover:bg-orange-500 text-background-white px-8 py-4 rounded-full font-bold text-base transition-all shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Home className="w-5 h-5" />
                            Back to Homepage
                        </button>
                    </div>

                    {/* Technical Details Accordion */}
                    <div className="max-w-xl mx-auto border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden transition-all duration-300">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/20 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                <span>Technical Spill Report</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
                        </button>

                        {showDetails && (
                            <div className="px-6 pb-6 pt-2 text-left border-t border-slate-200/50 dark:border-slate-800/50 animate-in fade-in duration-300 space-y-4">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase text-slate-400 mb-1">Error Message</h4>
                                    <p className="text-xs font-mono font-bold text-red-500 break-words dark:text-red-400 bg-red-50/50 dark:bg-red-950/10 p-3 rounded-xl border border-red-100/30 dark:border-red-900/20">
                                        {errorMessage}
                                    </p>
                                </div>
                                {errorStack && (
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-1">Stack Trace</h4>
                                        <pre className="text-[10px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto max-h-48 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl leading-relaxed">
                                            {errorStack}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Support Link */}
                    <div className="pt-2">
                        <button
                            onClick={() => navigate('/help')}
                            className="text-sm font-bold text-slate-400 hover:text-secondary-orange dark:text-slate-500 dark:hover:text-secondary-orange transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                        >
                            <Headphones className="w-4 h-4" />
                            Need help? Contact Culinary Support
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
