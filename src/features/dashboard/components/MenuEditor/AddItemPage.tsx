import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../../hooks/useMenu';
import type { MenuItem } from '../../../../types/menuTypes';
import { Check, ImagePlus, Sparkles, Plus } from 'lucide-react';

export const AddItemPage = () => {
    const navigate = useNavigate();
    const { addMenuItem, selectedCategory } = useMenu();

    // Default form state
    const [formData, setFormData] = useState<Partial<MenuItem>>({
        name: '',
        description: '',
        itemPrice: 0,
        packagingCharges: 0,
        taxAmount: 5,
        foodType: 'veg',
        serviceType: 'Delivery',
        itemType: 'Solid',
        isFrosting: 'No',
        serves: 1,
        portionSize: 4,
        maxQuantity: 10,
        tags: [],
        allergens: [],
        spiceLevel: 0,
        availability: {
            startTime: '09:00',
            endTime: '23:00',
            allDay: true
        },
        nutritionalInfo: {
            calories: '',
            protein: '',
            carbs: '',
            fats: ''
        },
        isAiGeneratedImage: false
    });

    const updateField = (field: keyof MenuItem, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateNestedField = (parent: 'nutritionalInfo' | 'availability', field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent] as any,
                [field]: value
            }
        }));
    };

    const toggleArrayItem = (field: 'tags' | 'allergens', value: string) => {
        setFormData(prev => {
            const currentArray = prev[field] || [];
            if (currentArray.includes(value)) {
                return { ...prev, [field]: currentArray.filter(i => i !== value) };
            } else {
                return { ...prev, [field]: [...currentArray, value] };
            }
        });
    };

    const handleSave = async () => {
        if (selectedCategory) {
            await addMenuItem(selectedCategory.id, formData);
            navigate(-1); // Go back
        }
    };

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <section className="flex-1 bg-cream overflow-y-auto p-4 md:p-8 relative h-full">
            <div className="max-w-6xl mx-auto pb-20">
                {/* Header */}
                <header className="flex items-center justify-between mb-8 md:mb-12">
                    <div className="flex items-center gap-4 md:gap-6">

                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Add New Item</h1>
                            <p className="text-sm text-gray-500 font-medium mt-1">{selectedCategory?.name} Category</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={handleBack}
                            className="hidden md:block px-6 py-2.5 rounded-full text-sm font-bold text-gray-500 hover:bg-white hover:text-navy transition-colors scale-95"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-[var(--color-primary-blue)] text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2"
                        >
                            <span>Save Item</span>
                            <Check className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                    {/* Left Column */}
                    <div className="lg:col-span-7 space-y-12 md:space-y-16">

                        {/* Basic Info */}
                        <div className="group">
                            <h3 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[var(--color-primary-blue)]"></span>
                                Basic Info
                            </h3>
                            <div className="space-y-8">
                                <div>
                                    <input
                                        value={formData.name}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        className="w-full bg-transparent text-3xl md:text-4xl font-display font-bold text-navy text-slate-900 dark:text-white placeholder:text-gray-300 border-0 border-b-2 border-gray-200 focus:border-[var(--color-primary-blue)] focus:ring-0 px-0 py-4 transition-all outline-none"
                                        placeholder="Item Name"
                                        type="text"
                                    />
                                </div>
                                <div>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => updateField('description', e.target.value)}
                                        className="w-full bg-transparent text-lg font-medium text-brown placeholder:text-gray-300 border-0 border-b-2 border-gray-200 focus:border-[var(--color-primary-blue)] focus:ring-0 px-0 py-4 resize-none transition-all outline-none text-slate-700 dark:text-slate-300"
                                        placeholder="Enter a delicious description..."
                                        rows={3}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Media */}
                        <div>
                            <h3 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                Media
                            </h3>
                            <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center hover:border-[var(--color-primary-blue)]/50 hover:bg-[var(--color-primary-blue)]/[0.02] transition-all cursor-pointer group h-64">
                                <div className="size-16 rounded-2xl bg-gray-50 dark:bg-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                    <ImagePlus className="w-8 h-8 text-gray-400 group-hover:text-[var(--color-primary-blue)]" />
                                </div>
                                <p className="text-navy text-slate-900 dark:text-white font-bold text-lg">Drop your image here</p>
                                <p className="text-gray-400 text-sm mt-1">or click to browse files</p>
                            </div>
                            <div className="mt-4 flex items-center justify-between px-2">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Sparkles className="w-5 h-5" />
                                    <span>AI Generated / Web Download?</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        className="sr-only peer"
                                        type="checkbox"
                                        checked={formData.isAiGeneratedImage}
                                        onChange={(e) => updateField('isAiGeneratedImage', e.target.checked)}
                                    />
                                    <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-primary-blue)]"></div>
                                </label>
                            </div>
                        </div>

                        {/* Details */}
                        <div>
                            <h3 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                Details
                            </h3>
                            <div className="space-y-8">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <label className="text-sm font-bold text-navy text-slate-900 dark:text-white">Availability Schedule</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                checked={formData.availability?.allDay}
                                                onChange={(e) => updateNestedField('availability', 'allDay', e.target.checked)}
                                                className="rounded border-gray-300 text-navy focus:ring-navy"
                                                id="avail-check"
                                                type="checkbox"
                                            />
                                            <label className="text-xs font-semibold text-gray-500" htmlFor="avail-check">Same as restaurant hours</label>
                                        </div>
                                    </div>
                                    <div className={`grid grid-cols-2 gap-4 ${formData.availability?.allDay ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase">From</span>
                                            <input
                                                className="w-full bg-gray-50 dark:bg-slate-700 border-0 rounded-xl px-4 py-3 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10"
                                                type="time"
                                                value={formData.availability?.startTime}
                                                onChange={(e) => updateNestedField('availability', 'startTime', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-xs font-bold text-gray-400 uppercase">To</span>
                                            <input
                                                className="w-full bg-gray-50 dark:bg-slate-700 border-0 rounded-xl px-4 py-3 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10"
                                                type="time"
                                                value={formData.availability?.endTime}
                                                onChange={(e) => updateNestedField('availability', 'endTime', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-navy text-slate-900 dark:text-white">Allergy Info</label>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { id: 'nuts', label: 'Contains Nuts' },
                                            { id: 'dairy', label: 'Dairy Free' },
                                            { id: 'gluten', label: 'Gluten Free' }
                                        ].map(opt => (
                                            <label key={opt.id} className="cursor-pointer group">
                                                <input
                                                    className="peer sr-only"
                                                    type="checkbox"
                                                    checked={formData.allergens?.includes(opt.id)}
                                                    onChange={() => toggleArrayItem('allergens', opt.id)}
                                                />
                                                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 text-sm font-medium transition-all peer-checked:bg-[var(--color-primary-blue)] peer-checked:text-white peer-checked:border-[var(--color-primary-blue)] hover:bg-gray-50 dark:hover:bg-slate-700">
                                                    {opt.label}
                                                </span>
                                            </label>
                                        ))}
                                        <label className="cursor-pointer group">
                                            <input className="peer sr-only" type="checkbox" />
                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-dashed border-gray-300 dark:border-slate-600 bg-transparent text-gray-400 text-sm font-medium transition-all hover:border-[var(--color-primary-blue)] hover:text-[var(--color-primary-blue)]">
                                                <Plus className="w-4 h-4" />
                                                Add Custom
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-5 space-y-12">
                        {/* Pricing */}
                        <div>
                            <h3 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Pricing
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 ring-1 ring-gray-100 dark:ring-slate-700 focus-within:ring-2 focus-within:ring-[var(--color-primary-blue)] transition-all">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-3">Base Price (INR)</label>
                                    <div className="flex items-center px-4 pb-2">
                                        <span className="text-2xl font-bold text-gray-400 mr-2">₹</span>
                                        <input
                                            value={formData.itemPrice}
                                            onChange={(e) => updateField('itemPrice', Number(e.target.value))}
                                            className="w-full bg-transparent border-0 p-0 text-3xl font-bold text-navy text-slate-900 dark:text-white focus:ring-0 placeholder:text-gray-200 outline-none"
                                            placeholder="0.00"
                                            type="number"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 focus-within:border-[var(--color-primary-blue)] transition-colors">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Taxes (%)</label>
                                        <input
                                            value={formData.taxAmount}
                                            onChange={(e) => updateField('taxAmount', Number(e.target.value))}
                                            className="w-full bg-transparent border-0 p-0 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-0 outline-none"
                                            placeholder="5%"
                                            type="number"
                                        />
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 focus-within:border-[var(--color-primary-blue)] transition-colors">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pkg. Fee (₹)</label>
                                        <input
                                            value={formData.packagingCharges}
                                            onChange={(e) => updateField('packagingCharges', Number(e.target.value))}
                                            className="w-full bg-transparent border-0 p-0 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-0 outline-none"
                                            placeholder="0.00"
                                            type="number"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Classification */}
                        <div>
                            <h3 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                                Classification
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-navy text-slate-900 dark:text-white">Service Type</label>
                                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
                                        {['Delivery', 'Dine-In', 'Both'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => updateField('serviceType', type)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${formData.serviceType === type ? 'bg-[var(--color-primary-blue)] text-white shadow-sm' : 'text-gray-500 hover:text-navy hover:text-slate-900 dark:hover:text-white'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-navy text-slate-900 dark:text-white">Food Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'veg', label: 'Veg', color: 'green' },
                                            { id: 'non_veg', label: 'Non-Veg', color: 'red' },
                                            { id: 'contains_egg', label: 'Egg', color: 'yellow' }
                                        ].map(type => (
                                            <label key={type.id} className="cursor-pointer relative">
                                                <input
                                                    className="peer sr-only"
                                                    name="food_type"
                                                    type="radio"
                                                    checked={formData.foodType === type.id}
                                                    onChange={() => updateField('foodType', type.id)}
                                                />
                                                <div className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all text-gray-500 ${formData.foodType === type.id ? `border-${type.color}-600 bg-${type.color}-50 text-${type.color}-700` : ''}`}>
                                                    <div className="size-3 border border-current flex items-center justify-center rounded-[1px] p-[1.5px]">
                                                        <div className="size-full rounded-full bg-current"></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold">{type.label}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attributes */}
                        <div>
                            <h3 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                Attributes
                            </h3>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500">Portion (Pcs)</label>
                                        <input
                                            value={formData.portionSize ?? ''}
                                            onChange={(e) => updateField('portionSize', Number(e.target.value))}
                                            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none"
                                            placeholder="4"
                                            type="number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500">Serves (Ppl)</label>
                                        <input
                                            value={formData.serves ?? ''}
                                            onChange={(e) => updateField('serves', Number(e.target.value))}
                                            className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none"
                                            placeholder="1"
                                            type="number"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500">Item Consistency</label>
                                    <select
                                        value={formData.itemType}
                                        onChange={(e) => updateField('itemType', e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none"
                                    >
                                        <option>Solid</option>
                                        <option>Liquid</option>
                                        <option>Semi-Solid</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500">Frosting Option</label>
                                    <select
                                        value={formData.isFrosting}
                                        onChange={(e) => updateField('isFrosting', e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-navy text-slate-900 dark:text-white focus:ring-2 focus:ring-[var(--color-primary-blue)]/10 focus:border-[var(--color-primary-blue)] transition-all outline-none"
                                    >
                                        <option>No</option>
                                        <option>Fresh</option>
                                        <option>Pre-Frosted</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};
