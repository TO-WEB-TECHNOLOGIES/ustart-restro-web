import React from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    hideCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, hideCloseButton = false }) => {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={!hideCloseButton ? onClose : undefined}
        >
            <div
                className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-900">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100">{title}</h3>
                    {!hideCloseButton && (
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
