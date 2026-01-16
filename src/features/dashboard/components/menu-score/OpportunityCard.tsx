import { motion } from 'framer-motion';
import { ChevronRight, type LucideIcon } from 'lucide-react';

interface OpportunityCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionText: string;
    actionColor: string;
    variants: any;
}

export const OpportunityCard = ({
    icon: Icon,
    title,
    description,
    actionText,
    actionColor,
    variants
}: OpportunityCardProps) => (
    <motion.div variants={variants} className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100/50 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group min-h-[190px]">
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
                <h4 className="text-xl font-black text-[var(--color-primary-blue)] dark:text-white mb-2 leading-tight pr-10">
                    {title}
                </h4>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed max-w-[95%]">
                    {description}
                </p>
            </div>
            <button className={`text-sm font-extrabold ${actionColor} flex items-center gap-1 group-hover:gap-2 transition-all w-fit`}>
                {actionText}
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
        <div className="absolute -bottom-4 -right-4 text-slate-200/40 dark:text-slate-700/20 group-hover:scale-110 group-hover:-translate-x-2 group-hover:-translate-y-2 transition-all duration-700 ease-out">
            <Icon className="w-28 h-28" />
        </div>
    </motion.div>
);
