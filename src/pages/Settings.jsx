import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import {
  Save, Warehouse, Truck, MapPin, Plus, Trash2,
  Settings as SettingsIcon, Package, User, CheckCircle,
  AlertTriangle, Loader2, X, Phone, Mail, Shield,
  Navigation, Globe, Zap, History, Bell, Languages
} from 'lucide-react';
import { toast } from 'react-toastify';

const SettingsPage = () => {
  const { hub, user } = useAuth();
  const isAdmin = user?.role?.some(r => ['admin', 'super_admin', 'moderator', 'customer_support'].includes(r.toLowerCase())) || false;
  const [activeTab, setActiveTab] = useState('hub');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hubInfo, setHubInfo] = useState({
    name: '',
    town: '',
    address: '',
    county: '',
    capacity: 1000,
  });
  const [routes, setRoutes] = useState([]);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [newRoute, setNewRoute] = useState({
    toTown: '',
    fee: '',
    weightLimit: 2.0,
    perKgFee: 50.0,
    providerType: 'RIDER',
    estimatedDaysMin: 1,
    estimatedDaysMax: 3,
    deliveryCategory: 'standard'
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!hub?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [hubRes, routesRes] = await Promise.all([
          axiosInstance.get(`/delivery/hubs/${hub.id}`),
          axiosInstance.get(`/delivery/routes?hubId=${hub.id}`)
        ]);

        if (hubRes.data.success) {
          setHubInfo({
            name: hubRes.data.hub.name || '',
            town: hubRes.data.hub.town || '',
            address: hubRes.data.hub.address || '',
            county: hubRes.data.hub.county || '',
            capacity: hubRes.data.hub.capacity || 1000,
          });
        }
        setRoutes(routesRes.data.routes || []);
      } catch (err) {
        console.error("Hub Sync Error", err);
        toast.error('Sync failure with headquarters');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hub]);

  const handleUpdateHub = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axiosInstance.put(`/delivery/hubs/${hub.id}`, hubInfo);
      toast.success('Hub metadata synchronized');
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpsertRoute = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...newRoute, fromHubId: hub.id };
      await axiosInstance.post('/delivery/routes', payload);
      toast.success('Logistics route authorized');

      const { data } = await axiosInstance.get(`/delivery/routes?hubId=${hub.id}`);
      setRoutes(data.routes || []);
      setShowRouteModal(false);
      setNewRoute({
        toTown: '', fee: '', weightLimit: 2.0, perKgFee: 50.0,
        providerType: 'RIDER', estimatedDaysMin: 1, estimatedDaysMax: 3, deliveryCategory: 'standard'
      });
    } catch (err) {
      toast.error('Route authorization failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm('Critical: This will revoke delivery capability for this zone. Continue?')) return;
    try {
      await axiosInstance.delete(`/delivery/routes/${routeId}`);
      setRoutes(prev => prev.filter(r => r.id !== routeId));
      toast.success('Route authority revoked');
    } catch (err) {
      toast.error('Revocation failure');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 opacity-50">
      <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-400" />
      <span className="text-xs font-bold  tracking-widest text-slate-500">Synchronizing Logistics Parameters...</span>
    </div>
  );

  const tabs = [
    { id: 'hub', name: 'Hub Profile', icon: Warehouse },
    { id: 'logistics', name: 'Delivery Zones', icon: MapPin },
    { id: 'account', name: 'Command Center', icon: Shield },
    { id: 'ops', name: 'Operational Policy', icon: Zap },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* 🏙️ ENTERPRISE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">System Configuration</h1>
          <p className="text-xs md:text-sm text-slate-500 font-bold  tracking-wide mt-1">
            Global Fulfillment Node Settings · <span className="text-slate-900">{hub?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400  tracking-widest border border-slate-200 px-3 py-1.5 rounded-full bg-white">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Node ID: {hub?.id?.substring(0, 8)}...
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── VERTICAL NAVIGATION (ALIBABA STYLE) ── */}
        <aside className="w-full lg:w-64 shrink-0">
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible no-scrollbar p-1 bg-slate-100/50 rounded-lg lg:bg-transparent">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded text-xs font-bold  tracking-widest transition-all whitespace-nowrap lg:w-full ${activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50 border border-slate-100'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.name}
              </button>
            ))}
          </nav>

          <div className="mt-8 hidden lg:block p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-white shadow-xl">
            <h4 className="text-[10px] font-black  tracking-[0.2em] mb-3 text-slate-400">System Health</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Connectivity</span>
                <span className="text-[10px] font-bold text-green-400 ">99.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">Sync Delay</span>
                <span className="text-[10px] font-bold text-blue-400 ">1.2s</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-blue-500"></div>
              </div>
              <p className="text-[9px] font-medium text-slate-500 italic ">Logistics engine nominal.</p>
            </div>
          </div>
        </aside>

        {/* ── CONTENT AREA ── */}
        <main className="flex-1 bg-white border border-slate-200 rounded shadow-sm overflow-hidden min-h-[600px]">
          {activeTab === 'hub' && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <SectionHeader title="Base Infrastructure Identification" />
              <form onSubmit={handleUpdateHub} className="p-6 md:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <InputGroup label="Node Entity Name" name="name" value={hubInfo.name}
                    onChange={e => setHubInfo({ ...hubInfo, name: e.target.value })} placeholder="Central Logistics Hub" />

                  <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="Operational Town" value={hubInfo.town}
                      onChange={e => setHubInfo({ ...hubInfo, town: e.target.value })} />
                    <InputGroup label="County Region" value={hubInfo.county}
                      onChange={e => setHubInfo({ ...hubInfo, county: e.target.value })} />
                  </div>

                  <InputGroup label="Tactical Address" fullWidth textarea value={hubInfo.address}
                    onChange={e => setHubInfo({ ...hubInfo, address: e.target.value })} />

                  <InputGroup label="Logistics Volume Capacity (Units)" type="number" value={hubInfo.capacity}
                    onChange={e => setHubInfo({ ...hubInfo, capacity: parseInt(e.target.value) })} />
                </div>

                <div className="pt-8 border-t border-slate-100 flex justify-end">
                  <button type="submit" disabled={saving}
                    className="px-8 py-3 bg-slate-900 text-white rounded text-[11px] font-black  tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Synchronizing...' : 'Commit Meta-Data'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'logistics' && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black text-slate-900  tracking-tight">Active Delivery Zones</h3>
                  <p className="text-[10px] font-bold text-slate-400  tracking-widest mt-1">Authorized Node Logistics lanes</p>
                </div>
                {isAdmin && (
                  <button onClick={() => setShowRouteModal(true)} className="px-4 py-2 bg-slate-900 text-white rounded text-[10px] font-black  tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg">
                    <Plus size={14} /> Add Zone
                  </button>
                )}
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                {routes.map(route => (
                  <div key={route.id} className="bg-white border border-slate-200 rounded p-5 group hover:border-blue-500/50 hover:shadow-xl hover:shadow-slate-200/50 transition-all relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                          <Navigation className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900  pr-8 truncate tracking-wide">{route.toTown}</h4>
                          <span className={`text-[9px] font-bold  tracking-tight px-2 py-0.5 rounded border mt-1 inline-block ${route.deliveryCategory === 'express' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                            {route.deliveryCategory} priority
                          </span>
                        </div>
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleDeleteRoute(route.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 mt-2">
                      <DataUnit label="Base Fee" value={`Ksh ${route.fee}`} />
                      <DataUnit label="Duration" value={`${route.estimatedDaysMin}-${route.estimatedDaysMax}D`} />
                      <DataUnit label="Asset" value={route.providerType} />
                    </div>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
                  </div>
                ))}
                {routes.length === 0 && (
                  <div className="col-span-full py-20 text-center flex flex-col items-center justify-center opacity-30">
                    <Globe size={48} className="text-slate-300 mb-4 animate-pulse" />
                    <p className="text-xs font-black  tracking-[0.2em] text-slate-400">Isolated Node: No active routes</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="p-8 md:p-12 animate-in slide-in-from-right-4 duration-300">
              <div className="max-w-md mx-auto text-center space-y-8">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-slate-900 rounded-3xl mx-auto flex items-center justify-center shadow-2xl border-4 border-white">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900  tracking-tight">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-[10px] font-bold text-slate-400  tracking-widest mt-1">Authorized Node Manager</p>
                </div>

                <div className="space-y-3">
                  <AccountRow icon={Mail} label="Access Email" value={user?.email} />
                  <AccountRow icon={Phone} label="Tactical Contact" value={user?.phone || 'Not Configured'} />
                  <AccountRow icon={Languages} label="Local Sync" value="English (Unified)" />
                </div>

                <div className="pt-8 space-y-3">
                  <button className="w-full py-3 bg-white border border-slate-200 rounded text-[11px] font-black  tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                    <SettingsIcon size={16} className="text-slate-400" /> Update Security Credentials
                  </button>
                  <p className="text-[9px] font-bold text-slate-400  leading-relaxed">
                    Security Notice: Credentials resets require multi-factor authorization from administrative headquarters.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ops' && (
            <div className="p-8 animate-in slide-in-from-right-4 duration-300">
              <SectionHeader title="Operational Fulfillment Policies" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <OpsPolicyCard
                  title="Damage Reclamation"
                  desc="Defines the penalty ratio for products damaged during hub transit or rider handling."
                  value="15% Default"
                />
                <OpsPolicyCard
                  title="Storage Surcharge"
                  desc="Daily holding fee for products exceeding 60-day inventory aging threshold."
                  value="Ksh 5.00/unit"
                />
                <OpsPolicyCard
                  title="Route Optimization"
                  desc="AI-driven clustering of delivery drops to minimize travel distance and rider fuel consumption."
                  value="ENABLED"
                  active
                />
                <OpsPolicyCard
                  title="SLA Guardrails"
                  desc="Automatic order escalation if logistics status is not updated within 24 operational hours."
                  value="STRICT"
                  active
                />
              </div>
              <div className="mt-12 bg-amber-50 border border-amber-100 p-6 rounded-lg flex gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-amber-800  tracking-tight">System Compliance Warning</h4>
                  <p className="text-xs text-amber-700 font-medium leading-relaxed mt-1 italic">
                    Operational policies are managed globally. Modifications to these thresholds must be authorized through the Regional Logistics Oversight board.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── ROUTE MODAL ── */}
      {showRouteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 bg-slate-900 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white  tracking-tight">Deploy Logistics Zone</h2>
                <p className="text-[10px] font-bold text-slate-400  tracking-widest mt-1">Authorized Route Authorization</p>
              </div>
              <button onClick={() => setShowRouteModal(false)} className="text-white/50 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpsertRoute} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <InputGroup label="Target Destination" required value={newRoute.toTown} onChange={e => setNewRoute({ ...newRoute, toTown: e.target.value })} />

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400  tracking-widest">Service Level</label>
                  <select value={newRoute.deliveryCategory} onChange={e => setNewRoute({ ...newRoute, deliveryCategory: e.target.value })}
                    className="w-full border border-slate-200 rounded px-4 py-2.5 text-xs font-bold outline-none focus:border-slate-900 shadow-sm transition-all bg-slate-50">
                    <option value="standard">STANDARD</option>
                    <option value="express">EXPRESS</option>
                    <option value="priority">PRIORITY</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <InputGroup label="Base Fee (Ksh)" type="number" required value={newRoute.fee} onChange={e => setNewRoute({ ...newRoute, fee: e.target.value })} />

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400  tracking-widest">Asset Class</label>
                  <select value={newRoute.providerType} onChange={e => setNewRoute({ ...newRoute, providerType: e.target.value })}
                    className="w-full border border-slate-200 rounded px-4 py-2.5 text-xs font-bold outline-none focus:border-slate-900 shadow-sm transition-all bg-slate-50">
                    <option value="RIDER">LOCAL FLEET</option>
                    <option value="COURIER">THIRD-PARTY 3PL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <InputGroup label="Min Duration (Days)" type="number" value={newRoute.estimatedDaysMin} onChange={e => setNewRoute({ ...newRoute, estimatedDaysMin: e.target.value })} />
                <InputGroup label="Max Duration (Days)" type="number" value={newRoute.estimatedDaysMax} onChange={e => setNewRoute({ ...newRoute, estimatedDaysMax: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowRouteModal(false)} className="flex-1 py-3 bg-white border border-slate-200 rounded text-[11px] font-black  tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-slate-900 text-white rounded text-[11px] font-black  tracking-widest hover:bg-slate-800 transition-all shadow-xl">
                  {saving ? 'SYNCHRONIZING...' : 'Authorize Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- Visual Utility Components --- */

const SectionHeader = ({ title }) => (
  <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
    <div className="w-2 h-6 bg-blue-600 rounded-full" />
    <h3 className="text-xl font-black text-slate-900  tracking-tight">{title}</h3>
  </div>
);

const InputGroup = ({ label, textarea, fullWidth, ...props }) => (
  <div className={`flex flex-col gap-2 ${fullWidth ? 'md:col-span-2' : ''}`}>
    <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1">{label}</label>
    {textarea ? (
      <textarea
        {...props}
        rows={3}
        className="w-full border border-slate-200 rounded px-4 py-3 text-sm font-bold outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-sm transition-all resize-none"
      />
    ) : (
      <input
        {...props}
        className="w-full border border-slate-200 rounded px-4 py-2.5 text-sm font-bold outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-sm transition-all"
      />
    )}
  </div>
);

const DataUnit = ({ label, value }) => (
  <div>
    <p className="text-[9px] font-black text-slate-400  tracking-tighter mb-0.5">{label}</p>
    <p className="text-[11px] font-black text-slate-900  tracking-wide">{value}</p>
  </div>
);

const AccountRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded border border-slate-100 group hover:bg-white hover:border-slate-200 transition-all">
    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
      <Icon size={18} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
    </div>
    <div className="text-left flex-1 min-w-0">
      <p className="text-[9px] font-black text-slate-400  tracking-widest leading-none mb-1">{label}</p>
      <p className="text-xs font-black text-slate-900 truncate tracking-tight">{value}</p>
    </div>
  </div>
);

const OpsPolicyCard = ({ title, desc, value, active }) => (
  <div className="p-5 border border-slate-200 rounded-lg hover:border-blue-500/50 transition-all bg-white shadow-sm flex flex-col justify-between">
    <div>
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-black text-slate-900  tracking-tight">{title}</h4>
        {active && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded-full">
            <div className="w-1 h-1 rounded-full bg-green-500" />
            <span className="text-[8px] font-black ">Active</span>
          </div>
        )}
      </div>
      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
      <span className="text-[10px] font-black text-slate-400  tracking-widest">Policy Threshold</span>
      <span className="text-[11px] font-black text-blue-600  tracking-wide">{value}</span>
    </div>
  </div>
);

export default SettingsPage;
