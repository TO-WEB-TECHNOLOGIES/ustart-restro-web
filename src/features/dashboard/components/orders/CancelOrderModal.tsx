import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import type { Order } from '../../api/mockDashboard';
import { z } from 'zod';

interface CancelOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isProcessing?: boolean;
    order: Order | null;
}

const cancelSchema = z.string().min(5, { message: "Reason must be at least 5 characters" });

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isProcessing = false,
    order
}) => {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);

    const suggestions = [
        t('dashboard.orders.card.cancelModal.suggestions.outOfStock'),
        t('dashboard.orders.card.cancelModal.suggestions.busy'),
        t('dashboard.orders.card.cancelModal.suggestions.closing'),
    ];

    const handleConfirm = () => {
        const result = cancelSchema.safeParse(reason.trim());
        if (!result.success) {
            setError(result.error.issues[0].message);
            return;
        }
        setError(null);
        onConfirm(reason);
    };

    const handleReasonChange = (val: string) => {
        setReason(val);
        if (error) {
            const result = cancelSchema.safeParse(val.trim());
            if (result.success) setError(null);
        }
    };

    if (!order) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('dashboard.orders.card.cancelModal.title')}
        >
            <div className="space-y-5 pt-2">
                {/* Penalty Warning */}
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-bold text-red-900 dark:text-red-400 leading-snug">
                        {t('dashboard.orders.card.cancelModal.penaltyWarning')}
                    </p>
                </div>

                {/* Cancel Reason */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                            {t('dashboard.orders.card.cancelModal.reasonPlaceholder')}
                        </label>
                        {error && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse">
                                <AlertCircle className="w-3 h-3" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                    <Textarea
                        value={reason}
                        onChange={(e) => handleReasonChange(e.target.value)}
                        placeholder={t('dashboard.orders.card.cancelModal.reasonPlaceholder')}
                        className={`resize-none h-28 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 focus:ring-red-500/10 rounded-xl transition-all dark:text-primary-blue ${error ? 'border-red-500 ring-2 ring-red-500/10' : 'focus:border-red-500'}`}
                    />
                </div>

                {/* Suggestions */}
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            onClick={() => handleReasonChange(s)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${reason === s
                                ? 'bg-red-50 border-red-200 text-red-600 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 rounded-xl h-11 font-bold dark:text-slate-600 text-slate-400 dark:hover:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        disabled={isProcessing}
                    >
                        {t('dashboard.orders.card.rejectModal.cancel')}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        className="flex-1 rounded-xl h-11 font-bold bg-secondary-orange/90 hover:bg-secondary-orange text-white shadow-lg shadow-secondary-orange dark:shadow-none"
                        disabled={reason.trim().length < 5 || isProcessing}
                    >
                        {isProcessing ? t('dashboard.orders.card.processing') : t('dashboard.orders.card.cancelModal.confirm')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
