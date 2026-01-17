import { Search, Filter, ChevronDown, Loader2 } from 'lucide-react';
import { useMenu } from '../../hooks/useMenu';

/**
 * ActionBar component for the Menu Editor.
 * Includes global search for items, filtering options, and a primary submit button.
 * Integrates with the useMenu hook for managing search state and submitting changes.
 */
export const MenuActions = () => {
    const { searchQuery, setSearchQuery, submitChanges, isDirty, isSubmitting } = useMenu();

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 px-8 flex items-center gap-4 shrink-0">
            {/* Search Input field */}
            <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary-blue)]/20 transition-all"
                />
            </div>

            {/* Filter Toggle Button */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
                <Filter className="w-4 h-4" />
                Filters
            </button>

            {/* Bulk Actions Dropdown */}
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm text-slate-700 dark:text-slate-300">
                Actions
                <ChevronDown className="w-4 h-4" />
            </button>

            <div className="flex-1" />

            {/* Primary Submit Button for Menu Changes */}
            <button
                onClick={submitChanges}
                disabled={!isDirty || isSubmitting}
                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 ${!isDirty || isSubmitting
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-[var(--color-primary-blue)] hover:bg-[#1a3a5f] text-white shadow-blue-500/10'
                    }`}
            >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Submitting...' : 'Submit Changes'}
            </button>
        </div>
    );
};
