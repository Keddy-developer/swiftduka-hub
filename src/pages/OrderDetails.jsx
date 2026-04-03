import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import { toast } from "react-toastify";
import {
  ArrowLeft, Package, Truck, MapPin, User, CheckCircle,
  XCircle, Clock, Eye, AlertTriangle, RefreshCw, Gift,
  Printer, Hash, DollarSign, Smartphone, CreditCard, Mail, Info, X
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import QRCode from "react-qr-code";
import ReturnForm from "../components/ReturnForm";

const StatusBadge = ({ status }) => {
  const configs = {
    Processing: "bg-blue-50 text-blue-700 border-blue-100",
    Shipped: "bg-purple-50 text-purple-700 border-purple-100",
    Delivered: "bg-green-50 text-green-700 border-green-100",
    ReadyForPickup: "bg-amber-50 text-amber-700 border-amber-100",
    Cancelled: "bg-red-50 text-red-700 border-red-100",
    Pending: "bg-slate-50 text-slate-700 border-slate-100",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${configs[status] || configs.Pending}`}>
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
      const res = await axiosInstance.get(`/order/admin/${id}`);
      setOrder(res.data.data || res.data);
    } catch (error) {
      toast.error("Manifest sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchOrderDetails(); }, [id]);

  const handleAction = async (endpoint, method = 'patch', payload = {}) => {
    if (isSupport) return toast.info("View-access only in current session");
    setActionLoading(true);
    try {
      await axiosInstance[method](endpoint, payload);
      toast.success("Command executed");
      fetchOrderDetails();
    } catch (err) {
      toast.error("Execution failure");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-400 font-medium italic text-sm">Syncing order manifest...</div>;
  if (!order) return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Order not found in registry.</div>;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 🏙️ HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <button onClick={() => navigate('/orders')} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-900 transition-colors">
            <ArrowLeft size={14} /> Back to Ledger
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tighter flex items-center gap-3">
             #{order.trackingNumber}
             <StatusBadge status={order.products[0]?.deliveryStatus} />
          </h2>
        </div>
        <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm uppercase">
                <Printer size={14} /> BATCH PRINT
            </button>
            <button onClick={fetchOrderDetails} className="px-4 py-2 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-sm uppercase">
                <RefreshCw size={14} className={actionLoading ? 'animate-spin' : ''} /> REFRESH
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
         {/* ── LEFT: LINE ITEMS ── */}
         <div className="lg:col-span-8 space-y-6">
            <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
               <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <Package size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cargo Manifest</span>
               </div>
               
               <div className="divide-y divide-slate-100">
                  {order.products.map(p => (
                    <div key={p.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                       <div className="flex flex-col md:flex-row gap-4 justify-between">
                          <div className="flex gap-4 min-w-0">
                             <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded p-1 flex-shrink-0">
                                {p.product?.image && <img src={p.product.image} className="w-full h-full object-cover rounded" />}
                             </div>
                             <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm truncate leading-tight">{p.product?.name}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight">ID: {p.id.slice(0,8)} · Qty: {p.quantity}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                   <StatusBadge status={p.deliveryStatus} />
                                   {p.isGift && <span className="px-2 py-0.5 bg-pink-50 text-pink-600 border border-pink-100 rounded text-[9px] font-bold uppercase tracking-tight flex items-center gap-1"><Gift size={10} /> Gift Wrapped</span>}
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-3 self-end md:self-auto">
                             <div className="text-right">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Position Total</p>
                                <p className="text-sm font-black text-slate-900 leading-none mt-0.5">Ksh {(p.priceAtPurchase * p.quantity).toLocaleString()}</p>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => { setQrContent(`${order.trackingNumber}|${p.id}`); setShowQRModal(true); }} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors border border-slate-100 bg-white shadow-sm"><Eye size={14} /></button>
                                {!p.adminReceived && p.deliveryStatus !== 'Cancelled' && (
                                   <button onClick={() => handleAction(`/order/${order.trackingNumber}/mark-received`, 'patch', { orderProductId: p.id })} className="p-1 px-3 bg-slate-900 text-white rounded text-[9px] font-bold uppercase hover:bg-slate-800 transition-all shadow-sm">Mark Inbound</button>
                                )}
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* ── GIFT PAYLOAD ── */}
            {order.isGiftOrder && (
               <section className="bg-pink-50 border border-pink-100 rounded p-5 space-y-3">
                  <div className="flex items-center gap-2 text-pink-700 border-b border-pink-200 pb-2 mb-2">
                     <Gift size={16} />
                     <span className="text-xs font-bold uppercase tracking-widest">Recipient Protocol</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-pink-400 uppercase tracking-widest leading-none">Recipient</p>
                        <p className="text-xs font-bold text-pink-900 truncate">{order.giftDetails?.recipientName}</p>
                        <p className="text-[10px] text-pink-700 flex items-center gap-1"><Smartphone size={10} /> {order.giftDetails?.recipientPhone}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[9px] font-bold text-pink-400 uppercase tracking-widest leading-none">Gift Cipher</p>
                        <p className="text-[10px] text-pink-800 italic leading-relaxed">"{order.giftDetails?.message || 'Standard Handover - No Card'}"</p>
                     </div>
                  </div>
               </section>
            )}
         </div>

         {/* ── RIGHT: SUMMARY & OPS ── */}
         <div className="lg:col-span-4 space-y-6">
            <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
               <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <Info size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol Metadata</span>
               </div>
               
               <div className="p-5 space-y-6">
                  {/* Stakeholder */}
                  <div className="space-y-4">
                     <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-l-2 border-slate-200 pl-2">Customer Profile</p>
                        <div className="space-y-2">
                           <p className="text-sm font-bold text-slate-900 flex items-center gap-2"><User size={14} className="text-slate-300" /> {order.shippingAddress?.name}</p>
                           <p className="text-xs text-slate-500 flex items-center gap-2"><Smartphone size={14} className="text-slate-300" /> {order.shippingAddress?.phoneNumber}</p>
                           <p className="text-xs text-slate-500 flex items-center gap-2"><Mail size={14} className="text-slate-300" /> {order.shippingAddress?.email}</p>
                        </div>
                     </div>
                     <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-l-2 border-slate-200 pl-2">Logistical Sink</p>
                        <div className="space-y-2">
                           <p className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight"><MapPin size={14} className="text-slate-300" /> {order.shippingAddress?.town}</p>
                           <p className="text-xs text-slate-500 leading-relaxed pl-5 tracking-tight uppercase font-medium">{order.shippingAddress?.address}</p>
                        </div>
                     </div>
                  </div>

                  {/* Financial Ledger */}
                  <div className="bg-slate-50 border border-slate-100 rounded p-4 space-y-3">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Financial Settlement</p>
                     <div className="space-y-2 text-xs font-bold text-slate-600">
                        <div className="flex justify-between"><span>SUBTOTAL</span><span>Ksh {order.totalCost - order.deliveryFee}</span></div>
                        <div className="flex justify-between"><span>LOGISTICS</span><span>Ksh {order.deliveryFee}</span></div>
                        {order.discount > 0 && <div className="flex justify-between text-green-600"><span>DISCOUNT</span><span>- Ksh {order.discount}</span></div>}
                        <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 font-black"><span>NET TOTAL</span><span>Ksh {order.totalCost}</span></div>
                     </div>
                  </div>

                  {/* Operational Controls */}
                  {!isSupport && (
                     <div className="space-y-2">
                        {order.products.every(p => p.adminReceived && p.deliveryStatus !== 'Delivered' && p.deliveryStatus !== 'Cancelled') && (
                           <button onClick={() => handleAction(`/order/${trackingNumber}/delivered`)} disabled={actionLoading}
                             className="w-full py-2.5 bg-green-600 text-white rounded text-[10px] font-bold uppercase hover:bg-green-700 transition-all shadow-sm">Mark Global Delivery</button>
                        )}
                        <button onClick={() => navigate(`/orders`)}
                          className="w-full py-2.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-500 uppercase hover:bg-slate-100 transition-all">Audit Finished Orders</button>
                     </div>
                  )}
               </div>
            </section>
         </div>
      </div>

      {/* QR MODAL */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
           <div className="bg-white border border-slate-200 rounded shadow-2xl w-full max-w-xs p-8 space-y-6 text-center animate-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Handover Identity</span>
                 <button onClick={() => setShowQRModal(false)} className="text-slate-300 hover:text-slate-600"><X size={16} /></button>
              </div>
              <div className="bg-white p-4 border border-slate-100 inline-block shadow-inner rounded">
                 <QRCode value={qrContent} size={200} />
              </div>
              <p className="text-[10px] font-mono text-slate-400 font-bold uppercase break-all">{qrContent}</p>
              <button onClick={() => window.print()} className="w-full py-3 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-slate-200">Print Label</button>
           </div>
        </div>
      )}
    </div>
  );
}
