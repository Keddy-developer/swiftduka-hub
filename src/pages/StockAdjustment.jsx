import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';
import { 
    ArrowLeft, Package, AlertTriangle, CheckCircle, 
    XCircle, Info, Loader2, Save, Trash2, ShieldCheck,
    History, MapPin, BadgeInfo
} from 'lucide-react';
import { AuditService } from '../utils/AuditService';

const StockAdjustment = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hub } = useAuth();
    
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [qty, setQty] = useState('');
    const [mode, setMode] = useState('add');
    const [reason, setReason] = useState('');
    const [reference, setReference] = useState('');

    useEffect(() => {
        fetchItem();
    }, [id]);

    const fetchItem = async () => {
        try {
            setLoading(true);
            const { data } = await axiosInstance.get(`/delivery/hubs/${hub.id}/inventory`);
            // Find specific item from list
            const found = data.inventory.find(inv => inv.id === id);
            if (!found) {
                toast.error("Item not found in this hub");
                navigate('/inventory');
                return;
            }
            setItem(found);
        } catch (err) {
            toast.error("Failed to load inventory details");
            navigate('/inventory');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to remove ${item.product?.name} from hub inventory? This will decommission the stock record.`)) return;
        
        setSaving(true);
        try {
            await axiosInstance.delete(`/delivery/hubs/${hub.id}/inventory`, {
                params: { productId: item.productId }
            });
            
            toast.success('Product decommissioned from hub');
            
            AuditService.logAction(hub.id, 'INVENTORY_DECOMMISSION', {
                message: `Decommissioned ${item.product?.name} via Adjustment Page`,
                sku: item.product?.sku
            });

            navigate('/inventory');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Deletion failure');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const q = parseInt(qty);
        if (!q || q <= 0) return toast.error('Please enter a valid quantity');
        if (!reason) return toast.error('Please provide a reason for adjustment');
        if (mode === 'subtract' && !reference) return toast.error('Reference (Order ID/Tracking) is required for stock removal');

        setSaving(true);
        try {
            await axiosInstance.patch(`/delivery/hubs/${hub.id}/inventory`, {
                productId: item.productId,
                quantity: q,
                mode,
                notes: reason,
                reference: reference
            });
            
            toast.success('Inventory manifest synchronized');
            
            // Audit log
            AuditService.logAction(hub.id, 'STOCK_ADJUSTMENT_PAGE', {
                message: `${mode === 'add' ? 'Incremented' : 'Decremented'} ${q} units - ${item.product?.name}`,
                sku: item.product?.sku,
                ref: reference,
                reason: reason
            });

            navigate('/inventory');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Sync failure');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-slate-200 animate-spin" />
            </div>
        );
    }

    const currentStock = item.quantity || 0;
    const projectedStock = mode === 'add' ? currentStock + (parseInt(qty) || 0) : Math.max(0, currentStock - (parseInt(qty) || 0));
    const isLow = currentStock <= (item.lowStockAlert || 10);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/inventory')}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 shadow-sm transition-all hover:shadow-md"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock Adjustment Authority</h1>
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">Manual Inventory Synchronization Override</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Product Info Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden relative group">
                        <div className="w-24 h-24 bg-slate-50 rounded-2xl border border-slate-100 p-2 mx-auto mb-6 shadow-inner">
                            {item.product?.image ? (
                                <img src={item.product.image} className="w-full h-full object-cover rounded-xl shadow-sm" alt="" />
                            ) : (
                                <Package className="w-full h-full text-slate-200 p-4" />
                            )}
                        </div>
                        <div className="text-center">
                            <h2 className="font-black text-slate-900 text-lg leading-tight tracking-tight mb-2 px-4 italic">{item.product?.name}</h2>
                            <span className="text-[10px] font-mono font-black py-1 px-3 bg-slate-100 text-slate-500 rounded-full">#{item.product?.sku}</span>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                <span>Owner</span>
                                <span className="text-slate-900">{item.product?.seller?.storeName || 'PLATFORM'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                <span>Current Available</span>
                                <span className={`text-sm ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{currentStock} PCS</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                <span>Storage Hub</span>
                                <span className="text-slate-900">{hub?.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex gap-3">
                            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                            <div>
                                <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest">Compliance Protocol</h4>
                                <p className="text-[11px] font-medium text-amber-700/80 mt-1 leading-relaxed">
                                    Manual adjustments are audited in real-time. Sellers will receive a reconciliation notice. For stock-outs, valid documentation is mandatory.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Adjustment Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-10 relative overflow-hidden">
                        
                        {/* Summary Visualization */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-6 rounded-2xl border-2 text-center transition-all cursor-pointer ${mode === 'add' ? 'bg-slate-900 border-slate-900 shadow-2xl scale-105' : 'bg-white border-slate-100 grayscale opacity-60'}`} onClick={() => setMode('add')}>
                                <ArrowLeft className="w-6 h-6 text-green-400 mx-auto mb-3 rotate-90" />
                                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-1 block">Operation</span>
                                <span className={`text-xl font-black italic ${mode === 'add' ? 'text-white' : 'text-slate-900'}`}>Stock In</span>
                            </div>
                            <div className={`p-6 rounded-2xl border-2 text-center transition-all cursor-pointer ${mode === 'subtract' ? 'bg-rose-600 border-rose-600 shadow-2xl scale-105' : 'bg-white border-slate-100 grayscale opacity-60'}`} onClick={() => setMode('subtract')}>
                                <ArrowLeft className="w-6 h-6 text-white mx-auto mb-3 -rotate-90" />
                                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-rose-200 mb-1 block">Operation</span>
                                <span className={`text-xl font-black italic ${mode === 'subtract' ? 'text-white' : 'text-slate-900'}`}>Stock Out</span>
                            </div>
                        </div>

                        <div className="space-y-8">
                             {/* Quantity Input */}
                            <div className="space-y-4">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase px-1">
                                    <BadgeInfo className="w-3.5 h-3.5" /> Adjustment Delta Units
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        min="1"
                                        placeholder="Quantity to adjust..."
                                        value={qty}
                                        onChange={e => setQty(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-6 text-4xl font-black outline-none focus:bg-white focus:border-slate-900 transition-all text-center group-hover:bg-white shadow-inner"
                                        required
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 tracking-tighter">PCS</div>
                                </div>
                                <div className="flex justify-center">
                                    <div className="bg-slate-100 rounded-full px-4 py-1.5 flex items-center gap-3">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Projection:</span>
                                        <span className="text-xs font-black text-slate-900">{currentStock} ➔ {projectedStock}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Reference / Reason Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase px-1">Reference Identifier</label>
                                    <div className="relative">
                                        <History className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <input 
                                            type="text" 
                                            placeholder={mode === 'subtract' ? "ORDER ID (Required)" : "Order ID (Optional)"}
                                            value={reference}
                                            onChange={e => setReference(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-sm transition-all"
                                            required={mode === 'subtract'}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase px-1">Justification Reason</label>
                                    <div className="relative">
                                        <Edit2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <select 
                                            value={reason}
                                            onChange={e => setReason(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-xs font-bold outline-none focus:border-slate-900 shadow-sm transition-all appearance-none"
                                            required
                                        >
                                            <option value="">Select Reason...</option>
                                            {mode === 'add' ? (
                                                <>
                                                    <option value="New Shipment Received">New Shipment Received</option>
                                                    <option value="Return to Inventory">Return to Inventory</option>
                                                    <option value="Inventory Reconciliation">Inventory Reconciliation</option>
                                                    <option value="System Correction">System Correction</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="Order Fulfillment">Order Fulfillment</option>
                                                    <option value="Quality Control Rejection">Quality Control Rejection</option>
                                                    <option value="Damaged in Storage">Damaged in Storage</option>
                                                    <option value="Inventory Reconciliation">Inventory Reconciliation</option>
                                                    <option value="Expired Stock Removal">Expired Stock Removal</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button 
                                type="submit" 
                                disabled={saving}
                                className={`w-full py-5 rounded-2xl text-white text-[11px] font-black tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-3 uppercase ${mode === 'add' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-rose-600 hover:bg-rose-700'} disabled:opacity-50 active:scale-95`}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> SYNCHRONIZING...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" /> COMMIT ADJUSTMENT
                                    </>
                                )}
                            </button>

                            <button 
                                type="button" 
                                onClick={handleDelete}
                                disabled={saving}
                                className="w-full py-4 mt-4 bg-white border border-rose-100 text-rose-500 rounded-2xl text-[10px] font-black tracking-[0.3em] hover:bg-rose-50 transition-all flex items-center justify-center gap-3 uppercase disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" /> DECOMMISSION PRODUCT
                            </button>
                        </div>

                        {/* Visual Decor */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none">
                            <Package size={180} />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Required for route definition
const Edit2 = ({ size, className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

export default StockAdjustment;
