import { type Restaurant } from '@/types/restaurantTypes';
import { Bike, UtensilsCrossed, ChevronUp, ChevronDown, PencilLine, Plus, User, X } from 'lucide-react';
import { useOnboardingStore, type ManagerInfo } from '../store/useOnboardingStore';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RestaurantCardProps {
    restaurant: Restaurant;
}

const getStatusDisplay = (status: string, t: any) => {
    switch (status) {
        case 'APPROVAL_PENDING':
        case 'ACTION_REQUIRED':
        case 'APPROVED_BUT_MENU_PENDING':
            return { label: t('onboarding.restaurant.complete.status.pending'), className: 'bg-amber-100 text-amber-700' };
        case 'ACTIVE':
            return { label: t('onboarding.restaurant.complete.status.active'), className: 'bg-green-100 text-green-700' };
        case 'RESTRICTED':
            return { label: t('onboarding.restaurant.complete.status.restricted'), className: 'bg-orange-100 text-orange-700' };
        case 'BLOCKED':
        case 'REJECTED':
            return { label: t('onboarding.restaurant.complete.status.blocked'), className: 'bg-red-100 text-red-700' };
        case 'ON_HOLD':
            return { label: t('onboarding.restaurant.complete.status.onHold'), className: 'bg-slate-100 text-slate-700' };
        case 'UPDATE_APPROVAL_PENDING':
            return { label: t('onboarding.restaurant.complete.status.updateApproval'), className: 'bg-blue-100 text-blue-700' };
        default:
            return { label: status, className: 'bg-slate-100 text-slate-700' };
    }
};

const maskMobile = (mobile: string) => {
    if (!mobile) return "";
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 4) return mobile;
    return `XXXXXX${cleanMobile.slice(-4)}`;
};

const formatAddress = (address: string) => {
    if (!address) return "";
    return address
        .split('|')
        .map(part => part.trim())
        .filter(part => part && part.length > 0 && part.toLowerCase() !== 'null')
        .join(', ');
};

export const RestaurantCard = ({ restaurant }: RestaurantCardProps) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(true);
    const statusDisplay = getStatusDisplay(restaurant.status, t);
    const formattedAddress = formatAddress(restaurant.address);
    const { user } = useAuth();
    const { restaurantSettings, setRestaurantSettings } = useOnboardingStore();
    
    const settings = restaurantSettings[restaurant.restroId] || {
        servingOptions: ['DELIVERY'],
        hasDeliveryPartners: false,
        isDeliveryViaUSTART: false,
        management: { isUserManaging: true }
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingExisting, setIsEditingExisting] = useState(false);
    const [managers, setManagers] = useState<{name: string, mobile: string, email: string, whatsapp: string}[]>([]);
    const [newManager, setNewManager] = useState<Partial<ManagerInfo>>({
        name: '',
        email: '',
        mobile: '',
        whatsapp: '',
    });
    const [isWhatsAppSame, setIsWhatsAppSame] = useState(false);

    // Mock API call to fetch managers
    useEffect(() => {
        const fetchManagers = async () => {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));
            setManagers([
                { name: 'Rahul Sharma', mobile: '9876543210', email: 'rahul@example.com', whatsapp: '9876543210' },
                { name: 'Priya Verma', mobile: '9123456789', email: 'priya@example.com', whatsapp: '9123456789' },
            ]);
        };
        fetchManagers();
    }, []);

    // Ensure management exists (for backward compatibility if any)
    const management = settings.management || { isUserManaging: true };

    const handleWhatsAppSameToggle = (checked: boolean) => {
        setIsWhatsAppSame(checked);
        if (checked && newManager.mobile) {
            setNewManager(prev => ({ ...prev, whatsapp: prev.mobile }));
        }
    };

    const handleEditManager = () => {
        setNewManager({
            name: management.name,
            email: management.email,
            mobile: management.mobile,
            whatsapp: management.whatsapp,
        });
        setIsWhatsAppSame(management.mobile === management.whatsapp);
        setIsEditingExisting(true);
        setIsModalOpen(true);
    };

    const handleSaveNewManager = () => {
        if (!newManager.name || !newManager.mobile) return;
        
        const managerData = {
            ...newManager,
            whatsapp: isWhatsAppSame ? newManager.mobile : newManager.whatsapp
        };

        // If editing an existing one, update the mock list too
        if (isEditingExisting) {
            setManagers(prev => prev.map(m => m.mobile === management.mobile ? (managerData as any) : m));
        } else {
            // Add to mock list for this session if it's new
            setManagers(prev => [...prev, managerData as any]);
        }
        
        // Update restaurant settings
        setRestaurantSettings(restaurant.restroId, {
            management: {
                isUserManaging: false,
                ...managerData
            }
        });

        setIsModalOpen(false);
        setIsEditingExisting(false);
        setNewManager({ name: '', email: '', mobile: '', whatsapp: '' });
        setIsWhatsAppSame(false);
    };

    const toggleServingOption = (option: 'DELIVERY' | 'DINE_IN', checked: boolean) => {
        const currentOptions = settings.servingOptions || [];
        const newOptions = checked 
            ? [...new Set([...currentOptions, option])]
            : currentOptions.filter(o => o !== option);
        
        setRestaurantSettings(restaurant.restroId, { servingOptions: newOptions });
    };

    const handleToggleDelivery = (checked: boolean) => {
        setRestaurantSettings(restaurant.restroId, { hasDeliveryPartners: checked });
    };

    const handleToggleUStartDelivery = (checked: boolean) => {
        setRestaurantSettings(restaurant.restroId, { isDeliveryViaUSTART: checked });
    };



    const handleManagementChange = (field: string, value: any) => {
        setRestaurantSettings(restaurant.restroId, {
            management: {
                ...management,
                [field]: value
            }
        });
    };

    return (
        <div className={`group relative rounded-3xl border-2 transition-all duration-300 ${isExpanded ? 'border-primary-blue bg-primary-blue/[0.02] shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm hover:shadow-md'}`}>
            <div className="p-5">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    {/* Image Section */}
                    <div className="relative w-full sm:w-32 h-32 rounded-2xl overflow-hidden shrink-0 border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                        <img 
                            src={restaurant.primaryImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop'} 
                            alt={restaurant.restroName}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                    </div>

                    <div className="flex-1 space-y-4 w-full">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="font-bold text-slate-900 text-xl leading-tight group-hover:text-primary-blue transition-colors">{restaurant.restroName}</h4>
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm ${statusDisplay.className}`}>
                                        {statusDisplay.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <span className="line-clamp-1">{formattedAddress || restaurant.address}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-primary-blue text-white shadow-lg shadow-primary-blue/20 ring-4 ring-primary-blue/10' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200/60'}`}
                                >
                                    {isExpanded ? <ChevronUp className="w-6 h-6" /> : <PencilLine className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Summary Badges (Only shown when collapsed) */}
                        {!isExpanded && (
                            <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                {settings.servingOptions?.includes('DELIVERY') && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50/50 border border-blue-100/50 shadow-sm">
                                        <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                            <Bike className="w-3 h-3 text-primary-blue" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600">
                                            {t('onboarding.restaurant.complete.card.deliveryLabel')} {settings.isDeliveryViaUSTART && `(${t('onboarding.restaurant.complete.card.ustartLabel')})`}
                                        </span>
                                    </div>
                                )}
                                {settings.servingOptions?.includes('DINE_IN') && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50/50 border border-orange-100/50 shadow-sm">
                                        <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                            <UtensilsCrossed className="w-3 h-3 text-orange-500" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-600">{t('onboarding.restaurant.complete.card.dineInLabel')}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50/50 border border-slate-100/50 shadow-sm">
                                    <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                        <User className="w-3 h-3 text-slate-500" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600">
                                        {t('onboarding.restaurant.complete.card.managedBy')} {management.isUserManaging ? (user?.name || t('onboarding.restaurant.complete.card.owner')) : (management.name || t('onboarding.restaurant.complete.card.manager'))}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Editable Details Form */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1200px] opacity-100 mt-8' : 'max-h-0 opacity-0'}`}>
                    <div className="pt-6 border-t border-slate-200/60 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Left Column: Serving Options */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">{t('onboarding.restaurant.complete.setupForm.servingOptions')}</Label>
                                        <p className="text-[10px] text-slate-500 pl-1">{t('onboarding.restaurant.complete.card.diningHint')}</p>
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        <button 
                                            onClick={() => toggleServingOption('DELIVERY', !settings.servingOptions?.includes('DELIVERY'))}
                                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${settings.servingOptions?.includes('DELIVERY') ? 'bg-[#0F2441] text-white border-[#0F2441] shadow-md shadow-[#0F2441]/20' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                        >
                                            {t('onboarding.restaurant.complete.card.deliveryLabel')}
                                        </button>
                                        <button 
                                            onClick={() => toggleServingOption('DINE_IN', !settings.servingOptions?.includes('DINE_IN'))}
                                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${settings.servingOptions?.includes('DINE_IN') ? 'bg-[#0F2441] text-white border-[#0F2441] shadow-md shadow-[#0F2441]/20' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                        >
                                            {t('onboarding.restaurant.complete.card.dineInLabel')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Logistics */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-slate-200">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-bold text-slate-800">{t('onboarding.restaurant.complete.setupForm.ownPartners')}</Label>
                                        </div>
                                        <Switch 
                                            checked={settings.hasDeliveryPartners} 
                                            onCheckedChange={handleToggleDelivery}
                                        />
                                    </div>

                                    {settings.hasDeliveryPartners && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex flex-col gap-1">
                                                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">{t('onboarding.restaurant.complete.setupForm.deliveryBy')}</Label>
                                            </div>
                                            <Tabs 
                                                value={settings.isDeliveryViaUSTART ? "USTART" : "SELF"} 
                                                onValueChange={(value) => handleToggleUStartDelivery(value === "USTART")}
                                                className="w-full"
                                            >
                                                <TabsList className="flex w-auto inline-flex bg-slate-100/50 p-1 rounded-xl gap-1 h-11">
                                                    <TabsTrigger 
                                                        value="USTART" 
                                                        className="px-6 rounded-lg data-[state=active]:bg-primary-blue data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs transition-all"
                                                    >
                                                        USTART
                                                    </TabsTrigger>
                                                    <TabsTrigger 
                                                        value="SELF" 
                                                        className="px-6 rounded-lg data-[state=active]:bg-primary-blue data-[state=active]:text-white data-[state=active]:shadow-md font-bold text-xs transition-all"
                                                    >
                                                        {t('onboarding.restaurant.complete.setupForm.management.me')}
                                                    </TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Management Section */}
                        <div className="pt-6 border-t border-slate-200/60 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                                <div className="space-y-1">
                                    <Label className="text-xl font-bold text-slate-800 uppercase tracking-wider">{t('onboarding.restaurant.complete.setupForm.management.title')}</Label>
                                    <p className="text-md text-slate-500">{t('onboarding.restaurant.complete.setupForm.management.hint')}</p>
                                </div>

                                <div className="flex flex-col items-end gap-3 w-full sm:w-auto">
                                    <Tabs 
                                        value={management.isUserManaging ? "ME" : "OTHERS"} 
                                        onValueChange={(val) => handleManagementChange('isUserManaging', val === "ME")}
                                        className="w-full sm:w-auto"
                                    >
                                        <TabsList className="flex w-full sm:w-auto inline-flex bg-slate-100/50 p-1.5 rounded-2xl gap-1.5 h-12">
                                            <TabsTrigger 
                                                value="ME" 
                                                className="flex-1 sm:flex-none px-8 rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary-blue data-[state=active]:shadow-sm font-bold text-sm transition-all"
                                            >
                                                {t('onboarding.restaurant.complete.setupForm.management.me')}
                                            </TabsTrigger>
                                            <TabsTrigger 
                                                value="OTHERS" 
                                                className="flex-1 sm:flex-none px-8 rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary-blue data-[state=active]:shadow-sm font-bold text-sm transition-all"
                                            >
                                                {t('onboarding.restaurant.complete.setupForm.management.someoneElse')}
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    {/* Management Info Card - Aligned with Tabs */}
                                    <div className="w-full sm:min-w-[320px] p-2 bg-white border border-slate-200/60 rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
                                        {management.isUserManaging ? (
                                            <div className="flex items-center justify-between pl-3 pr-2 py-1.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-primary-blue/5 flex items-center justify-center border border-primary-blue/10">
                                                        <User className="w-5 h-5 text-primary-blue" />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || t('onboarding.restaurant.complete.card.owner')}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">{maskMobile(user?.mobile || '')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            management.name ? (
                                                <div className="flex items-center justify-between pl-3 pr-2 py-1.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-primary-blue/5 flex items-center justify-center border border-primary-blue/10">
                                                            <User className="w-5 h-5 text-primary-blue" />
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="text-xs font-bold text-slate-900 leading-none">{management.name}</p>
                                                            <p className="text-[10px] text-slate-500 font-medium">{maskMobile(management.mobile || '')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={handleEditManager}
                                                            className="p-2 rounded-xl hover:bg-primary-blue/5 text-slate-400 hover:text-primary-blue transition-all flex items-center justify-center"
                                                            title={t('onboarding.restaurant.complete.setupForm.management.editManager')}
                                                        >
                                                            <PencilLine className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setRestaurantSettings(restaurant.restroId, {
                                                                    management: { isUserManaging: false }
                                                                });
                                                            }}
                                                            className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center"
                                                            title={t('onboarding.restaurant.complete.setupForm.management.removeManager')}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 relative">
                                                        <select 
                                                            className="w-full h-11 pl-4 pr-10 rounded-2xl bg-slate-50 border border-transparent text-xs font-bold text-slate-600 focus:bg-white focus:border-primary-blue/30 outline-none appearance-none transition-all cursor-pointer"
                                                            value={management.mobile || ''}
                                                            onChange={(e) => {
                                                                const m = managers.find(mgr => mgr.mobile === e.target.value);
                                                                if (m) {
                                                                    setRestaurantSettings(restaurant.restroId, {
                                                                        management: {
                                                                            isUserManaging: false,
                                                                            ...m
                                                                        }
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <option value="" disabled>{t('onboarding.restaurant.complete.setupForm.management.selectManager')}</option>
                                                            {managers.map((mgr) => (
                                                                <option key={mgr.mobile} value={mgr.mobile}>
                                                                    {mgr.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                            <ChevronDown className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            setIsExpanded(true);
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="h-11 w-11 rounded-2xl bg-primary-blue/5 text-primary-blue border border-primary-blue/10 hover:bg-primary-blue/10 transition-all flex items-center justify-center shadow-sm"
                                                        title={t('onboarding.restaurant.complete.setupForm.management.addNewManager')}
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Manager Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false);
                    setIsEditingExisting(false);
                    setNewManager({ name: '', email: '', mobile: '', whatsapp: '' });
                }}
                title={isEditingExisting ? t('onboarding.restaurant.complete.setupForm.management.editManager') : t('onboarding.restaurant.complete.setupForm.management.addNewManager')}
            >
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{t('onboarding.restaurant.complete.setupForm.management.name')}</Label>
                        <Input 
                            placeholder={t('onboarding.restaurant.complete.setupForm.management.fullNamePlaceholder')}
                            value={newManager.name}
                            onChange={(e) => setNewManager({...newManager, name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{t('onboarding.restaurant.complete.setupForm.management.email')}</Label>
                        <Input 
                            type="email"
                            placeholder={t('onboarding.restaurant.complete.setupForm.management.emailPlaceholder')}
                            value={newManager.email}
                            onChange={(e) => setNewManager({...newManager, email: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{t('onboarding.restaurant.complete.setupForm.management.mobile')}</Label>
                        <Input 
                            placeholder={t('onboarding.restaurant.complete.setupForm.management.mobilePlaceholder')}
                            value={newManager.mobile}
                            onChange={(e) => {
                                const val = e.target.value;
                                setNewManager({...newManager, mobile: val});
                                if (isWhatsAppSame) setNewManager(prev => ({ ...prev, whatsapp: val }));
                            }}
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('onboarding.restaurant.complete.setupForm.management.whatsapp')}</Label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={isWhatsAppSame} 
                                    onChange={(e) => handleWhatsAppSameToggle(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-primary-blue focus:ring-primary-blue/10 cursor-pointer"
                                />
                                <span className="text-[10px] font-medium text-slate-600 group-hover:text-primary-blue transition-colors">{t('onboarding.restaurant.complete.setupForm.management.sameAsMobile')}</span>
                            </label>
                        </div>
                        <Input 
                            placeholder={t('onboarding.restaurant.complete.setupForm.management.whatsappPlaceholder')}
                            value={newManager.whatsapp}
                            onChange={(e) => setNewManager({...newManager, whatsapp: e.target.value})}
                            disabled={isWhatsAppSame}
                            className={`transition-all duration-200 ${isWhatsAppSame ? 'bg-slate-50 border-slate-100 text-slate-400' : ''}`}
                        />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 h-12 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                        >
                            {t('onboarding.restaurant.complete.setupForm.management.cancel')}
                        </button>
                        <button 
                            onClick={handleSaveNewManager}
                            disabled={!newManager.name || !newManager.mobile}
                            className="flex-2 h-12 px-8 rounded-2xl bg-primary-blue text-white text-sm font-bold shadow-lg shadow-primary-blue/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
                        >
                            {t('onboarding.restaurant.complete.setupForm.management.saveManager')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}; 
