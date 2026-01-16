import { motion } from 'framer-motion';
import { ChevronRight, type LucideIcon } from 'lucide-react';

interface ActionCardProps {
    icon: LucideIcon;
    watermarkIcon?: LucideIcon;
    title: string;
    description: string;
    iconColor: string;
    variants: any;
    onClick?: () => void;
}

export const ActionCard = ({
    icon: Icon,
    watermarkIcon: WatermarkIcon,
    title,
    description,
    iconColor,
    variants,
    onClick
}: ActionCardProps) => {
    const Watermark = WatermarkIcon || Icon;

    return (
        <motion.div
            variants={variants}
            onClick={onClick}
            className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden h-[200px] group cursor-pointer"
        >
            {/* Faded Background Icon (Deep Background) - Watermark */}
            <div className="absolute -bottom-8 -left-8 text-slate-100 dark:text-slate-800/20 pointer-events-none">
                <div className="bg-slate-50/20 dark:bg-slate-800/10 p-4 rounded-full">
                    <Watermark className="w-28 h-28 opacity-40" />
                </div>
            </div>

            <div className="relative z-10 flex flex-col h-full">
                {/* Top Header */}
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-black text-[var(--color-primary-blue)] dark:text-white leading-tight max-w-[180px]">
                        {title}
                    </h4>
                    <ChevronRight className="w-6 h-6 text-slate-300 transition-colors" />
                </div>

                {/* Description */}
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px] leading-relaxed">
                    {description}
                </p>

                {/* Primary Icon (Bottom Right) */}
                <div className="absolute bottom-0 right-0">
                    <Icon className={`w-12 h-12 ${iconColor} opacity-90`} />
                </div>
            </div>
        </motion.div>
    );
};
