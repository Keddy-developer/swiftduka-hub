import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, MapPin, Truck, Box, Edit2, 
  Trash2, Globe, ArrowRight, Save, X, Navigation,
  Home, Phone, Mail, Clock, Layout, List
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';

/**
 * LogisticsPage - Hub Manager Portal
 * 
 * Centralized dashboard for managing Hub-specific:
 * 1. Pickup Stations (BOUND to Hub & Zone)
 * 2. Delivery Areas (BOUND to Hub & Zone)
 */
const Logistics = () => {
  const { hub } = useAuth();
  const [activeTab, setActiveTab] = useState('stations'); // 'stations' | 'areas'
  const [stations, setStations] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (hub?.id) {
      fetchData();
    }
  }, [hub, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'stations' ? 'pickup-stations' : 'delivery-areas';
      const { data } = await axiosInstance.get(`/delivery/hubs/${hub.id}/${endpoint}`);
      if (activeTab === 'stations') {
        setStations(data.stations || []);
      } else {
        setAreas(data.areas || []);
      }
    } catch (err) {
      toast.error(`Failed to load ${activeTab === 'stations' ? 'stations' : 'areas'}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData(activeTab === 'stations' ? {
        name: '', address: '', town: hub?.town || '', county: hub?.county || '',
        phone: '', email: '', openingHours: '08:00 - 18:00'
      } : {
        name: '', fee: 0, town: hub?.town || '', county: hub?.county || '',
        address: '', freeDeliveryEligibility: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === 'stations' ? 'pickup-stations' : 'delivery-areas';
      if (editingItem) {
        const idField = activeTab === 'stations' ? 'stationId' : 'areaId';
        await axiosInstance.put(`/delivery/hubs/${hub.id}/${endpoint}/${editingItem.id}`, formData);
        toast.success(`${activeTab === 'stations' ? 'Station' : 'Area'} updated successfully.`);
      } else {
        await axiosInstance.post(`/delivery/hubs/${hub.id}/${endpoint}`, formData);
        toast.success(`New ${activeTab === 'stations' ? 'Station' : 'Area'} created.`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed.");
    }
  };

  const filteredItems = (activeTab === 'stations' ? stations : areas).filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.town?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 🏙️ LOGISTICS COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Globe className="text-blue-600" size={32} />
             Hub Logistics Command
          </h1>
          <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
             Manage decentralized logistics infrastructure for {hub?.name}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
           <Shield className="text-blue-600" size={16} />
           <span className="text-[10px] font-black text-blue-900 uppercase tracking-tight">System Managed Infrastructure</span>
        </div>
      </div>

      {/* 🧭 NAVIGATION TABS */}
      <div className="flex gap-2 p-1.5 bg-slate-100/50 border border-slate-200 rounded-2xl max-w-md shadow-inner">
        <TabButton 
          active={activeTab === 'stations'} 
          onClick={() => setActiveTab('stations')}
          icon={Box}
          label="My Pickup Stations"
        />
        <TabButton 
          active={activeTab === 'areas'} 
          onClick={() => setActiveTab('areas')}
          icon={Navigation}
          label="My Delivery Areas"
        />
      </div>

      {/* 🔍 SEARCH & FILTERS */}
      <div className="relative group max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
        <input 
          type="text" 
          placeholder={`Search ${activeTab === 'stations' ? 'stations' : 'areas'} in node...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all shadow-sm"
        />
      </div>

      {/* 📦 CONTENT GRID */}
      {loading ? (
        <LoadingState />
      ) : filteredItems.length === 0 ? (
        <EmptyState 
           type={activeTab} 
           hasSearch={!!searchTerm} 
           onAdd={() => handleOpenModal()} 
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {filteredItems.map(item => (
             <LogisticsCard 
                key={item.id} 
                item={item} 
                type={activeTab} 
                onEdit={() => handleOpenModal(item)}
             />
           ))}
        </div>
      )}

      {/* 🏗️ MANAGEMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div>
                   <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                     {editingItem ? 'Update Configuration' : 'Infrastructure View'}
                   </h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                     Node Zone: {hub?.zoneId || 'AUTO_ASSIGN'}
                   </p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                    <X size={20} strokeWidth={3} />
                 </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Name / Identifier</label>
                       <input 
                          required
                          value={formData.name || ''} 
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none"
                          placeholder="e.g. Malindi CBD HUB-1"
                       />
                    </div>
                    {activeTab === 'areas' && (
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Standard Delivery Fee (KES)</label>
                          <input 
                            required
                            type="number"
                            value={formData.fee || 0} 
                            onChange={e => setFormData({...formData, fee: e.target.value})}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none"
                          />
                       </div>
                    )}
                    {activeTab === 'stations' && (
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Contact Phone</label>
                          <input 
                            required
                            value={formData.phone || ''} 
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none"
                          />
                       </div>
                    )}
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Physical Location Address</label>
                    <textarea 
                       required
                       value={formData.address || ''} 
                       onChange={e => setFormData({...formData, address: e.target.value})}
                       className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white transition-all outline-none h-24"
                       placeholder="Detailed location description..."
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Town</label>
                       <input 
                          disabled
                          value={formData.town || ''} 
                          className="w-full px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">County</label>
                       <input 
                          disabled
                          value={formData.county || ''} 
                          className="w-full px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed"
                       />
                    </div>
                 </div>

                 {activeTab === 'areas' && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                       <input 
                         type="checkbox"
                         id="free-del"
                         checked={formData.freeDeliveryEligibility || false}
                         onChange={e => setFormData({...formData, freeDeliveryEligibility: e.target.checked})}
                         className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                       />
                       <label htmlFor="free-del" className="text-xs font-black text-blue-900 uppercase tracking-tight">Enable Standard Free Delivery Eligibility</label>
                    </div>
                 )}

                 <div className="pt-6 flex gap-4">
                    <button 
                       type="button"
                       onClick={() => setIsModalOpen(false)}
                       className="flex-1 py-4 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all font-sans"
                    >
                       Cancel
                    </button>
                    <button 
                       type="submit"
                       className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                       <Save size={16} />
                       {editingItem ? 'Commit Changes' : 'Initialize Asset'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

/* --- UI COMPONENTS --- */

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
      active 
      ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50' 
      : 'text-slate-400 hover:text-slate-600'
    }`}
  >
    <Icon size={16} className={active ? 'text-blue-500' : ''} />
    {label}
  </button>
);

const LogisticsCard = ({ item, type, onEdit }) => (
  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden">
     <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
           {type === 'stations' ? <Box className="text-blue-600" /> : <Navigation className="text-purple-600" />}
        </div>
        <button 
          onClick={onEdit}
          className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white transition-all shadow-sm"
        >
           <Edit2 size={16} />
        </button>
     </div>

     <div className="space-y-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">{item.name}</h3>
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200" />
           </div>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pt-1">
              <MapPin size={12} className="text-slate-300" /> {item.town}, {item.county}
           </p>
        </div>

        <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl">
           {type === 'stations' ? (
              <div className="space-y-2">
                 <p className="text-[10px] font-black text-slate-900 uppercase flex justify-between">
                    <span className="text-slate-400">Contact:</span> {item.phone}
                 </p>
                 <p className="text-[10px] font-black text-slate-900 uppercase flex justify-between">
                    <span className="text-slate-400">Schedule:</span> {item.openingHours}
                 </p>
              </div>
           ) : (
              <div className="space-y-2">
                 <p className="text-[10px] font-black text-slate-900 uppercase flex justify-between">
                    <span className="text-slate-400 text-[9px] tracking-widest">Base Rate:</span> 
                    <span className="text-sm">KES {item.fee}</span>
                 </p>
                 <p className="text-[10px] font-black text-slate-900 uppercase flex justify-between">
                    <span className="text-slate-400 text-[9px] tracking-widest">Free Eligibility:</span> 
                    <span className={`px-2 py-0.5 rounded ${item.freeDeliveryEligibility ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                       {item.freeDeliveryEligibility ? 'ENABLED' : 'DISABLED'}
                    </span>
                 </p>
              </div>
           )}
        </div>
     </div>

     {/* Decoration */}
     <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-slate-50 rounded-full opacity-50 group-hover:scale-125 transition-transform" />
  </div>
);

const LoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-50">
     {[1, 2, 3].map(i => (
       <div key={i} className="bg-slate-100 border-2 border-dashed border-slate-200 h-64 rounded-3xl animate-pulse" />
     ))}
  </div>
);

const EmptyState = ({ type, hasSearch, onAdd }) => (
  <div className="py-20 flex flex-col items-center text-center max-w-md mx-auto">
     <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center justify-center mb-8 shadow-sm">
        {type === 'stations' ? <Box size={40} className="text-slate-300" /> : <Navigation size={40} className="text-slate-300" />}
     </div>
     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
        {hasSearch ? 'No Results Found' : `No ${type === 'stations' ? 'Pickup Stations' : 'Delivery Sectors'} Established`}
     </h3>
     <p className="text-sm font-bold text-slate-400 mt-4 leading-relaxed uppercase tracking-tight">
        {hasSearch 
          ? 'Establish a new asset or adjust your tactical search parameters.' 
          : `Expand your hub's operational reach by defining new ${type === 'stations' ? 'pickup points' : 'delivery sectors'} in this zone.`
        }
     </p>
     {!hasSearch && (
        <button 
           onClick={onAdd}
           className="mt-10 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-3"
        >
           <Plus size={16} strokeWidth={3} /> Establish First Asset
        </button>
     )}
  </div>
);

export default Logistics;
