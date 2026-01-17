import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const TABS = [
    { label: 'Menu editor', path: 'edit' },
    { label: 'Manage inventory', path: 'stock' },
    { label: 'Taxes', path: 'taxes' },
    { label: 'Charges', path: 'charges' }
];

export const MenuTabs = () => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between shrink-0">
            <div className="flex gap-8">
                {TABS.map((tab) => {
                    const isActive = location.pathname.endsWith(`/${tab.path}`);

                    return (
                        <button
                            key={tab.label}
                            onClick={() => navigate(`../${tab.path}`)}
                            className={`py-4 text-sm font-bold relative transition-colors ${isActive
                                ? 'text-[var(--color-primary-blue)] dark:text-white'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            {tab.label}
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary-blue)]"
                                />
                            )}
                        </button>
                    );
                })}
            </div>
            <button className="flex items-center gap-2 text-[var(--color-primary-blue)] text-sm font-bold">
                <Sparkles className="w-4 h-4 text-[#f97316]" />
                See what's changed
            </button>
        </div>
    );
};
