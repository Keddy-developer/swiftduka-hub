import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import { 
  Save, Warehouse, Truck, MapPin, Plus, Trash2, 
  Settings as SettingsIcon, Package, User, CheckCircle, 
  AlertTriangle, Loader2 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsPage = () => {
  const { hub, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hubInfo, setHubInfo] = useState({
    name: '',
    town: '',
    address: '',
    county: '',
    capacity: 1000,
  });
  const [routes, setRoutes] = useState([]);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [newRoute, setNewRoute] = useState({
    toTown: '',
    fee: '',
    weightLimit: 2.0,
    perKgFee: 50.0,
    providerType: 'RIDER',
    estimatedDaysMin: 1,
    estimatedDaysMax: 3,
    deliveryCategory: 'standard'
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!hub?.id) return;
      try {
        const [hubRes, routesRes] = await Promise.all([
          axiosInstance.get(`/fulfillment/hubs/${hub.id}`),
          axiosInstance.get(`/fulfillment/routes?hubId=${hub.id}`)
        ]);
        
        if (hubRes.data.success) {
          setHubInfo({
             name: hubRes.data.hub.name || '',
             town: hubRes.data.hub.town || '',
             address: hubRes.data.hub.address || '',
             county: hubRes.data.hub.county || '',
             capacity: hubRes.data.hub.capacity || 1000,
          });
        }
        setRoutes(routesRes.data.routes || []);
      } catch (err) {
        toast.error('Failed to load settings data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hub]);

  const handleUpdateHub = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.put(`/fulfillment/hubs/${hub.id}`, hubInfo);
      toast.success('Hub profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update hub profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpsertRoute = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...newRoute, fromHubId: hub.id };
      await axiosInstance.post('/fulfillment/routes', payload);
      toast.success('Route saved successfully');
      
      // Refresh routes
      const { data } = await axiosInstance.get(`/fulfillment/routes?hubId=${hub.id}`);
      setRoutes(data.routes || []);
      setShowRouteModal(false);
      setNewRoute({
        toTown: '',
        fee: '',
        weightLimit: 2.0,
        perKgFee: 50.0,
        providerType: 'RIDER',
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
        deliveryCategory: 'standard'
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save route');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoute = async (routeId) => {
     if(!window.confirm('Are you sure you want to delete this route?')) return;
     try {
        await axiosInstance.delete(`/fulfillment/routes/${routeId}`);
        setRoutes(prev => prev.filter(r => r.id !== routeId));
        toast.success('Route deleted');
     } catch (err) {
        toast.error('Failed to delete route');
     }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48 space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Core Parameters...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <div className="flex items-center gap-3 mb-3">
               <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-primary" />
               </div>
               <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Configuration Console</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">Hub Infrastructure Settings</h1>
            <p className="text-slate-500 font-medium tracking-tight uppercase text-xs">Manage logistics parameters and hub operational metadata</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* ── LEFT COLUMN: HUB PROFILE ── */}
        <div className="lg:col-span-4 space-y-8">
           <section className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                 <Warehouse className="w-5 h-5 text-primary" />
                 Base Profile
              </h3>
              
              <form onSubmit={handleUpdateHub} className="space-y-5">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fulfillment Hub Name</label>
                    <input 
                      type="text" 
                      value={hubInfo.name} 
                      onChange={e => setHubInfo({...hubInfo, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Town</label>
                       <input 
                         type="text" 
                         value={hubInfo.town} 
                         onChange={e => setHubInfo({...hubInfo, town: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">County</label>
                       <input 
                         type="text" 
                         value={hubInfo.county} 
                         onChange={e => setHubInfo({...hubInfo, county: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Street Address</label>
                    <textarea 
                      rows="2"
                      value={hubInfo.address} 
                      onChange={e => setHubInfo({...hubInfo, address: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Max Capacity (Units)</label>
                    <input 
                      type="number" 
                      value={hubInfo.capacity} 
                      onChange={e => setHubInfo({...hubInfo, capacity: parseInt(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                    />
                 </div>

                 <button 
                   type="submit" 
                   disabled={saving}
                   className="w-full bg-slate-900 text-white rounded-2xl py-4 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 mt-4"
                 >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Synchronizing...' : 'Save Hub Profile'}
                 </button>
              </form>
           </section>

           <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
              <div className="relative z-10">
                 <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Manager Account
                 </h3>
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Name</p>
                       <p className="font-bold">{user?.firstName} {user?.lastName}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated ID</p>
                       <p className="font-mono text-xs opacity-60 truncate">{user?.id}</p>
                    </div>
                    <button className="w-full py-3 bg-white/10 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                       Reset Password
                    </button>
                 </div>
              </div>
              <Warehouse className="absolute bottom-[-20px] right-[-20px] w-48 h-48 opacity-[0.03] rotate-12" />
           </section>
        </div>

        {/* ── RIGHT COLUMN: ROUTE MANAGEMENT ── */}
        <div className="lg:col-span-8 space-y-8">
           <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
              <div className="p-8 pb-4 flex items-center justify-between">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2 flex items-center gap-2">
                       <MapPin className="w-5 h-5 text-primary" />
                       Delivery Routes
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active fulfillment coverage areas</p>
                 </div>
                 <button 
                   onClick={() => setShowRouteModal(true)}
                   className="bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                 >
                    <Plus className="w-4 h-4" /> Define Route
                 </button>
              </div>

              <div className="flex-1 p-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {routes.map(route => (
                      <motion.div 
                        key={route.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-50 border border-slate-100 rounded-3xl p-6 group hover:border-primary/30 transition-all"
                      >
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <Truck className="w-4 h-4 text-primary" />
                                  <h4 className="font-black text-slate-900 text-lg leading-none">{route.toTown}</h4>
                               </div>
                               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-2 py-0.5 rounded-full">
                                  {route.deliveryCategory} Delivery
                               </span>
                            </div>
                            <button 
                              onClick={() => handleDeleteRoute(route.id)}
                              className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>

                         <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 pt-4">
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Base Logistics Fee</p>
                               <p className="font-extrabold text-slate-900">KES {route.fee}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Est. Duration</p>
                               <p className="font-extrabold text-slate-900">{route.estimatedDaysMin}-{route.estimatedDaysMax} Days</p>
                            </div>
                         </div>
                      </motion.div>
                    ))}

                    {routes.length === 0 && (
                       <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                             <MapPin className="w-10 h-10 text-slate-200" />
                          </div>
                          <h4 className="font-bold text-slate-900">No Custom Routes Configured</h4>
                          <p className="text-xs text-slate-400 max-w-xs mt-2">Define delivery routes to calculate automated logistics fees for your customers.</p>
                       </div>
                    )}
                 </div>
              </div>
           </section>
        </div>
      </div>

      {/* ── ROUTE UPSERT MODAL ── */}
      <AnimatePresence>
        {showRouteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setShowRouteModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
            >
               <div className="bg-slate-900 px-8 py-10 text-white">
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-1">Define Route Parameters</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Connect your hub to a customer delivery zone</p>
               </div>

               <form onSubmit={handleUpsertRoute} className="p-10 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Destination Town</label>
                        <input 
                          type="text" 
                          required
                          value={newRoute.toTown}
                          onChange={e => setNewRoute({...newRoute, toTown: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                          placeholder="e.g. Mombasa"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Delivery Class</label>
                        <select 
                          value={newRoute.deliveryCategory}
                          onChange={e => setNewRoute({...newRoute, deliveryCategory: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 appearance-none"
                        >
                           <option value="standard">Standard</option>
                           <option value="express">Express</option>
                           <option value="priority">Priority</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Base Fee (KES)</label>
                        <input 
                          type="number" 
                          required
                          value={newRoute.fee}
                          onChange={e => setNewRoute({...newRoute, fee: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                          placeholder="e.g. 500"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Provider Strategy</label>
                        <select 
                          value={newRoute.providerType}
                          onChange={e => setNewRoute({...newRoute, providerType: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 appearance-none"
                        >
                           <option value="RIDER">Local Rider</option>
                           <option value="COURIER">3PL Courier</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pb-4 border-b border-slate-100">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Est. Min Days</label>
                        <input 
                          type="number" 
                          value={newRoute.estimatedDaysMin}
                          onChange={e => setNewRoute({...newRoute, estimatedDaysMin: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Est. Max Days</label>
                        <input 
                          type="number" 
                          value={newRoute.estimatedDaysMax}
                          onChange={e => setNewRoute({...newRoute, estimatedDaysMax: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10"
                        />
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <button 
                       type="button"
                       onClick={() => setShowRouteModal(false)}
                       className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50"
                     >
                        Cancel
                     </button>
                     <button 
                       type="submit"
                       disabled={saving}
                       className="flex-1 bg-primary text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                     >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {saving ? 'Processing...' : 'Authorize Route'}
                     </button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
