import { 
  HelpCircle, 
  ChevronRight, 
  MessageCircle, 
  ArrowRight 
} from "lucide-react";

interface LearningCenterItem {
  question: string;
  onClick?: () => void;
}

interface OfferSupportSidebarProps {
  learningCenterTitle: string;
  learningCenterItems: LearningCenterItem[];
  helpTitle: string;
  helpText: string;
  chatLabel: string;
}

export const OfferSupportSidebar = ({
  learningCenterTitle,
  learningCenterItems,
  helpTitle,
  helpText,
  chatLabel,
}: OfferSupportSidebarProps) => {
  return (
    <div className="w-full lg:w-80 space-y-6 lg:sticky lg:top-10 overflow-hidden transition-all duration-300">
      {/* Learning Center */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary-blue dark:text-white" />
          <h2 className="text-base font-bold text-primary-blue dark:text-white">
            {learningCenterTitle}
          </h2>
        </div>
        
        <div className="space-y-4">
          {learningCenterItems.map((item, index) => (
            <div 
              key={index} 
              className="flex items-start justify-between group cursor-pointer"
              onClick={item.onClick}
            >
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium group-hover:text-secondary-orange transition-colors">
                {item.question}
              </p>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-secondary-orange transition-colors shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      </div>

      {/* Help Box */}
      <div className="bg-[#0f2441] rounded-3xl p-6 text-white space-y-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 size-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-all"></div>
        <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold">
            {helpTitle}
          </h3>
          <p className="text-xs text-blue-100/70 leading-relaxed">
            {helpText}
          </p>
        </div>
        <button className="w-full h-10 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
          {chatLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
