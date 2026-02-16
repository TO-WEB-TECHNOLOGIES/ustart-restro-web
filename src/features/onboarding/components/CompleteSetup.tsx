import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2, Store, MapPin, PlusCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/error';

interface Restaurant {
    id: string;
    name: string;
    address: string;
    status: string;
}

export const CompleteSetup = () => {
    const { t } = useTranslation();
    const { isMultipleRestro, user } = useAuth();
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [isLoadingRestros, setIsLoadingRestros] = useState(false);
    const [activeTab, setActiveTab] = useState<'single' | 'multi'>(isMultipleRestro ? 'multi' : 'single');

    useEffect(() => {
        const fetchRestaurants = async () => {
            setIsLoadingRestros(true);
            try {
                // Mock API call
                await new Promise(resolve => setTimeout(resolve, 1000));
                const mockRestros: Restaurant[] = [
                    { 
                        id: '1', 
                        name: 'The Spicy Grill - Main Branch', 
                        address: '123, MG Road, Bangalore',
                        status: 'APPROVED'
                    }
                ];
                setRestaurants(mockRestros);
            } catch (error) {
                toast.error('Failed to fetch restaurants');
            } finally {
                setIsLoadingRestros(false);
            }
        };

        fetchRestaurants();
    }, []);

    const handleAddRestaurant = () => {
        toast.info('Navigate to restaurant onboarding form...');
        // Example: navigate('/grow-with-ustart/restaurant-info');
    };

    const handleFinalSubmit = async () => {
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success('Restaurant setup verified!');
            navigate('/grow-with-ustart/upload-menu');
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to complete onboarding'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">
                        {t('onboarding.restaurant.complete.title', 'Complete Your Profile')}
                    </h2>
                    <p className="text-slate-500 text-lg">
                        {t('onboarding.restaurant.complete.subtitle', "Welcome back, {{name}}. Verify your restaurants to finish setup.", { name: user?.name })}
                    </p>
                </div>
                
                {isMultipleRestro && (
                    <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full md:w-auto">
                        <TabsList className="bg-slate-200/50 p-1 rounded-xl h-12">
                            <TabsTrigger value="single" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                {t('onboarding.restaurant.complete.singleRestro', 'I have only single Restaurant')}
                            </TabsTrigger>
                            <TabsTrigger value="multi" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                {t('onboarding.restaurant.complete.multiRestro', 'I have More than 1 restaurant')}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                )}
            </div>

            <div className="space-y-8">
                <Card className="p-8 border-slate-200/60 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-blue/10 rounded-2xl flex items-center justify-center">
                                <Store className="w-6 h-6 text-primary-blue" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    {t('onboarding.restaurant.complete.ownedRestaurants', 'My Restaurants')}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {t('onboarding.restaurant.complete.ownedRestaurantsDesc', 'Manage your outlets associated with this brand.')}
                                </p>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            className="border-primary-blue/30 text-primary-blue hover:bg-primary-blue/5 rounded-xl h-11 px-6"
                            onClick={handleAddRestaurant}
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            {t('onboarding.restaurant.complete.addRestaurant', 'Add another restaurant')}
                        </Button>
                    </div>

                    {isLoadingRestros ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
                            <p className="text-slate-400 font-medium">
                                {t('onboarding.restaurant.complete.fetchingRestros', 'Fetching your restaurants...')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {restaurants.map(restro => (
                                <div 
                                    key={restro.id}
                                    className="group relative p-6 rounded-3xl border-2 border-primary-blue bg-primary-blue/[0.03] shadow-sm transition-all hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-900 text-lg">{restro.name}</h4>
                                                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                    {restro.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                <MapPin className="w-4 h-4 shrink-0" />
                                                {restro.address}
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 bg-primary-blue rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-primary-blue/20">
                                            <CheckCircle2 className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <button 
                                onClick={handleAddRestaurant}
                                className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed border-slate-200 hover:border-primary-blue/40 hover:bg-slate-50 transition-all text-slate-400 hover:text-primary-blue gap-3 group"
                            >
                                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-primary-blue/5 group-hover:border-primary-blue/20 transition-all">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <div className="text-center">
                                    <span className="block text-sm font-bold uppercase tracking-wider">
                                        {t('onboarding.restaurant.complete.addRestaurant', 'Add another restaurant')}
                                    </span>
                                    <span className="text-xs opacity-60">
                                        {t('onboarding.restaurant.complete.expandNetwork', 'Expand your business network')}
                                    </span>
                                </div>
                            </button>
                        </div>
                    )}
                </Card>

                <div className="flex justify-end pt-4">
                    <Button 
                        size="lg"
                        className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 group"
                        onClick={handleFinalSubmit}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                {t('onboarding.restaurant.complete.finishButton', 'Finish & Go to Dashboard')}
                                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};
