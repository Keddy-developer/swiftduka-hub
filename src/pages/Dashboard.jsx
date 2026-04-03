import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import { 
  Package, Users, AlertTriangle, 
  Clock, Box, CheckCircle2, RefreshCw, Layers, TrendingUp, Warehouse,
  Activity, ArrowUpRight, ArrowDownRight, Zap, Target, Shield, Navigation,
  Globe, ClipboardList, Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const Dashboard = () => {
  const { hub } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(silent => !silent ? true : silent);
    if (!hub?.id) {
       setLoading(false);
       return;
    }
    try {
      const { data } = await axiosInstance.get(`/delivery/hubs/${hub.id}/stats`);
      setStats(data.stats);
    } catch (err) {
      console.error("Dashboard synchronization error", err);
    } finally {
      setLoading(false);
      // If manually triggered (silent is false/undefined usually, but let's check if we want toast)
      // fetchStats is called on mount too.
    }
  };

  const handleForceSync = async () => {
     await fetchStats();
     toast.success("Operational telemetry synchronized");
  };

  useEffect(() => { fetchStats(); }, [hub]);

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center p-20 opacity-50">
         <RefreshCw className="w-8 h-8 animate-spin mb-3 text-slate-400" />
         <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Synchronizing Hub Operational Data...</span>
       </div>
     );
  }

  const cards = [
    { label: 'Current Inventory', value: stats?.totalStock || 0, icon: Package, sub: 'Units in Manifest', color: 'blue', trend: '+12%' },
    { label: 'Active Fleet', value: stats?.activeRiders || 0, icon: Truck, sub: 'Field Operators', color: 'slate', trend: 'NOMINAL' },
    { label: 'Node Utilization', value: `${stats?.utilization || 0}%`, icon: Layers, sub: `${hub?.capacity || 1000} Max Capacity`, color: 'amber', trend: 'STEADY' },
    { label: 'Completed Today', value: stats?.completedToday || 0, icon: CheckCircle2, sub: 'Successful Drops', color: 'green', trend: '+5' },
  ];

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
      {/* 🏙️ TACTICAL COMMAND HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
         <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Logistics Command Center</h1>
            <div className="flex items-center gap-3 mt-1">
               <p className="text-[10px] md:text-xs text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                  <Warehouse size={14} className="text-blue-600 mb-0.5" />
                  Node: {hub?.name || 'SwiftHub Node'} · {hub?.town || 'Central'}, {hub?.county || 'HQ'}
               </p>
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Live Core Connected</span>
            </div>
         </div>
         <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => navigate('/logs')} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm">Audit History</button>
            <button onClick={handleForceSync} className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest">
               <RefreshCw size={14} className="inline mr-2" /> Force Sync
            </button>
         </div>
      </div>

      {/* 📊 KPI HUD TILES (MOBILE OPTIMIZED) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
         {cards.map((card) => (
           <KPIAltCard key={card.label} {...card} />
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
         {/* 📈 PERFORMANCE TELEMETRY */}
         <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Throughput Velocity</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">24H Operational Flux Analysis</p>
               </div>
               <div className="flex items-center gap-6">
                  <LegendItem color="#0F172A" label="Inbound" />
                  <LegendItem color="#3B82F6" label="Outbound" />
               </div>
            </div>
            
            <div className="p-6 md:p-8 flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.chartData || []}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F172A" stopOpacity={0.08}/>
                        <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.08}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="time" 
                      axisLine={false} 
                      tickLine={false} 
                      fontSize={10} 
                      fontWeight={800} 
                      stroke="#94A3B8" 
                      dy={10}
                      tickFormatter={(v) => v.split(':')[0] + 'H'}
                    />
                    <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight={800} stroke="#94A3B8" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      itemStyle={{ fontWeight: 'black', fontSize: '10px', textTransform: 'uppercase', padding: '4px 0' }}
                    />
                    <Area type="monotone" dataKey="in" stroke="#0F172A" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" animationDuration={1500} />
                    <Area type="monotone" dataKey="out" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" animationDuration={1500} />
                  </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* 🔔 OPERATIONAL MONITOR */}
         <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col group overflow-hidden">
            <div className="p-6 md:p-8 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
               <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Active Logs</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Node Telemetry</p>
               </div>
               <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5 text-blue-400 fill-blue-400" />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
               {stats?.alerts?.map((alert, idx) => (
                 <div key={alert.id || idx} className="p-6 hover:bg-slate-50 transition-all cursor-pointer border-b border-slate-100 last:border-0 relative">
                    <div className="flex gap-4">
                       <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 shadow-lg ${
                         alert.type === 'warning' ? 'bg-amber-500 shadow-amber-200' : 
                         alert.type === 'error' ? 'bg-rose-500 shadow-rose-200' : 'bg-blue-500 shadow-blue-200'
                       }`} />
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1 gap-2">
                             <p className="font-black text-[11px] text-slate-900 uppercase tracking-tight leading-none truncate">{alert.title}</p>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">{alert.time}</span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight line-clamp-2 italic">{alert.message}</p>
                       </div>
                    </div>
                 </div>
               ))}
               {!stats?.alerts?.length && (
                 <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center px-8">
                    <Shield size={48} className="text-slate-300 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">All Systems Nominal</p>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 italic">Node operating within established security and operational guardrails.</p>
                 </div>
               )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100">
               <button onClick={() => navigate('/logs')} className="w-full py-3.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm hover:shadow-lg hover:border-slate-300 transition-all flex items-center justify-center gap-3">
                  <ClipboardList size={14} className="text-slate-400" /> Complete Audit Trail
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

/* --- Visual Utility Components --- */

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-2.5">
     <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: color }} />
     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
  </div>
);

const KPIAltCard = ({ label, value, icon: Icon, sub, color, trend }) => {
  const configs = {
    blue: "text-blue-600 border-blue-500 bg-blue-50/20 shadow-blue-100",
    green: "text-green-600 border-green-500 bg-green-50/20 shadow-green-100",
    amber: "text-amber-600 border-amber-500 bg-amber-50/20 shadow-amber-100",
    slate: "text-slate-900 border-slate-400 bg-slate-50/20 shadow-slate-100"
  };

  return (
    <div className={`bg-white border p-6 rounded-2xl shadow-sm border-l-8 transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden ${configs[color] || configs.slate}`}>
       <div className="flex justify-between items-start mb-6">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-sm transition-transform group-hover:scale-110">
             <Icon size={24} className="opacity-80" />
          </div>
          {trend && (
             <div className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
                <span className="text-[10px] font-black tracking-tighter">{trend}</span>
                {trend.startsWith('+') ? <ArrowUpRight size={10} /> : <TrendingUp size={10} />}
             </div>
          )}
       </div>
       <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase italic tracking-tight">{sub}</p>
       </div>
       <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
};

export default Dashboard;
