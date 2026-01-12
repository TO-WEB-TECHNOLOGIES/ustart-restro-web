import { Megaphone, HelpCircle, FileText, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const BoostWidget = () => {
    return (
        <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
            {/* Background Gradient/Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-orange/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4 text-secondary-orange">
                    <Megaphone className="w-5 h-5" />
                </div>

                <h3 className="text-lg font-bold mb-2">Boost your visibility</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Get 20% more orders by promoting your top dishes this weekend.
                </p>

                <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold">
                    Create Ad Campaign
                </Button>
            </div>
        </div>
    );
};

export const HelpWidget = () => {
    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Need Help?</h3>
            <div className="space-y-4">
                <a href="#" className="flex items-center gap-3 text-slate-600 hover:text-secondary-orange transition-colors group">
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-secondary-orange" />
                    <span className="text-sm font-medium">How to update operating hours</span>
                </a>
                <a href="#" className="flex items-center gap-3 text-slate-600 hover:text-secondary-orange transition-colors group">
                    <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-secondary-orange" />
                    <span className="text-sm font-medium">Managing customer refunds</span>
                </a>
                <a href="#" className="flex items-center gap-3 text-slate-600 hover:text-secondary-orange transition-colors group">
                    <MessageCircle className="w-4 h-4 text-slate-400 group-hover:text-secondary-orange" />
                    <span className="text-sm font-medium">Contact Partner Support</span>
                </a>
            </div>
        </div>
    );
};
