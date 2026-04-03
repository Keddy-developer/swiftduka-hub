import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import { toast } from "react-toastify";
import {
  ArrowLeft, Package, Truck, MapPin, User, CheckCircle,
  XCircle, Clock, Eye, AlertTriangle, RefreshCw, Gift,
  Printer, Hash, DollarSign, Smartphone, CreditCard, Mail, Info, X,
  Navigation, Calendar, Shield, Activity, Share2, ClipboardCheck
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import QRCode from "react-qr-code";

const StatusBadge = ({ status }) => {
  const configs = {
    Processing: "bg-blue-50 text-blue-700 border-blue-100 shadow-blue-100",
    Shipped: "bg-purple-50 text-purple-700 border-purple-100 shadow-purple-100",
    Delivered: "bg-green-50 text-green-700 border-green-100 shadow-green-100",
    ReadyForPickup: "bg-orange-50 text-orange-700 border-orange-100 shadow-orange-100",
    Cancelled: "bg-red-50 text-red-700 border-red-100 shadow-red-100",
    Pending: "bg-slate-50 text-slate-700 border-slate-100 shadow-slate-100",
    ReadyForLogistics: "bg-indigo-50 text-indigo-700 border-indigo-100 shadow-indigo-100"
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${configs[status] || "bg-slate-50 text-slate-400 border-slate-200"}`}>
      {status}
    </span>
  );
};

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrContent, setQrContent] = useState("");

  const isSupport = user?.role?.includes("customer_support");

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      // Backend uses /admin/:trackingNumber in orderRoutes.ts
      const res = await axiosInstance.get(`/order/admin/${id}`);
      setOrder(res.data.data || res.data);
    } catch (error) {
      console.error("Order fetch error", error);
      toast.error("Manifest sync failure");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchOrderDetails(); }, [id]);

  const handleAction = async (endpoint, method = 'patch', payload = {}) => {
    if (isSupport) return toast.info("Restricted: Customer Support Access Only");
    setActionLoading(true);
    try {
      await axiosInstance[method](endpoint, payload);
      toast.success("Logistics command authorized");
      fetchOrderDetails();
    } catch (err) {
      toast.error("Execution failure");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 opacity-50">
      <RefreshCw className="w-8 h-8 animate-spin mb-3 text-slate-400" />
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Synchronizing Order Telemetry...</span>
    </div>
  );

  if (!order) return (
    <div className="p-24 text-center max-w-sm mx-auto space-y-6">
       <div className="w-20 h-20 bg-slate-100 rounded-3xl mx-auto flex items-center justify-center border border-slate-200">
          <AlertTriangle className="w-10 h-10 text-slate-300" />
       </div>
       <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Entity Not Found</h3>
       <p className="text-[10px] font-bold text-slate-400 uppercase italic">The requested manifest does not exist in this fulfillment node's registry.</p>
       <button onClick={() => navigate('/orders')} className="w-full py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">Return to Ledger</button>
    </div>
  );

  const overallStatus = order.products[0]?.deliveryStatus || 'Pending';

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-500">
      {/* 🏙️ ACTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
        <div>
          <button onClick={() => navigate('/orders')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors mb-4 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Fulfilment Ledger
          </button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">
               #{order.trackingNumber}
            </h1>
            <StatusBadge status={overallStatus} />
          </div>
          <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <Calendar size={14} className="mb-0.5" /> Initial Registration: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => window.print()} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
                <Printer size={16} /> Batch Print
            </button>
            <button onClick={fetchOrderDetails} className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest flex items-center justify-center gap-2">
                <RefreshCw size={16} className={actionLoading ? 'animate-spin' : ''} /> Sync
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         {/* ── LEFT: LINE ITEMS & CARGO ── */}
         <div className="lg:col-span-8 space-y-6 md:space-y-8">
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden group">
               <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Package size={18} className="text-slate-400" />
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Cargo Manifest Line Items</h3>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-white border border-slate-100 px-2 py-0.5 rounded shadow-sm">Items: {order.products.length}</span>
               </div>
               
               <div className="divide-y divide-slate-100">
                  {order.products.map(p => (
                    <div key={p.id} className="p-6 hover:bg-slate-50/50 transition-all relative overflow-hidden group/item">
                       <div className="flex flex-col sm:flex-row gap-6 justify-between relative z-10">
                          <div className="flex gap-6 min-w-0">
                             <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl p-1 flex-shrink-0 shadow-sm transition-transform group-hover/item:scale-105">
                                {p.product?.image ? (
                                   <img src={p.product.image} className="w-full h-full object-cover rounded-lg" alt="" />
                                ) : (
                                   <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                      <Package size={24} className="text-slate-200" />
                                   </div>
                                )}
                             </div>
                             <div className="min-w-0 flex-1">
                                <h4 className="font-black text-slate-900 text-sm md:text-base truncate leading-tight uppercase tracking-tight">{p.product?.name}</h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                   <p className="text-[10px] font-mono text-blue-600 font-black tracking-widest">ID: {p.id.slice(0,8)}</p>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-4">Units: {p.quantity}</p>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-200 pl-4">Price: Ksh {p.priceAtPurchase?.toLocaleString()}</p>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                   <StatusBadge status={p.deliveryStatus} />
                                   {p.isGift && (
                                      <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm shadow-rose-100/50 animation-pulse"><Gift size={12} /> Gift Wrapped</span>
                                   )}
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex flex-col items-start sm:items-end gap-4 shrink-0 justify-between">
                             <div className="text-left sm:text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Position Gross Value</p>
                                <p className="text-xl font-black text-slate-900 tracking-tighter leading-none mt-1">Ksh {(p.priceAtPurchase * p.quantity).toLocaleString()}</p>
                             </div>
                             <div className="flex gap-2 w-full sm:w-auto">
                                <button 
                                  onClick={() => { setQrContent(`${order.trackingNumber}|${p.id}`); setShowQRModal(true); }} 
                                  className="flex-1 sm:flex-none p-2.5 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-slate-100 bg-slate-50 hover:shadow-lg shadow-sm"
                                >
                                   <Eye size={18} />
                                </button>
                                {!p.adminReceived && p.deliveryStatus !== 'Cancelled' && (
                                   <button 
                                      onClick={() => handleAction(`/order/${order.trackingNumber}/mark-received`, 'patch', { orderProductId: p.id })} 
                                      className="flex-3 sm:flex-none px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:shadow-xl transition-all shadow-lg shadow-slate-200"
                                   >
                                      Mark Inbound
                                   </button>
                                )}
                             </div>
                          </div>
                       </div>
                       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 opacity-0 group-hover/item:opacity-100 transition-opacity -z-10"></div>
                    </div>
                  ))}
               </div>
               
               <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                     <Shield className="w-5 h-5 text-blue-400" />
                     <p className="text-xs font-black uppercase tracking-widest underline decoration-blue-500 underline-offset-4">Manifest Integrity Guaranteed</p>
                  </div>
                  <button className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Digital Audit Log</button>
               </div>
            </section>

            {/* ── GIFT PROTOCOL ── */}
            {order.isGiftOrder && (
               <section className="bg-gradient-to-br from-rose-50 to-white border border-rose-100 rounded-2xl p-6 md:p-8 space-y-4 shadow-xl shadow-rose-100/20 relative overflow-hidden group">
                  <div className="flex items-center gap-3 text-rose-700 border-b border-rose-100 pb-4 mb-4">
                     <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center border border-rose-200">
                        <Gift size={18} />
                     </div>
                     <span className="text-sm font-black uppercase tracking-widest">Handover Protocol (RECIPIENT)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                     <div className="space-y-4">
                        <div>
                           <p className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Target Name</p>
                           <p className="text-lg font-black text-rose-900 truncate uppercase tracking-tight">{order.giftDetails?.recipientName}</p>
                        </div>
                        <div className="flex items-center gap-6">
                           <div>
                              <p className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Tactical Comm</p>
                              <p className="text-xs font-black text-rose-700 flex items-center gap-2"><Smartphone size={14} className="mb-0.5" /> {order.giftDetails?.recipientPhone}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Handover Status</p>
                              <p className="text-[10px] font-black text-rose-600 flex items-center gap-2 uppercase tracking-tight"><Clock size={14} className="mb-0.5" /> AWAITING DROP</p>
                           </div>
                        </div>
                     </div>
                     <div className="bg-white/60 backdrop-blur-sm border border-rose-200/50 p-5 rounded-xl">
                        <p className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] mb-2 font-black">Gift Message Cipher</p>
                        <p className="text-xs font-bold text-rose-800 italic leading-relaxed font-black">"{order.giftDetails?.message || 'Standard Handover - Direct Handshake - No Card Protocol'}"</p>
                     </div>
                  </div>
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-100/50 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
               </section>
            )}
         </div>

         {/* ── RIGHT: COMMAND DATA & OPS ── */}
         <div className="lg:col-span-4 space-y-6 md:space-y-8">
            {/* Stakeholder Analytics */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden shadow-xl shadow-slate-200/20">
               <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                  <Activity size={18} className="text-slate-400" />
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-black">Consignee Telemetry</h3>
               </div>
               
               <div className="p-6 space-y-8">
                  {/* Customer Information */}
                  <div className="space-y-6">
                     <div className="group">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
                           Customer Identity
                           <Share2 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-slate-400" />
                        </p>
                        <div className="space-y-3">
                           <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm text-slate-900 font-black text-sm">JS</div>
                              <div className="min-w-0 flex-1">
                                 <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{order.shippingAddress?.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.shippingAddress?.email}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                               <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm">
                                  <Smartphone size={18} className="text-blue-500" />
                               </div>
                               <p className="text-xs font-black text-slate-900 tracking-widest">{order.shippingAddress?.phoneNumber}</p>
                           </div>
                        </div>
                     </div>

                     <div className="group">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Tactical Drop-Off Point</p>
                        <div className="space-y-3 bg-slate-900 text-white p-5 rounded-2xl shadow-xl border-t-4 border-blue-500">
                           <div className="flex items-center gap-3">
                              <MapPin size={18} className="text-blue-500" />
                              <h4 className="text-sm font-black uppercase tracking-tight truncate">{order.shippingAddress?.town}</h4>
                           </div>
                           <div className="h-px bg-white/10 w-full"></div>
                           <p className="text-[10px] font-bold leading-relaxed text-slate-400 uppercase tracking-wide">
                              {order.shippingAddress?.address || 'UNIFIED ZONE - CONTACT HANDOVER TEAM'}
                           </p>
                           <button className="w-full mt-2 py-2 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">GPS Coordinates</button>
                        </div>
                     </div>
                  </div>

                  {/* Financial Settlement Ledger */}
                  <div className="space-y-4">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Financial Settlement Ledger</p>
                     <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 border-2 border-dashed">
                        {[
                           { label: 'Subtotal Manifest', value: order.totalCost - order.deliveryFee },
                           { label: 'Logistics Overhead', value: order.deliveryFee },
                           { label: 'Network Discount', value: order.discount, color: 'text-green-600' }
                        ].map((row, i) => row.value > 0 && (
                           <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-500">{row.label}</span>
                              <span className={row.color || 'text-slate-900'}>Ksh {row.value.toLocaleString()}</span>
                           </div>
                        ))}
                        <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Final Settlement</span>
                           <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Ksh {order.totalCost.toLocaleString()}</span>
                        </div>
                     </div>
                  </div>

                  {/* High Command Controls */}
                  <div className="space-y-3 pt-4">
                     {!isSupport && (
                        <div className="space-y-3">
                           {order.products.every(p => p.adminReceived && p.deliveryStatus !== 'Delivered' && p.deliveryStatus !== 'Cancelled') && (
                              <button 
                                onClick={() => handleAction(`/order/tracking/${order.trackingNumber}/status`, 'patch', { status: 'Delivered' })} 
                                disabled={actionLoading}
                                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-3"
                              >
                                 <ClipboardCheck size={18} /> Authorize Drop-Off
                              </button>
                           )}
                           <button onClick={() => navigate(`/orders`)}
                             className="w-full py-4 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm">
                             Return to Ledger
                           </button>
                        </div>
                     )}
                     <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                        <Info size={14} className="shrink-0" />
                        <p className="text-[9px] font-black uppercase tracking-tight leading-tight">All logistics updates are immutable and recorded in the block-history.</p>
                     </div>
                  </div>
               </div>
            </section>
         </div>
      </div>

      {/* QR IDENTITY MODAL */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-10 space-y-8 text-center animate-in zoom-in-95 duration-200 overflow-hidden relative">
              <div className="flex items-center justify-between relative z-10">
                 <div className="text-left">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cargo ID Handover</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Proof of Delivery Credentials</p>
                 </div>
                 <button onClick={() => setShowQRModal(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors shadow-sm"><X size={20} /></button>
              </div>

              <div className="bg-white p-6 border-4 border-slate-900 inline-block shadow-2xl rounded-2xl hover:scale-105 transition-transform duration-300 group">
                 <QRCode value={qrContent} size={200} fgColor="#0F172A" />
              </div>

              <div className="space-y-2 relative z-10">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Security Cipher</p>
                 <p className="text-[10px] font-mono text-slate-900 font-black p-3 bg-slate-50 rounded-lg break-all border border-slate-100 shadow-inner">{qrContent}</p>
              </div>

              <button onClick={() => window.print()} className="w-full py-4 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 relative z-10">
                 <Printer size={18} /> Print Manifest Label
              </button>
              
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/50 rounded-full -mr-24 -mt-24 -z-10"></div>
           </div>
        </div>
      )}
    </div>
  );
}
