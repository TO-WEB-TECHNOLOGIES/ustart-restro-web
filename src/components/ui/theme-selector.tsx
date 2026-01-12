import { Monitor, Moon, Sun, Check } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function ThemeSelector() {
    const { setTheme, theme } = useTheme();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
        setTheme(newTheme);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 rounded-full"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <button
                        onClick={() => handleThemeChange("light")}
                        className={`w-full px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200 ${theme === 'light' ? 'bg-orange-50/50 dark:bg-slate-700/50 text-secondary-orange' : 'text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            <span>{t('common.theme.light')}</span>
                        </div>
                        {theme === 'light' && <Check className="h-3 w-3 text-secondary-orange" />}
                    </button>
                    <button
                        onClick={() => handleThemeChange("dark")}
                        className={`w-full px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200 ${theme === 'dark' ? 'bg-orange-50/50 dark:bg-slate-700/50 text-secondary-orange' : 'text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            <span>{t('common.theme.dark')}</span>
                        </div>
                        {theme === 'dark' && <Check className="h-3 w-3 text-secondary-orange" />}
                    </button>
                    <button
                        onClick={() => handleThemeChange("system")}
                        className={`w-full px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200 ${theme === 'system' ? 'bg-orange-50/50 dark:bg-slate-700/50 text-secondary-orange' : 'text-slate-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            <span>{t('common.theme.system')}</span>
                        </div>
                        {theme === 'system' && <Check className="h-3 w-3 text-secondary-orange" />}
                    </button>
                </div>
            )}
        </div>
    );
}
