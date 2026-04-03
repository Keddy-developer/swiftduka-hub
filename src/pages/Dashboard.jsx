import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import { 
  Package, Users, AlertTriangle, 
  Clock, Box, CheckCircle2, RefreshCw, Layers, TrendingUp, Warehouse
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const Dashboard = () => {
  const { hub } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      if (!hub?.id) {
         setLoading(false);
         return;
      }
      try {
        const { data } = await axiosInstance.get(`/delivery/hubs/${hub.id}/stats`);
        setStats(data.stats);
      } catch (err) {
        console.error("Dashboard error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [hub]);

  if (loading) {
     return <div className="p-8 text-slate-400 font-medium italic text-sm">Synchronizing hub operational data...</div>;
  }

  const cards = [
    { label: 'Live Stock', value: stats?.totalStock || 0, icon: Package, sub: 'Units in Hub' },
    { label: 'Active Fleet', value: stats?.activeRiders || 0, icon: Users, sub: 'Assigned Riders' },
    { label: 'Capacity', value: `${stats?.utilization || 0}%`, icon: Layers, sub: `${hub?.capacity || 1000} Max` },
    { label: 'Outbound Today', value: stats?.completedToday || 0, icon: CheckCircle2, sub: 'Processed Orders' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 🏙️ WORKBENCH HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Logistics Command</h2>
            <p className="text-[11px] md:text-xs text-slate-500 font-bold uppercase tracking-tight flex items-center gap-2">
               <Warehouse size={14} className="text-slate-400" />
               {hub?.name} · {hub?.town}, {hub?.county}
            </p>
         </div>
         <div className="flex gap-2">
            <button className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm uppercase">Logs</button>
            <button className="flex-1 md:flex-none px-4 py-2 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 transition-all shadow-sm uppercase">Force Sync</button>
         </div>
      </div>

      {/* 📊 KPI TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
         {cards.map((card) => (
           <div key={card.label} className="bg-white border border-slate-200 p-4 md:p-6 rounded shadow-sm flex items-center gap-3 md:gap-5 hover:border-slate-400 transition-colors">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded bg-slate-50 flex items-center justify-center border border-slate-100 flex-shrink-0 text-slate-400">
                 <card.icon size={20} />
              </div>
              <div className="min-w-0">
                 <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{card.label}</p>
                 <p className="text-lg md:text-2xl font-black text-slate-900 tracking-tighter leading-none">{card.value}</p>
                 <p className="text-[8px] md:text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight whitespace-nowrap">{card.sub}</p>
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
         {/* Picking Performance Chart */}
         <div className="xl:col-span-2 bg-white border border-slate-200 p-4 md:p-6 rounded shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-50">
               <div>
                  <h3 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-tight">Throughput Ledger</h3>
                  <p className="text-[9px] font-bold text-slate-4400 uppercase tracking-widest leading-none mt-1">24H Operational Traffic Analysis</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-slate-900 rounded-full" />
                     <span className="text-[9px] font-bold text-slate-500 uppercase">Inbound</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-blue-500 rounded-full" />
                     <span className="text-[9px] font-bold text-slate-500 uppercase">Outbound</span>
                  </div>
               </div>
            </div>
            
            <div className="h-[180px] md:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.chartData || []}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0F172A" stopOpacity={0.05}/>
                        <stop offset="95%" stopColor="#0F172A" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.05}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={9} fontWeight={700} stroke="#94A3B8" />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: 'none', padding: '6px' }}
                      itemStyle={{ fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase' }}
                    />
                    <Area type="monotone" dataKey="in" stroke="#0F172A" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" />
                    <Area type="monotone" dataKey="out" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" />
                  </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* 🔔 ACTION CENTER */}
         <div className="bg-white border border-slate-200 p-4 md:p-6 rounded shadow-sm flex flex-col">
            <h3 className="text-sm md:text-base font-bold text-slate-900 uppercase tracking-tight mb-6">Operational Logs</h3>
            <div className="flex-1 space-y-3">
               {stats?.alerts?.map(alert => (
                 <div key={alert.id} className="p-3 bg-slate-50 border border-slate-100 rounded hover:border-slate-300 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                       <span className={`w-1.5 h-1.5 rounded-full ${alert.type === 'error' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                       <span className="text-[9px] font-bold text-slate-800 uppercase tracking-tight leading-tight">{alert.title}</span>
                       <span className="ml-auto text-[8px] font-bold text-slate-400 uppercase">{alert.time}</span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed uppercase tracking-tight line-clamp-2">{alert.message}</p>
                 </div>
               ))}
               {!stats?.alerts?.length && (
                 <div className="text-center py-10">
                   <p className="text-slate-400 text-[10px] font-bold uppercase italic tracking-widest">No active logs</p>
                 </div>
               )}
            </div>
            
            <button className="w-full py-2.5 mt-6 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-slate-800 transition-all">
               Audit History
            </button>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
