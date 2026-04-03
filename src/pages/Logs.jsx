import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import { 
  ClipboardList, Search, Filter, RefreshCw, 
  ArrowLeft, Package, Truck, AlertTriangle, 
  CheckCircle2, Info, Clock, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const LogsPage = () => {
  const { hub } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const fetchLogs = async () => {
    if (!hub?.id) return;
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/delivery/hubs/${hub.id}/logs`);
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Log fetch failed", err);
      toast.error("Failed to sync operational history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [hub]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getIcon = (type, severity) => {
    if (type === 'ORDER') return <Truck size={16} className="text-blue-500" />;
    if (severity === 'warning') return <AlertTriangle size={16} className="text-amber-500" />;
    if (severity === 'success') return <CheckCircle2 size={16} className="text-green-500" />;
    return <Package size={16} className="text-slate-400" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 🏙️ HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
         <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-[10px] font-black uppercase tracking-widest mb-4"
            >
               <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Node Operational History</h1>
            <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-wide mt-1">
               Audit Trail for <span className="text-slate-900">{hub?.name || 'SwiftHub Node'}</span>
            </p>
         </div>
         <div className="flex gap-2">
            <button 
              onClick={fetchLogs} 
              className="px-6 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest flex items-center gap-3"
            >
               <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Force Refresh
            </button>
         </div>
      </div>

      {/* 🔍 FILTERS */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 shadow-sm">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search logs by entity or message..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:bg-white focus:border-slate-900 transition-all uppercase tracking-tight" 
            />
         </div>
         <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-slate-200 rounded px-4 py-2.5 text-xs font-black outline-none focus:border-slate-900 bg-slate-50 uppercase tracking-widest"
            >
               <option value="ALL">ALL EVENTS</option>
               <option value="INVENTORY">INVENTORY ONLY</option>
               <option value="ORDER">ORDER UPDATES</option>
            </select>
         </div>
      </div>

      {/* 📋 LOG LIST */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
         {loading ? (
           <div className="flex flex-col items-center justify-center p-40 opacity-50">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-slate-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 tracking-[0.2em]">Accessing Node Audit Vault...</span>
           </div>
         ) : filteredLogs.length > 0 ? (
           <div className="divide-y divide-slate-100">
             {filteredLogs.map((log) => (
               <div key={log.id} className="p-6 hover:bg-slate-50/50 transition-all group border-l-4 border-l-transparent hover:border-l-blue-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div className="flex gap-5">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 group-hover:scale-110 transition-transform shrink-0">
                           {getIcon(log.type, log.severity)}
                        </div>
                        <div>
                           <div className="flex items-center gap-3 mb-1">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                log.type === 'ORDER' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}>
                                {log.type === 'INVENTORY' ? '📦 ' : '🚚 '}{log.type}
                              </span>
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.title}</h4>
                           </div>
                           <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed max-w-2xl">{log.message}</p>
                        </div>
                     </div>
                     <div className="md:text-right shrink-0 flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1 pl-16 md:pl-0">
                        <div className="flex items-center gap-1.5 text-slate-900 text-xs font-black">
                           <Clock size={12} className="text-slate-400" />
                           {format(new Date(log.time), 'HH:mm:ss')}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-tighter">
                           <Calendar size={12} />
                           {format(new Date(log.time), 'MMM dd, yyyy')}
                        </div>
                     </div>
                  </div>
               </div>
             ))}
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center py-40 opacity-30 text-center px-8">
              <ClipboardList size={64} className="text-slate-300 mb-6" />
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Node Audit Gap</p>
              <p className="text-xs font-bold text-slate-400 mt-2 italic max-w-xs uppercase">No operational events detected for the current filter selection or node status.</p>
           </div>
         )}
      </div>

      {/* 🔒 SYSTEM FOOTER */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 rounded-xl text-white shadow-xl">
         <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Real-time Telemetry Enabled</span>
         </div>
         <p className="text-[9px] font-bold text-slate-500 uppercase">Unified Logistics Ledger · v4.0.2-STABLE</p>
      </div>
    </div>
  );
};

export default LogsPage;
