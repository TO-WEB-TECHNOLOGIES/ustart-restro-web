import { useTranslation } from 'react-i18next';

const EmptyPlateIllustration = () => (
    <svg viewBox="0 0 400 300" className="w-full h-full drop-shadow-2xl">
        <defs>
            <radialGradient id="plateGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="90%" stopColor="#F3F4F6" />
                <stop offset="100%" stopColor="#E5E7EB" />
            </radialGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        {/* Table Shadow */}
        <ellipse cx="200" cy="260" rx="140" ry="20" fill="#000" opacity="0.1" filter="url(#glow)" />

        {/* The Plate */}
        <g className="animate-float">
            <ellipse cx="200" cy="220" rx="120" ry="40" fill="url(#plateGradient)" stroke="#E5E7EB" strokeWidth="2" />
            <ellipse cx="200" cy="220" rx="80" ry="25" fill="#FFFFFF" stroke="#F3F4F6" strokeWidth="1" />

            {/* "Empty" Crumbs */}
            <circle cx="180" cy="225" r="2" fill="#D1D5DB" />
            <circle cx="210" cy="215" r="1.5" fill="#D1D5DB" />
            <circle cx="220" cy="230" r="2" fill="#D1D5DB" />
        </g>

        {/* The Cloche (Lid) - Lifted */}
        <g className="animate-hover-slow" style={{ transformOrigin: '200px 150px' }}>
            <path
                d="M 100 180 Q 200 60 300 180"
                fill="url(#plateGradient)"
                stroke="#CBD5E1"
                strokeWidth="1"
                className="drop-shadow-lg"
            />
            <path
                d="M 100 180 Q 200 210 300 180"
                fill="#E2E8F0"
                opacity="0.5"
            />
            {/* Handle */}
            <circle cx="200" cy="115" r="12" fill="#9CA3AF" />
            <circle cx="200" cy="115" r="10" fill="url(#plateGradient)" />

            {/* Shine */}
            <path d="M 140 140 Q 180 100 220 120" fill="none" stroke="white" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
        </g>

        {/* Zzz Animation for sleeping state */}
        <g className="animate-pulse-slow">
            <text x="260" y="100" fontSize="24" fill="#9CA3AF" fontFamily="sans-serif" fontWeight="bold" opacity="0.6">Z</text>
            <text x="280" y="80" fontSize="18" fill="#9CA3AF" fontFamily="sans-serif" fontWeight="bold" opacity="0.4">z</text>
            <text x="295" y="65" fontSize="14" fill="#9CA3AF" fontFamily="sans-serif" fontWeight="bold" opacity="0.2">z</text>
        </g>
    </svg>
);

interface NoOrdersScreenProps {
    stage: string;
}

export default function NoOrdersScreen({ stage }: NoOrdersScreenProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center flex-grow w-full h-full">
            {/* Hero Illustration */}
            <div className="w-64 h-56 mb-6 relative">
                <EmptyPlateIllustration />
            </div>

            {/* Text Content */}
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
                {t('dashboard.orders.empty.title', { stage: t(`dashboard.orders.tabs.${stage.toLowerCase()}`, stage) })}
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8 max-w-xs">
                {t('dashboard.orders.empty.description')}
            </p>

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-hover-slow {
                    animation: float 8s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .animate-pulse-slow {
                    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
}
