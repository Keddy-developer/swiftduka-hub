import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheck, Package, Users, Truck, 
  BarChart3, Settings, ClipboardList, Info
} from 'lucide-react';

const Home = () => {
  const { user, isAdmin, isManager, isHQ, isStaff } = useAuth();
  
  const getRoleDescription = () => {
    if (isAdmin) return "System Administrator — Full infrastructure and entity oversight.";
    if (isManager) return "Hub Authority — Strategic management of regional nodes and staff.";
    if (isHQ) return "HQ Logistics — Global fleet and seller performance oversight.";
    if (isStaff) return "Hub Operations — Front-line inventory control and order fulfillment.";
    return "Authorized Personnel — Access level under review.";
  };

  const getRoleBadge = () => {
    if (isAdmin) return { text: "Admin", bg: "bg-red-50 text-red-700 border-red-100" };
    if (isManager) return { text: "Manager", bg: "bg-blue-50 text-blue-700 border-blue-100" };
    if (isHQ) return { text: "HQ Staff", bg: "bg-indigo-50 text-indigo-700 border-indigo-100" };
    if (isStaff) return { text: "Hub Staff", bg: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    return { text: "Guest", bg: "bg-slate-50 text-slate-700 border-slate-100" };
  };

  const badge = getRoleBadge();

  const moduleCards = [
    {
      title: 'Workbench',
      desc: 'Real-time hub throughput metrics and critical alerts.',
      icon: BarChart3,
      color: 'blue',
      roles: ['admin', 'fulfillment_manager', 'fulfillment_staff', 'hq_staff']
    },
    {
      title: 'Inventory & Stocks',
      desc: 'Inbound inventory management, SKUs, and stock counts.',
      icon: Package,
      color: 'emerald',
      roles: ['admin', 'fulfillment_manager', 'fulfillment_staff']
    },
    {
      title: 'Order Fulfillment',
      desc: 'Pick, pack, and ship operations for pending customer orders.',
      icon: ClipboardList,
      color: 'rose',
      roles: ['admin', 'fulfillment_manager', 'fulfillment_staff']
    },
    {
      title: 'Staff Intelligence',
      desc: 'Manage shift assignments, performance rankings, and access logs.',
      icon: Users,
      color: 'indigo',
      roles: ['admin', 'fulfillment_manager']
    },
    {
      title: 'Last-Mile Fleet',
      desc: 'Rider registration, zone mapping, and delivery performance.',
      icon: Truck,
      color: 'amber',
      roles: ['admin', 'fulfillment_manager', 'hq_staff']
    },
    {
      title: 'System Settings',
      desc: 'Configure hub policies, thresholds, and administrative rules.',
      icon: Settings,
      color: 'slate',
      roles: ['admin']
    }
  ];

  const userRole = (user?.role || [])[0] || 'guest';
  const availableModules = moduleCards.filter(card => card.roles.includes(userRole) || isAdmin);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-slate-900 text-white min-h-[440px] flex flex-col justify-center px-8 md:px-16 border border-white/10 shadow-2xl">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="/fulfillment_hub_onboarding_1775903982914.png" 
            alt="Fulfillment Hub Onboarding" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest mb-6 ${badge.bg} border-transparent bg-white/10 backdrop-blur-md`}>
            <ShieldCheck size={12} />
            {badge.text} Access Active
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-none">
            Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Logistics Neural Center</span>
          </h1>
          <p className="text-lg text-slate-300 font-medium leading-relaxed mb-8 max-w-xl">
            {getRoleDescription()} Your workstation is synchronized with the regional fulfillment network.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-3 bg-white text-slate-900 font-black rounded-xl hover:bg-slate-100 transition-all transform hover:scale-105 shadow-xl shadow-white/5">
              Launch Workbench
            </button>
            <button className="px-8 py-3 bg-white/10 text-white font-black rounded-xl hover:bg-white/20 transition-all border border-white/10 backdrop-blur-md">
              View Guide
            </button>
          </div>
        </div>
      </div>

      {/* Role Guide Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <ClipboardList size={20} />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Operational Scope</h2>
                <p className="text-sm font-medium text-slate-500 tracking-tight">Modules authorized for your clearance level</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableModules.map((module) => (
              <div key={module.title} className="group p-6 bg-white border border-slate-200 rounded-3xl hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform`}>
                    <module.icon size={24} />
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    Active
                  </div>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{module.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{module.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                 <Info size={18} className="text-blue-600" />
                 <h3 className="font-black text-slate-900 text-lg">System Integrity</h3>
              </div>
              <div className="space-y-6">
                 <div className="flex gap-4">
                    <div className="w-1 h-12 bg-blue-600 rounded-full shrink-0" />
                    <div>
                       <p className="font-black text-xs text-slate-900 uppercase tracking-widest mb-1">Data Privacy</p>
                       <p className="text-xs text-slate-500 leading-relaxed font-medium">All financial and staff data is encrypted. Personal identifiable information (PII) is masked for read-only roles.</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-1 h-12 bg-emerald-500 rounded-full shrink-0" />
                    <div>
                       <p className="font-black text-xs text-slate-900 uppercase tracking-widest mb-1">Audit Protocol</p>
                       <p className="text-xs text-slate-500 leading-relaxed font-medium">Every inventory adjustment and order status change is logged with timestamp and technician ID.</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-1 h-12 bg-amber-500 rounded-full shrink-0" />
                    <div>
                       <p className="font-black text-xs text-slate-900 uppercase tracking-widest mb-1">Network Sync</p>
                       <p className="text-xs text-slate-500 leading-relaxed font-medium">Operational status is synced globally every 30 seconds. In case of delay, force refresh the workbench.</p>
                    </div>
                 </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-100">
                 <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-700 leading-relaxed">
                       Need deeper clearance? Contact your Regional Logistics Director for permission overrides.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
