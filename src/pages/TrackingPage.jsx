import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import {
   Search,
   Package,
   MapPin,
   Truck,
   User,
   AlertCircle,
   Clock,
   CheckCircle2,
   Phone,
   Calendar,
   Building2
} from 'lucide-react';
import { toast } from 'react-toastify';

const TrackingPage = () => {
   const { hub } = useAuth();
   const [trackingNumber, setTrackingNumber] = useState('');
   const [order, setOrder] = useState(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);

   const handleSearch = async (e) => {
      e.preventDefault();
      if (!trackingNumber.trim()) return;
      if (!hub?.id) {
         toast.error("You must be assigned to a hub first.");
         return;
      }

      setLoading(true);
      setError(null);
      setOrder(null);

      try {
         // The endpoint added in backend: /hubs/:id/track/:trackingNumber
         const response = await axiosInstance.get(`/delivery/hubs/${hub.id}/track/${trackingNumber.trim()}`);
         setOrder(response.data.order);
         toast.success("Tracking data found!");
      } catch (err) {
         console.error("Tracking error:", err);
         if (err.response?.status === 404) {
            setError("No order found with this tracking number.");
         } else if (err.response?.status === 403) {
            setError("Access Denied: This order is not affiliated with your active fulfillment hub.");
         } else {
            setError(err.response?.data?.message || "An error occurred while tracking the order.");
         }
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="space-y-6 max-w-5xl mx-auto">
         {/* Header */}
         <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Track Order Payload</h1>
            <p className="text-slate-500 mt-1">Scan or manually enter a tracking number to view full processing and routing intelligence.</p>
         </div>

         {/* Search Input Box */}
         <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <form onSubmit={handleSearch} className="flex max-w-2xl gap-3">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                     type="text"
                     placeholder="e.g. TN-12345678"
                     value={trackingNumber}
                     onChange={(e) => setTrackingNumber(e.target.value)}
                     className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-slate-900 font-bold tracking-widest placeholder:normal-case placeholder:font-normal"
                     disabled={loading}
                  />
               </div>
               <button
                  type="submit"
                  disabled={loading || !trackingNumber.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
               >
                  {loading ? <Clock className="w-5 h-5 animate-spin" /> : 'Track Package'}
               </button>
            </form>
         </div>

         {/* States Output */}
         {error && (
            <div className="bg-red-50 border border-red-200 p-5 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
               <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
               <div>
                  <h3 className="font-bold text-red-800 tracking-tight">Tracking Failure</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
               </div>
            </div>
         )}

         {order && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Order Identity Card */}
               <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center">
                           <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-400 tracking-widest">Tracking Record</p>
                           <h2 className="text-lg font-black text-slate-900">{order.trackingNumber}</h2>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <div className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-2">
                           <Clock className="w-3.5 h-3.5 text-slate-400" />
                           <span className="text-xs font-bold text-slate-700">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="px-3 py-1 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                           <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                           <span className="text-xs font-black text-green-700 tracking-tight">Affiliated</span>
                        </div>
                     </div>
                  </div>

                  {/* Main Logistics Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 p-6 gap-6">
                     <div>
                        <h3 className="text-xs font-black text-slate-400 tracking-widest mb-3">Customer Profile</h3>
                        <div className="flex items-start gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              <User className="w-5 h-5 text-slate-400" />
                           </div>
                           <div>
                              <p className="font-bold text-slate-900">{order.user?.username || 'Guest Customer'}</p>
                              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5"><Phone className="w-3.5 h-3.5" />{order.user?.phone || 'No phone'}</p>
                              <p className="text-sm text-slate-500 line-clamp-1">{order.user?.email}</p>
                           </div>
                        </div>
                     </div>

                     <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <h3 className="text-xs font-black text-slate-400 tracking-widest mb-3 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Destination Routing</h3>
                        {order.deliveryType === 'DOOR' ? (
                           <div className="text-sm">
                              <p className="font-bold text-slate-800 text-base mb-1">Door Delivery</p>
                              <p className="text-slate-600 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400 shrink-0" /> {order.deliveryArea?.name}, {order.deliveryArea?.town}</p>
                           </div>
                        ) : (
                           <div className="text-sm">
                              <p className="font-bold text-slate-800 text-base mb-1">Pickup Station</p>
                              <p className="text-slate-600 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-blue-500 shrink-0" /> {order.pickupStation?.name || 'Unknown Station'}</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Products Timeline/List */}
               <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                     <Package className="w-5 h-5 text-slate-400" />
                     <h3 className="font-bold text-slate-700 tracking-tight">Payload Products ({order.products?.length || 0})</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                     {order.products?.map((item) => (
                        <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors">
                           <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                 <div className="flex gap-2 items-center mb-1">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded">{item.deliveryStatus}</span>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-bold text-[10px] rounded">Qty: {item.quantity}</span>
                                 </div>
                                 <p className="font-bold text-slate-900">{item.product?.name || 'Unknown Product'}</p>
                                 <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                                    By <span className="font-medium text-slate-700">{item.product?.seller?.storeName || 'Unknown Seller'}</span>
                                 </p>
                              </div>

                              {item.riderOrders && item.riderOrders.length > 0 && (
                                 <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-sm min-w-48 text-right">
                                    <p className="text-[10px] font-black text-purple-600 tracking-widest mb-1">Assigned Rider</p>
                                    <p className="font-bold text-purple-900">{item.riderOrders[0]?.rider?.name}</p>
                                    <p className="text-purple-700 font-medium text-xs">{item.riderOrders[0]?.rider?.numberPlate}</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default TrackingPage;
