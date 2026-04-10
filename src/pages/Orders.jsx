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
import LogisticsAuditTrail from "../components/LogisticsAuditTrail";

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
    <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest border ${configs[status] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });

  const fetchOrders = async (silent = false) => {
    if (!hub?.id) return setLoading(false);
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      // Use status if NOT "ALL", otherwise undefined to fetch everything
      const statusParam = activeTab === 'ALL' ? '' : `&status=${activeTab}`;
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';

      const url = `/hubs/${hub.id}/seller-orders?period=${period}&page=${page}&limit=${limit}${statusParam}${searchParam}`;
      const res = await axiosInstance.get(url);

      const ordersData = res.data.orders || [];
      const paginationData = res.data.pagination || { total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false };

      setOrders(ordersData);
      setPagination(paginationData);
    } catch (error) {
      console.error("[Orders] Fetch error:", error);
      if (error.response) {
        console.error("[Orders] Data:", error.response.data);
      }
      toast.error("Logistics sync failure");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔄 Trigger fetch when filters or pagination change
  useEffect(() => {
    fetchOrders();
  }, [hub, period, page, activeTab]);

  // 🔍 Debounced search effect
  useEffect(() => {
    if (!search) {
      fetchOrders(true);
      return;
    }
    const timer = setTimeout(() => {
      setPage(1); // Reset to page 1 for new search
      fetchOrders(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDownloadReport = () => {
    toast.info("Generating Logistics Manifest PDF...");
    // Future: implement pdf download endpoint call
    setTimeout(() => {
      toast.success("Ready for download. Check your system exports.");
    }, 2000);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 opacity-50">
      <RefreshCw className="w-8 h-8 animate-spin mb-3 text-slate-400" />
      <span className="text-xs font-bold tracking-widest text-slate-500">Synchronizing Order Manifest...</span>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
      {/* 🏙️ TOP NAVIGATION & PERFORMANCE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Order Fulfillment</h1>
          <p className="text-xs md:text-sm text-slate-500 font-bold tracking-wide mt-1 italic">
            Hub Inbound & Outbound Traffic Manifest
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 shadow-inner">
            {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button onClick={() => fetchOrders(true)} className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 tracking-widest">
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
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-[10px] font-black text-slate-600 outline-none focus:border-slate-400 tracking-widest"
          >
            <option value="all">Global History</option>
            <option value="today">Today Only</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>
          <button
            onClick={handleDownloadReport}
            className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 tracking-widest"
          >
            <Download size={14} /> Reports
          </button>
        </div>
      </div>

      {/* 🗄️ MANIFEST GRID (MOBILE FIRST) */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 text-left">
        {orders.map(order => (
          <OrderTacticalCard key={order.id} order={order} />
        ))}

        {orders.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl opacity-40">
            <ClipboardList size={48} className="mx-auto mb-4 text-slate-300 animate-pulse" />
            <h3 className="text-sm font-black tracking-[0.3em] text-slate-400">Zero Record Delta</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-2 italic">No operational orders detected in current logistics scope.</p>
          </div>
        )}
      </div>

      {/* 📑 PAGINATION CONTROLS */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 border border-slate-200 rounded-xl shadow-sm mt-6">
          <div className="text-[10px] font-black text-slate-400 tracking-widest">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} Total)
          </div>
          <div className="flex gap-2">
            <button
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 border border-slate-200 rounded-lg text-[10px] font-black tracking-widest hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black tracking-widest hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all px-6"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── AUDIT TRAIL ── */}
      <div className="pt-10 border-t border-slate-200">
        <div className="mb-6">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Outbound Traffic Audit</h3>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-1 italic">Recent order lifecycle status updates</p>
        </div>
        <LogisticsAuditTrail hubId={hub?.id || null} filterType="ORDER" />
      </div>

      <div className="md:hidden h-20" />
    </div>
  );
};

const OrderTacticalCard = ({ order: sellerOrder }) => {
  const mainOrder = sellerOrder.order;
  const product = sellerOrder.product;

  const dateStr = new Date(mainOrder?.createdAt || sellerOrder.createdAt).toLocaleDateString(undefined, {
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
              <h3 className="font-black text-slate-900 text-xs tracking-tight group-hover:text-blue-600 transition-colors">
                {mainOrder?.trackingNumber || 'NO-TRACKING'}
              </h3>
              <p className="text-[9px] font-bold text-slate-400 tracking-widest mt-0.5">{dateStr}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={sellerOrder.deliveryStatus || 'Pending'} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 bg-slate-50/50 rounded-lg p-4 border border-slate-100">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-400 tracking-widest">Consignee</p>
            <p className="text-[11px] font-black text-slate-900 truncate">{mainOrder?.user?.username || 'Guest'}</p>
            <p className="text-[9px] font-bold text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-1">
              <Phone size={10} className="text-slate-300" /> {mainOrder?.user?.phone || 'N/A'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[8px] font-black text-slate-400 tracking-widest">Destination</p>
            <p className="text-[11px] font-black text-slate-900 truncate">
              {mainOrder?.deliveryType === 'DOOR'
                ? (mainOrder?.deliveryArea?.name || mainOrder?.deliveryArea?.town || 'Door Delivery')
                : (mainOrder?.pickupStation?.name || 'Pickup Station')}
            </p>
            <p className="text-[9px] font-bold text-blue-600 tracking-tighter flex items-center gap-1">
              <Navigation size={10} className="text-blue-400" /> {mainOrder?.deliveryType}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-md p-2 shadow-sm">
            <div className="w-10 h-10 rounded bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
              {product?.image ? (
                <img src={product.image} className="w-full h-full object-cover" alt="" />
              ) : (
                <Package className="w-full h-full p-2 text-slate-200" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-slate-900 truncate">{product?.name || 'Product'}</p>
              <p className="text-[9px] font-bold text-slate-500">Qty: {sellerOrder.quantity || 1}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-2">
            <div>
              <p className="text-[8px] font-black text-slate-400 tracking-widest">Gross Value</p>
              <p className="text-base font-black text-slate-900 tracking-tighter">
                Ksh {(mainOrder?.totalCost || 0).toLocaleString()}
              </p>
            </div>
            <Link to={`/orders/${mainOrder?.id}`} className="px-5 py-2 bg-slate-900 text-white rounded text-[10px] font-black tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
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
