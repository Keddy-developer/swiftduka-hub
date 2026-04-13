import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import { 
    Users, TrendingUp, AlertCircle, CheckCircle2, 
    Clock, Plus, Search, Filter, MoreVertical, 
    Shield, Zap, Award, BarChart3, ChevronRight,
    QrCode, Target, Info
} from 'lucide-react';
import { toast } from 'react-toastify';

const StaffManagement = () => {
    const { hub } = useAuth();
    const [performance, setPerformance] = useState([]);
    const [insights, setInsights] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDutyModal, setShowDutyModal] = useState(false);
    const [workers, setWorkers] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [perfRes, workersRes] = await Promise.all([
                axiosInstance.get('/workforce/performance/metrics'),
                axiosInstance.get('/workforce/workers')
            ]);
            setPerformance(perfRes.data.metrics || []);
            setInsights(perfRes.data.insights || []);
            setAnomalies(perfRes.data.anomalies || []);
            setWorkers(workersRes.data.workers || []);
        } catch (err) {
            console.error("Failed to fetch staff data", err);
            toast.error("Telemetry failure: Could not load staff metrics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hub?.id) fetchData();
    }, [hub]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 🏙️ HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Staff Management</h1>
                    <div className="flex items-center gap-3 mt-2">
                         <div className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded text-[10px] font-black text-blue-700 uppercase tracking-widest">
                            {hub?.name || 'Local Node'}
                         </div>
                         <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                         <p className="text-xs font-bold text-slate-500 italic">Predictive performance monitoring active</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowDutyModal(true)}
                    className="flex items-center justify-center gap-3 px-8 py-3.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all hover:-translate-y-0.5"
                >
                    <Plus size={18} strokeWidth={3} />
                    ASSIGN CUSTOM DUTY
                </button>
            </div>

            {/* 📊 KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    label="Hygieia Score" 
                    value={`${(performance.reduce((acc, m) => acc + (Number(m.overallScore) || 0), 0) / (performance.length || 1)).toFixed(1)}%`}
                    sub="Avg Collective Efficiency"
                    icon={TrendingUp}
                    color="blue"
                />
                <MetricCard 
                    label="Active Sentinels" 
                    value={performance.length}
                    sub="Users logged in period"
                    icon={Users}
                    color="green"
                />
                <MetricCard 
                    label="Anomaly Alerts" 
                    value={anomalies.length}
                    sub="Flagged suspicious events"
                    icon={AlertCircle}
                    color="rose"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* 📋 PERFORMANCE TABLE */}
                <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Staff Performance</h3>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Efficiency Telemetry</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search staff..." 
                                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 ring-blue-500/10 transition-all w-48"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/30 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Completion</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Time/Task</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {performance.map((staff) => (
                                    <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs border border-slate-200">
                                                    {staff.user.firstName?.[0]}{staff.user.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-sm tracking-tight">{staff.user.firstName} {staff.user.lastName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{staff.user.role?.[0]?.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center">
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${(staff.completionRate || 0) > 80 ? 'bg-green-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${staff.completionRate || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-700 mt-1.5">{(staff.completionRate || 0).toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-[11px] font-black text-slate-700">{(staff.efficiencyScore || 0).toFixed(1)}m</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex justify-center">
                                                <div className={`px-2 py-1 rounded text-[10px] font-black border ${
                                                    (staff.overallScore || 0) > 90 ? 'bg-green-50 text-green-700 border-green-200' :
                                                    (staff.overallScore || 0) > 70 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-rose-50 text-rose-700 border-rose-200'
                                                }`}>
                                                    {(staff.overallScore || 0).toFixed(0)} CP
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <Link 
                                                to={`/staff/${staff.userId || staff.user.id}`}
                                                className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-slate-900 inline-block"
                                            >
                                                <ChevronRight size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 🧠 AI INSIGHTS & ANOMALIES */}
                <div className="space-y-6">
                    {/* INSIGHTS */}
                    <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl shadow-slate-200 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black tracking-tight">AI Insights</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Wisdom</p>
                            </div>
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                                <Zap className="w-6 h-6 text-blue-400 fill-blue-400" />
                            </div>
                        </div>

                        <div className="space-y-6 flex-1">
                            {insights.map(item => (
                                <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                                    <div className="flex gap-4">
                                        <div className="mt-1">
                                            {item.category === 'BOTTLENECK' ? <AlertCircle className="text-rose-400" size={18} /> : <Info className="text-blue-400" size={18} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black tracking-tight mb-1">{item.title}</p>
                                            <p className="text-[11px] text-slate-400 leading-relaxed italic">{item.description}</p>
                                            {item.suggestedAction && (
                                                <div className="mt-3 flex items-center gap-2 text-[10px] font-black text-blue-400 group-hover:gap-3 transition-all">
                                                    RESOLVE: {item.suggestedAction} <ChevronRight size={12} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!insights.length && (
                                <div className="py-12 text-center opacity-40">
                                    <Shield className="mx-auto mb-3" />
                                    <p className="text-[10px] font-black tracking-widest uppercase">System Optimal</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ANOMALIES */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6 px-2">
                             <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase tracking-widest">Integrity Watch</h3>
                             <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        </div>
                        <div className="space-y-4">
                            {anomalies.map(anomaly => (
                                <div key={anomaly.id} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100">
                                    <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                                        anomaly.severity === 'HIGH' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'
                                    }`}>
                                        <AlertCircle size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-[11px] font-black text-slate-900 truncate tracking-tight">{anomaly.user.firstName} {anomaly.user.lastName}</p>
                                            <span className="text-[9px] font-bold text-slate-400">{new Date(anomaly.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 line-clamp-1 italic mt-0.5">{anomaly.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 🛡️ DUTY ASSIGNMENT MODAL */}
            {showDutyModal && (
                <DutyModal 
                    onClose={() => setShowDutyModal(false)} 
                    workers={workers} 
                    onSuccess={() => { fetchData(); setShowDutyModal(false); }}
                />
            )}
        </div>
    );
};

const MetricCard = ({ label, value, sub, icon: Icon, color }) => {
    const colors = {
        blue: "text-blue-600 border-blue-100 bg-blue-50/10 shadow-blue-50",
        green: "text-green-600 border-green-100 bg-green-50/10 shadow-green-50",
        rose: "text-rose-600 border-rose-100 bg-rose-50/10 shadow-rose-50"
    };
    return (
        <div className={`bg-white border rounded-3xl p-8 transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group ${colors[color]}`}>
            <div className="flex justify-between items-start mb-6">
                 <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 transition-transform group-hover:scale-110">
                    <Icon size={28} />
                 </div>
                 <div className="w-8 h-1 bg-slate-100 rounded-full" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
            <p className="text-[11px] font-bold text-slate-400 mt-2 italic">{sub}</p>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-full opacity-50 pointer-events-none" />
        </div>
    );
};

const DutyModal = ({ onClose, workers, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '', description: '', assignedTo: '', priority: 'MEDIUM', deadline: '', requiresQR: false
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosInstance.post('/workforce/duties/custom', formData);
            toast.success("Duty assigned successfully");
            onSuccess();
        } catch (err) {
            toast.error("Failed to assign duty");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-900/40 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Assign Duty</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Directive</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><Plus className="rotate-45" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duty Title</label>
                            <input 
                                required
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 ring-blue-500/10 outline-none"
                                placeholder="e.g. Warehouse Inventory Cycle Count"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instructions</label>
                            <textarea 
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-24 focus:ring-2 ring-blue-500/10 outline-none"
                                placeholder="Detail steps for this activity..."
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assigned Staff</label>
                            <select 
                                required
                                value={formData.assignedTo}
                                onChange={e => setFormData({...formData, assignedTo: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            >
                                <option value="">Select individual...</option>
                                {workers.map(w => (
                                    <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority</label>
                            <select 
                                value={formData.priority}
                                onChange={e => setFormData({...formData, priority: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            >
                                <option value="LOW">LOW</option>
                                <option value="MEDIUM">MEDIUM</option>
                                <option value="HIGH">HIGH</option>
                                <option value="CRITICAL">CRITICAL</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Deadline</label>
                            <input 
                                type="datetime-local"
                                value={formData.deadline}
                                onChange={e => setFormData({...formData, deadline: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <input 
                                type="checkbox"
                                id="qr_req"
                                checked={formData.requiresQR}
                                onChange={e => setFormData({...formData, requiresQR: e.target.checked})}
                                className="w-5 h-5 rounded border-slate-200 text-blue-600 focus:ring-blue-500/20"
                            />
                            <label htmlFor="qr_req" className="text-xs font-bold text-slate-700">Require QR scan</label>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100 flex gap-4">
                         <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-200 transition-all"
                         >
                             CANCEL
                         </button>
                         <button 
                            disabled={loading}
                            type="submit"
                            className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                         >
                             {loading && <Zap className="animate-spin" size={16} />}
                             ISSUE DIRECTIVE
                         </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StaffManagement;
