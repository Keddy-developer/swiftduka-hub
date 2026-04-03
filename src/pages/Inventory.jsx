import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import {
  Plus, Search, Filter, Package, RefreshCw,
  ArrowDown, ArrowUp, X, Loader2, AlertTriangle,
  Truck, Layers, CheckCircle, ChevronDown, BarChart2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

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
      toast.success(`✅ ${quantity} units of "${selected.name}" received into hub`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to receive shipment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black">Receive Shipment</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white/70 text-sm font-medium">Log inbound stock for <span className="text-white font-bold">{hub?.name}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Product Search */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Product</label>
            {selected ? (
              <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <img src={selected.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{selected.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 uppercase">{selected.sku || 'No SKU'}</p>
                </div>
                <button type="button" onClick={() => { setSelected(null); setProductSearch(''); }} className="text-slate-400 hover:text-rose-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
                {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 top-full mt-2 w-full bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
                    {searchResults.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setSelected(p); setSearchResults([]); setProductSearch(''); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <img src={p.image} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{p.sku || 'No SKU'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units Received</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 50"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full border border-slate-200 rounded-2xl px-5 py-3.5 text-2xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              required
            />
          </div>

          {/* Supplier & Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</label>
              <input
                type="text"
                placeholder="e.g. Jumia Express"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference / Note</label>
              <input
                type="text"
                placeholder="e.g. PO-2026-001"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selected}
              className="flex-1 py-3.5 rounded-2xl bg-primary text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {submitting ? 'Processing...' : 'Confirm Receipt'}
            </button>
          </div>
        </form>
      </motion.div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm mx-4 p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-slate-900">Adjust Stock</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5 truncate max-w-[200px]">{item.product.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-all">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-500">Current Stock</span>
          <span className="text-3xl font-black text-slate-900">{item.quantity} <span className="text-slate-300 text-lg">units</span></span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setMode('add')} className={`py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all border ${mode === 'add' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500'}`}>
              <ArrowDown className="w-4 h-4" /> Stock In
            </button>
            <button type="button" onClick={() => setMode('subtract')} className={`py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all border ${mode === 'subtract' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-500'}`}>
              <ArrowUp className="w-4 h-4" /> Stock Out
            </button>
          </div>
          <input
            type="number" min="1" placeholder="Quantity"
            value={qty} onChange={e => setQty(e.target.value)}
            className="w-full border border-slate-200 rounded-2xl px-5 py-3.5 text-xl font-black text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            required
          />
          <input
            type="text" placeholder="Reason (optional)"
            value={reason} onChange={e => setReason(e.target.value)}
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            type="submit" disabled={loading}
            className={`w-full py-3.5 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'add' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-100' : 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-100'} disabled:opacity-50`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Saving...' : `Confirm ${mode === 'add' ? 'Stock In' : 'Stock Out'}`}
          </button>
        </form>
      </motion.div>
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
    setLoading(true);
    if (!hub?.id) {
       setLoading(false);
       return;
    }
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await axiosInstance.get(`/delivery/hubs/${hub.id}/inventory`);
      setInventory(data.inventory || []);
    } catch {
      toast.error('Failed to sync inventory manifest');
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 space-y-4">
        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <p className="text-slate-400 font-bold text-sm">Syncing inventory manifest...</p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showReceiveModal && (
          <ReceiveShipmentModal hub={hub} onClose={() => setShowReceiveModal(false)} onSuccess={() => fetchData(true)} />
        )}
        {adjustItem && (
          <AdjustModal item={adjustItem} hub={hub} onClose={() => setAdjustItem(null)} onSuccess={() => fetchData(true)} />
        )}
      </AnimatePresence>

      <div className="space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none mb-3">Inventory Ledger</h1>
            <p className="text-slate-500 font-medium">Real-time stock manifest for <span className="text-slate-800 font-bold">{hub?.name}</span></p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchData(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowReceiveModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Receive Shipment
            </button>
          </div>
        </div>

        {/* ── Stats Strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total SKUs', value: inventory.length, icon: Layers, color: 'text-primary bg-primary/10' },
            { label: 'Total Units', value: totalUnits.toLocaleString(), icon: Package, color: 'text-violet-600 bg-violet-50' },
            { label: 'Low Stock', value: lowStockCount, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
            { label: 'Coverage', value: `${inventory.length > 0 ? Math.round(((inventory.length - lowStockCount) / inventory.length) * 100) : 100}%`, icon: BarChart2, color: 'text-emerald-600 bg-emerald-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-[1.5rem] border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black text-slate-900 leading-none mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search & Filters ── */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-2 flex flex-col md:flex-row gap-2 shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Scan/Type SKU, Product Name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50/50 border-none rounded-2xl pl-16 pr-6 py-4 font-bold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>
          <button
            onClick={() => setFilterLowStock(f => !f)}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-xs font-bold transition-all border ${filterLowStock ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="uppercase tracking-widest">{filterLowStock ? 'Low Stock Only' : 'All Items'}</span>
            {lowStockCount > 0 && (
              <span className="bg-amber-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {lowStockCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left table-auto">
            <thead className="bg-[#F8FAFC] border-b border-slate-100">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource & SKU</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Level</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Health</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Restocked</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(item => {
                const isLow = item.quantity <= (item.lowStockAlert ?? 10);
                const lastDate = item.lastRestocked
                  ? new Date(item.lastRestocked).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
                  : 'Never';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 p-1 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                          {item.product?.image
                            ? <img src={item.product.image} className="w-full h-full object-cover rounded-xl" alt="" />
                            : <Package className="w-6 h-6 text-slate-300" />}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 leading-none mb-1.5">{item.product?.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded border border-slate-100">
                              {item.product?.sku || 'No SKU'}
                            </span>
                            {item.product?.seller?.storeName && (
                              <>
                                <span className="text-slate-200">|</span>
                                <span className="text-[10px] font-black text-primary uppercase">{item.product.seller.storeName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                        {item.quantity} <span className="text-slate-300 text-base ml-0.5">units</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Alert at {item.lowStockAlert ?? 10}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isLow ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 shadow-sm shadow-emerald-200'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {isLow ? 'Critical' : 'Healthy'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-slate-500">{lastDate}</span>
                    </td>
                    <td className="px-10 py-5 text-right">
                      <button
                        onClick={() => setAdjustItem(item)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/20 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 duration-200"
                      >
                        <Layers className="w-3.5 h-3.5" /> Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-24 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-[1.5rem] bg-slate-50 flex items-center justify-center mb-6">
                        <Package className="w-10 h-10 text-slate-200" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">
                        {filterLowStock ? 'No Low Stock Items' : 'Inventory Manifest Empty'}
                      </h3>
                      <p className="text-slate-400 mt-2 font-medium max-w-xs">
                        {filterLowStock
                          ? 'All items are sufficiently stocked.'
                          : 'Use "Receive Shipment" to log your first inbound stock.'}
                      </p>
                      {!filterLowStock && (
                        <button
                          onClick={() => setShowReceiveModal(true)}
                          className="mt-6 flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                          <Plus className="w-4 h-4" /> Receive First Shipment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Inventory;
