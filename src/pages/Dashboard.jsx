import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import { 
  BarChart3, Package, Truck, Users, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Clock, Box, 
  CheckCircle2, RefreshCw, Layers, TrendingUp 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { hub } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!hub?.id) return;
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

  const cards = [
    { label: 'Live Stock Units', value: stats?.totalStock || 0, icon: Package, color: 'blue', sub: 'Hub Inventory' },
    { label: 'Active Fleet', value: stats?.activeRiders || 0, icon: Users, color: 'purple', sub: 'Linked Riders' },
    { label: 'Capacity Used', value: `${stats?.utilization || 0}%`, icon: Layers, color: 'orange', sub: `${hub?.capacity || 5000} Max` },
    { label: 'Completed Today', value: stats?.completedToday || 0, icon: CheckCircle2, color: 'green', sub: 'Outbound Flow' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* 🚀 HUB WELCOME AREA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <div className="flex items-center gap-3 mb-3">
               <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-200">System Online</span>
               <span className="text-slate-300 font-bold">/</span>
               <span className="text-slate-500 font-bold text-xs uppercase tracking-tighter">{hub?.town}, {hub?.county || 'Hub Location'}</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
               {hub?.name || 'Loading Architecture...'}
            </h1>
         </div>
         <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
               <Clock className="w-4 h-4" /> Shift Logs
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
               <TrendingUp className="w-4 h-4" /> System Health
            </button>
         </div>
      </div>

      {/* 📊 KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {cards.map((card, i) => (
           <motion.div 
             key={card.label}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group lg:min-h-[220px] flex flex-col justify-between"
           >
              <div>
                <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${
                  card.color === 'blue' ? 'bg-blue-600 shadow-blue-100 text-white' :
                  card.color === 'purple' ? 'bg-purple-600 shadow-purple-100 text-white' :
                  card.color === 'orange' ? 'bg-orange-600 shadow-orange-100 text-white' :
                  'bg-emerald-600 shadow-emerald-100 text-white'
                }`}>
                   <card.icon className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</div>
              </div>
              <div>
                <div className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">{card.value}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter opacity-60">{card.sub}</div>
              </div>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         {/* Picking Performance Chart */}
         <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
               <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none mb-2">Processing Throughput</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Last 24 Hours Metrics</p>
               </div>
               <div className="flex items-center gap-2">
                   <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Inbound</span>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Outbound</span>
                   </div>
               </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.chartData || []}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={10} fontWeight={700} stroke="#94A3B8" />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="in" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                    <Area type="monotone" dataKey="out" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                  </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* 🔔 ACTION CENTER */}
         <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm flex flex-col">
            <h3 className="text-xl font-black text-slate-900 leading-none mb-8">Operational Alerts</h3>
            <div className="flex-1 space-y-4">
               {stats?.alerts?.map(alert => (
                 <AlertItem 
                   key={alert.id}
                   icon={alert.type === 'error' ? AlertTriangle : alert.type === 'warning' ? Clock : CheckCircle2} 
                   title={alert.title} 
                   desc={alert.message} 
                   time={alert.time} 
                   type={alert.type}
                 />
               ))}
               {!stats?.alerts?.length && (
                 <div className="text-center py-10">
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Everything is optimal</p>
                 </div>
               )}
            </div>
            
            <button className="w-full py-4 mt-8 bg-slate-50 hover:bg-slate-100 rounded-3xl text-sm font-bold text-slate-600 transition-all border border-slate-100">
               View All System Logs
            </button>
         </div>
      </div>
    </div>
  );
};

const AlertItem = ({ icon: Icon, title, desc, time, type }) => {
  const styles = {
    error: 'bg-rose-50 text-rose-600 border-rose-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    info: 'bg-blue-50 text-blue-600 border-blue-100',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };
  return (
    <div className={`p-5 rounded-3xl border ${styles[type] || styles.info} group hover:scale-[1.02] transition-transform cursor-pointer`}>
       <div className="flex items-center gap-3 mb-2">
          <Icon className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
          <span className="ml-auto text-[8px] font-bold opacity-60 uppercase">{time}</span>
       </div>
       <p className="text-[11px] font-bold text-slate-800 leading-relaxed">{desc}</p>
    </div>
  );
};

export default Dashboard;
