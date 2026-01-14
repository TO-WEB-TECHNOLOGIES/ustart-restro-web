import { useNavigate } from 'react-router-dom';
import { Home, Headphones, Utensils, UtensilsCrossed, ChefHat } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Logo } from '@/components/ui/logo';

export const NotFound = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();

    // Determine if we are effectively in dark mode
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

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
            <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden pt-20 px-6 bg-pattern">
                {/* Floating Icons Background */}
                <div className="absolute top-1/4 left-10 opacity-10 dark:opacity-5 animate-bounce duration-[4000ms]">
                    <ChefHat className="w-24 h-24" />
                </div>
                <div className="absolute bottom-1/4 right-10 opacity-10 dark:opacity-5 animate-bounce duration-[5000ms]">
                    <Utensils className="w-24 h-24" />
                </div>
                <div className="absolute top-1/3 right-20 opacity-10 dark:opacity-5 transform rotate-12">
                    <UtensilsCrossed className="w-20 h-20" />
                </div>

                <div className="relative max-w-2xl w-full text-center z-10">
                    <div className="relative inline-block mb-12">
                        <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-8 border-gray-100 dark:border-gray-800 bg-background-white dark:bg-gray-900 shadow-2xl flex items-center justify-center relative transform hover:rotate-6 transition-transform duration-500">
                            <div className="font-serif italic text-8xl md:text-9xl text-secondary-orange select-none flex space-x-2 items-center">
                                <span>4</span>
                                <div className="relative w-16 h-16 md:w-20 md:h-20 border-8 border-secondary-orange rounded-full mt-4 md:mt-6 opacity-80"></div>
                                <span>4</span>
                            </div>

                            {/* Decorative Utensils inside circle */}
                            <div className="absolute -left-16 md:-left-24 top-1/2 -translate-y-1/2 transform -rotate-12 opacity-80">
                                <Utensils className="w-12 h-12 md:w-20 md:h-20 text-gray-400" />
                            </div>
                            <div className="absolute -right-16 md:-right-24 top-1/2 -translate-y-1/2 transform rotate-12 opacity-80">
                                <UtensilsCrossed className="w-12 h-12 md:w-20 md:h-20 text-gray-400" />
                            </div>
                        </div>

                        {/* Floating elements near circle */}
                        <div className="absolute -top-12 -right-4 transform rotate-12 flex flex-col items-center">
                            {/* Skillet alternative */}
                            <ChefHat className="w-20 h-20 text-gray-300 dark:text-gray-700" />
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-extrabold text-primary-blue dark:text-background-white mb-6 leading-tight">
                        Oops! Looks like this dish is <span className="text-secondary-orange">off the menu.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-lg mx-auto">
                        We couldn't find the page you were looking for. Our chefs are double-checking the kitchen for any missing ingredients.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <button
                            onClick={() => navigate('/')}
                            className="bg-secondary-orange hover:bg-orange-500 text-background-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-orange-200 dark:hover:shadow-none transform hover:-translate-y-1 flex items-center"
                        >
                            <Home className="mr-2 w-5 h-5" />
                            Back to Homepage
                        </button>

                        <button
                            onClick={() => navigate('/help')}
                            className="text-primary-blue dark:text-gray-300 font-bold text-lg hover:text-secondary-orange dark:hover:text-secondary-orange transition-colors flex items-center"
                        >
                            <Headphones className="mr-2 w-5 h-5" />
                            Contact Support
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
