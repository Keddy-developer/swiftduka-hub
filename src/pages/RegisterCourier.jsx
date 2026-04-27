import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowLeft, User, Phone, Mail, IdCard, Truck, 
  Loader2, Save, X, Camera, Info, ShieldCheck, Zap,
  Navigation, Smartphone, Shield, AlertTriangle,
  Lock, Key
} from "lucide-react";

export default function RegisterCourier() {
  const { id } = useParams();
  const { hub } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    vehicleType: "",
    plateNumber: "",
    status: "OFFLINE"
  });

  useEffect(() => {
    if (id && id !== "new") {
      setFetching(true);
      axiosInstance.get(`/delivery/hubs/${hub?.id}/couriers`)
        .then((res) => {
          const courierList = res.data?.couriers || [];
          const courier = courierList.find(c => c.id === id);
          if (courier) {
            setForm({
              name: courier.name || "",
              email: courier.email || courier.user?.email || "",
              phone: courier.phone || courier.user?.phone || "",
              password: "", // Don't show password
              vehicleType: courier.vehicleType || "",
              plateNumber: courier.plateNumber || "",
              status: courier.status || "OFFLINE"
            });
          } else {
            toast.error("Courier not found in this hub");
            navigate("/couriers");
          }
        })
        .catch(err => {
          toast.error("Telemetry failure: Could not retrieve asset data");
          navigate("/couriers");
        })
        .finally(() => setFetching(false));
    }
  }, [id, hub?.id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hub?.id) return toast.error("Deployment Hub is required.");
    setLoading(true);

    try {
      if (id && id !== "new") {
        await axiosInstance.put(`/delivery/hubs/${hub.id}/couriers/${id}`, form);
        toast.success("Courier asset configuration updated");
      } else {
        await axiosInstance.post(`/delivery/hubs/${hub.id}/couriers`, form);
        toast.success("New courier asset onboarded successfully");
      }
      navigate("/couriers");
    } catch (error) {
      toast.error(error.response?.data?.message || "Courier authorization failed");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex flex-col items-center justify-center p-20 opacity-50">
      <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-400" />
      <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Retrieving Asset Dossier...</span>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-20">
      {/* 🏙️ ACTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
        <div>
          <button onClick={() => navigate('/couriers')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-widest hover:text-slate-900 transition-colors mb-4 group uppercase">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Courier Registry
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
            {id && id !== "new" ? 'Courier Asset Modification' : 'Specialized Courier Onboarding'}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[10px] md:text-[11px] text-slate-500 font-black tracking-widest flex items-center gap-2 uppercase">
              <Navigation size={14} className="text-emerald-600 mb-0.5" />
              Deployment Hub: {hub?.name || 'Central Hub'}
            </p>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[10px] font-black text-slate-400 tracking-tighter uppercase">Status: Authorization Pipeline</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── MAIN CONFIGURATION ── */}
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden group">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User size={18} className="text-slate-400" />
                <h3 className="text-xs font-black text-slate-900 tracking-widest uppercase">Courier Personal Identity</h3>
              </div>
              <Shield size={16} className="text-emerald-500 opacity-50" />
            </div>

            <div className="p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputUnit label="Full Legal Name" name="name" value={form.name} onChange={handleChange} required icon={User} placeholder="e.g. John Doe" />
                <InputUnit label="Authorized Phone" name="phone" value={form.phone} onChange={handleChange} required icon={Smartphone} placeholder="+254..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputUnit label="Digital Identity (Email)" name="email" type="email" value={form.email} onChange={handleChange} required icon={Mail} placeholder="courier@ikosoko.com" />
                {(!id || id === "new") && (
                  <InputUnit label="Access Password" name="password" type="password" value={form.password} onChange={handleChange} required icon={Lock} placeholder="••••••••" />
                )}
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden group">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
              <Truck size={18} className="text-slate-400" />
              <h3 className="text-xs font-black text-slate-900 tracking-widest uppercase">Asset Parameters</h3>
            </div>
            <div className="p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 flex items-center gap-2 uppercase">
                    <Truck size={12} /> Vehicle Class
                  </label>
                  <select name="vehicleType" value={form.vehicleType} onChange={handleChange} required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-black outline-none focus:border-emerald-500 focus:bg-white shadow-sm transition-all uppercase">
                    <option value="">SELECT CLASS</option>
                    <option value="Motorbike">Motorbike</option>
                    <option value="TukTuk">TukTuk</option>
                    <option value="Van">Small Van</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
                <InputUnit label="Plate Vector (Number Plate)" name="plateNumber" value={form.plateNumber} onChange={handleChange} required icon={IdCard} placeholder="KAA 000A" />
              </div>
            </div>
          </section>
        </div>

        {/* ── SECURITY & AUTHORIZATION ── */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
             <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                   <Key size={24} className="text-emerald-400" />
                </div>
                <div>
                   <h4 className="text-lg font-black tracking-tight uppercase leading-tight mb-2">Access Credentials</h4>
                   <p className="text-[10px] text-slate-400 leading-relaxed font-black opacity-80 uppercase italic">
                      Couriers use their phone/email and the password set here to access the specialized SwiftDuka Courier mobile application.
                   </p>
                </div>
                <div className="pt-4 border-t border-white/10">
                   <div className="flex items-center gap-3 text-emerald-400">
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-black tracking-widest uppercase">Encrypted Transmission</span>
                   </div>
                </div>
             </div>
             <Zap size={120} className="absolute -bottom-10 -right-10 text-white/5 group-hover:scale-110 transition-transform duration-700" />
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-[32px] p-6 flex gap-4 items-start">
            <Info className="w-6 h-6 text-emerald-600 shrink-0 mt-1" />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-emerald-900 tracking-widest leading-none uppercase">Asset Synchronization</p>
              <p className="text-[10px] text-emerald-700 font-bold leading-relaxed tracking-tight italic opacity-70 uppercase">
                Once onboarded, the courier will be immediately visible in the Logistics Workbench for task assignment.
              </p>
            </div>
          </div>

          <div className="pt-2 sticky bottom-6 z-20">
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-[20px] text-xs font-black tracking-[0.25em] hover:bg-emerald-600 transition-all shadow-2xl shadow-slate-300 disabled:bg-slate-200 group flex items-center justify-center gap-3 uppercase">
              {loading ? <Loader2 size={20} className="animate-spin" /> : (id && id !== "new" ? "UPDATE ASSET DOSSIER" : "AUTHORIZE COURIER")}
              {!loading && <Zap size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-emerald-400 fill-emerald-400" />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* --- Visual Input Component --- */
const InputUnit = ({ label, icon: Icon, textarea, fullWidth, ...props }) => (
  <div className={`space-y-2 ${fullWidth ? 'md:col-span-2' : ''}`}>
    <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1 flex items-center gap-2 uppercase">
      {Icon && <Icon size={12} className="opacity-70" />}
      {label}
    </label>
    {textarea ? (
      <textarea {...props} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/5 shadow-sm transition-all resize-none h-24 uppercase placeholder:lowercase" />
    ) : (
      <input {...props} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-black outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/5 shadow-sm transition-all uppercase placeholder:lowercase`} />
    )}
  </div>
);
