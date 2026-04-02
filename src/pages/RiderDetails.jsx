import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../services/axiosConfig';
import { ArrowLeft, User, Truck, ShieldCheck, Navigation, Phone, Mail, Activity, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const RiderDetails = () => {
    const { id } = useParams();
    const [rider, setRider] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchRider = async () => {
        try {
            const { data } = await axiosInstance.get(`/logistics/riders/${id}`);
            if (data.success) {
                setRider(data.rider);
            }
        } catch (err) {
            toast.error("Failed to load rider details");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRider();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center py-20 text-slate-400">
            <Activity className="w-8 h-8 animate-spin" />
        </div>
    );

    if (!rider) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-slate-700">Rider record not found</h2>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-6 mb-6">
                <Link to="/fleet" className="p-2 hover:bg-slate-100 rounded transition-colors text-slate-500">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                   <h1 className="text-3xl font-black text-slate-900 tracking-tight">Rider Dossier: {rider.user.firstName} {rider.user.lastName}</h1>
                   <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${rider.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {rider.isActive ? 'Active Status' : 'Offline'} • Joined {new Date(rider.createdAt).toLocaleDateString()}
                      </span>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ID Card */}
                <div className="workbench-card flex flex-col items-center justify-center p-8 text-center bg-slate-800 text-white border-0 shadow-lg relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-3 opacity-20">
                       <ShieldCheck className="w-24 h-24" />
                   </div>
                   <div className="w-24 h-24 bg-white/10 rounded-full p-2 mb-4 relative z-10 backdrop-blur-sm border border-white/20">
                       <img src={rider.user.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop'} className="w-full h-full object-cover rounded-full" />
                   </div>
                   <h2 className="text-2xl font-bold relative z-10">{rider.user.firstName} {rider.user.lastName}</h2>
                   <p className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-1 mb-6 relative z-10">Hub Transportation</p>
                   
                   <div className="w-full bg-slate-900/50 p-4 rounded text-left relative z-10 border border-slate-700">
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase">Plate No.</span>
                          <span className="font-mono text-emerald-400 font-bold">{rider.licensePlate || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-2">
                          <span className="text-slate-400 font-bold uppercase">Vehicle</span>
                          <span className="font-bold text-white">{rider.vehicleType || 'Motorbike'}</span>
                      </div>
                   </div>
                </div>

                {/* Operations Info */}
                <div className="workbench-card md:col-span-2 space-y-6">
                   <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">Contact & Routing Information</h3>
                   
                   <div className="grid grid-cols-2 gap-6">
                       <div className="flex items-start gap-4 p-4 bg-slate-50 rounded border border-slate-100/50">
                           <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                           <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile Contact</p>
                                <p className="font-bold text-slate-800">{rider.user.phone || 'No phone recorded'}</p>
                           </div>
                       </div>
                       
                       <div className="flex items-start gap-4 p-4 bg-slate-50 rounded border border-slate-100/50">
                           <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                           <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                                <p className="font-bold text-slate-800 truncate">{rider.user.email}</p>
                           </div>
                       </div>

                       <div className="flex items-start gap-4 p-4 bg-slate-50 rounded border border-slate-100/50">
                           <Navigation className="w-5 h-5 text-slate-400 shrink-0" />
                           <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Operation Zone</p>
                                <p className="font-bold text-slate-800">{rider.fulfillmentHub?.town || rider.coverageArea || 'General Area'}</p>
                           </div>
                       </div>

                       <div className="flex items-start gap-4 p-4 bg-slate-50 rounded border border-slate-100/50">
                           <Truck className="w-5 h-5 text-slate-400 shrink-0" />
                           <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Record</p>
                                <p className="font-bold text-slate-800">Database ID: {rider.id.slice(-8)}</p>
                           </div>
                       </div>
                   </div>

                   <div className="mt-8">
                       <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3 mb-4">Account Action</h3>
                       <div className="flex gap-3">
                           <button className="alibaba-btn bg-rose-600 hover:bg-rose-700">Suspend Access</button>
                           <button className="alibaba-btn bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-none">Request Document Review</button>
                       </div>
                   </div>
                </div>
            </div>
        </div>
    );
};

export default RiderDetails;
