import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Utensils, Plus, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/error';

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: string;
    category: string;
    type: 'Veg' | 'Non-Veg' | 'Egg';
}

export const UploadMenu = () => {
    const { t } = useTranslation();
    const [items, setItems] = useState<MenuItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [newItem, setNewItem] = useState<Omit<MenuItem, 'id'>>({
        name: '',
        description: '',
        price: '',
        category: 'Main Course',
        type: 'Veg'
    });

    const categories = [
        'Main Course',
        'Starters',
        'Desserts',
        'Beverages',
        'Soups',
        'Salads',
        'Snacks'
    ];

    const addItem = () => {
        if (!newItem.name || !newItem.price || !newItem.category) {
            toast.error('Please fill in all required fields');
            return;
        }

        const item: MenuItem = {
            ...newItem,
            id: Math.random().toString(36).substring(7)
        };

        setItems([...items, item]);
        setNewItem({
            name: '',
            description: '',
            price: '',
            category: newItem.category,
            type: 'Veg'
        });
        toast.success('Item added to list');
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleFinalSubmit = async () => {
        if (items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success('Onboarding completed successfully!');
            // Navigation to dashboard would happen here
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to complete onboarding'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    {t('onboarding.steps.upload.title', 'Upload Your Menu')}
                </h2>
                <p className="text-slate-500 text-lg">
                    {t('onboarding.steps.upload.subtitle', 'Build your digital menu catalog to start receiving orders.')}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-6">
                    <Card className="p-6 border-slate-200/60 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Utensils className="w-5 h-5 text-primary-blue" />
                            <h3 className="text-lg font-bold text-slate-900">Add Menu Item</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Item Name *</label>
                                <Input
                                    placeholder="e.g. Butter Chicken"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Category *</label>
                                <select 
                                    className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-blue/20"
                                    value={newItem.category} 
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Price (₹) *</label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={newItem.price}
                                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700">Food Type</label>
                                <select 
                                    className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-blue/20"
                                    value={newItem.type} 
                                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                                >
                                    <option value="Veg">Veg</option>
                                    <option value="Non-Veg">Non-Veg</option>
                                    <option value="Egg">Egg</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5 mb-6">
                            <label className="text-sm font-semibold text-slate-700">Description</label>
                            <Textarea
                                placeholder="Describe your delicious dish..."
                                className="resize-none h-24"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            />
                        </div>

                        <Button 
                            className="w-full bg-primary-blue hover:bg-primary-blue/90 h-12 rounded-xl"
                            onClick={addItem}
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add to Menu
                        </Button>
                    </Card>
                </div>

                <div className="lg:col-span-5 h-fit sticky top-24">
                    <Card className="p-6 border-slate-200/60 shadow-lg flex flex-col min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Preview ({items.length})</h3>
                        </div>

                        <div className="flex-grow space-y-3 overflow-y-auto max-h-[600px] pr-2">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                                    <Utensils className="w-12 h-12 mb-4" />
                                    <p className="text-sm font-medium">No items added yet</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w-2 h-2 rounded-full ${
                                                        item.type === 'Veg' ? 'bg-green-500' : 
                                                        item.type === 'Non-Veg' ? 'bg-red-500' : 'bg-yellow-500'
                                                    }`} />
                                                    <h4 className="font-bold text-slate-900">{item.name}</h4>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.category}</p>
                                            </div>
                                            <p className="font-bold text-slate-900 text-sm">₹{item.price}</p>
                                        </div>
                                        <button 
                                            onClick={() => removeItem(item.id)}
                                            className="absolute -right-2 -top-2 w-7 h-7 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-100">
                            <Button 
                                className="w-full bg-slate-900 hover:bg-black text-white h-14 rounded-2xl shadow-xl shadow-slate-200"
                                onClick={handleFinalSubmit}
                                disabled={isSaving || items.length === 0}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        Finish & Complete Onboarding
                                        <ArrowRight className="w-5 h-5 ml-3" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
