import { useTheme } from '@/context/ThemeContext';

export const Loader = () => {
    const { theme } = useTheme();
    // Start with a default color; we can make this more dynamic if needed
    // But since the script runs first, the theme context should be correct fairly quickly
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Using simple SVG for a spinner
    return (
        <div className="flex items-center justify-center min-h-screen bg-background-white dark:bg-[#0A121E]">
            <svg
                className={`animate-spin h-10 w-10 ${isDark ? 'text-white' : 'text-primary-blue'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
            </svg>
        </div>
    );
};
