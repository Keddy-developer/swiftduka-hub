import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import { 
  Save, Warehouse, Truck, MapPin, Plus, Trash2, 
  Settings as SettingsIcon, Package, User, CheckCircle, 
  AlertTriangle, Loader2, X, Phone, Mail
} from 'lucide-react';
import { toast } from 'react-toastify';

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
        toast.error('Sync failure');
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
      toast.success('Hub synchronized');
    } catch (err) {
      toast.error('Update failed');
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
      toast.success('Route authorized');
      
      const { data } = await axiosInstance.get(`/fulfillment/routes?hubId=${hub.id}`);
      setRoutes(data.routes || []);
      setShowRouteModal(false);
      setNewRoute({
        toTown: '', fee: '', weightLimit: 2.0, perKgFee: 50.0,
        providerType: 'RIDER', estimatedDaysMin: 1, estimatedDaysMax: 3, deliveryCategory: 'standard'
      });
    } catch (err) {
      toast.error('Authorization failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoute = async (routeId) => {
     if(!window.confirm('Revoke route authority?')) return;
     try {
        await axiosInstance.delete(`/fulfillment/routes/${routeId}`);
        setRoutes(prev => prev.filter(r => r.id !== routeId));
        toast.success('Route revoked');
     } catch (err) {
        toast.error('Revocation failed');
     }
  };

  if (loading) return <div className="p-8 text-slate-400 font-medium italic text-sm text-center">Syncing hub parameters...</div>;

  return (
    <div className="space-y-6 md:space-y-10">
      {/* 🏙️ HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">System Configuration</h2>
          <p className="text-[12px] md:text-sm text-slate-500 font-medium tracking-tight">Core operational parameters and logistical infrastructure management.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* ── LEFT: CORE PROFILE ── */}
        <div className="lg:col-span-5 space-y-6">
           <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                 <Warehouse size={14} className="text-slate-400" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Infrastructure</span>
              </div>
              
              <form onSubmit={handleUpdateHub} className="p-5 space-y-4">
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Fulfillment Hub Identity</label>
                     <input type="text" value={hubInfo.name} onChange={e => setHubInfo({...hubInfo, name: e.target.value})}
                       className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Town</label>
                        <input type="text" value={hubInfo.town} onChange={e => setHubInfo({...hubInfo, town: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">County</label>
                        <input type="text" value={hubInfo.county} onChange={e => setHubInfo({...hubInfo, county: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                     </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Physical Address</label>
                     <textarea rows="2" value={hubInfo.address} onChange={e => setHubInfo({...hubInfo, address: e.target.value})}
                       className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-medium outline-none focus:border-slate-900 shadow-sm resize-none" />
                  </div>

                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Logistics Capacity (Units)</label>
                     <input type="number" value={hubInfo.capacity} onChange={e => setHubInfo({...hubInfo, capacity: parseInt(e.target.value)})}
                       className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                  </div>

                  <button type="submit" disabled={saving}
                    className="w-full py-2.5 bg-slate-900 text-white rounded text-[10px] font-bold uppercase hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                     {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                     {saving ? 'SYNCHRONIZING...' : 'COMMIT HUB PARAMETERS'}
                  </button>
              </form>
           </section>

           <section className="bg-slate-900 rounded border border-slate-800 p-5 text-white shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center font-bold text-xs uppercase">HQ</div>
                 <h3 className="text-xs font-bold uppercase tracking-tight">Active Command Account</h3>
              </div>
              <div className="space-y-3 opacity-90">
                 <div className="flex items-center gap-3 text-xs">
                    <User size={14} className="text-slate-500" />
                    <span className="font-bold">{user?.firstName} {user?.lastName}</span>
                 </div>
                 <div className="flex items-center gap-3 text-xs">
                    <Mail size={14} className="text-slate-500" />
                    <span className="truncate">{user?.email}</span>
                 </div>
                 <div className="pt-2">
                    <button className="w-full py-2 bg-white/5 border border-white/10 rounded text-[9px] font-bold uppercase hover:bg-white/10 transition-all">TERMINATE SESSION</button>
                 </div>
              </div>
           </section>
        </div>

        {/* ── RIGHT: LOGISTICS ROUTES ── */}
        <div className="lg:col-span-7 space-y-6">
           <section className="bg-white border border-slate-200 rounded shadow-sm flex flex-col min-h-[500px]">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Delivery Zones</span>
                 </div>
                 <button onClick={() => setShowRouteModal(true)} className="p-1 px-2.5 bg-slate-900 text-white rounded text-[9px] font-bold uppercase hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm">
                    <Plus size={12} /> ADD ZONE
                 </button>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {routes.map(route => (
                   <div key={route.id} className="bg-slate-50 border border-slate-100 rounded p-4 group transition-all hover:border-slate-300">
                      <div className="flex justify-between items-start mb-3">
                         <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 uppercase truncate mb-0.5">{route.toTown}</h4>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter border border-slate-200 px-1.5 py-0.5 rounded bg-white">{route.deliveryCategory} Delivery</span>
                         </div>
                         <button onClick={() => handleDeleteRoute(route.id)} className="p-1 px-2 bg-white border border-slate-200 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                            <Trash2 size={12} />
                         </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 mt-2">
                         <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Base Fee</p>
                            <p className="text-[11px] font-bold text-slate-900">Ksh {route.fee}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Est. Days</p>
                            <p className="text-[11px] font-bold text-slate-900">{route.estimatedDaysMin}-{route.estimatedDaysMax}</p>
                         </div>
                      </div>
                   </div>
                 ))}
                 {routes.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-40">
                       <MapPin size={32} className="mx-auto mb-3" />
                       <p className="text-[10px] font-bold uppercase tracking-widest">No active Logistics Zones found.</p>
                    </div>
                 )}
              </div>
           </section>
        </div>
      </div>

      {/* ROUTE MODAL */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[1px]">
           <div className="bg-white border border-slate-200 rounded shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
              <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
                 <span className="text-sm font-bold text-white uppercase tracking-tight">Authorize New Logistics Zone</span>
                 <button onClick={() => setShowRouteModal(false)} className="text-white/50 hover:text-white"><X size={16} /></button>
              </div>

              <form onSubmit={handleUpsertRoute} className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Destination Town</label>
                       <input type="text" required value={newRoute.toTown} onChange={e => setNewRoute({...newRoute, toTown: e.target.value})}
                         className="w-full border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Delivery Priority</label>
                       <select value={newRoute.deliveryCategory} onChange={e => setNewRoute({...newRoute, deliveryCategory: e.target.value})}
                         className="w-full border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm">
                          <option value="standard">STANDARD</option>
                          <option value="express">EXPRESS</option>
                          <option value="priority">PRIORITY</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Base Logistics Fee (Ksh)</label>
                       <input type="number" required value={newRoute.fee} onChange={e => setNewRoute({...newRoute, fee: e.target.value})}
                         className="w-full border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Fulfillment Mode</label>
                       <select value={newRoute.providerType} onChange={e => setNewRoute({...newRoute, providerType: e.target.value})}
                         className="w-full border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm">
                          <option value="RIDER">LOCAL RIDER</option>
                          <option value="COURIER">3PL COURIER</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Min. Duration (Days)</label>
                       <input type="number" value={newRoute.estimatedDaysMin} onChange={e => setNewRoute({...newRoute, estimatedDaysMin: e.target.value})}
                         className="w-full border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Max. Duration (Days)</label>
                       <input type="number" value={newRoute.estimatedDaysMax} onChange={e => setNewRoute({...newRoute, estimatedDaysMax: e.target.value})}
                         className="w-full border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                    </div>
                 </div>

                 <div className="flex gap-2 pt-4">
                    <button type="button" onClick={() => setShowRouteModal(false)} className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold uppercase hover:bg-slate-100">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2 bg-slate-900 text-white rounded text-[10px] font-bold uppercase hover:bg-slate-800 transition-all shadow-sm">
                       {saving ? 'SYNCHRONIZING...' : 'AUTHORIZE ZONE'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
