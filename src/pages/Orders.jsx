import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Search, Filter, Calendar, Download, RefreshCw, 
  Package, Truck, CheckCircle, XCircle, Clock, 
  ChevronDown, ChevronUp, MapPin, Eye, Phone, User, AlertTriangle
} from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance from "../services/axiosConfig";
import { useAuth } from "../contexts/AuthContext";

const StatusBadge = ({ status }) => {
  const configs = {
    Processing: "bg-blue-50 text-blue-700 border-blue-100",
    Shipped: "bg-purple-50 text-purple-700 border-purple-100",
    Delivered: "bg-green-50 text-green-700 border-green-100",
    ReadyForPickup: "bg-orange-50 text-orange-700 border-orange-100",
    Cancelled: "bg-red-50 text-red-700 border-red-100",
    Pending: "bg-amber-50 text-amber-700 border-amber-100",
    ReadyForLogistics: "bg-indigo-50 text-indigo-700 border-indigo-100"
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${configs[status] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
      {status}
    </span>
  );
};

const Orders = () => {
  const { hub } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("all");
  const [activeTab, setActiveTab] = useState("ALL");

  const fetchOrders = async (silent = false) => {
    if (!hub?.id) return setLoading(false);
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      // Fetching orders specific to this hub. 
      // Note: Endpoint should filter by hub products usually, 
      // but here we use the admin-orders and filter client-side or expect the backend to handle hub context.
      const res = await axiosInstance.get(`/order/admin-orders?period=${period}`);
      const data = Array.isArray(res.data) ? res.data : (res.data?.orders || []);
      
      // Filter orders that have products belonging to this hub
      const hubOrders = data.filter(order => 
        order.products?.some(p => p.product?.fulfillmentHubId === hub.id)
      );
      
      setOrders(hubOrders);
    } catch (error) {
      console.error("Order fetch error", error);
      toast.error("Logistics sync failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [hub, period]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => 
      order.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
      order.shippingAddress?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  if (loading) return <div className="p-8 text-slate-400 font-medium italic">Synchronizing order manifest...</div>;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 🏙️ HEADER & UTILITIES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Order Fulfillment</h2>
          <p className="text-[12px] md:text-sm text-slate-500 font-medium">Processing manifest for hub incoming and outgoing traffic.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex bg-white border border-slate-200 rounded p-1 shadow-sm">
                {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED'].map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <button onClick={() => fetchOrders(true)} className="px-4 py-2 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2">
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
        </div>
      </div>

      {/* 📊 DENSE SEARCH & FILTERS */}
      <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search tracking number or customer..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full bg-white border border-slate-200 rounded pl-10 pr-4 py-2 text-sm font-medium outline-none focus:border-slate-400 transition-all shadow-sm" 
             />
          </div>
          <div className="flex gap-2">
              <select 
                value={period} 
                onChange={e => setPeriod(e.target.value)}
                className="bg-white border border-slate-200 rounded px-3 py-2 text-[10px] font-bold text-slate-600 outline-none focus:border-slate-400 uppercase shadow-sm"
              >
                  <option value="all">All Logs</option>
                  <option value="today">Today Only</option>
                  <option value="week">Past 7 Days</option>
                  <option value="month">Past 30 Days</option>
              </select>
              <button className="px-4 py-2 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 shadow-sm uppercase">
                 <Download size={14} /> Reports
              </button>
          </div>
      </div>

      {/* 🗄️ ORDER LEDGER (Responsive Cards on Mobile, Table on Desktop) */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden min-h-[400px]">
        {/* Tablet/Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
             <thead>
               <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-48">Identifier</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Consignee</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Item Scope</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Value</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Logistics</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Utility</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {filteredOrders.map(order => (
                 <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                   <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                         <span className="font-mono text-xs font-bold text-slate-900 tracking-tight">{order.trackingNumber}</span>
                         <span className="text-[9px] text-slate-400 uppercase font-medium">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <div className="min-w-0">
                         <p className="font-bold text-slate-900 text-xs truncate">{order.shippingAddress?.name}</p>
                         <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                             <Phone size={10} className="text-slate-300" /> {order.shippingAddress?.phoneNumber}
                         </p>
                      </div>
                   </td>
                   <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                         {order.products?.map((p, idx) => (
                           <div key={idx} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                              <span className="text-[9px] font-bold text-slate-700">{p.quantity}x</span>
                              <span className="text-[9px] font-medium text-slate-500 truncate max-w-[100px]">{p.product?.name}</span>
                              <StatusBadge status={p.deliveryStatus} />
                           </div>
                         ))}
                      </div>
                   </td>
                   <td className="px-6 py-4 text-center">
                      <p className="text-xs font-bold text-slate-900">Ksh {order.totalCost.toLocaleString()}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">{order.paymentStatus}</p>
                   </td>
                   <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 uppercase">
                            <MapPin size={10} className="text-slate-300" />
                            {order.shippingAddress?.town}
                         </div>
                         <span className="text-[9px] text-slate-400 font-medium">{order.deliveryType}</span>
                      </div>
                   </td>
                   <td className="px-6 py-4 text-right">
                      <Link to={`/orders/${order.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-[10px] font-bold uppercase hover:bg-slate-800 transition-all shadow-sm">
                         Manage
                      </Link>
                   </td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>

        {/* Mobile View Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredOrders.map(order => (
            <div key={order.id} className="p-4 bg-white hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-slate-900 tracking-tight">{order.trackingNumber}</span>
                <Link to={`/orders/${order.id}`} className="text-slate-900 font-bold text-[10px] uppercase underline decoration-2 underline-offset-4">Manage Order</Link>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-3">
                 <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Customer</p>
                    <p className="text-[11px] font-bold text-slate-800">{order.shippingAddress?.name}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Logistics</p>
                    <p className="text-[11px] font-bold text-slate-800">{order.shippingAddress?.town}</p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                 {order.products?.map((p, idx) => (
                   <StatusBadge key={idx} status={p.deliveryStatus} />
                 ))}
              </div>
              <div className="flex items-center justify-between border-t border-slate-50 pt-2 mt-2">
                 <span className="text-[9px] text-slate-400 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                 <span className="text-xs font-black text-slate-900">Ksh {order.totalCost.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
           <div className="p-20 text-center text-slate-400 text-[10px] font-bold italic uppercase tracking-widest border-t border-slate-50">No operational orders detected in current scope.</div>
        )}
      </div>
    </div>
  );
};

export default Orders;
