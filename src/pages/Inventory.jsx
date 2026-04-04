import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import {
  Plus, Search, Package, RefreshCw,
  ArrowDown, ArrowUp, X, Loader2, AlertTriangle,
  Truck, Layers, CheckCircle, ChevronDown, MoreVertical,
  Edit2, Trash2, ExternalLink
} from 'lucide-react';
import { toast } from 'react-toastify';
import LogisticsAuditTrail from '../components/LogisticsAuditTrail';

// ─── Shared Components ──────────────────────────────────────────────────
const StatTile = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'border-blue-500 text-blue-600 bg-blue-50/30',
    amber: 'border-amber-500 text-amber-600 bg-amber-50/30',
    green: 'border-green-500 text-green-600 bg-green-50/30',
    slate: 'border-slate-500 text-slate-600 bg-slate-50/30'
  };

  return (
    <div className={`border-l-4 p-4 bg-white border border-y-slate-200 border-r-slate-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${colors[color] || colors.slate}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <Icon className="w-4 h-4 opacity-30" />
      </div>
      <p className="text-2xl font-black text-slate-900 leading-none tracking-tighter">{value}</p>
    </div>
  );
};

// ─── Receive Shipment Modal ──────────────────────────────────────────────────
const ReceiveShipmentModal = ({ hub, onClose, onSuccess }) => {
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const searchProducts = useCallback(async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      // Adjusted to use explicit query params as per backend requirements
      const { data } = await axiosInstance.get(`/products`, { params: { search: q, limit: 10 } });
      setSearchResults(data?.data || data?.products || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productSearch), 300);
    return () => clearTimeout(t);
  }, [productSearch, searchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return toast.error('Selection required');
    if (!quantity || parseInt(quantity) <= 0) return toast.error('Invalid quantity');
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/delivery/hubs/${hub.id}/inventory`, {
        productId: selected.id,
        quantity: parseInt(quantity),
        mode: 'add',
        notes: `INBOUND: ${supplier || 'Direct Inbound'}. ${notes}`.trim()
      });
      toast.success('Inventory manifest updated');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Sync error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 bg-slate-900 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Lock Inbound Stock</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Physical Inventory Reconciliation</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Asset</label>
            {selected ? (
              <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
                <img src={selected.image} alt="" className="w-12 h-12 rounded bg-white object-cover border border-blue-200 shadow-sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">{selected.name}</p>
                  <p className="text-[10px] font-mono text-blue-600 font-black">SKU: {selected.sku || 'N/A'}</p>
                </div>
                <button type="button" onClick={() => { setSelected(null); setProductSearch(''); }} className="p-2 text-slate-400 hover:text-rose-600 bg-white rounded-full shadow-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" placeholder="Scan SKU or Search Product Catalog..."
                  value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-slate-900 shadow-sm transition-all"
                />
                {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[240px] overflow-y-auto no-scrollbar border-t-0 p-1">
                    {searchResults.map(p => (
                      <button key={p.id} type="button" onClick={() => { setSelected(p); setSearchResults([]); setProductSearch(''); }}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 text-left rounded-lg transition-colors group"
                      >
                        <img src={p.image} alt="" className="w-10 h-10 rounded object-cover shadow-sm grayscale group-hover:grayscale-0 transition-all" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{p.name}</p>
                          <p className="text-[9px] font-mono text-slate-400 font-bold tracking-widest mt-0.5">{p.sku || 'NO-SKU'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity Received</label>
               <input type="number" min="1" placeholder="Units Count" value={quantity} onChange={e => setQuantity(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-lg font-black outline-none focus:bg-white focus:border-slate-900 shadow-sm transition-all" required />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier Entity</label>
               <input type="text" placeholder="Vendor / Store" value={supplier} onChange={e => setSupplier(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-slate-900 shadow-sm transition-all" />
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logistics Notes</label>
            <textarea placeholder="Condition reports, batch numbers, or tactical notes..." value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs font-medium outline-none focus:bg-white focus:border-slate-900 shadow-sm transition-all resize-none h-24" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 rounded text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={submitting || !selected}
              className="flex-1 py-3 bg-slate-900 text-white rounded text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
            >
               {submitting ? 'Syncing...' : 'Confirm Inbound'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Adjust Stock Modal ──────────────────────────────────────────────────────
const AdjustModal = ({ item, hub, onClose, onSuccess }) => {
  const [qty, setQty] = useState('');
  const [mode, setMode] = useState('add');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const q = parseInt(qty);
    if (!q || q <= 0) return toast.error('Invalid delta');
    setLoading(true);
    try {
      await axiosInstance.patch(`/delivery/hubs/${hub.id}/inventory`, {
        productId: item.productId,
        quantity: q,
        mode,
        notes: `ADJUSTMENT: ${reason}`
      });
      toast.success('Manifest reconciled');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Adjustment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-8">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Reconcile Units</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">{item.product?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-900 rounded-xl p-5 mb-8 text-center border-4 border-slate-800 shadow-xl">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Active Hub Manifest</span>
          <span className="text-4xl font-black text-white tracking-tighter">{item.quantity}</span>
          <span className="text-[12px] font-black text-slate-500 uppercase ml-2 tracking-widest">PCS</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex p-1 bg-slate-100 rounded-lg">
            <button type="button" onClick={() => setMode('add')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${mode === 'add' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Stock In
            </button>
            <button type="button" onClick={() => setMode('subtract')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${mode === 'subtract' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-rose-600'}`}>
              Stock Out
            </button>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adjustment Delta</label>
             <input type="number" min="1" placeholder="Units to sync..." value={qty} onChange={e => setQty(e.target.value)}
               className={`w-full border-2 rounded-lg px-4 py-3 text-2xl font-black outline-none transition-all text-center ${
                 mode === 'add' ? 'border-slate-100 focus:border-slate-900' : 'border-rose-100 focus:border-rose-600'
               }`} required />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tactical Reason</label>
             <input type="text" placeholder="e.g. Damage, Transfer, Shrinkage" value={reason} onChange={e => setReason(e.target.value)}
               className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
          </div>

          <button type="submit" disabled={loading}
            className={`w-full py-4 mt-2 rounded-lg text-white text-[11px] font-black uppercase tracking-widest shadow-xl transition-all ${
              mode === 'add' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-rose-600 hover:bg-rose-700'
            } disabled:opacity-50`}
          >
             {loading ? 'SYNCHRONIZING...' : `Commit ${mode === 'add' ? 'Inbound' : 'Outbound'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Main Inventory Page ─────────────────────────────────────────────────────
const Inventory = () => {
  const { hub } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!hub?.id) return setLoading(false);
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await axiosInstance.get(`/delivery/hubs/${hub.id}/inventory`);
      setInventory(data.inventory || []);
    } catch {
      toast.error('Network sync failure');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hub]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const lowStockCount = inventory.filter(i => i.quantity <= (i.lowStockAlert ?? 10)).length;
  const totalUnits = inventory.reduce((s, i) => s + i.quantity, 0);

  const filtered = inventory.filter(item => {
    const matchesSearch =
      item.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.product?.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterLowStock ? item.quantity <= (item.lowStockAlert ?? 10) : true;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 opacity-50">
      <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-400" />
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Retrieving Stock Manifest...</span>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
      {showReceiveModal && <ReceiveShipmentModal hub={hub} onClose={() => setShowReceiveModal(false)} onSuccess={() => fetchData(true)} />}
      {adjustItem && <AdjustModal item={adjustItem} hub={hub} onClose={() => setAdjustItem(null)} onSuccess={() => fetchData(true)} />}

      {/* ── ALIBABA STYLE TOP NAV ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Stock Manifest</h1>
          <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-wide mt-1">Real-time Node Inventory Control</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => fetchData(true)} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Sync
            </button>
            <button onClick={() => setShowReceiveModal(true)} className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded text-[10px] font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 uppercase tracking-widest">
                <Plus size={16} /> Inbound
            </button>
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          <StatTile label="Unique SKUs" value={inventory.length} icon={Layers} color="slate" />
          <StatTile label="Total Units" value={totalUnits.toLocaleString()} icon={Package} color="blue" />
          <StatTile label="Critical Level" value={lowStockCount} icon={AlertTriangle} color="amber" />
          <StatTile label="Node Health" value={`${inventory.length > 0 ? Math.round(((inventory.length - lowStockCount) / inventory.length) * 100) : 100}%`} icon={CheckCircle} color="green" />
      </div>

      {/* ── SEARCH & FILTERS ── */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
          <div className="flex-1 relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
             <input type="text" placeholder="Scan SKU / Search Asset Catalog..." value={search} onChange={e => setSearch(e.target.value)}
               className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-slate-900 transition-all" />
          </div>
          <div className="flex gap-2">
             <button onClick={() => setFilterLowStock(f => !f)}
               className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 whitespace-nowrap ${filterLowStock ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                 <AlertTriangle className="w-3.5 h-3.5" /> {filterLowStock ? 'Filter Active' : 'Low Stock Only'}
             </button>
          </div>
      </div>

      {/* ── INVENTORY LEDGER (MOBILE OPTIMIZED) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(item => (
          <InventoryCard 
            key={item.id} 
            item={item} 
            onAdjust={() => setAdjustItem(item)} 
          />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl opacity-40">
             <Package size={48} className="mx-auto mb-4 text-slate-300 animate-pulse" />
             <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Zero Record Delta</h3>
             <p className="text-[10px] font-bold text-slate-400 mt-2">No assets matching current logistics parameters.</p>
          </div>
        )}
      </div>

      {/* ── AUDIT TRAIL ── */}
      <div className="pt-10 border-t border-slate-200">
         <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Inbound & Internal Audit</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Recent physical inventory reconciliations</p>
         </div>
         <LogisticsAuditTrail hubId={hub.id} filterType="INVENTORY" />
      </div>

      <div className="md:hidden h-20" /> {/* Mobile bottom spacer */}
    </div>
  );
};

const InventoryCard = ({ item, onAdjust }) => {
  const isLow = item.quantity <= (item.lowStockAlert ?? 10);
  const lastDate = item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'INITIAL';

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative">
       <div className="p-4 flex gap-4">
          <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-100 p-1 flex-shrink-0 relative overflow-hidden">
             {item.product?.image ? (
               <img src={item.product.image} className="w-full h-full object-cover rounded shadow-sm group-hover:scale-110 transition-transform duration-500" alt="" />
             ) : (
               <Package size={24} className="text-slate-200 m-auto" />
             )}
             {isLow && (
                <div className="absolute top-0 right-0 p-1 bg-amber-500 shadow-lg">
                   <AlertTriangle className="w-2.5 h-2.5 text-white" />
                </div>
             )}
          </div>
          <div className="min-w-0 flex-1">
             <div className="flex justify-between items-start">
                <h3 className="font-black text-slate-900 text-xs truncate leading-tight uppercase tracking-tight pr-4">{item.product?.name}</h3>
                <button onClick={onAdjust} className="text-slate-300 hover:text-slate-900 transition-colors">
                   <MoreVertical className="w-4 h-4" />
                </button>
             </div>
             <p className="text-[9px] font-mono text-slate-400 font-black mt-1 font-bold">#{item.product?.sku || 'NO-SKU'}</p>
             <p className="text-[10px] font-bold text-slate-500 mt-2 truncate italic">{item.product?.seller?.storeName || 'PLATFORM ASSET'}</p>
          </div>
       </div>

       <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Manifest</span>
             <span className={`text-xl font-black tracking-tighter ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                {item.quantity.toLocaleString()} <span className="text-[10px] uppercase font-bold text-slate-400">Pcs</span>
             </span>
          </div>
          <div className="text-right">
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Last Sync</span>
             <p className="text-[10px] font-black text-slate-900 uppercase mt-1">{lastDate}</p>
          </div>
       </div>

       <div className="absolute bottom-0 left-0 h-1 bg-blue-600 transition-all duration-300 w-0 group-hover:w-full opacity-0 group-hover:opacity-100"></div>
    </div>
  );
};

export default Inventory;
