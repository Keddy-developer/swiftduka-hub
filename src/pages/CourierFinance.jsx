import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import axiosInstance from "../services/axiosConfig";
import { 
  Wallet, DollarSign, ArrowUpRight, ArrowDownLeft, 
  History, Clock, CheckCircle2, XCircle, Settings,
  Users, TrendingUp, AlertCircle, RefreshCw, ChevronRight,
  Search, Filter, Banknote, Gavel, FileText
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";

const CourierFinance = () => {
  const { hub } = useAuth();
  const [activeTab, setActiveTab] = useState("wallets");
  const [couriers, setCouriers] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settlingCourier, setSettlingCourier] = useState(null);
  const [settleAmount, setSettleAmount] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab, hub]);

  const fetchData = async () => {
    if (!hub?.id) return;
    setLoading(true);
    try {
      if (activeTab === "wallets") {
        const res = await axiosInstance.get(`/delivery/hubs/${hub.id}/couriers`);
        // Note: We'll need to fetch detailed wallet info for each if the basic endpoint doesn't have it
        setCouriers(res.data.riders || res.data || []);
      } else if (activeTab === "payouts") {
        // Mocking for now as we might need a specific endpoint
        const res = await axiosInstance.get(`/delivery/hubs/${hub.id}/payouts`).catch(() => ({ data: { data: [] } }));
        setPayouts(res.data.data || []);
      } else if (activeTab === "rules") {
        const res = await axiosInstance.get(`/delivery/compensation-rules`).catch(() => ({ data: { data: [] } }));
        setRules(res.data.data || []);
      }
    } catch (err) {
      toast.error("Failed to fetch finance data");
    } finally {
      setLoading(false);
    }
  };

  const handleSettleCOD = async () => {
    if (!settleAmount || isNaN(settleAmount)) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      await axiosInstance.post(`/delivery/hubs/${hub.id}/couriers/settle-cod`, {
        courierId: settlingCourier.id,
        amount: parseFloat(settleAmount)
      });
      toast.success("COD Settled Successfully");
      setSettlingCourier(null);
      setSettleAmount("");
      fetchData();
    } catch (err) {
      toast.error("Settlement failed");
    }
  };

  const handlePayoutAction = async (requestId, status) => {
    try {
      await axiosInstance.post(`/delivery/hubs/${hub.id}/couriers/payouts`, {
        requestId,
        status
      });
      toast.success(`Payout ${status.toLowerCase()}ed`);
      fetchData();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Courier Finance
            <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full tracking-tighter">Treasury</span>
          </h1>
          <p className="text-xs text-slate-500 font-black tracking-widest mt-1 flex items-center gap-2 uppercase">
            <Banknote size={14} className="text-emerald-600" />
            Ledger Management · {hub?.name}
          </p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          {[
            { id: "wallets", label: "Wallets", icon: Wallet },
            { id: "payouts", label: "Payouts", icon: ArrowUpRight },
            { id: "rules", label: "Rules", icon: Gavel }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest flex items-center gap-2 transition-all ${
                activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={14} />
              {tab.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 opacity-30">
          <RefreshCw className="w-12 h-12 animate-spin text-slate-400 mb-4" />
          <p className="text-xs font-black tracking-widest text-slate-500">SYNCING LEDGER...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === "wallets" && (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 border-dashed mb-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input placeholder="Search courier balances..." className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none" />
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 tracking-widest leading-none mb-1">TOTAL LIABILITY</p>
                      <p className="text-xl font-black text-slate-900 tracking-tighter">KSh {couriers.reduce((acc, c) => acc + (c.wallet?.codLiability || 0), 0).toLocaleString()}</p>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {couriers.map(courier => (
                  <div key={courier.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Users size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-sm tracking-tight">{courier.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{courier.phone}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                        <p className="text-[9px] font-black text-emerald-600 tracking-widest mb-1">AVAILABLE</p>
                        <p className="text-lg font-black text-slate-900 tracking-tighter">KSh {courier.wallet?.availableBalance?.toLocaleString() || '0'}</p>
                      </div>
                      <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                        <p className="text-[9px] font-black text-orange-600 tracking-widest mb-1">COD HELD</p>
                        <p className="text-lg font-black text-slate-900 tracking-tighter">KSh {courier.wallet?.codLiability?.toLocaleString() || '0'}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSettlingCourier(courier)}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                    >
                      <DollarSign size={14} /> SETTLE COD
                    </button>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "payouts" && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Courier</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payouts.map(payout => (
                    <tr key={payout.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                            <Users size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900">{payout.courier?.name}</p>
                            <p className="text-[10px] font-bold text-slate-400">{format(new Date(payout.createdAt), 'MMM dd, HH:mm')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-900">KSh {payout.amount.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
                          payout.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                          payout.status === 'PENDING' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {payout.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handlePayoutAction(payout.id, 'APPROVED')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200">
                              <CheckCircle2 size={18} />
                            </button>
                            <button onClick={() => handlePayoutAction(payout.id, 'REJECTED')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200">
                              <XCircle size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center opacity-40">
                         <Clock size={48} className="mx-auto mb-4 text-slate-300 animate-pulse" />
                         <p className="text-xs font-black tracking-widest text-slate-400">NO PENDING PAYOUTS</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "rules" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rules.map(rule => (
                <div key={rule.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-slate-400 transition-all flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-black text-slate-900 text-sm">{rule.name}</h3>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${rule.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{rule.type.replace(/_/g, ' ')}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 tracking-widest leading-none mb-1">VALUE</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">
                          {rule.type === 'DISTANCE_BASED' ? `KSh ${rule.value}/KM` : `KSh ${rule.value.toLocaleString()}`}
                        </p>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <Settings size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-slate-50 transition-all group">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                  <TrendingUp size={24} />
                </div>
                <p className="text-[10px] font-black tracking-widest text-slate-400 group-hover:text-primary">ADD NEW RULE</p>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Settlement Modal */}
      {settlingCourier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shrink-0">
                <Banknote className="text-emerald-600 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Settle COD</h3>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5 uppercase">Record Cash Remittance</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 tracking-widest mb-1 uppercase">Courier</p>
                <p className="font-black text-slate-900">{settlingCourier.name}</p>
                <p className="text-xs font-bold text-orange-600 mt-2 italic flex items-center gap-1">
                  <AlertCircle size={12} /> Total Owed: KSh {settlingCourier.wallet?.codLiability?.toLocaleString() || '0'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Amount Received</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">KSh</div>
                  <input 
                    type="number"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-black text-slate-900 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setSettlingCourier(null)} className="flex-1 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black tracking-widest hover:bg-slate-100 transition-all uppercase">Cancel</button>
              <button onClick={handleSettleCOD} className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-200 uppercase">Confirm Settlement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourierFinance;
