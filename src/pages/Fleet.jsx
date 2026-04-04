import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import {
   Pencil, Trash2, Plus, Truck, Package, Star,
   Phone, IdCard, Wallet, TrendingUp, RefreshCw, X, AlertTriangle,
   Activity, Shield, Navigation, Smartphone, CheckCircle2, Zap,
   Search, Filter, ChevronRight, User, MoreVertical,
   Compass
} from "lucide-react";
import { toast } from "react-toastify";
import PendingAssignmentsPanel from "../components/PendingAssignmentsPanel";
import { useAuth } from "../contexts/AuthContext";

export default function RidersManagement() {
   const { hub } = useAuth();
   const [riders, setRiders] = useState([]);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [selectedRiderId, setSelectedRiderId] = useState(null);
   const [loadingDelete, setLoadingDelete] = useState(false);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const navigate = useNavigate();

   const fetchRiders = async (silent = false) => {
      if (!hub?.id) return setLoading(false);
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
         const response = await axiosInstance.get(`/delivery/hubs/${hub.id}/riders`);
         setRiders(response.data?.riders || response.data || []);
      } catch (err) {
         console.error("Failed to fetch riders:", err);
         toast.error("Fleet sync failure");
         setRiders([]);
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   };

   useEffect(() => { fetchRiders(); }, [hub]);

   const handleDelete = async (id) => {
      setLoadingDelete(true);
      try {
         await axiosInstance.delete(`/delivery/hubs/${hub.id}/riders/${id}`);
         setRiders((prev) => prev.filter((rider) => rider.id !== id));
         toast.success("Rider personnel record revoked");
         setShowDeleteModal(false);
      } catch (error) {
         toast.error("Revocation failed");
      } finally {
         setLoadingDelete(false);
         setSelectedRiderId(null);
      }
   };

   const filteredRiders = riders.filter(r =>
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone?.includes(searchQuery) ||
      r.numberPlate?.toLowerCase().includes(searchQuery.toLowerCase())
   );

   if (loading) return (
      <div className="flex flex-col items-center justify-center p-20 opacity-50">
         <RefreshCw className="w-8 h-8 animate-spin mb-3 text-slate-400" />
         <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Synchronizing Fleet Manifests...</span>
      </div>
   );

   return (
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-20">
         {/* 🏙️ TACTICAL HEADER */}
         <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
            <div>
               <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  Fleet Command Center
                  <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Live</span>
               </h1>
               <p className="text-[10px] md:text-xs text-slate-500 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                  <Truck size={14} className="text-blue-600 mb-0.5" />
                  Node: {hub?.name} · Active Fleet Status
               </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               <button onClick={() => fetchRiders(true)} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm flex items-center justify-center gap-2">
                  <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Sync Fleet
               </button>
               <button onClick={() => navigate("/register-a-rider/new")} className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest flex items-center justify-center gap-2">
                  <Plus size={14} /> Register Rider
               </button>
            </div>
         </div>

         {/* 📊 KPI HUD TILES */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <KPICard label="Total Agents" value={riders.length} icon={User} color="blue" />
            <KPICard label="Global Drops" value={riders.reduce((acc, r) => acc + (r.totalDeliveries || 0), 0)} icon={Package} color="slate" />
            <KPICard label="Performance score" value={riders.length > 0 ? (riders.reduce((acc, r) => acc + (r.rating || 0), 0) / riders.length).toFixed(1) : "0.0"} icon={Star} color="amber" />
            <KPICard label="Active Capacity" value={`${riders.filter(r => r.status === 'AVAILABLE').length} Available`} icon={Activity} color="green" />
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* 🚀 PENDING OPERATIONS */}
            <div className="xl:col-span-2 space-y-6">
               <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden group">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Zap size={18} className="text-amber-500 fill-amber-500" />
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Urgent Assignments</h3>
                     </div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Real-time Flux</span>
                  </div>
                  <PendingAssignmentsPanel />
               </div>

               {/* 🗄️ FLEET LEDGER (MOBILE FRIENDLY CARDS) */}
               <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 border-dashed">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           placeholder="Search by Name, Phone or Plate Number..."
                           className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-2 text-xs font-bold outline-none focus:bg-white focus:border-slate-300 transition-all uppercase tracking-tight"
                        />
                     </div>
                     <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Filter:</span>
                        {['All', 'Available', 'Busy', 'Offline'].map(tag => (
                           <button key={tag} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black uppercase tracking-tighter text-slate-500 hover:bg-slate-50 whitespace-nowrap">{tag}</button>
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {filteredRiders.map(rider => (
                        <RiderCard key={rider.id} rider={rider} onDelete={() => { setSelectedRiderId(rider.id); setShowDeleteModal(true); }} onConfig={() => navigate(`/register-a-rider/${rider.id}`)} />
                     ))}
                     {filteredRiders.length === 0 && (
                        <div className="col-span-full py-24 text-center bg-white border border-slate-200 border-dashed rounded-3xl opacity-40">
                           <Compass size={48} className="mx-auto mb-4 text-slate-300 animate-pulse" />
                           <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 font-black">Zero Deployment Authority Matches</p>
                           <p className="text-[10px] font-bold text-slate-400 mt-2 italic">Refine search parameters or onboard new personnel.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* 🔔 NETWORK TELEMETRY */}
            <div className="space-y-6">
               <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden group shadow-xl shadow-slate-200/50">
                  <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                     <div className="flex items-center gap-3">
                        <Shield size={18} className="text-blue-400" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Fleet Security</h3>
                     </div>
                     <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>

                  <div className="p-6 space-y-6">
                     <div className="space-y-4">
                        <TelemetryItem label="Operational Zones" value="Active - All Regions" status="nominal" />
                        <TelemetryItem label="Signal Strength" value="High Coverage (LTE)" status="nominal" />
                        <TelemetryItem label="Average TAT" value="42.5 Minutes" status="warning" />
                     </div>

                     <div className="pt-6 border-t border-slate-100">
                        <button className="w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                           <Activity size={14} /> Full Fleet Audit Trail
                        </button>
                     </div>
                  </div>
               </section>

               <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                  <div className="relative z-10">
                     <h4 className="text-xs font-black uppercase tracking-widest mb-1 opacity-80">Network Intelligence</h4>
                     <p className="text-lg font-black tracking-tight leading-tight mb-4">Onboard new personnel to expand your delivery catchment area.</p>
                     <button onClick={() => navigate("/register-a-rider/new")} className="py-2.5 px-6 bg-white text-blue-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">
                        Expand Fleet Now
                     </button>
                  </div>
                  <Navigation size={120} className="absolute -bottom-10 -right-10 text-white/10 group-hover:scale-110 transition-transform duration-700" />
               </div>
            </div>
         </div>

         {/* ⚠️ MODERN REVIKE MODAL */}
         {showDeleteModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
               <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6 animate-in zoom-in-95 duration-200 overflow-hidden relative">
                  <div className="flex items-center gap-4 relative z-10">
                     <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 shrink-0">
                        <AlertTriangle className="text-rose-600 w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Security Notice</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Fleet Authority Revocation</p>
                     </div>
                  </div>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-tight italic relative z-10">
                     You are about to decouple this agent from the hub logistical framework. All active permissions and routing capabilities for this personnel will be terminated immediately.
                  </p>
                  <div className="flex gap-3 relative z-10">
                     <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                     <button onClick={() => handleDelete(selectedRiderId)} disabled={loadingDelete} className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200">
                        {loadingDelete ? 'SYNCING...' : 'Confirm Revocation'}
                     </button>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 -z-10"></div>
               </div>
            </div>
         )}
      </div>
   );
}

/* --- Components --- */

const KPICard = ({ label, value, icon: Icon, color }) => {
   const styles = {
      blue: "border-blue-500 bg-blue-50/20 text-blue-600",
      slate: "border-slate-400 bg-slate-50 text-slate-900",
      amber: "border-amber-500 bg-amber-50/20 text-amber-600",
      green: "border-green-500 bg-green-50/20 text-green-600"
   };

   return (
      <div className={`bg-white border-l-4 p-5 rounded-2xl shadow-sm border transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden ${styles[color]}`}>
         <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm transition-transform group-hover:scale-110">
               <Icon size={20} className="opacity-80" />
            </div>
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0" />
         </div>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
         <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
         <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-all -z-10"></div>
      </div>
   );
};

const RiderCard = ({ rider, onDelete, onConfig }) => (
   <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 hover:border-slate-400 hover:shadow-xl transition-all group relative overflow-hidden">
      <div className="flex items-center gap-4 relative z-10">
         <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
            {rider.vehicleImage ? <img src={rider.vehicleImage} className="w-full h-full object-cover" alt="" /> : <Truck size={24} className="text-slate-300" />}
         </div>
         <div className="min-w-0 flex-1">
            <h3 className="font-black text-slate-900 text-sm truncate uppercase tracking-tight leading-none mb-1.5">{rider.name}</h3>
            <div className="flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${rider.status === 'AVAILABLE' ? 'bg-green-500 shadow-lg shadow-green-200' : 'bg-amber-500 shadow-lg shadow-amber-200'}`} />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{rider.status || 'OFFLINE'}</span>
            </div>
         </div>
         <button className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors">
            <MoreVertical size={18} />
         </button>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 relative z-10">
         <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">Net Settlement</p>
            <p className="text-sm font-black text-slate-900 tracking-tighter leading-none">Ksh {(rider.totalEarnings || 0).toLocaleString()}</p>
         </div>
         <div className="text-right space-y-1">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">Quality Index</p>
            <p className="text-sm font-black text-slate-900 tracking-tighter leading-none flex items-center justify-end gap-1.5">{rider.rating || '5.0'} <Star size={12} className="text-amber-400 fill-amber-400" /></p>
         </div>
      </div>

      <div className="space-y-2 pt-1 relative z-10">
         <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl group/info hover:bg-white transition-colors">
            <Smartphone size={14} className="text-slate-300 group-hover/info:text-blue-500" />
            <span className="text-[10px] font-black text-slate-600 tracking-wider">{rider.phone}</span>
         </div>
         <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl group/info hover:bg-white transition-colors">
            <Smartphone size={14} className="text-slate-300 group-hover/info:text-indigo-500 select-all" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{rider.numberPlate || 'NO PLATE RECORDED'}</span>
         </div>
      </div>

      <div className="flex gap-2 pt-2 relative z-10">
         <button onClick={() => navigate(`/rider-details/${rider.id}`)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200">VIEW MANIFEST</button>
         <button onClick={onConfig} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-100"> PERSONNEL CONFIG</button>
         <button onClick={onDelete} className="px-3 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 hover:text-white transition-all">REVOKE</button>
      </div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
   </div>
);

const TelemetryItem = ({ label, value, status }) => (
   <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white transition-colors">
      <div>
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
         <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{value}</p>
      </div>
      <div className={`w-2 h-2 rounded-full ${status === 'nominal' ? 'bg-green-500 shadow-lg shadow-green-100' : 'bg-amber-500 shadow-lg shadow-amber-100'}`} />
   </div>
);

const ArrowRight = ({ size, className }) => <ChevronRight size={size} className={className} />;
