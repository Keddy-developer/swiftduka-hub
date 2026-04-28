import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import {
   Pencil, Trash2, Plus, Truck, Package, Star,
   Phone, IdCard, Wallet, TrendingUp, RefreshCw, X, AlertTriangle,
   Activity, Shield, Navigation, Smartphone, CheckCircle2, Zap,
   Search, Filter, ChevronRight, User, MoreVertical,
   Compass, DollarSign, History, ClipboardList
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

export default function CourierManagement({ readOnly }) {
   const { hub } = useAuth();
   const [couriers, setCouriers] = useState([]);
   const [showDeleteModal, setShowDeleteModal] = useState(false);
   const [selectedCourierId, setSelectedCourierId] = useState(null);
   const [loadingDelete, setLoadingDelete] = useState(false);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const navigate = useNavigate();

   const fetchCouriers = async (silent = false) => {
      if (!hub?.id) return setLoading(false);
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
         const response = await axiosInstance.get(`/delivery/hubs/${hub.id}/couriers`);
         setCouriers(response.data?.couriers || (Array.isArray(response.data) ? response.data : []));
      } catch (err) {
         console.error("Failed to fetch couriers:", err);
         toast.error("Failed to load courier fleet");
         setCouriers([]);
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   };

   useEffect(() => { fetchCouriers(); }, [hub]);

   const handleDelete = async (id) => {
      setLoadingDelete(true);
      try {
         await axiosInstance.delete(`/delivery/hubs/${hub.id}/couriers/${id}`);
         setCouriers((prev) => prev.filter((c) => c.id !== id));
         toast.success("Courier removed successfully");
         setShowDeleteModal(false);
      } catch (error) {
         toast.error("Failed to remove courier");
      } finally {
         setLoadingDelete(false);
         setSelectedCourierId(null);
      }
   };

   const filteredCouriers = couriers.filter(c =>
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase())
   );

   if (loading) return (
      <div className="flex flex-col items-center justify-center p-20 opacity-50">
         <RefreshCw className="w-8 h-8 animate-spin mb-3 text-slate-400" />
         <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Synchronizing Fleet Manifest...</span>
      </div>
   );

   return (
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-20">
         {/* 🏙️ STRATEGIC HEADER */}
         <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
            <div>
               <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  Courier Management
                  <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full tracking-tighter uppercase">Authorized Only</span>
               </h1>
               <p className="text-[10px] md:text-xs text-slate-500 font-black tracking-widest mt-1 flex items-center gap-2 uppercase">
                  <Navigation size={14} className="text-emerald-600 mb-0.5" />
                  Hub: {hub?.name} · Specialized Last-Mile Assets
               </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               <button onClick={() => navigate("/finance")} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all tracking-widest shadow-sm flex items-center justify-center gap-2 uppercase">
                  <DollarSign size={14} className="text-emerald-600" /> Treasury & Finance
               </button>
               <button onClick={() => fetchCouriers(true)} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all tracking-widest shadow-sm flex items-center justify-center gap-2 uppercase">
                  <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
               </button>
               {!readOnly && (
                  <button onClick={() => navigate("/register-courier/new")} className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 tracking-widest flex items-center justify-center gap-2 uppercase">
                     <Plus size={14} /> Onboard Courier
                  </button>
               )}
            </div>
         </div>

         {/* 📊 LOGISTICS METRICS */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <KPICard label="Total Assets" value={couriers.length} icon={User} color="blue" />
            <KPICard label="COD Liability" value={`KSh ${Array.isArray(couriers) ? couriers.reduce((acc, c) => acc + (c.wallet?.codLiability || 0), 0).toLocaleString() : '0'}`} icon={Wallet} color="slate" />
            <KPICard label="Wallet Balance" value={`KSh ${Array.isArray(couriers) ? couriers.reduce((acc, c) => acc + (c.wallet?.availableBalance || 0), 0).toLocaleString() : '0'}`} icon={TrendingUp} color="emerald" />
            <KPICard label="Active Capacity" value={`${Array.isArray(couriers) ? couriers.filter(c => c.status !== 'OFFLINE').length : '0'} Ready`} icon={Zap} color="amber" />
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-3 space-y-6">
               {/* 🔍 SEARCH FILTERS */}
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 border-dashed shadow-inner">
                  <div className="relative flex-1">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                     <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search courier by Name, Phone or Plate Vector..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-2 text-xs font-bold outline-none focus:bg-white focus:border-slate-300 transition-all tracking-tight"
                     />
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                     <span className="text-[10px] font-black text-slate-400 tracking-widest shrink-0 uppercase">Operational Status:</span>
                     {['All', 'Ready', 'In-Transit', 'Offline'].map(tag => (
                        <button key={tag} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black tracking-tighter text-slate-500 hover:bg-slate-50 whitespace-nowrap uppercase">{tag}</button>
                     ))}
                  </div>
               </div>

               {/* 🏍️ COURIER LISTING */}
               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredCouriers.map(courier => (
                     <CourierCard
                        key={courier.id}
                        courier={courier}
                        navigate={navigate}
                        readOnly={readOnly}
                        onDelete={() => { setSelectedCourierId(courier.id); setShowDeleteModal(true); }}
                        onConfig={() => navigate(`/register-courier/${courier.id}`)}
                     />
                  ))}
                  {filteredCouriers.length === 0 && (
                     <div className="col-span-full py-24 text-center bg-white border border-slate-200 border-dashed rounded-[40px] opacity-40">
                        <Compass size={48} className="mx-auto mb-4 text-slate-300 animate-spin-slow" />
                        <p className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase">No Couriers Detected</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 italic">Refine search parameters or initiate onboarding.</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* ⚠️ SECURITY OVERRIDE MODAL */}
         {showDeleteModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
               <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
                  <div className="flex items-center gap-4 relative z-10">
                     <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 shrink-0">
                        <AlertTriangle className="text-rose-600 w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">Access Revocation</h3>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5 uppercase">Remove Courier Authority</p>
                     </div>
                  </div>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed tracking-tight italic relative z-10">
                     This action will unassign the courier from this hub node. They will lose access to all pending and assigned logistics tasks.
                  </p>
                  <div className="flex gap-3 relative z-10">
                     <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black tracking-widest hover:bg-slate-100 transition-all uppercase">Cancel</button>
                     <button onClick={() => handleDelete(selectedCourierId)} disabled={loadingDelete} className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 uppercase">
                        {loadingDelete ? 'PROCESSING...' : 'CONFIRM REMOVAL'}
                     </button>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 -z-10"></div>
               </div>
            </div>
         )}
      </div>
   );
}

const KPICard = ({ label, value, icon: Icon, color }) => {
   const styles = {
      blue: "border-blue-500 bg-blue-50/20 text-blue-600",
      slate: "border-slate-900 bg-slate-50 text-slate-900",
      emerald: "border-emerald-500 bg-emerald-50/20 text-emerald-600",
      amber: "border-amber-500 bg-amber-50/20 text-amber-600"
   };

   return (
      <div className={`bg-white border-l-4 p-5 rounded-3xl shadow-sm border transition-all hover:shadow-2xl hover:-translate-y-1 group relative overflow-hidden ${styles[color]}`}>
         <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm transition-transform group-hover:scale-110">
               <Icon size={20} className="opacity-80" />
            </div>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0" />
         </div>
         <p className="text-[10px] font-black text-slate-400 tracking-widest mb-1 uppercase">{label}</p>
         <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
         <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-all -z-10"></div>
      </div>
   );
};

const CourierCard = ({ courier, onDelete, navigate, readOnly }) => (
   <div className="bg-white border border-slate-200 rounded-[32px] p-6 space-y-6 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-50/50 transition-all group relative overflow-hidden">
      <div className="flex items-center gap-4 relative z-10">
         <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform shadow-inner">
            {courier.user?.avatar ? <img src={courier.user.avatar} className="w-full h-full object-cover" alt="" /> : <Truck size={28} className="text-slate-300" />}
         </div>
         <div className="min-w-0 flex-1">
            <h3 className="font-black text-slate-900 text-sm truncate tracking-tight leading-none mb-1.5 uppercase">{courier.name || 'Unknown Asset'}</h3>
            <div className="flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${courier.status === 'READY' ? 'bg-emerald-500 shadow-lg shadow-emerald-200 animate-pulse' : 'bg-slate-300'}`} />
               <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">{courier.status || 'OFFLINE'}</span>
            </div>
         </div>
         <div className="relative flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); navigate(`/couriers/${courier.id}`); }} className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="Order History">
               <History size={16} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); navigate(`/finance?courierId=${courier.id}`); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Financial Ledger">
               <Wallet size={16} />
            </button>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-4 relative z-10">
         <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-400 tracking-[0.15em] leading-none uppercase">COD Liability</p>
            <p className="text-sm font-black text-slate-900 tracking-tighter leading-none">KSh {(courier.wallet?.codLiability || 0).toLocaleString()}</p>
         </div>
         <div className="text-right space-y-1">
            <p className="text-[8px] font-black text-slate-400 tracking-[0.15em] leading-none uppercase">Vehicle Type</p>
            <p className="text-[10px] font-black text-emerald-600 tracking-tight leading-none uppercase">{courier.vehicleType || 'NOT SPECIFIED'}</p>
         </div>
      </div>

      <div className="space-y-2 relative z-10">
         <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl group/info hover:bg-white transition-colors">
            <Smartphone size={14} className="text-slate-300 group-hover/info:text-emerald-500" />
            <span className="text-[10px] font-black text-slate-600 tracking-wider select-all">{courier.phone || 'PHONE N/A'}</span>
         </div>
         <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl group/info hover:bg-white transition-colors">
            <IdCard size={14} className="text-slate-300 group-hover/info:text-indigo-500" />
            <span className="text-[10px] font-black text-slate-600 tracking-widest uppercase">{courier.plateNumber || 'NO PLATE RECORDED'}</span>
         </div>
      </div>

      <div className="flex gap-2 pt-2 relative z-10">
         {!readOnly && (
            <>
               <button onClick={() => navigate(`/couriers/${courier.id}`)} className="flex-[2] py-3.5 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black tracking-widest hover:bg-slate-200 transition-all shadow-xl shadow-slate-100 border border-slate-200 uppercase">View Asset Records</button>
               <button onClick={() => navigate(`/register-courier/${courier.id}`)} className="flex-[2] py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 uppercase">Configure Asset</button>
               <button onClick={onDelete} className="flex-1 py-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[10px] font-black hover:bg-rose-600 hover:text-white transition-all uppercase">Decommission</button>
            </>
         )}
         {readOnly && (
            <button className="w-full py-3.5 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black tracking-widest uppercase border border-slate-100">READ ONLY ACCESS</button>
         )}
      </div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
   </div>
);
