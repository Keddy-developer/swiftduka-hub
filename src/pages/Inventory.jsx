import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import {
  Plus, Search, Package, RefreshCw,
  ArrowDown, ArrowUp, X, Loader2, AlertTriangle,
  Truck, Layers, CheckCircle, ChevronDown
} from 'lucide-react';
import { toast } from 'react-toastify';

// ─── Shared Components ──────────────────────────────────────────────────
const StatTile = ({ label, value, icon: Icon, sub }) => (
  <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex items-center gap-4">
    <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0">
      <Icon className="w-4 h-4 text-slate-500" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-slate-900 leading-none mt-0.5">{value}</p>
      {sub && <p className="text-[8px] font-medium text-slate-400 mt-1 truncate">{sub}</p>}
    </div>
  </div>
);

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
      const { data } = await axiosInstance.get(`/products`, { params: { search: q, limit: 8 } });
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
    if (!selected) return toast.error('Please select a product');
    if (!quantity || parseInt(quantity) <= 0) return toast.error('Enter a valid quantity');
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/delivery/hubs/${hub.id}/inventory`, {
        productId: selected.id,
        quantity: parseInt(quantity),
        mode: 'add',
        notes: `Shipment received from ${supplier || 'Unknown Supplier'}. ${notes}`.trim()
      });
      toast.success(`${quantity} units of "${selected.name}" added to manifest`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Inbound sync failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[1px] bg-black/30">
      <div className="relative bg-white border border-slate-200 rounded shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-tight">Lock Inbound Stock</span>
          </div>
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Resource</label>
            {selected ? (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded p-3">
                <img src={selected.image} alt="" className="w-8 h-8 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-xs truncate">{selected.name}</p>
                  <p className="text-[9px] font-mono text-slate-400 font-medium">#{selected.sku || 'N/A'}</p>
                </div>
                <button type="button" onClick={() => { setSelected(null); setProductSearch(''); }} className="text-slate-300 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text" placeholder="Search SKU or Product Name..."
                  value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  className="w-full border border-slate-200 rounded pl-9 pr-4 py-2 text-xs font-medium outline-none focus:border-slate-400"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded shadow-lg max-h-[160px] overflow-y-auto">
                    {searchResults.map(p => (
                      <button key={p.id} type="button" onClick={() => { setSelected(p); setSearchResults([]); setProductSearch(''); }}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0"
                      >
                        <img src={p.image} alt="" className="w-6 h-6 rounded object-cover" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[8px] font-mono text-slate-400">SKU: {p.sku || 'N/A'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Units Received</label>
               <input type="number" min="1" placeholder="0" value={quantity} onChange={e => setQuantity(e.target.value)}
                 className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-bold outline-none focus:border-slate-900" required />
             </div>
             <div className="space-y-1.5">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supplier Name</label>
               <input type="text" placeholder="e.g. Jumia" value={supplier} onChange={e => setSupplier(e.target.value)}
                 className="w-full border border-slate-200 rounded px-3 py-2 text-xs font-medium focus:border-slate-400 outline-none" />
             </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reference / Note</label>
            <input type="text" placeholder="Internal tracking reference..." value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full border border-slate-200 rounded px-3 py-2 text-[10px] font-medium focus:border-slate-400 outline-none" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={submitting || !selected}
              className="flex-1 py-2 rounded bg-slate-900 text-white text-[10px] font-bold uppercase transition-all shadow-sm disabled:opacity-50"
            >
               {submitting ? 'PROCESSING...' : 'CONFIRM RECEIPT'}
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
    if (!q || q <= 0) return toast.error('Enter a valid quantity');
    setLoading(true);
    try {
      await axiosInstance.patch(`/delivery/hubs/${hub.id}/inventory`, {
        productId: item.productId,
        quantity: q,
        mode,
        notes: reason
      });
      toast.success(mode === 'add' ? `+${q} units stocked in` : `-${q} units adjusted out`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Adjustment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]">
      <div className="bg-white rounded border border-slate-200 shadow-2xl w-full max-w-sm p-6 overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Adjust Manifest Level</h3>
            <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">{item.product.name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-300 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded p-4 mb-6 flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Active Stock</span>
          <span className="text-xl font-bold text-slate-900 tracking-tighter">{item.quantity} UNITS</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMode('add')} className={`py-2 rounded text-[10px] font-bold uppercase transition-all border ${mode === 'add' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              Stock In
            </button>
            <button type="button" onClick={() => setMode('subtract')} className={`py-2 rounded text-[10px] font-bold uppercase transition-all border ${mode === 'subtract' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              Stock Out
            </button>
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Change Delta</label>
             <input type="number" min="1" placeholder="Units to adjust..." value={qty} onChange={e => setQty(e.target.value)}
               className="w-full border border-slate-300 rounded px-4 py-2.5 text-lg font-bold outline-none focus:border-slate-900" required />
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Operational Reason</label>
             <input type="text" placeholder="Internal justification..." value={reason} onChange={e => setReason(e.target.value)}
               className="w-full border border-slate-200 rounded px-3 py-2 text-[10px] font-medium focus:border-slate-400 outline-none" />
          </div>
          <button type="submit" disabled={loading}
            className={`w-full py-2.5 mt-2 rounded text-white text-[10px] font-bold uppercase shadow-sm transition-all ${mode === 'add' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
          >
             {loading ? 'SYNCHRONIZING...' : `COMMIT ${mode === 'add' ? 'STOCK IN' : 'STOCK OUT'}`}
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
      toast.error('Sync failure');
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

  if (loading) return <div className="p-8 text-slate-400 font-medium italic">Synchronizing stock ledger...</div>;

  return (
    <div className="space-y-6 md:space-y-8">
      {showReceiveModal && <ReceiveShipmentModal hub={hub} onClose={() => setShowReceiveModal(false)} onSuccess={() => fetchData(true)} />}
      {adjustItem && <AdjustModal item={adjustItem} hub={hub} onClose={() => setAdjustItem(null)} onSuccess={() => fetchData(true)} />}

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Stock Manifest</h2>
          <p className="text-[12px] md:text-sm text-slate-500 font-medium">Real-time inventory ledge for digital and physical reconciliation.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => fetchData(true)} className="px-4 py-2 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> RELOAD LEDGER
            </button>
            <button onClick={() => setShowReceiveModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-sm">
                <Plus size={14} /> NEW SHIPMENT
            </button>
        </div>
      </div>

      {/* ── KPI TILES ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatTile label="Unique SKUs" value={inventory.length} icon={Layers} />
          <StatTile label="Total Units" value={totalUnits.toLocaleString()} icon={Package} />
          <StatTile label="Low Stock" value={lowStockCount} icon={AlertTriangle} sub="Alert threshold met" />
          <StatTile label="Coverage" value={`${inventory.length > 0 ? Math.round(((inventory.length - lowStockCount) / inventory.length) * 100) : 100}%`} icon={CheckCircle} />
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input type="text" placeholder="Scan SKU or Search Stock..." value={search} onChange={e => setSearch(e.target.value)}
               className="w-full bg-white border border-slate-200 rounded pl-10 pr-4 py-2 text-sm font-medium outline-none focus:border-slate-400 transition-all" />
          </div>
          <button onClick={() => setFilterLowStock(f => !f)}
            className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-tight border transition-all flex items-center justify-center gap-2 ${filterLowStock ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500'}`}>
              <AlertTriangle className="w-3.5 h-3.5" /> {filterLowStock ? 'Low Stock Only' : 'Show All SKUs'}
          </button>
      </div>

      {/* ── LEDGER TABLE ── */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product Master</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inventory Level</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Last Sync</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Utility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 uppercase tracking-tight">
              {filtered.map(item => {
                const isLow = item.quantity <= (item.lowStockAlert ?? 10);
                const lastDate = item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : 'INITIAL';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-white border border-slate-200 p-0.5 flex-shrink-0">
                          {item.product?.image ? <img src={item.product.image} className="w-full h-full object-cover rounded" alt="" /> : <Package size={16} className="text-slate-200 m-auto" />}
                        </div>
                        <div className="min-w-0">
                           <p className="font-bold text-slate-900 text-xs truncate leading-tight">{item.product?.name}</p>
                           <p className="text-[9px] font-mono text-slate-400">SKU: {item.product?.sku || 'N/A'} · {item.product?.seller?.storeName || 'GENERIC'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-base font-bold text-slate-900">{item.quantity}</span>
                       <span className="text-[9px] text-slate-300 ml-1 font-bold">QTY</span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isLow ? 'bg-red-500' : 'bg-green-500'}`} />
                            <span className={`text-[10px] font-bold ${isLow ? 'text-red-600' : 'text-green-600'}`}>{isLow ? 'CRITICAL' : 'OPTIMAL'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-medium text-slate-400">{lastDate}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => setAdjustItem(item)} className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[9px] font-bold text-slate-600 hover:bg-slate-900 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                          ADJUST
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-16 text-center text-slate-400 text-[10px] font-bold italic uppercase tracking-widest border-t border-slate-50">Zero record matching current logistics filter.</div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
