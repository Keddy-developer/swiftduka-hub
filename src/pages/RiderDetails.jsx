import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosConfig';
import { 
  ArrowLeft, User, Truck, ShieldCheck, Navigation, 
  Phone, Mail, Activity, Calendar, IdCard, Star, MapPin, X, Info
} from 'lucide-react';
import { toast } from 'react-toastify';

const InfoTile = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded">
    <Icon size={14} className="text-slate-400 mt-0.5" />
    <div className="min-w-0">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-[11px] font-bold text-slate-900 truncate uppercase">{value || 'N/A'}</p>
    </div>
  </div>
);

export default function RiderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [rider, setRider] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchRider = async () => {
        try {
            const { data } = await axiosInstance.get(`/logistics/riders/${id}`);
            if (data.success) {
                setRider(data.rider);
            }
        } catch (err) {
            toast.error("Rider manifest retrieval failure");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRider(); }, [id]);

    if (loading) return <div className="p-8 text-slate-400 font-medium italic text-sm text-center">Syncing agent manifest...</div>;
    if (!rider) return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Agent record not found in hub registry.</div>;

    return (
        <div className="space-y-6 md:space-y-8">
            {/* 🏙️ HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                    <button onClick={() => navigate('/fleet')} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-900 transition-colors">
                        <ArrowLeft size={14} /> Back to Fleet
                    </button>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tighter flex items-center gap-3 uppercase">
                        {rider.user.firstName} {rider.user.lastName}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${rider.isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                            {rider.isActive ? 'Active Status' : 'Offline'}
                        </span>
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded text-[10px] font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 shadow-sm uppercase">DEACTIVATE</button>
                    <button onClick={fetchRider} className="px-4 py-2 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-sm uppercase animate-none">SYNC DOSSIER</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
               {/* ── LEFT: AGENT IDENTITY ── */}
               <div className="lg:col-span-4 space-y-6">
                  <section className="bg-slate-900 rounded border border-slate-800 p-6 text-white shadow-lg relative overflow-hidden group text-center">
                     <ShieldCheck size={100} className="absolute -right-8 -top-8 text-white/5 rotate-12 group-hover:text-white/10 transition-colors" />
                     <div className="w-24 h-24 rounded-full bg-white/10 p-1.5 mx-auto mb-4 border border-white/20 shadow-xl overflow-hidden">
                        <img src={rider.user.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop'} className="w-full h-full object-cover rounded-full" />
                     </div>
                     <h3 className="text-lg font-black tracking-tight">{rider.user.firstName} {rider.user.lastName}</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Personnel ID: {rider.id.slice(0,8)}</p>
                     
                     <div className="mt-6 flex flex-wrap gap-2 justify-center">
                        <span className="px-2 py-0.5 bg-white/10 border border-white/20 rounded text-[9px] font-bold uppercase tracking-widest text-slate-300">Rider Class-A</span>
                        <span className="px-2 py-0.5 bg-white/10 border border-white/20 rounded text-[9px] font-bold uppercase tracking-widest text-slate-300">Hub Verified</span>
                     </div>
                  </section>

                  <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                     <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                        <Truck size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asset Parameters</span>
                     </div>
                     <div className="p-5 space-y-3">
                         <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">License Plate</span>
                            <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">{rider.licensePlate || 'N/A'}</span>
                         </div>
                         <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Type</span>
                            <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{rider.vehicleType || 'Motorbike'}</span>
                         </div>
                         <div className="flex justify-between items-center pt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Registry Date</span>
                            <span className="text-xs font-bold text-slate-800">{new Date(rider.createdAt).toLocaleDateString()}</span>
                         </div>
                     </div>
                  </section>
               </div>

               {/* ── RIGHT: CONTACT & OPS ── */}
               <div className="lg:col-span-8 space-y-6">
                  <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden min-h-[400px]">
                     <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                        <Navigation size={14} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Communication & Deployment</span>
                     </div>
                     
                     <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoTile label="Primary Signal" value={rider.user.phone} icon={Phone} />
                            <InfoTile label="Digital Authority" value={rider.user.email} icon={Mail} />
                            <InfoTile label="Deployment Hub" value={rider.fulfillmentHub?.town || 'Central Command'} icon={Warehouse} />
                            <InfoTile label="Sector Zone" value={rider.coverageArea} icon={MapPin} />
                        </div>

                        <div className="mt-8 border-t border-slate-100 pt-8">
                           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Account Utility</h4>
                           <div className="flex flex-wrap gap-2">
                              <button className="p-2 px-6 bg-slate-900 text-white rounded text-[10px] font-bold uppercase hover:bg-slate-800 transition-all shadow-sm">Personnel Audit</button>
                              <button className="p-2 px-6 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">Review Credentials</button>
                           </div>
                        </div>

                        <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded flex gap-4 items-start">
                           <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                           <div className="space-y-1">
                              <h5 className="text-[11px] font-bold text-amber-900 uppercase tracking-tight">Security Protocol Advisory</h5>
                              <p className="text-[11px] text-amber-700 leading-relaxed font-medium">Verify all identification documents are current. Unverified agents will be automatically throttled by the automated dispatch engine in the next cycle.</p>
                           </div>
                        </div>
                     </div>
                  </section>
               </div>
            </div>
        </div>
    );
}

const Warehouse = ({ size, className }) => <Truck size={size} className={className} />; // Fallback icon
