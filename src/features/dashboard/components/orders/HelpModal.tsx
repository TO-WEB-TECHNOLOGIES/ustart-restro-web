import { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { z } from 'zod';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpModal = ({ isOpen, onClose }: HelpModalProps) => {
    const { t } = useTranslation();
    const [description, setDescription] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Zod validation
        const result = z.string().min(10, { message: t('dashboard.widgets.help.supportModal.minCharsError') }).safeParse(description);

        if (!result.success) {
            setError(result.error.issues[0].message);
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    const handleClose = () => {
        setIsSubmitted(false);
        setDescription('');
        setError(null);
        onClose();
    };

    const tKey = (key: string) => t(`dashboard.widgets.help.supportModal.${key}`);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative h-32 bg-slate-900 flex items-center justify-center overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl" />
                    <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl" />

                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="relative z-10 flex flex-col items-center gap-2">
                        <h2 className="text-xl font-black text-white uppercase tracking-wider">
                            {tKey('title')}
                        </h2>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {tKey('raiseTitle')}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    {tKey('instruction')}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    {tKey('descriptionLabel')}
                                </label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    placeholder={tKey('placeholder')}
                                    className={`min-h-[120px] rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 focus-visible:ring-orange-500/20 focus-visible:border-orange-500/50 resize-none px-4 py-3 text-md dark:text-white ${error ? 'border-red-500 dark:border-red-500/50' : ''}`}
                                />
                                {error && (
                                    <div className="flex items-center gap-1.5 mt-1 text-red-500 text-[11px] font-bold animate-in fade-in slide-in-from-top-1">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        {tKey('submit')}
                                    </>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center py-4 space-y-6">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mx-auto animate-in zoom-in duration-300">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {tKey('successTitle')}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                                    {tKey('successMessage')}
                                </p>
                            </div>
                            <Button
                                onClick={handleClose}
                                variant="outline"
                                className="h-12 px-8 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                {tKey('close')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
