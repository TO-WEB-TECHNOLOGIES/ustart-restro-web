import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Utensils, Plus, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: string;
    category: string;
    type: 'Veg' | 'Non-Veg' | 'Egg';
}

export const MenuCreation = () => {
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
            toast.error(t('onboarding.menu.fillRequired', 'Please fill in all required fields'));
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
            category: newItem.category, // Keep the category for convenience
            type: 'Veg'
        });
        toast.success(t('onboarding.menu.itemAdded', 'Item added to list'));
    };

    const removeItem = (id: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    const handleSaveMenu = async () => {
        if (items.length === 0) {
            toast.error(t('onboarding.menu.addAtLeastOne', 'Please add at least one item to your menu'));
            return;
        }

        setIsSaving(true);
        // Mock API call
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            toast.success(t('onboarding.menu.saveSuccess', 'Menu saved successfully!'));
            // Here you would typically navigate to the next screen or trigger a status update
        } catch (error) {
            toast.error(t('onboarding.menu.saveError', 'Failed to save menu'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Build Your First Menu</h2>
                <p className="text-slate-500 text-lg">
                    Add a few items to get started. You can always add more later in the dashboard.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Item Form */}
                <Card className="lg:col-span-1 p-6 h-fit sticky top-24">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary-blue" />
                        Add New Item
                    </h3>
                    <div className="space-y-4">
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
                                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newItem.category} 
                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                                <label className="text-sm font-semibold text-slate-700">Type</label>
                                <select 
                                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newItem.type} 
                                    onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                                >
                                    <option value="Veg">Veg</option>
                                    <option value="Non-Veg">Non-Veg</option>
                                    <option value="Egg">Egg</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700">Description</label>
                            <Textarea
                                placeholder="Describe your delicious dish..."
                                className="resize-none h-20"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            />
                        </div>

                        <Button 
                            className="w-full bg-primary-blue hover:bg-primary-blue/90"
                            onClick={addItem}
                        >
                            Add to Menu
                        </Button>
                    </div>
                </Card>

                {/* Menu Preview */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Utensils className="w-6 h-6 text-primary-blue" />
                            Menu Preview ({items.length} items)
                        </h3>
                        {items.length > 0 && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100"
                                onClick={() => setItems([])}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Clear All
                            </Button>
                        )}
                    </div>

                    {items.length === 0 ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                <Utensils className="w-8 h-8 text-slate-300" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 mb-1">No items added yet</h4>
                            <p className="text-slate-500 max-w-xs">
                                Use the form on the left to start building your restaurant's digital menu.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <Card key={item.id} className="p-4 flex items-center justify-between group hover:border-primary-blue/30 transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-2 rounded-full ${
                                            item.type === 'Veg' ? 'bg-green-500' : 
                                            item.type === 'Non-Veg' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`} title={item.type} />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-900">{item.name}</h4>
                                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500 uppercase tracking-wider">
                                                    {item.category}
                                                </span>
                                            </div>
                                            {item.description && (
                                                <p className="text-sm text-slate-500 line-clamp-1 italic">{item.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-mono font-bold text-slate-900">₹{parseFloat(item.price).toFixed(2)}</p>
                                        <button 
                                            onClick={() => removeItem(item.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Card>
                            ))}

                            <div className="pt-6 flex justify-end">
                                <Button 
                                    className="bg-primary-blue hover:bg-primary-blue/90 h-12 px-8 rounded-xl shadow-lg shadow-primary-blue/20"
                                    onClick={handleSaveMenu}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Saving Menu...
                                        </>
                                    ) : (
                                        <>
                                            Submit Menu & Continue
                                            <ArrowRight className="w-5 h-5 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
