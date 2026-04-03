import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  Search, Filter, Calendar, Download, RefreshCw, 
  Package, Truck, CheckCircle, XCircle, Clock, 
  ChevronDown, ChevronUp, MapPin, Eye, Phone, User, AlertTriangle,
  MoreVertical, Navigation, ClipboardList
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
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${configs[status] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
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
      const res = await axiosInstance.get(`/order/admin-orders?period=${period}`);
      const data = Array.isArray(res.data) ? res.data : (res.data?.orders || []);
      
      const hubOrders = data.filter(order => 
        order.products?.some(p => p.product?.fulfillmentHubId === hub.id)
      );
      
      setOrders(hubOrders);
    } catch (error) {
      toast.error("Logistics sync failure");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [hub, period]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.trackingNumber?.toLowerCase().includes(search.toLowerCase()) ||
        order.shippingAddress?.name?.toLowerCase().includes(search.toLowerCase());
      
      if (activeTab === "ALL") return matchesSearch;
      return matchesSearch && (order.deliveryStatus?.toUpperCase() === activeTab);
    });
  }, [orders, search, activeTab]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 opacity-50">
      <RefreshCw className="w-8 h-8 animate-spin mb-3 text-slate-400" />
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Synchronizing Order Manifest...</span>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
      {/* 🏙️ TOP NAVIGATION & PERFORMANCE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Order Fulfillment</h1>
          <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-wide mt-1 italic">
             Hub Inbound & Outbound Traffic Manifest
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 shadow-inner">
                {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED'].map(tab => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            <button onClick={() => fetchOrders(true)} className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
        </div>
      </div>

      {/* 📊 SEARCH & UTILITY TOOLBAR */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
          <div className="flex-1 relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
             <input 
                type="text" 
                placeholder="Scan Tracking Master / Search Consignee..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-slate-900 transition-all" 
             />
          </div>
          <div className="flex gap-2">
              <select 
                value={period} 
                onChange={e => setPeriod(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-[10px] font-black text-slate-600 outline-none focus:border-slate-400 uppercase tracking-widest"
              >
                  <option value="all">Global History</option>
                  <option value="today">Today Only</option>
                  <option value="week">Past 7 Days</option>
                  <option value="month">Past 30 Days</option>
              </select>
              <button className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                 <Download size={14} /> Reports
              </button>
          </div>
      </div>

      {/* 🗄️ MANIFEST GRID (MOBILE FIRST) */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredOrders.map(order => (
          <OrderTacticalCard key={order.id} order={order} />
        ))}

        {filteredOrders.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl opacity-40">
             <ClipboardList size={48} className="mx-auto mb-4 text-slate-300 animate-pulse" />
             <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Zero Record Delta</h3>
             <p className="text-[10px] font-bold text-slate-400 mt-2 italic">No operational orders detected in current logistics scope.</p>
          </div>
        )}
      </div>

      <div className="md:hidden h-20" />
    </div>
  );
};

const OrderTacticalCard = ({ order }) => {
  const dateStr = new Date(order.createdAt).toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative">
       <div className="p-5">
          <div className="flex justify-between items-start mb-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 group-hover:bg-slate-900 group-hover:border-slate-900 transition-all">
                   <Package className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </div>
                <div>
                   <h3 className="font-black text-slate-900 text-xs tracking-tight uppercase group-hover:text-blue-600 transition-colors">{order.trackingNumber}</h3>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{dateStr}</p>
                </div>
             </div>
             <div className="flex flex-col items-end gap-1">
                <StatusBadge status={order.deliveryStatus || 'Pending'} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-slate-50/50 rounded-lg p-4 border border-slate-100">
             <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Consignee</p>
                <p className="text-[11px] font-black text-slate-900 truncate uppercase">{order.shippingAddress?.name}</p>
                <p className="text-[9px] font-bold text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1">
                   <Phone size={10} className="text-slate-300" /> {order.shippingAddress?.phoneNumber}
                </p>
             </div>
             <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tactical Destination</p>
                <p className="text-[11px] font-black text-slate-900 truncate uppercase">{order.shippingAddress?.town}</p>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter flex items-center gap-1">
                   <Navigation size={10} className="text-blue-400" /> 3.2KM DISTANCE
                </p>
             </div>
          </div>

          <div className="mt-5 space-y-3">
             <div className="flex flex-wrap gap-1.5 max-h-[60px] overflow-hidden">
                {order.products?.slice(0, 3).map((p, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-white border border-slate-100 rounded-md px-2 py-1 shadow-sm">
                     <span className="text-[10px] font-black text-slate-900">{p.quantity}x</span>
                     <span className="text-[9px] font-bold text-slate-500 truncate max-w-[80px] uppercase">{p.product?.name}</span>
                  </div>
                ))}
                {order.products?.length > 3 && (
                  <div className="flex items-center gap-1 bg-slate-900 text-white border border-slate-900 rounded-md px-2 py-1 shadow-sm">
                     <span className="text-[9px] font-black">+{order.products.length - 3}</span>
                  </div>
                )}
             </div>

             <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
                <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gross Value</p>
                   <p className="text-base font-black text-slate-900 tracking-tighter">Ksh {order.totalCost.toLocaleString()}</p>
                </div>
                <Link to={`/orders/${order.id}`} className="px-5 py-2 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
                   Manage
                </Link>
             </div>
          </div>
       </div>

       <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
    </div>
  );
};

export default Orders;
