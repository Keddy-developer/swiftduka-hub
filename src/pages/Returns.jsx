import React, { useEffect, useState, useMemo } from "react";
import {
  CheckCircle, XCircle, Clock, Search, Package,
  User, Phone, Calendar, DollarSign, PackageOpen,
  RefreshCw, AlertTriangle, Info, SendHorizonal, Smartphone, X
} from "lucide-react";
import axiosInstance from "../services/axiosConfig";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

const StatusBadge = ({ status }) => {
  const configs = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-100",
    REQUESTED: "bg-amber-50 text-amber-700 border-amber-100",
    APPROVED: "bg-green-50 text-green-700 border-green-100",
    REJECTED: "bg-red-50 text-red-700 border-red-100",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tight border ${configs[status] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
      {status}
    </span>
  );
};

export default function ReturnsManagement({ readOnly }) {
  const { hub } = useAuth();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Action States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchReturns = async (silent = false) => {
    if (!hub?.id) return setLoading(false);
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await axiosInstance.get(`/returns/admin`);
      // Filter returns for this hub
      const hubReturns = res.data.filter(ret =>
        ret.product?.fulfillmentHubId === hub.id ||
        ret.product?.seller?.fulfillmentHubId === hub.id
      );
      setReturns(hubReturns);
    } catch (error) {
      console.error("Failed to fetch returns:", error);
      toast.error("Reverse logistics sync failed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchReturns(); }, [hub]);

  const filteredReturns = useMemo(() => {
    const query = search.toLowerCase();
    return returns.filter((ret) =>
      ret.id?.toLowerCase().includes(query) ||
      ret.product?.name?.toLowerCase().includes(query) ||
      ret.user?.username?.toLowerCase().includes(query)
    );
  }, [returns, search]);

  const handleApprove = async (returnId) => {
    if (!window.confirm("Approve this return request?")) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/returns/${returnId}/approve`);
      toast.success("Return approved");
      fetchReturns(true);
    } catch (error) {
      toast.error("Approval failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (returnId) => {
    if (!rejectNotes.trim()) return toast.error("Rejection reason required");
    setIsSubmitting(true);
    try {
      await axiosInstance.patch(`/returns/${returnId}/reject`, { notes: rejectNotes });
      toast.success("Return rejected");
      setShowRejectModal(false);
      setRejectNotes("");
      fetchReturns(true);
    } catch (error) {
      toast.error("Rejection failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-400 font-medium italic text-sm">Syncing return manifests...</div>;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 🏙️ HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Reverse Logistics</h2>
          <p className="text-[12px] md:text-sm text-slate-500 font-medium">Manage customer return requests and hub re-stocking.</p>
        </div>
        <button onClick={() => fetchReturns(true)} className="px-4 py-2 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> SYNC RETURNS
        </button>
      </div>

      {/* 📊 TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search Return ID or Product..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded pl-10 pr-4 py-2 text-sm font-medium outline-none focus:border-slate-400 shadow-sm" />
        </div>
      </div>

      {/* 🗄️ RETURNS LEDGER */}
      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 tracking-wider">Return Reference</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 tracking-wider">Customer</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 tracking-wider">Product Scope</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 tracking-wider">Status</th>
                <th className="px-6 py-3 text-[10px] font-bold text-slate-500 tracking-wider text-right">Utility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.map(ret => (
                <tr key={ret.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs font-bold text-slate-900 tracking-tight">#{ret.id.slice(0, 8)}</p>
                    <p className="text-[9px] text-slate-400 font-medium">{new Date(ret.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 text-xs truncate">{ret.user?.username}</p>
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><Smartphone size={10} /> {ret.user?.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-slate-50 border border-slate-100 p-0.5 flex-shrink-0">
                        {ret.product?.image && <img src={ret.product.image} className="w-full h-full object-cover rounded" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">{ret.product?.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium">{ret.reason}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ret.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(!readOnly && (ret.status === 'PENDING' || ret.status === 'REQUESTED')) && (
                        <>
                          <button onClick={() => handleApprove(ret.id)} className="p-1 px-2 bg-green-50 text-green-700 border border-green-100 rounded text-[9px] font-bold hover:bg-green-600 hover:text-white transition-all">Approve</button>
                          <button onClick={() => { setSelectedReturn(ret); setShowRejectModal(true); }} className="p-1 px-2 bg-red-50 text-red-700 border border-red-100 rounded text-[9px] font-bold hover:bg-red-600 hover:text-white transition-all">Reject</button>
                        </>
                      )}
                      
                      {(!readOnly && ret.status === 'APPROVED' && ret.agentStatus !== 'RECEIVED' && ret.agentStatus !== 'SENT') && (
                        <button 
                          onClick={async () => {
                            if (!window.confirm("Confirm product received at hub?")) return;
                            setIsSubmitting(true);
                            try {
                              await axiosInstance.patch(`/returns/${ret.id}/received`);
                              toast.success("Marked as Received");
                              fetchReturns(true);
                            } catch (e) {
                              toast.error("Operation failed");
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                          className="p-1 px-2 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold hover:bg-blue-600 hover:text-white transition-all"
                        >
                          Mark Received
                        </button>
                      )}

                      {ret.agentStatus === 'RECEIVED' && (
                        <button 
                          onClick={async () => {
                            if (!window.confirm("Mark this return as shipped back to seller/inventory?")) return;
                            setIsSubmitting(true);
                            try {
                              await axiosInstance.patch(`/returns/${ret.id}/ship`);
                              toast.success("Marked as Shipped");
                              fetchReturns(true);
                            } catch (e) {
                              toast.error("Operation failed");
                            } finally {
                              setIsSubmitting(false);
                            }
                          }}
                          className="p-1 px-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          Mark Shipped
                        </button>
                      )}
                      <button onClick={() => { setSelectedReturn(ret); setShowDetailsModal(true); }} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"><Info size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredReturns.length === 0 && (
          <div className="p-20 text-center text-slate-400 text-[10px] font-bold italic tracking-widest border-t border-slate-50">No reverse logistics requests detected in current scope.</div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Reject Return Request</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-slate-300 hover:text-slate-600"><X size={16} /></button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">Provide a justification for the rejection. The customer will be notified of this operational decision.</p>
            <textarea
              value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
              placeholder="Operational justification..."
              className="w-full border border-slate-200 rounded p-3 text-xs font-medium outline-none focus:border-slate-400 h-24 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold hover:bg-slate-100">Cancel</button>
              <button onClick={() => handleReject(selectedReturn.id)} disabled={isSubmitting} className="flex-1 py-2 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 transition-all shadow-sm">
                {isSubmitting ? 'SYNCING...' : 'CONFIRM REJECT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Details Modal */}
      {selectedReturn && showDetailsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <PackageOpen size={18} className="text-blue-400" />
                <h3 className="text-[11px] font-black uppercase tracking-widest">Return Dossier</h3>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-white/10 rounded transition-colors"><X size={18} /></button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
              <div className="flex gap-4 items-start">
                <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-lg p-1 flex-shrink-0">
                  {selectedReturn.product?.image && <img src={selectedReturn.product.image} className="w-full h-full object-cover rounded" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                     <p className="font-black text-slate-900 text-sm tracking-tight truncate flex-1">{selectedReturn.product?.name}</p>
                     <StatusBadge status={selectedReturn.status} />
                  </div>
                  <p className="text-[10px] font-mono font-black text-slate-400">SKU: {selectedReturn.product?.sku || 'NO-SKU'}</p>
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded text-red-700">
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-1"><AlertTriangle size={10} /> Reason for Return</p>
                    <p className="text-xs font-bold leading-relaxed">{selectedReturn.reason}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer Profile</p>
                  <p className="text-sm font-black text-slate-900 tracking-tight">{selectedReturn.user?.username}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-tight">{selectedReturn.user?.phone}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Timeline</p>
                  <p className="text-sm font-black text-slate-900 tracking-tight">{new Date(selectedReturn.createdAt).toLocaleDateString()}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1 tracking-tight">{new Date(selectedReturn.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>

              {selectedReturn.notes && (
                <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Logistics Notes</p>
                  <p className="text-xs font-medium italic opacity-90 leading-relaxed">"{selectedReturn.notes}"</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                 <button onClick={() => setShowDetailsModal(false)} className="flex-1 py-3 border border-slate-200 rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Close Dossier</button>
                 {(!readOnly && (selectedReturn.status === 'PENDING' || selectedReturn.status === 'REQUESTED')) && (
                   <button onClick={() => { setShowRejectModal(true); setShowDetailsModal(false); }} className="flex-1 py-3 bg-red-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 transition-all">Reject Claim</button>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
