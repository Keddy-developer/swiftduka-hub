import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosConfig';
import {
    ArrowLeft, User, Truck, ShieldCheck, Navigation,
    Phone, Mail, Activity, Calendar, IdCard, Star, MapPin, X, Info,
    AlertTriangle, Briefcase, Eye, ExternalLink, FileText, Image as ImageIcon,
    History, BadgeCheck, ShieldAlert, Locate, Maximize2, CheckCircle2, Edit3,
    DollarSign, Wallet, ClipboardList, Package
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const Warehouse = ({ size, className }) => <MapPin size={size} className={className} />;

const InfoTile = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
        <Icon size={14} className="text-slate-400 mt-0.5" />
        <div className="min-w-0">
            <p className="text-[9px] font-bold text-slate-400 tracking-widest leading-none mb-1 uppercase">{label}</p>
            <p className="text-[11px] font-black text-slate-900 truncate uppercase">{value || 'N/A'}</p>
        </div>
    </div>
);

export default function CourierDetails() {
    const { id } = useParams();
    const { hub } = useAuth();
    const navigate = useNavigate();
    const [courier, setCourier] = useState(null);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('DELIVERED');
    const [showPODModal, setShowPODModal] = useState(null);

    const formatImgSrc = (src) => {
        if (!src) return "";
        if (src.startsWith('http') || src.startsWith('data:')) return src;
        // Detection for common base64 patterns
        if (src.startsWith('/9j/')) return `data:image/jpeg;base64,${src}`;
        if (src.startsWith('iVBOR')) return `data:image/png;base64,${src}`;
        if (src.startsWith('PHN2')) return `data:image/svg+xml;base64,${src}`;
        return `data:image/png;base64,${src}`;
    };

    const fetchData = async () => {
        if (!hub?.id) return;
        setLoading(true);
        try {
            const [courierRes, assignmentsRes] = await Promise.all([
                axiosInstance.get(`/delivery/hubs/${hub.id}/couriers/${id}`),
                axiosInstance.get(`/delivery/hubs/${hub.id}/couriers/${id}/assignments`)
            ]);
            setCourier(courierRes.data.courier);
            setAssignments(assignmentsRes.data.assignments);
        } catch (err) {
            console.error("Failed to load data:", err);
            toast.error("Failed to load courier records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id, hub?.id]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 opacity-50">
            <Activity className="w-8 h-8 animate-spin mb-3 text-slate-400" />
            <span className="text-xs font-black tracking-widest text-slate-500 uppercase">Retrieving Logistic Records...</span>
        </div>
    );

    if (!courier) return (
        <div className="p-20 text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-rose-500" />
            <p className="text-xs font-black tracking-widest text-slate-400 uppercase">Courier Asset Not Found</p>
            <button onClick={() => navigate('/couriers')} className="mt-4 text-[10px] font-black text-emerald-600 hover:underline uppercase">Back to Management</button>
        </div>
    );

    const filteredAssignments = assignments.filter(a => a.status === activeTab);

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* 🏙️ HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
                <div className="space-y-2">
                    <button onClick={() => navigate('/couriers')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
                        <ArrowLeft size={14} /> Back to Courier Fleet
                    </button>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3 uppercase">
                        {courier.name || 'Unknown Asset'}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-tighter border ${courier.status === 'READY' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                            {courier.status || 'OFFLINE'}
                        </span>
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate(`/finance?courierId=${courier.id}`)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-2 shadow-sm transition-all uppercase tracking-widest">
                        <DollarSign size={14} /> View Ledger
                    </button>
                    <button onClick={() => navigate(`/register-courier/${courier.id}`)} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black hover:bg-slate-800 flex items-center justify-center gap-2 shadow-xl shadow-slate-200 transition-all uppercase tracking-widest">
                        <Edit3 size={14} /> Edit Profile
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* ── LEFT: ASSET PROFILE ── */}
                <div className="lg:col-span-4 space-y-6">
                    <section className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-3xl bg-slate-50 p-1 border border-slate-100 shadow-inner overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    {courier.user?.avatar ? (
                                        <img src={courier.user.avatar} className="w-full h-full object-cover rounded-2xl" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <User size={64} />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 rounded-xl shadow-lg border-4 border-white text-white">
                                    <BadgeCheck size={16} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{courier.name}</h3>
                                <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">ID: {courier.id?.slice(0, 8)}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center pt-2">
                                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black tracking-widest text-slate-600 uppercase">
                                    {courier.vehicleType || 'Class-B Agent'}
                                </span>
                                <span className="px-3 py-1 bg-indigo-50 rounded-lg text-[9px] font-black tracking-widest text-indigo-600 uppercase">
                                    {courier.plateNumber || 'No Plate'}
                                </span>
                            </div>
                        </div>
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-slate-50 rounded-full opacity-50 -z-0"></div>
                    </section>

                    <section className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <ClipboardList size={16} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Financial Status</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1">COD Liability</p>
                                <p className="text-lg font-black text-rose-600 tracking-tighter leading-none">KSh {(courier.wallet?.codLiability || 0).toLocaleString()}</p>
                                <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Un-surrendered</p>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <p className="text-[8px] font-black text-emerald-600 tracking-widest uppercase mb-1">Wallet Balance</p>
                                <p className="text-lg font-black text-emerald-700 tracking-tighter leading-none">KSh {(courier.wallet?.availableBalance || 0).toLocaleString()}</p>
                                <p className="text-[8px] font-bold text-emerald-600 mt-2 uppercase">Earnings</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 px-2">
                            <Phone size={16} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Contact Intel</span>
                        </div>
                        <div className="space-y-3">
                            <InfoTile label="Phone" value={courier.phone || courier.user?.phone} icon={Phone} />
                            <InfoTile label="Email" value={courier.email || courier.user?.email} icon={Mail} />
                        </div>
                    </section>
                </div>

                {/* ── RIGHT: ORDER HISTORY ── */}
                <div className="lg:col-span-8 space-y-6">
                    <section className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                        <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-900 text-white rounded-xl">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 tracking-widest uppercase">Order History</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Asset Log Manifest</p>
                                </div>
                            </div>
                            
                            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                {['DELIVERED', 'PENDING', 'ACCEPTED', 'PICKED_UP', 'FAILED'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 rounded-lg text-[9px] font-black tracking-widest transition-all uppercase ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        {tab.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 flex-1">
                            {filteredAssignments.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredAssignments.map((assignment) => {
                                        const order = assignment.order || assignment.orderProduct?.order;
                                        const cashCollection = order?.cashCollection;
                                        
                                        return (
                                            <div key={assignment.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 hover:shadow-xl transition-all group">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                                            <Package size={24} className="text-slate-300" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-xs font-black text-slate-900 tracking-tight uppercase">Order #{order?.trackingNumber || assignment.id.slice(0, 8)}</span>
                                                                <span className="text-[10px] font-bold text-slate-400">•</span>
                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{new Date(assignment.assignedAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <User size={12} className="text-slate-400" />
                                                                    <span className="text-[10px] font-bold text-slate-600 uppercase">{order?.user?.firstName} {order?.user?.lastName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <MapPin size={12} className="text-slate-400" />
                                                                    <span className="text-[10px] font-bold text-slate-600 uppercase truncate max-w-[150px]">{order?.shippingAddress?.address || 'N/A'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        {assignment.status === 'DELIVERED' && (
                                                            <button 
                                                                onClick={() => setShowPODModal(assignment)}
                                                                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black tracking-widest hover:bg-emerald-600 hover:text-white transition-all uppercase"
                                                            >
                                                                <ShieldCheck size={14} /> POD Asset
                                                            </button>
                                                        )}
                                                        {cashCollection && (
                                                            <div className={`px-3 py-2 rounded-lg border flex flex-col items-center ${cashCollection.surrenderedStatus === 'SURRENDERED' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                                                <span className="text-[7px] font-black uppercase tracking-widest">KSh {cashCollection.cashAmount.toLocaleString()}</span>
                                                                <span className="text-[8px] font-black uppercase tracking-tighter">{cashCollection.surrenderedStatus.replace('_', ' ')}</span>
                                                            </div>
                                                        )}
                                                        <Link to={`/orders/${order?.id}`} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                                            <ExternalLink size={18} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 opacity-30 grayscale">
                                    <ClipboardList size={64} className="mb-4" />
                                    <p className="text-xs font-black tracking-[0.2em] uppercase">No Assignments Found</p>
                                    <p className="text-[10px] font-bold mt-2 uppercase">No activity matching the selected status filter.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* ── POD MODAL ── */}
            {showPODModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-8 bg-slate-900 text-white shrink-0">
                            <div>
                                <h3 className="text-lg font-black tracking-tight uppercase">Proof of Delivery Asset</h3>
                                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Order ID: {showPODModal.order?.trackingNumber || showPODModal.id}</p>
                            </div>
                            <button onClick={() => setShowPODModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Delivery Snapshot</p>
                                <div className="aspect-square rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden relative group cursor-pointer shadow-inner">
                                    {showPODModal.proofOfDelivery ? (
                                        <img src={formatImgSrc(showPODModal.proofOfDelivery)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="POD" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <ImageIcon size={48} className="mb-2" />
                                            <span className="text-[8px] font-black tracking-widest uppercase">No Image Captured</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Customer Signature</p>
                                <div className="aspect-square rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden relative group cursor-pointer shadow-inner">
                                    {showPODModal.signature ? (
                                        <img src={formatImgSrc(showPODModal.signature)} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform" alt="Signature" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                            <FileText size={48} className="mb-2" />
                                            <span className="text-[8px] font-black tracking-widest uppercase">No Signature Recorded</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                            <button onClick={() => setShowPODModal(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-slate-800 transition-all shadow-lg">Close Asset</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
