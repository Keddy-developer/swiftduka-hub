import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
   Truck, Search, MapPin, Package, User, 
   Clock, Star, Phone, CheckCircle2, 
   ChevronLeft, Loader2, AlertCircle,
   Zap, Navigation, Bike, MoreVertical,
   Smartphone, ExternalLink, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../services/axiosConfig';
import { useAuth } from '../contexts/AuthContext';

export default function AssignExternalCourier() {
   const { orderProductId } = useParams();
   const [searchParams] = useSearchParams();
   const productId = searchParams.get('productId');
   const orderId = searchParams.get('orderId');
   const navigate = useNavigate();
   const { hub } = useAuth();

   const [order, setOrder] = useState(null);
   const [couriers, setCouriers] = useState([]);
   const [loading, setLoading] = useState(true);
   const [assigning, setAssigning] = useState(null);
   const [searchQuery, setSearchQuery] = useState("");
   const [stats, setStats] = useState({ active: 0, total: 0 });

   useEffect(() => {
      fetchData();
   }, [orderProductId, hub]);

   const fetchData = async () => {
      if (!hub?.id) return;
      setLoading(true);
      try {
         // Fetch order details
         const orderRes = await axiosInstance.get(`/order/admin/${orderId || orderProductId}`);
         const orderData = orderRes.data.data || orderRes.data;
         setOrder(orderData);

         // Fetch couriers for this hub
         const couriersRes = await axiosInstance.get(`/delivery/hubs/${hub.id}/couriers`);
         const courierList = couriersRes.data?.couriers || (Array.isArray(couriersRes.data) ? couriersRes.data : []);
         setCouriers(courierList);
         
         setStats({
            total: courierList.length,
            active: courierList.filter(c => c.status === 'ONLINE' || c.status === 'AVAILABLE').length
         });
      } catch (err) {
         console.error("Failed to load courier data:", err);
         toast.error("Telemetry failure: Could not load hub courier assets");
      } finally {
         setLoading(false);
      }
   };

   const handleAssign = async (courierId) => {
      setAssigning(courierId);
      try {
         // We use the same assignment endpoint but the ID passed is a courier's ID
         // Backend should handle the differentiation or we use a specific courier endpoint
         await axiosInstance.post(`/delivery/hubs/${hub.id}/couriers/assign`, {
            orderProductId,
            orderId,
            courierId,
            deliveryFee: 0
         });
         
         toast.success("External dispatch sequence initiated");
         setTimeout(() => {
            navigate(`/orders/${orderId}`);
         }, 1500);
      } catch (err) {
         console.error("Assignment failed:", err);
         toast.error(err.response?.data?.error || "External dispatch assignment failed");
      } finally {
         setAssigning(null);
      }
   };

   const filteredCouriers = couriers.filter(c => {
      const matchesSearch = 
         c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         c.phone?.includes(searchQuery) ||
         c.plateNumber?.toLowerCase().includes(searchQuery.toLowerCase());
          
      return matchesSearch;
   });

   if (loading) {
      return (
         <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] opacity-50">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-600" />
            <span className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase">Synchronizing Courier Assets...</span>
         </div>
      );
   }

   return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
            <div>
               <button 
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-widest hover:text-slate-900 transition-colors mb-4 uppercase group"
               >
                  <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Return to Order Manifest
               </button>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                  External Dispatch
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-black text-emerald-700 tracking-tighter uppercase">Marketplace Couriers</span>
                  </div>
               </h1>
               <p className="text-xs text-slate-500 font-bold tracking-tight mt-2 flex items-center gap-2">
                  <Navigation size={14} className="text-emerald-500" />
                  Hub: {hub?.name} · Active Sector Logistics
               </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assets</p>
                  <p className="text-xl font-black text-slate-900">{stats.total}</p>
               </div>
               <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active</p>
                  <p className="text-xl font-black text-emerald-600">{stats.active}</p>
               </div>
            </div>
         </div>

         {/* Search & Filter */}
         <div className="bg-white border border-slate-200 rounded-[2.5rem] p-3 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
               <input 
                  type="text" 
                  placeholder="Scan Courier Name, Phone or Plate..." 
                  className="w-full pl-16 pr-6 py-4 bg-slate-50 border-none rounded-[2rem] text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
            <button onClick={fetchData} className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black tracking-widest hover:bg-slate-800 transition-all uppercase flex items-center justify-center gap-2">
               <RefreshCw size={14} /> Refresh Assets
            </button>
         </div>

         {/* Couriers Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCouriers.length > 0 ? (
               filteredCouriers.map((courier) => (
                  <div 
                     key={courier.id}
                     className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden group hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 relative"
                  >
                     <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                           <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                              <User size={32} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                           </div>
                           <div className={`px-4 py-1 rounded-full text-[9px] font-black tracking-tighter uppercase ${
                              courier.status === 'ONLINE' || courier.status === 'AVAILABLE'
                                 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                 : 'bg-slate-50 text-slate-400 border border-slate-100'
                           }`}>
                              {courier.status}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{courier.name}</h3>
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 uppercase">
                                 <Smartphone size={12} /> {courier.phone}
                              </p>
                           </div>

                           <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                              <div className="space-y-1">
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Vehicle</p>
                                 <p className="text-[11px] font-black text-slate-900 flex items-center gap-1.5 uppercase">
                                    <Truck size={12} className="text-emerald-500" /> {courier.vehicleType || 'Courier'}
                                 </p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Plate</p>
                                 <p className="text-[11px] font-black text-slate-900 uppercase">{courier.plateNumber || 'N/A'}</p>
                              </div>
                           </div>
                        </div>

                        <button 
                           onClick={() => handleAssign(courier.id)}
                           disabled={assigning !== null}
                           className={`w-full mt-8 py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all uppercase flex items-center justify-center gap-3 ${
                              assigning === courier.id
                                 ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                 : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200'
                           }`}
                        >
                           {assigning === courier.id ? (
                              <Loader2 size={16} className="animate-spin" />
                           ) : (
                              <>
                                 <Zap size={16} className="fill-white" /> Initiate Dispatch
                              </>
                           )}
                        </button>
                     </div>
                  </div>
               ))
            ) : (
               <div className="col-span-full py-20 text-center bg-white border border-dashed border-slate-200 rounded-[3rem]">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                     <AlertCircle size={32} className="text-slate-200" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No External Couriers Found</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">Please onboard couriers in the management section first.</p>
                  <button 
                     onClick={() => navigate('/couriers')}
                     className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-slate-800 transition-all uppercase"
                  >
                     Go to Management
                  </button>
               </div>
            )}
         </div>
      </div>
   );
}
