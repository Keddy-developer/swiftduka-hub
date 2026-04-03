import axiosInstance from "../services/axiosConfig";
import { Eye, Trash2, UserRound, Store, Star, Calendar, Mail, MapPin, Shield, TrendingUp, Plus, Edit, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

export default function SellersPage() {
  const { hub } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSellers = async () => {
    setLoading(true);
    if (!hub?.id) {
       setLoading(false);
       return;
    }
    try {
      const res = await axiosInstance.get(`/delivery/hubs/${hub.id}/sellers`);
      const sellersData = res.data?.sellers || res.data?.data || res.data;
      setSellers(Array.isArray(sellersData) ? sellersData : []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      toast.error("Failed to load hub sellers");
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [hub]);

  const handleShowModal = (id) => {
    setShowModal(true);
    setSelectedSellerId(id);
  };

  const handleDelete = async (id) => {
    setLoadingDelete(true);
    try {
      await axiosInstance.delete(`/admin/delete-seller-account/${id}`);
      setSellers((prev) => prev.filter((seller) => seller.id !== id));
      toast.success("Seller removed successfully.");
    } catch (error) {
      console.error("Error removing seller:", error);
      toast.error("Failed to delete seller. Please try again later.");
    } finally {
      setLoadingDelete(false);
      setShowModal(false);
      setSelectedSellerId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-400 font-medium">Loading seller network...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 🏙️ HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Seller Network</h2>
          <p className="text-[12px] md:text-sm text-slate-500 font-medium">Manage merchant accounts assigned to {hub?.name || 'hub'}.</p>
        </div>
        <Link to="/register-seller">
          <button className="w-full md:w-auto px-4 py-2 bg-slate-900 text-white rounded text-[10px] md:text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm">
            <Plus size={14} /> REGISTER NEW MERCHANT
          </button>
        </Link>
      </div>

      {/* 📊 SUMMARY TILES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total Merchants', value: sellers.length, icon: UserRound },
          { label: 'Approved', value: sellers.filter(s => s.approvalStatus === 'approved').length, icon: Shield },
          { label: 'Awaiting Action', value: sellers.filter(s => s.approvalStatus === 'pending').length, icon: Calendar },
          { label: 'Inactive Units', value: sellers.filter(s => s.deleted).length, icon: Trash2 },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 p-4 md:p-5 rounded shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0">
                <stat.icon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-base md:text-lg font-bold text-slate-900 mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🗄️ DATA TABLE (Responsive) */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Merchant Detail</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact & Scope</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Metrics</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 overflow-hidden flex-shrink-0">
                        {seller.profilePicture ? (
                           <img src={seller.profilePicture} className="w-full h-full object-cover" />
                        ) : (
                           <Store size={16} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{seller.storeName || 'Unnamed'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">#{seller.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[150px]">{seller.user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-medium">
                        <MapPin className="w-3 h-3" />
                        <span>{seller.county || 'Unset'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-4 text-center">
                       <div>
                          <p className="text-xs font-bold text-slate-900">{seller.sales || 0}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-medium">Sales</p>
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-900">{seller._count?.products || 0}</p>
                          <p className="text-[9px] text-slate-400 uppercase font-medium">SKUs</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-block border ${
                         seller.approvalStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                         seller.approvalStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                         'bg-red-50 text-red-700 border-red-100'
                      }`}>
                         {seller.approvalStatus}
                      </span>
                      {seller.deleted && (
                        <span className="text-[8px] font-bold text-red-500 uppercase italic">DEACTIVATED</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/sellers/${seller.id}`} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors">
                        <Eye size={14} />
                      </Link>
                      <Link to={`/register-seller?edit=${seller.id}`} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors">
                        <Edit size={14} />
                      </Link>
                      <button onClick={() => handleShowModal(seller.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sellers.length === 0 && (
           <div className="p-12 text-center text-slate-400 font-medium italic border-t border-slate-50 text-sm">No linked merchants detected in this logistical scope.</div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50 p-4 backdrop-blur-[1px]">
          <div className="bg-white rounded border border-slate-200 p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in duration-200">
             <div className="flex items-center gap-3 mb-4">
               <AlertTriangle className="text-amber-500 w-5 h-5" />
               <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Security Protocol</h3>
             </div>
             <p className="text-[11px] text-slate-500 mb-6 leading-relaxed">System will initiate decoupling of this merchant from hub logistics. Active inventory status will be suspended. Verify this action before proceeding.</p>
             <div className="flex gap-2 justify-end">
                <button className="px-4 py-2 text-slate-600 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold uppercase" onClick={() => setShowModal(false)}>Abort</button>
                <button 
                  className="px-4 py-2 bg-slate-900 text-white rounded text-[10px] font-bold uppercase hover:bg-slate-800 transition-colors"
                  onClick={() => selectedSellerId && handleDelete(selectedSellerId)}
                  disabled={loadingDelete}
                >
                  {loadingDelete ? 'SYCHRONIZING...' : 'CONFIRM REVOKE'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
