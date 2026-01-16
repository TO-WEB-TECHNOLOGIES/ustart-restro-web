interface MenuScoreGaugeProps {
    score: number;
}

export const MenuScoreGauge = ({ score }: MenuScoreGaugeProps) => {
    // Semi-circle radius 45, total length PI * r ≈ 141.37
    const radius = 45;
    const circumference = Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-56 h-36 flex flex-col items-center justify-end">
            <svg className="w-full h-auto overflow-visible px-4" viewBox="0 0 100 60">
                {/* Background Arc */}
                <path
                    d="M 5 50 A 45 45 0 0 1 95 50"
                    fill="none"
                    stroke="#f1f5f9"
                    className="dark:stroke-slate-800"
                    strokeWidth="14"
                    strokeLinecap="round"
                />
                {/* Progress Arc */}
                <path
                    d="M 5 50 A 45 45 0 0 1 95 50"
                    fill="none"
                    stroke="var(--color-secondary-orange)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
            </svg>

            <div className="absolute bottom-2 text-5xl font-extrabold text-[var(--color-primary-blue)] dark:text-white">
                {score}%
            </div>
        </div>
    );
};
