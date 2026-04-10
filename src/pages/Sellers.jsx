import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import {
  Eye, Trash2, UserRound, Store, Star, Calendar, Mail, MapPin, Shield,
  TrendingUp, Plus, Edit, AlertTriangle, Search, Filter, RefreshCw,
  ChevronRight, Globe, Zap, MoreVertical, Package, ShieldCheck,
  Smartphone, Building
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

export default function SellersPage({ readOnly }) {
  const { hub } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const fetchSellers = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    if (!hub?.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const res = await axiosInstance.get(`/delivery/hubs/${hub.id}/sellers`);
      const sellersData = res.data?.sellers || res.data?.data || res.data;
      setSellers(Array.isArray(sellersData) ? sellersData : []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      toast.error("Failed to load sellers");
      setSellers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [hub]);

  const handleDelete = async (id) => {
    setLoadingDelete(true);
    try {
      await axiosInstance.delete(`/admin/delete-seller-account/${id}`);
      setSellers((prev) => prev.filter((seller) => seller.id !== id));
      toast.success("Seller removed from hub");
    } catch (error) {
      console.error("Error removing seller:", error);
      toast.error("Failed to remove seller.");
    } finally {
      setLoadingDelete(false);
      setShowModal(false);
      setSelectedSellerId(null);
    }
  };

  const filteredSellers = sellers.filter(s =>
    s.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone?.includes(searchQuery)
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 opacity-50">
      <RefreshCw className="w-8 h-8 animate-spin mb-3 text-slate-400" />
      <span className="text-xs font-bold  tracking-widest text-slate-500">Loading sellers...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-20">
      {/* 🏙️ TACTICAL HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Sellers</h1>
          <p className="text-[10px] md:text-xs text-slate-500 font-black  tracking-widest mt-1 flex items-center gap-2">
            <Building size={14} className="text-blue-600 mb-0.5" />
            Hub: {hub?.name} · Seller Directory
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => fetchSellers(true)} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all  tracking-widest shadow-sm flex items-center justify-center gap-2">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          {!readOnly && (
            <button onClick={() => navigate("/register-seller")} className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200  tracking-widest flex items-center justify-center gap-2">
              <Plus size={14} /> Add New Seller
            </button>
          )}
        </div>
      </div>

      {/* 📊 KPI SUMMARY HUD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <KPICard label="Active Sellers" value={sellers.length} icon={UserRound} color="blue" />
        <KPICard label="Approved Sellers" value={sellers.filter(s => s.approvalStatus === 'approved').length} icon={ShieldCheck} color="green" />
        <KPICard label="Total Products" value={sellers.reduce((acc, s) => acc + (s._count?.products || 0), 0)} icon={Package} color="slate" />
        <KPICard label="Pending Approval" value={sellers.filter(s => s.approvalStatus === 'pending').length} icon={Zap} color="amber" />
      </div>

      <div className="space-y-6">
        {/* 🔍 SEARCH & FILTER STRIP */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Store, Email or Phone..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-slate-400 transition-all  tracking-tight"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {['Approved', 'Pending', 'Premium', 'All'].map(t => (
              <button key={t} className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[9px] font-black  tracking-widest text-slate-500 hover:bg-slate-50 whitespace-nowrap">{t}</button>
            ))}
          </div>
        </div>

        {/* 🗄️ MERCHANT CARDS / GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSellers.map(seller => (
            <MerchantCard 
               key={seller.id} 
               seller={seller} 
               readOnly={readOnly}
               onDetails={() => navigate(`/sellers/${seller.id}`)} 
               onEdit={() => navigate(`/register-seller?edit=${seller.id}`)} 
               onDelete={() => { setSelectedSellerId(seller.id); setShowModal(true); }} 
            />
          ))}
          {filteredSellers.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white border border-slate-200 border-dashed rounded-3xl opacity-40">
              <Globe size={48} className="mx-auto mb-4 text-slate-300 animate-pulse" />
              <p className="text-xs font-black  tracking-[0.2em] text-slate-400">No Sellers Found</p>
              <p className="text-[10px] font-bold text-slate-400 mt-2 italic">Refine search parameters or add a new seller.</p>
            </div>
          )}
        </div>
      </div>

      {/* ⚠️ MODAL: DECOUPLING SECURITY PROTOCOL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6 animate-in zoom-in-95 duration-200 overflow-hidden relative">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 shrink-0">
                <AlertTriangle className="text-rose-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900  tracking-tight">Remove Seller</h3>
                <p className="text-[10px] font-bold text-slate-400  tracking-widest mt-0.5">Remove Seller Account</p>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 leading-relaxed  tracking-tight italic relative z-10">
              This will remove the seller from this hub. Their products will no longer be available for fulfillment through this hub. Verify this action before proceeding.
            </p>
            <div className="flex gap-3 relative z-10">
              <button className="flex-1 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black  tracking-widest hover:bg-slate-100 transition-all font-black" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl text-[10px] font-black  tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200"
                onClick={() => selectedSellerId && handleDelete(selectedSellerId)}
                disabled={loadingDelete}
              >
                {loadingDelete ? 'REMOVING...' : 'REMOVE SELLER'}
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
      </div>
      <p className="text-[10px] font-black text-slate-400  tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
      <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-all -z-10"></div>
    </div>
  );
};

const MerchantCard = ({ seller, onDetails, onEdit, onDelete, readOnly }) => (
  <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col justify-between">
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform shadow-inner">
          {seller.profilePicture ? <img src={seller.profilePicture} className="w-full h-full object-cover" /> : <Store size={24} className="text-slate-300" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-black text-slate-900 text-base truncate  tracking-tight leading-none mb-1.5">{seller.storeName || 'Unnamed Seller'}</h3>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[8px] font-black  tracking-widest border ${seller.approvalStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
              {seller.approvalStatus}
            </span>
            {seller.deleted && <span className="text-[8px] font-black text-rose-500  italic">OFFLINE</span>}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group/info hover:bg-white transition-colors">
          <Mail size={14} className="text-slate-300 group-hover/info:text-blue-500" />
          <span className="text-[10px] font-black text-slate-600 truncate">{seller.user?.email || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group/info hover:bg-white transition-colors">
          <MapPin size={14} className="text-slate-300 group-hover/info:text-rose-500" />
          <span className="text-[10px] font-black text-slate-600  tracking-widest">{seller.county || 'Unassigned Zone'}</span>
        </div>
      </div>
    </div>

    <div>
      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 mt-2">
        <div className="text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <p className="text-sm font-black text-slate-900 tracking-tighter leading-none">{seller.sales || 0}</p>
          <p className="text-[8px] font-black text-slate-400  tracking-widest mt-1">Total Sales</p>
        </div>
        <div className="text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <p className="text-sm font-black text-slate-900 tracking-tighter leading-none">{seller._count?.products || 0}</p>
          <p className="text-[8px] font-black text-slate-400  tracking-widest mt-1">Total Products</p>
        </div>
      </div>

      <div className="flex gap-2 pt-6">
        <button onClick={onDetails} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black  tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-2">
          <Eye size={12} /> Details
        </button>
        {!readOnly && (
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-colors">
              <Edit size={14} />
            </button>
            <button onClick={onDelete} className="p-3 bg-rose-50 text-rose-400 rounded-xl hover:text-rose-600 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
  </div>
);
