import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosConfig';
import {
    Activity, Clock, Package, Truck, AlertTriangle,
    CheckCircle, Info, ChevronRight, RefreshCw, Layers
} from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import { toast } from 'react-toastify';

const LogisticsAuditTrail = ({ hubId, staffId, filterType }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLogs = async (silent = false) => {
        if (!hubId) return;
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const { data } = await axiosInstance.get(`/delivery/hubs/${hubId}/logs`, {
                params: { staffId }
            });
            let unifiedLogs = data.logs || [];
            if (filterType) {
                unifiedLogs = unifiedLogs.filter(l => l.type === filterType);
            }
            setLogs(unifiedLogs);
        } catch (error) {
            console.error("Log fetch failure", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [hubId, staffId, filterType]);

    if (loading) return (
        <div className="p-10 text-center opacity-30">
            <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-slate-400" />
            <p className="text-[10px] font-black  tracking-widest">Loading activity logs...</p>
        </div>
    );

    return (
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Activity size={18} className="text-blue-400" />
                    <h3 className="text-xs font-black text-white  tracking-widest">Activity Logs</h3>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black text-slate-500  tracking-tighter">Live activity</span>
                    <button onClick={() => fetchLogs(true)} className="p-1 text-slate-400 hover:text-white transition-colors">
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                {logs.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {logs.map((log) => (
                            <div key={log.id} className="p-5 hover:bg-slate-50/80 transition-colors flex gap-4 group">
                                <div className="mt-1">
                                    {log.type === 'INVENTORY' ? (
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${log.severity === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                            <Layers size={14} strokeWidth={3} />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                                            <Truck size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-0.5">
                                        <p className="text-[10px] font-black text-slate-900  tracking-tight truncate">{log.title}</p>
                                        <div className="flex items-center gap-1.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[9px] font-bold text-slate-500 ">
                                                {log.time ? new Date(log.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '...'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed  tracking-tight">{log.message}</p>
                                    <div className="mt-2 flex items-center gap-3">
                                        <span className="text-[8px] font-black text-slate-400  tracking-widest">
                                            {log.time ? new Date(log.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                                        </span>
                                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                                        <span className={`text-[8px] font-black  tracking-widest ${log.type === 'INVENTORY' ? 'text-blue-600' : 'text-indigo-600'}`}>{log.type}</span>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                    {log.type === 'INVENTORY' && log.id && log.approvalStatus === 'APPROVED' && (
                                        <button 
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (window.confirm("Request seller to reverse this stock addition?")) {
                                                    try {
                                                        await axiosInstance.post(`/delivery/hubs/${hubId}/reversal-request`, { logId: log.id });
                                                        toast.success("Reversal request sent to seller");
                                                        fetchLogs(true);
                                                    } catch (err) {
                                                        toast.error("Failed to send request");
                                                    }
                                                }
                                            }}
                                            className="px-2 py-1 bg-red-50 text-red-600 rounded text-[8px] font-black tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                                        >
                                            REVERSE
                                        </button>
                                    )}
                                    {log.approvalStatus === 'PENDING_REVERSAL' && (
                                        <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-[8px] font-black tracking-widest border border-amber-100">
                                            WAITING SELLER
                                        </span>
                                    )}
                                    <ChevronRight size={14} className="text-slate-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-20 text-center opacity-30 italic">
                        <Package size={32} className="mx-auto mb-3" />
                        <p className="text-[10px] font-black  tracking-widest">No activity found for this period.</p>
                    </div>
                )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[9px] font-black text-slate-400  tracking-widest">End of logs</p>
                <button 
                  onClick={() => {
                    if (!logs.length) return toast.error("No logs to download");
                    const exportData = logs.map(l => ({
                        Time: l.time ? new Date(l.time).toLocaleString() : 'N/A',
                        Type: l.type,
                        Title: l.title,
                        Message: l.message,
                        Severity: l.severity
                    }));
                    exportToCSV(exportData, `Logs_${filterType || 'All'}_${hubId}`, ["Time", "Type", "Title", "Message", "Severity"]);
                    toast.success("Logs downloaded");
                  }} 
                  className="text-[9px] font-black text-blue-600 tracking-widest hover:underline"
                >
                  Download All Logs
                </button>
            </div>
        </section>
    );
};

export default LogisticsAuditTrail;
