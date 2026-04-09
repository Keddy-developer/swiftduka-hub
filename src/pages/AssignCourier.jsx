import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
   Truck, Search, MapPin, Package, User, 
   Clock, Star, Phone, CheckCircle2, 
   ChevronLeft, Loader2, AlertCircle,
   Zap, Navigation, Bike, MoreVertical,
   Smartphone, ExternalLink
} from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';

export default function AssignCourier() {
   const { orderProductId } = useParams();
   const [searchParams] = useSearchParams();
   const productId = searchParams.get('productId');
   const orderId = searchParams.get('orderId');
   const navigate = useNavigate();
   const { hub } = useAuth();

   const [order, setOrder] = useState(null);
   const [riders, setRiders] = useState([]);
   const [loading, setLoading] = useState(true);
   const [assigning, setAssigning] = useState(null);
   const [searchQuery, setSearchQuery] = useState("");
   const [stats, setStats] = useState({ available: 0, total: 0 });

   useEffect(() => {
      fetchData();
   }, [orderProductId, hub]);

   const fetchData = async () => {
      if (!hub?.id) return;
      setLoading(true);
      try {
         // Fetch order details
         const orderRes = await axiosInstance.get(`/order/admin/${orderId || orderProductId}`);
         setOrder(orderRes.data);

         // Fetch riders for this hub
         const ridersRes = await axiosInstance.get(`/delivery/hubs/${hub.id}/riders`);
         const ridersList = ridersRes.data?.riders || ridersRes.data || [];
         setRiders(ridersList);
         
         setStats({
            total: ridersList.length,
            available: ridersList.filter(r => r.status === 'AVAILABLE').length
         });
      } catch (err) {
         console.error("Failed to load dispatch data:", err);
         toast.error("Telemetry failure: Could not load hub assets");
      } finally {
         setLoading(false);
      }
   };

   const handleAssign = async (riderId) => {
      setAssigning(riderId);
      try {
         await axiosInstance.post('/riders/assign-rider', {
            orderProductId,
            orderId,
            riderId,
            deliveryFee: 0, // Calculated by backend or defaults
            bonusAmount: 0
         });
         
         toast.success("Dispatch sequence initiated successfully");
         setTimeout(() => {
            navigate(`/orders/${orderId}`);
         }, 1500);
      } catch (err) {
         console.error("Assignment failed:", err);
         toast.error(err.response?.data?.error || "Dispatch assignment failed");
      } finally {
         setAssigning(null);
      }
   };

   const filteredRiders = riders.filter(r => 
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone?.includes(searchQuery) ||
      r.numberPlate?.toLowerCase().includes(searchQuery.toLowerCase())
   );

   if (loading) {
      return (
         <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] opacity-50">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-600" />
            <span className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase">Synchronizing Hub Manifest...</span>
         </div>
      );
   }

   const productItem = order?.products?.find(p => p.id === orderProductId);

   return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
         {/* 🏙️ ACTION HEADER */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
            <div className="space-y-1">
               <button 
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest mb-4 group"
               >
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Dispatch
               </button>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  Logistical Assignment
                  <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg shadow-blue-200">Priority</span>
               </h1>
               <p className="text-xs text-slate-500 font-bold tracking-tight mt-1 flex items-center gap-2">
                  <Navigation size={14} className="text-blue-600" />
                  Dispatching from <span className="text-slate-900 font-black">{hub?.name}</span>
               </p>
            </div>
            
            <div className="flex gap-4">
               <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center border border-green-100">
                     <Bike className="text-green-600 w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Fleet</p>
                     <p className="text-xl font-black text-slate-900 leading-none">{stats.available} <span className="text-xs text-slate-400">/ {stats.total}</span></p>
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 📦 ASSET PREVIEW */}
            <div className="lg:col-span-1 space-y-6">
               <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm sticky top-8">
                  <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Package size={18} className="text-blue-400" />
                        <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Asset Manifest</h3>
                     </div>
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">#{order?.trackingNumber}</span>
                  </div>
                  
                  <div className="p-6 space-y-6">
                     {/* Product Identity */}
                     <div className="flex gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 shadow-inner">
                           {productItem?.product?.image ? (
                              <img src={productItem.product.image} className="w-full h-full object-cover" alt="" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                 <Package className="w-8 h-8 text-slate-200" />
                              </div>
                           )}
                        </div>
                        <div className="min-w-0 py-1">
                           <h4 className="font-black text-slate-900 text-sm leading-tight mb-1 truncate">{productItem?.product?.name || 'Standard Shipment'}</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quantity: {productItem?.quantity || 1}</p>
                           <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full uppercase tracking-tighter">{order?.deliveryType}</span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black rounded-full uppercase tracking-tighter">Ready</span>
                           </div>
                        </div>
                     </div>

                     {/* Tactical Intel */}
                     <div className="space-y-3 pt-6 border-t border-slate-100">
                        <div className="flex items-start gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                           <MapPin className="text-blue-500 w-5 h-5 mt-0.5" />
                           <div className="min-w-0">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Destination Vector</p>
                              <p className="text-[11px] font-black text-slate-900 leading-snug tracking-tight">
                                 {order?.shippingAddress?.address}, {order?.shippingAddress?.town}
                                 {order?.deliveryArea?.name && <><br /><span className="text-blue-600">[{order.deliveryArea.name}]</span></>}
                                 <br/>{order?.shippingAddress?.county}
                              </p>
                           </div>
                        </div>

                        <div className="flex items-start gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                           <User className="text-indigo-500 w-5 h-5 mt-0.5" />
                           <div className="min-w-0">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Receiver Profile</p>
                              <p className="text-[11px] font-black text-slate-900 tracking-tight">{order?.shippingAddress?.name}</p>
                              <p className="text-[10px] font-bold text-slate-500">{order?.shippingAddress?.phoneNumber}</p>
                           </div>
                        </div>
                     </div>

                     <div className="pt-4 flex items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 group hover:border-blue-300 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <ExternalLink size={14} className="text-blue-600" />
                           </div>
                           <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Full Dossier</span>
                        </div>
                        <button 
                           onClick={() => navigate(`/orders/${orderId}`)}
                           className="text-[9px] font-black text-blue-600 underline decoration-2 underline-offset-4"
                        >
                           VIEW
                        </button>
                     </div>
                  </div>
               </div>
            </div>

            {/* 🏍️ FLEET SELECTION */}
            <div className="lg:col-span-2 space-y-6">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="relative flex-1">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Available Fleet Personnel..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-slate-300 transition-all tracking-tight"
                     />
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Filter Status:</span>
                     {['All', 'Available', 'Busy'].map(tag => (
                        <button key={tag} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-tighter text-slate-500 hover:bg-slate-900 hover:text-white transition-all whitespace-nowrap">{tag}</button>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRiders.length > 0 ? (
                     filteredRiders.map((rider) => (
                        <RiderSelectCard 
                           key={rider.id}
                           rider={rider}
                           onAssign={() => handleAssign(rider.id)}
                           isAssigning={assigning === rider.id}
                           disabled={!!assigning}
                        />
                     ))
                  ) : (
                     <div className="col-span-full py-20 text-center bg-white border border-slate-200 border-dashed rounded-[40px] opacity-40">
                        <User size={48} className="mx-auto mb-4 text-slate-300 animate-pulse" />
                        <p className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase">Zero Personnel Matches Found</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 italic">Synchronize Node for active fleet manifests.</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}

const RiderSelectCard = ({ rider, onAssign, isAssigning, disabled }) => {
   const isAvailable = rider.status === 'AVAILABLE';
   const avatar = rider.user?.avatar;

   return (
      <div className={`bg-white border border-slate-200 rounded-3xl p-6 space-y-5 transition-all group relative overflow-hidden ${!isAvailable ? 'opacity-60 cursor-not-allowed hover:border-slate-200 shadow-none' : 'hover:border-blue-400 hover:shadow-xl hover:shadow-blue-50 cursor-pointer'}`} onClick={isAvailable && !disabled ? onAssign : undefined}>
         <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
               {avatar ? <img src={avatar} className="w-full h-full object-cover" alt="" /> : <User size={28} className="text-slate-300" />}
            </div>
            <div className="min-w-0 flex-1">
               <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-black text-slate-900 text-sm truncate tracking-tight leading-none uppercase">{rider.name || 'Unknown Agent'}</h3>
                  <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
               </div>
               <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isAvailable ? 'text-green-600' : 'text-amber-600'}`}>
                     {rider.status || 'Offline'}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="text-[9px] font-black text-slate-400 flex items-center gap-1">
                     {rider.rating || '5.0'} <Star size={10} className="fill-amber-400 text-amber-400" />
                  </span>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-3 relative z-10">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-white transition-colors">
               <div className="flex items-center gap-2 mb-1">
                  <Smartphone size={12} className="text-slate-300" />
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Device ID</p>
               </div>
               <p className="text-[10px] font-black text-slate-700 tracking-tight">{rider.phone || 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-white transition-colors">
               <div className="flex items-center gap-2 mb-1">
                  <Zap size={12} className="text-slate-300" />
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Plate Vector</p>
               </div>
               <p className="text-[10px] font-black text-slate-700 tracking-tight">{rider.numberPlate || 'NO PLATE'}</p>
            </div>
         </div>

         <div className="pt-1 relative z-10">
            {isAvailable ? (
               <button 
                  disabled={disabled}
                  className={`w-full py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 ${isAssigning ? 'bg-green-600' : 'hover:bg-blue-600 hover:shadow-blue-200'}`}
               >
                  {isAssigning ? (
                     <>
                        <Loader2 className="w-4 h-4 animate-spin" /> DISPATCHING...
                     </>
                  ) : (
                     <>
                        <CheckCircle2 size={16} /> CONFIRM DISPATCH
                     </>
                  )}
               </button>
            ) : (
               <div className="w-full py-3.5 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                  <AlertCircle size={16} /> PERSONNEL BUSY
               </div>
            )}
         </div>

         {/* 🌊 DECORATIVE WAVE */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors -z-10"></div>
      </div>
   );
};
