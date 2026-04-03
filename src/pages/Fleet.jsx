import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import { 
  Pencil, Trash2, Plus, Truck, Package, Star, 
  Phone, IdCard, Wallet, TrendingUp, RefreshCw, X, AlertTriangle 
} from "lucide-react";
import { toast } from "react-toastify";
import PendingAssignmentsPanel from "../components/PendingAssignmentsPanel";
import RiderEarningsModal from "../components/RiderEarningsModal";
import { useAuth } from "../contexts/AuthContext";

const StatTile = ({ label, value, icon: Icon }) => (
  <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex items-center gap-4">
    <div className="w-10 h-10 rounded bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0">
      <Icon className="w-4 h-4 text-slate-500" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-slate-900 leading-none mt-0.5">{value}</p>
    </div>
  </div>
);

export default function RidersManagement() {
  const { hub } = useAuth();
  const [riders, setRiders] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchRiders = async (silent = false) => {
    if (!hub?.id) return setLoading(false);
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await axiosInstance.get(`/delivery/hubs/${hub.id}/riders`);
      setRiders(response.data?.riders || response.data || []);
    } catch (err) {
      console.error("Failed to fetch riders:", err);
      toast.error("Fleet sync failure");
      setRiders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRiders(); }, [hub]);

  const handleDelete = async (id) => {
    setLoadingDelete(true);
    try {
      await axiosInstance.delete(`/delivery/hubs/${hub.id}/riders/${id}`);
      setRiders((prev) => prev.filter((rider) => rider.id !== id));
      toast.success("Rider revoked");
      setShowDeleteModal(false);
    } catch (error) {
      toast.error("Revocation failed");
    } finally {
      setLoadingDelete(false);
      setSelectedRiderId(null);
    }
  };

  if (loading) return <div className="p-8 text-slate-400 font-medium italic text-sm">Synchronizing fleet manifests...</div>;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 🏙️ HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Fleet Command</h2>
          <p className="text-[12px] md:text-sm text-slate-500 font-medium">Manage and monitor last-mile delivery agents assigned to this hub.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => fetchRiders(true)} className="px-4 py-2 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm uppercase">
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> SYNC FLEET
            </button>
            <button onClick={() => navigate("/register-a-rider/new")} className="px-4 py-2 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-sm uppercase">
                <Plus size={14} /> REGISTER RIDER
            </button>
        </div>
      </div>

      {/* 📊 KPI OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatTile label="Active Agents" value={riders.length} icon={Truck} />
          <StatTile label="Total Drops" value={riders.reduce((acc, r) => acc + (r.totalDeliveries || 0), 0)} icon={Package} />
          <StatTile label="Avg Performance" value={riders.length > 0 ? (riders.reduce((acc, r) => acc + (r.rating || 0), 0) / riders.length).toFixed(1) : "0.0"} icon={Star} />
          <StatTile label="Fleet Health" value={`${riders.filter(r => r.status === 'AVAILABLE').length} Available`} icon={TrendingUp} />
      </div>

      {/* 🚀 PENDING ASSIGNMENTS */}
      <PendingAssignmentsPanel />

      {/* 🗄️ RIDERS LEDGER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {riders.map(rider => (
            <div key={rider.id} className="bg-white border border-slate-200 rounded p-5 space-y-4 hover:border-slate-400 transition-all shadow-sm">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {rider.vehicleImage ? <img src={rider.vehicleImage} className="w-full h-full object-cover" /> : <Truck size={18} className="text-slate-300" />}
                   </div>
                   <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-xs truncate uppercase tracking-tight">{rider.name}</h3>
                      <div className="flex items-center gap-2">
                         <span className={`w-1.5 h-1.5 rounded-full ${rider.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-amber-500'}`} />
                         <span className="text-[9px] font-bold text-slate-400 uppercase">{rider.status || 'OFFLINE'}</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-50 pt-4">
                   <div className="space-y-0.5">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Settlement</p>
                      <p className="text-[11px] font-black text-slate-900 leading-none">Ksh {(rider.totalEarnings || 0).toLocaleString()}</p>
                   </div>
                   <div className="text-right space-y-0.5">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Metrics</p>
                      <p className="text-[11px] font-black text-slate-900 leading-none">{rider.acceptanceRate || 0}% ACC</p>
                   </div>
                </div>

                <div className="space-y-1.5 pt-1">
                   <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2 py-1 rounded">
                      <Phone size={12} className="text-slate-300" /> {rider.phone}
                   </div>
                   <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium bg-slate-50 border border-slate-100 px-2 py-1 rounded">
                      <IdCard size={12} className="text-slate-300" /> {rider.numberPlate || 'NO PLATE'}
                   </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-50">
                    <button onClick={() => navigate(`/register-a-rider/${rider.id}`)} className="flex-1 py-1.5 bg-slate-900 text-white rounded text-[9px] font-bold uppercase transition-all shadow-sm">Config</button>
                    <button onClick={() => { setSelectedRiderId(rider.id); setShowDeleteModal(true); }} className="px-2 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded text-[9px] font-bold uppercase hover:bg-red-600 hover:text-white transition-all">Revoke</button>
                </div>
            </div>
          ))}
          {riders.length === 0 && (
             <div className="col-span-full py-20 text-center text-slate-400 text-[10px] font-bold italic uppercase tracking-widest border border-slate-200 border-dashed rounded">Zero deployment records found.</div>
          )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
           <div className="bg-white border border-slate-200 rounded shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in duration-200">
              <div className="flex items-center gap-3">
                 <AlertTriangle className="text-red-600" />
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Revoke Deployment Authority</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">This action will decouple the rider from the hub logistical framework. Verify this decision before proceeding.</p>
              <div className="flex gap-2 pt-2">
                 <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold uppercase hover:bg-slate-100">Cancel</button>
                 <button onClick={() => handleDelete(selectedRiderId)} disabled={loadingDelete} className="flex-1 py-2 bg-red-600 text-white rounded text-[10px] font-bold uppercase hover:bg-red-700 transition-all shadow-sm">
                    {loadingDelete ? 'SYNCING...' : 'CONFIRM REVOKE'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
