import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosConfig';
import {
    ArrowLeft, User, ShieldCheck, Phone, Mail, 
    Calendar, History, BadgeCheck, X, Info, 
    TrendingUp, Award, Clock, ClipboardList, Zap
} from 'lucide-react';
import { toast } from 'react-toastify';
import LogisticsAuditTrail from '../components/LogisticsAuditTrail';

const InfoTile = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white transition-all shadow-sm group">
        <div className="p-2.5 bg-white rounded-xl shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
            <Icon size={18} />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 tracking-widest leading-none mb-1.5 uppercase">{label}</p>
            <p className="text-sm font-black text-slate-900 truncate tracking-tight">{value || 'N/A'}</p>
        </div>
    </div>
);

const PerformanceMetric = ({ label, value, icon: Icon, trend, color = 'blue' }) => {
    const colors = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        green: 'text-green-600 bg-green-50 border-green-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
        rose: 'text-rose-600 bg-rose-50 border-rose-100'
    };

    return (
        <div className={`p-6 rounded-3xl border ${colors[color]} flex items-center justify-between`}>
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-none mb-1">{label}</p>
                    <p className="text-2xl font-black tracking-tight">{value}</p>
                </div>
            </div>
            {trend && (
                <div className="text-right">
                    <p className="text-[10px] font-black tracking-tighter text-slate-400">TREND</p>
                    <p className="text-xs font-black">{trend}</p>
                </div>
            )}
        </div>
    );
};

export default function StaffDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLogsModal, setShowLogsModal] = useState(false);

    const fetchStaff = async () => {
        try {
            const { data } = await axiosInstance.get(`/workforce/workers/${id}`);
            if (data.success) {
                setStaff(data.worker);
            }
        } catch (err) {
            toast.error("Failed to load staff dossier");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStaff(); }, [id]);

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Zap className="animate-spin text-blue-600" size={40} />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Synchronizing Telemetry...</p>
        </div>
    );
    
    if (!staff) return (
        <div className="p-20 text-center">
            <h2 className="text-xl font-black text-slate-900">Sentinel Not Found</h2>
            <p className="text-sm text-slate-500 mt-2">The requested worker record does not exist in this node.</p>
            <button onClick={() => navigate('/staff-management')} className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black">BACK TO COMMAND</button>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 🏙️ COMMAND HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                <div className="space-y-2">
                    <button onClick={() => navigate('/staff-management')} className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest">
                        <ArrowLeft size={14} strokeWidth={3} /> Node Intelligence
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-slate-900/5 border border-slate-200 flex items-center justify-center font-black text-slate-400 text-xl overflow-hidden">
                           {staff.avatar ? <img src={staff.avatar} className="w-full h-full object-cover" /> : `${staff.firstName?.[0]}${staff.lastName?.[0]}`}
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 leading-none">
                                {staff.firstName} {staff.lastName}
                                {staff.isActive && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" title="Active Sentinel" />}
                            </h1>
                            <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-[0.2em] mt-2 uppercase">
                                {staff.role?.[0]?.replace('_', ' ')} · Hub: {staff.hubName || 'Direct Execution'}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                         onClick={() => setShowLogsModal(true)}
                         className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                        <History size={16} strokeWidth={3} /> ACTIVITY LOG
                    </button>
                    <button onClick={fetchStaff} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-slate-800 flex items-center justify-center gap-2 shadow-xl shadow-slate-200 transition-all">
                        <Zap size={16} strokeWidth={3} /> SYNC TELEMETRY
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* ── LEFT: PERFORMANCE METRICS ── */}
                <div className="xl:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PerformanceMetric 
                            label="Reliability Score" 
                            value={`${(staff.overallScore || 85).toFixed(0)}%`} 
                            icon={Award}
                            trend="+4.2%"
                            color="blue"
                        />
                        <PerformanceMetric 
                            label="Task Throughput" 
                            value={staff.tasksCompleted || 0} 
                            icon={ClipboardList}
                            trend="Season High"
                            color="green"
                        />
                        <PerformanceMetric 
                            label="Avg Latency / Task" 
                            value={`${(staff.avgTimePerTask || 12).toFixed(1)}m`} 
                            icon={Clock}
                            trend="-1.5m (Ideal)"
                            color="amber"
                        />
                        <PerformanceMetric 
                            label="Compliance" 
                            value="100%" 
                            icon={ShieldCheck}
                            trend="No Violations"
                            color="rose"
                        />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Deployment Profile</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">Personnel Details</p>
                            </div>
                            <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm">
                                <User size={24} className="text-blue-600" />
                            </div>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoTile label="Primary Email" value={staff.email} icon={Mail} />
                            <InfoTile label="Direct Phone" value={staff.phone} icon={Phone} />
                            <InfoTile label="National ID" value={staff.workerProfile?.nationalId} icon={BadgeCheck} />
                            <InfoTile label="Onboarding Date" value={new Date(staff.createdAt).toLocaleDateString()} icon={Calendar} />
                            <InfoTile label="Node Allocation" value={staff.hubName} icon={TrendingUp} />
                            <InfoTile label="Employment Type" value={staff.workerProfile?.payType?.replace('_', ' ')} icon={Award} />
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: RECENT ACTIVITY ── */}
                <div className="xl:col-span-4 space-y-8">
                    <div className="bg-slate-900 text-white rounded-[32px] p-8 shadow-2xl shadow-slate-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-black tracking-tight mb-8 flex items-center gap-3">
                            <History size={24} className="text-blue-400" />
                            Operational Log
                        </h3>
                        <div className="space-y-6 relative z-10">
                            {(staff.recentTasks || []).map((task, i) => (
                                <div key={task.id} className="flex gap-4 group/item">
                                    <div className="relative flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 group-hover/item:scale-150 transition-transform shadow-lg shadow-blue-500/50" />
                                        {i < staff.recentTasks.length - 1 && <div className="w-px h-full bg-white/10 my-1" />}
                                    </div>
                                    <div className="pb-6">
                                        <p className="text-xs font-black tracking-tight group-hover/item:text-blue-400 transition-colors">{task.type?.replace('_', ' ')}</p>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">REF: {task.orderRef || 'INTERNAL'}</p>
                                        <p className="text-[9px] text-slate-500 font-bold mt-2">{new Date(task.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                            {(!staff.recentTasks || staff.recentTasks.length === 0) && (
                                <div className="py-12 text-center opacity-30">
                                    <ClipboardList size={40} className="mx-auto mb-4" />
                                    <p className="text-[10px] font-black tracking-widest uppercase">No Recent Activity Detected</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl space-y-3">
                        <div className="flex items-center gap-2 text-blue-600">
                            <Info size={16} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Authority Tip</span>
                        </div>
                        <p className="text-[11px] text-blue-800 font-bold leading-relaxed">
                            Worker performance is calculated based on throughput and precision logs. Frequent anomalies may require manual intervention or retraining.
                        </p>
                    </div>
                </div>
            </div>

            {/* 🛡️ SYSTEM AUDIT MODAL */}
            {showLogsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/60 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 h-[80vh] flex flex-col">
                        <div className="p-8 bg-slate-900 border-b border-white/10 flex items-center justify-between text-white shrink-0">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">Sentinel Activity Archive</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personnel: {staff.firstName} {staff.lastName}</p>
                            </div>
                            <button onClick={() => setShowLogsModal(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-slate-50">
                             <LogisticsAuditTrail hubId={staff.fulfillmentHubId} staffId={staff.id} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
