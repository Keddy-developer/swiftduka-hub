import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosConfig';
import {
    ArrowLeft, User, Truck, ShieldCheck, Navigation,
    Phone, Mail, Activity, Calendar, IdCard, Star, MapPin, X, Info,
    AlertTriangle, Briefcase, Eye, ExternalLink, FileText, Image as ImageIcon,
    History, BadgeCheck, ShieldAlert, Locate, Maximize2, CheckCircle2
} from 'lucide-react';
import { toast } from 'react-toastify';
import LogisticsAuditTrail from '../components/LogisticsAuditTrail';

const Warehouse = ({ size, className }) => <MapPin size={size} className={className} />;

const InfoTile = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded">
        <Icon size={14} className="text-slate-400 mt-0.5" />
        <div className="min-w-0">
            <p className="text-[9px] font-bold text-slate-400 tracking-widest leading-none mb-1">{label}</p>
            <p className="text-[11px] font-bold text-slate-900 truncate">{value || 'N/A'}</p>
        </div>
    </div>
);

export default function RiderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [rider, setRider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [showCredsModal, setShowCredsModal] = useState(false);
    const [showVehicleModal, setShowVehicleModal] = useState(false);

    const fetchRider = async () => {
        try {
            const { data } = await axiosInstance.get(`/riders/${id}`);
            if (data) {
                setRider(data);
            }
        } catch (err) {
            toast.error("Failed to load rider details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRider(); }, [id]);

    if (loading) return <div className="p-8 text-slate-400 font-medium italic text-sm text-center">Loading rider details...</div>;
    if (!rider) return <div className="p-20 text-center text-slate-400 font-bold tracking-widest">Rider not found.</div>;

    return (
        <div className="space-y-6 md:space-y-8">
            {/* 🏙️ HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                    <button onClick={() => navigate('/fleet')} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors">
                        <ArrowLeft size={14} /> Back to Fleet
                    </button>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tighter flex items-center gap-3">
                        {rider.user?.firstName ? `${rider.user.firstName} ${rider.user.lastName}` : (rider.name || 'Rider')}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tight border ${rider.status === 'AVAILABLE' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                            {rider.status || 'OFFLINE'}
                        </span>
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (window.confirm("Remove this rider from the hub?")) {
                                try {
                                    await axiosInstance.delete(`/riders/${id}`);
                                    toast.success("Rider removed successfully");
                                    navigate('/fleet');
                                } catch (err) {
                                    toast.error("Failed to remove rider");
                                }
                            }
                        }}
                        className="px-4 py-2 bg-white border border-slate-200 rounded text-[10px] font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 shadow-sm"
                    >
                        DEACTIVATE
                    </button>
                    <button onClick={fetchRider} className="px-4 py-2 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-sm animate-none">REFRESH</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
                {/* ── LEFT: RIDER IDENTITY ── */}
                <div className="lg:col-span-4 space-y-6">
                    <section className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-white shadow-2xl relative overflow-hidden group text-center lg:text-left">
                        <ShieldCheck size={160} className="absolute -right-12 -top-12 text-white/5 rotate-12 group-hover:text-white/10 transition-all duration-700" />
                        <div className="flex flex-col lg:flex-row items-center gap-6 relative z-10">
                            <div className="relative">
                                <div className="w-28 h-28 rounded-3xl bg-white/10 p-1 mx-auto lg:mx-0 border border-white/20 shadow-2xl overflow-hidden group-hover:scale-105 transition-transform">
                                    <img 
                                        src={rider.user?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop'} 
                                        className="w-full h-full object-cover rounded-2xl" 
                                        alt="Agent Avatar"
                                    />
                                </div>
                                <div className="absolute -bottom-2 -right-2 p-1.5 bg-blue-500 rounded-lg shadow-lg border-2 border-slate-900">
                                    <BadgeCheck size={14} className="text-white" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black tracking-tight leading-tight">
                                    {rider.user?.firstName ? `${rider.user.firstName} ${rider.user.lastName}` : (rider.name || 'Rider')}
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">ID Number: {rider.id?.slice(0, 8)}</p>
                                <div className="flex flex-wrap gap-2 justify-center lg:justify-start pt-1">
                                    <span className="px-2.5 py-1 bg-white/10 border border-white/10 rounded-lg text-[9px] font-black tracking-widest text-blue-400 capitalize">
                                        {rider.vehicleType || 'Class-A Agent'}
                                    </span>
                                    <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-[9px] font-black tracking-widest text-green-400">
                                        {rider.fulfillmentHub?.name ? 'Hub Verified' : 'Central Verified'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                            <Truck size={14} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 tracking-widest">Vehicle Details</span>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                <span className="text-[10px] font-black text-slate-400">License Plate</span>
                                <span className="text-sm font-black text-slate-900 tracking-tighter">{rider.numberPlate || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                                <span className="text-[10px] font-black text-slate-400">Vehicle Type</span>
                                <span className="text-sm font-bold text-slate-700 tracking-tight">{rider.vehicleType || 'Motorbike'}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-[10px] font-bold text-slate-400">Registration Date</span>
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
                            <span className="text-[10px] font-bold text-slate-500 tracking-widest">Contact Information</span>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InfoTile label="Phone Number" value={rider.user?.phone || rider.phone} icon={Phone} />
                                <InfoTile label="Email Address" value={rider.user?.email || rider.email} icon={Mail} />
                                <InfoTile label="Assigned Hub" value={rider.fulfillmentHub?.town || 'Main Hub'} icon={Warehouse} />
                                <InfoTile label="Delivery Area" value={rider.coverageArea || 'General Area'} icon={MapPin} />
                                               <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                                    Rider Records
                                </div>
                                <div className="flex flex-wrap gap-3 mt-4">
                                    <button 
                                        onClick={() => setShowAuditModal(true)}
                                        className="flex-1 min-w-[140px] p-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 group"
                                    >
                                        <History size={14} className="group-hover:rotate-12 transition-transform" />
                                        VIEW ACTIVITY LOG
                                    </button>
                                    <button 
                                        onClick={() => setShowCredsModal(true)}
                                        className="flex-1 min-w-[140px] p-3.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck size={14} />
                                        VIEW DOCUMENTS
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-blue-50/50 border border-blue-100 rounded-2xl flex gap-4 items-start animate-pulse shadow-sm">
                                <ShieldAlert size={20} className="text-blue-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <h5 className="text-[11px] font-black text-blue-900 tracking-tight uppercase">Document Verification</h5>
                                    <p className="text-[10px] text-blue-700 leading-relaxed font-bold">Please ensure all rider documents are up to date. Riders with expired documents may be suspended from the dispatch engine.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            {/* ── LOGISTICS AUDIT MODAL ── */}
            {showAuditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 bg-slate-900 text-white shrink-0">
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Rider Activity Log</h3>
                                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Log History: {rider.name}</p>
                            </div>
                            <button onClick={() => setShowAuditModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                            <LogisticsAuditTrail hubId={rider.fulfillmentHubId} />
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 text-blue-800">
                                <Info size={16} className="shrink-0 mt-0.5" />
                                <p className="text-[11px] font-medium leading-relaxed">
                                    This log shows all system actions related to this rider, filtered by the local hub authority. For historical data older than 30 days, please contact the main administrator.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── REVIEW CREDENTIALS MODAL ── */}
            {showCredsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative animate-in slide-in-from-bottom-5 duration-300">
                        <div className="p-8 space-y-8">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Identity Verification</h3>
                                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mt-0.5">Account ID: {rider.id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowCredsModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                    <X size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <CredItem icon={IdCard} label="National ID Number" value={rider.nationalId} />
                                    <CredItem icon={ShieldCheck} label="Driving License Number" value={rider.drivingLicence} />
                                    <CredItem icon={Activity} label="Status" value={rider.status} color={rider.status === 'AVAILABLE' ? 'text-green-600' : 'text-amber-600'} />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2">Vehicle Photo</p>
                                    <div className="aspect-video rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden relative group/asset cursor-pointer shadow-inner" onClick={() => setShowVehicleModal(true)}>
                                        <img 
                                            src={rider.vehicleImage || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&h=400&fit=crop'} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                                            alt="Vehicle"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/asset:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                                            <Maximize2 size={24} className="mb-2 animate-bounce" />
                                            <span className="text-[10px] font-black tracking-widest">VIEW PHOTO</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                        <p className="text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">Vehicle Information</p>
                                        <p className="text-sm font-black text-slate-900 tracking-tighter">
                                            {rider.vehicleType} · {rider.numberPlate}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setShowCredsModal(false)} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all">CLOSE</button>
                                <button 
                                    onClick={() => navigate(`/register-a-rider/${rider.id}`)}
                                    className="px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit size={14} />
                                    EDIT DETAILS
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ASSET TELEMETRY MODAL ── */}
            {showVehicleModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative w-full max-w-6xl aspect-video rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10">
                        <img src={rider.vehicleImage || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200'} className="w-full h-full object-contain" alt="Asset Fullscreen" />
                        <button onClick={() => setShowVehicleModal(false)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/20 group">
                            <X size={32} className="group-hover:rotate-90 transition-transform" />
                        </button>
                        <div className="absolute bottom-6 left-6 p-6 bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl text-white">
                            <p className="text-[10px] font-black tracking-widest uppercase text-white/60 mb-1">Plate Number</p>
                            <h4 className="text-2xl font-black tracking-tight">{rider.numberPlate}</h4>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const CredItem = ({ icon: Icon, label, value, color = "text-slate-900" }) => (
    <div className="flex items-start gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
        <div className="p-2.5 bg-white shadow-sm rounded-xl text-blue-600">
            <Icon size={18} />
        </div>
        <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1 leading-none">{label}</p>
            <p className={`text-sm font-black tracking-tighter truncate ${color}`}>{value || 'NOT SERIALIZED'}</p>
        </div>
    </div>
);


