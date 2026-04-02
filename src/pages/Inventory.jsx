import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import { 
  Plus, Search, Filter, Package, AlertTriangle, 
  RefreshCw, Layers, ArrowDown, ArrowUp, Edit3 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const Inventory = () => {
  const { hub } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    if (!hub?.id) return;
    try {
      const { data } = await axiosInstance.get(`/delivery/hubs/${hub.id}/inventory`);
      setInventory(data.inventory || []);
    } catch (err) {
      toast.error("Manifest failed to sync");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hub]);

  const updateStock = async (productId, quantity, mode) => {
    try {
      await axiosInstance.patch(`/delivery/hubs/${hub.id}/inventory`, {
        productId,
        quantity,
        mode
      });
      toast.success(mode === 'add' ? "Stock inbound successful" : "Level adjusted");
      fetchData();
    } catch (err) {
      toast.error("Stock sync conflict: check ledger");
    }
  };

  const filtered = inventory.filter(item => 
    item.product.name.toLowerCase().includes(search.toLowerCase()) ||
    item.product.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* 🚀 HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none mb-3">Inventory Ledger</h1>
            <p className="text-slate-500 font-medium">Real-time stock manifest for {hub?.name}</p>
         </div>
         <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
               <RefreshCw className="w-4 h-4" /> Global Refresh
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-bold hover:bg-primary-900 transition-all shadow-xl shadow-primary/20">
               <Plus className="w-4 h-4" /> Receive Shipment
            </button>
         </div>
      </div>

      {/* 🔍 SEARCH & FILTERS */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-2 flex flex-col md:flex-row gap-2 shadow-sm">
         <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Scan/Type SKU, Name or UPC..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50/50 border-none rounded-2xl pl-16 pr-6 py-4 font-bold text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all" 
            />
         </div>
         <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
               <Filter className="w-4 h-4 text-slate-400" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filters Off</span>
            </div>
         </div>
      </div>

      {/* 📋 TABLE AREA */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
         <table className="w-full text-left table-auto">
            <thead className="bg-[#F8FAFC] border-b border-slate-100">
               <tr>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource & Intelligent SKU</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</th>
                  <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Health</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Adjust Stock</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {filtered.map((item, idx) => (
                 <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                       <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 p-1 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                             <img src={item.product.image} className="w-full h-full object-cover rounded-xl" alt="" />
                          </div>
                          <div>
                             <h4 className="font-extrabold text-slate-900 leading-none mb-2">{item.product.name}</h4>
                             <div className="flex items-center gap-3">
                                <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded border border-slate-100">{item.product.sku}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-[10px] font-black text-primary uppercase">{item.product.seller?.storeName || 'Merchant'}</span>
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-6 text-center md:text-left">
                       <div className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-1">{item.quantity} <span className="text-slate-300 ml-1">Units</span></div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Available for Pick</p>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.quantity <= item.lowStockAlert ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 shadow-lg shadow-emerald-100'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${item.quantity <= item.lowStockAlert ? 'text-rose-600' : 'text-emerald-700'}`}>
                             {item.quantity <= item.lowStockAlert ? 'Critical Level' : 'Optimized'}
                          </span>
                       </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <button 
                            onClick={() => updateStock(item.productId, 10, 'add')}
                            className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-900 transition-all tooltip" 
                            title="Inbound Restock"
                          >
                             <ArrowDown className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => updateStock(item.productId, 1, 'subtract')}
                            className="bg-white border border-slate-200 text-slate-700 p-3 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                            title="Adjustment Out"
                          >
                             <ArrowUp className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                 </tr>
               ))}
               {filtered.length === 0 && (
                 <tr>
                    <td colSpan="4" className="py-24 text-center">
                       <div className="flex flex-col items-center">
                          <Package className="w-16 h-16 text-slate-100 mb-6" />
                          <h3 className="text-xl font-bold text-slate-900">Resource Manifest Empty</h3>
                          <p className="text-slate-400 mt-2 font-medium">Scanning all segments... No matching resource found.</p>
                       </div>
                    </td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default Inventory;
