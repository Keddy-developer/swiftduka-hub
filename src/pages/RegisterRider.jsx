import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import uploadToCloudinary from "../utils/uploadToCloudinary";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { 
  ArrowLeft, User, Phone, Mail, IdCard, Truck, Upload, 
  Loader2, Save, X, Camera, Info, ShieldCheck, Zap,
  Navigation, Calendar, Briefcase, Smartphone, Compass,
  Activity, CheckCircle2, Shield, AlertTriangle
} from "lucide-react";

export default function RegisterRider() {
  const { id } = useParams();
  const { hub } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [hubs, setHubs] = useState([]);
  const [form, setForm] = useState({
    name: "", age: "", drivingLicence: "", nationalId: "",
    numberPlate: "", phone: "", email: "", vehicleType: "",
    vehicleModel: "", vehicleColor: "", vehicleImage: null,
    selectedHubId: "" // Stores admin's manually selected hub
  });
  const [existingImage, setExistingImage] = useState(null);

  useEffect(() => {
    // If Admin doesn't have a hub, fetch all hubs so they can assign the rider
    if (!hub?.id) {
      axiosInstance.get('/delivery/hubs')
        .then(res => setHubs(res.data.hubs || []))
        .catch(() => console.error("Could not fetch hubs for admin assignment"));
    }

    if (id && id !== "new") {
      setFetching(true);
      axiosInstance.get(`/riders/${id}`)
        .then((res) => {
          const rider = res.data;
          // Determine the best name to show (handle "undefined undefined" string from previous bugs)
          let displayName = rider.name || "";
          if (!displayName || displayName === "undefined undefined") {
            if (rider.user?.firstName) {
              displayName = `${rider.user.firstName} ${rider.user.lastName || ""}`.trim();
            }
          }

          setForm(prev => ({
            ...prev,
            name: displayName, 
            age: rider.age?.toString() || "",
            drivingLicence: rider.drivingLicence || "", 
            nationalId: rider.nationalId || "",
            numberPlate: rider.numberPlate || "", 
            phone: rider.phone || rider.user?.phone || "",
            email: rider.email || rider.user?.email || "", 
            vehicleType: rider.vehicleType || "",
            vehicleModel: rider.vehicleModel || "", 
            vehicleColor: rider.vehicleColor || "",
            vehicleImage: null,
            selectedHubId: rider.fulfillmentHubId || ""
          }));
          setExistingImage(rider.vehicleImage || null);
        })
        .catch(err => {
          toast.error("Manifest retrieval failure");
          navigate("/fleet");
        })
        .finally(() => setFetching(false));
    }
  }, [id, navigate, hub?.id]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "vehicleImage") setForm({ ...form, vehicleImage: files[0] });
    else setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetHubId = hub?.id || form.selectedHubId;
    
    if (!targetHubId) return toast.error("Deployment Hub is required.");
    setLoading(true);

    try {
      let uploadedImageUrl = existingImage;
      if (form.vehicleImage) {
        const uploadResult = await uploadToCloudinary(form.vehicleImage);
        uploadedImageUrl = uploadResult.imageUrl;
      }

      const payload = {
        ...form,
        age: parseInt(form.age, 10),
        vehicleImage: uploadedImageUrl || existingImage,
        fulfillmentHubId: targetHubId 
      };

      if (id && id !== "new") {
         // Fix the endpoint to match backend if necessary, but keep original pattern if it works
        await axiosInstance.put(`/delivery/hubs/${targetHubId}/riders/${id}`, payload);
        toast.success("Personnel dossier serialized");
      } else {
        await axiosInstance.post(`/delivery/hubs/${targetHubId}/riders`, payload);
        toast.success("Agent activation successful");
      }
      navigate("/fleet");
    } catch (error) {
      toast.error("Security credential failure");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex flex-col items-center justify-center p-20 opacity-50">
      <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-400" />
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Retrieving Agent Credentials...</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-20">
      {/* 🏙️ ACTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
        <div>
          <button onClick={() => navigate('/fleet')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors mb-4 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Fleet Registry
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            {id && id !== "new" ? 'Personnel Data Modification' : 'Field Agent Deployment'}
          </h1>
          <div className="flex items-center gap-3 mt-1">
             <p className="text-[10px] md:text-[11px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                <Navigation size={14} className="text-blue-600 mb-0.5" />
                Target Node: {hub?.name || 'Central Hub'}
             </p>
             <div className="w-1 h-1 rounded-full bg-slate-300" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Status: Vetting Pipeline</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT: PERSONNEL & ASSET ── */}
        <div className="lg:col-span-8 space-y-8">
           {/* SECTION 1: IDENTITY */}
           <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden group">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <User size={18} className="text-slate-400" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Personnel Legal Identity</h3>
                 </div>
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-200" />
              </div>
              
              <div className="p-6 md:p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <InputUnit label="Full Legal Identity" name="name" value={form.name} onChange={handleChange} required icon={User} />
                     <InputUnit label="Personnel Age (Years)" name="age" type="number" min={18} value={form.age} onChange={handleChange} required icon={Calendar} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <InputUnit label="DL Authority Identifier" name="drivingLicence" value={form.drivingLicence} onChange={handleChange} required icon={ShieldCheck} uppercase />
                     <InputUnit label="National ID Cipher" name="nationalId" value={form.nationalId} onChange={handleChange} required icon={IdCard} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <InputUnit label="Encrypted Comm (Phone)" name="phone" value={form.phone} onChange={handleChange} required icon={Smartphone} />
                     <InputUnit label="Digital Email Identity" name="email" type="email" value={form.email} onChange={handleChange} required icon={Mail} />
                  </div>

                  {!hub?.id && (
                     <div className="grid grid-cols-1 gap-8 pt-4 border-t border-slate-100">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <AlertTriangle size={12} className="opacity-70" />
                              Global Setup: Select Logistics Hub Node
                           </label>
                           <select name="selectedHubId" value={form.selectedHubId} onChange={handleChange} required
                              className="w-full bg-rose-50 border border-rose-200 text-rose-900 rounded-xl px-4 py-3.5 text-xs font-black outline-none focus:border-rose-900 focus:bg-white shadow-sm transition-all">
                              <option value="">-- ASSIGN TARGET HUB --</option>
                              {hubs.map(h => (
                                 <option key={h.id} value={h.id}>{h.name} ({h.town})</option>
                              ))}
                           </select>
                        </div>
                     </div>
                  )}
              </div>
           </section>

           {/* SECTION 2: ASSET PARAMETERS */}
           <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden group">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                 <Truck size={18} className="text-slate-400" />
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Logistics Asset Parameters</h3>
              </div>
              <div className="p-6 md:p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                           <Compass size={12} /> Asset Class
                        </label>
                        <select name="vehicleType" value={form.vehicleType} onChange={handleChange} required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-black outline-none focus:border-slate-900 focus:bg-white shadow-sm transition-all uppercase">
                           <option value="">SELECT</option>
                           <option value="Motorbike">Motorbike (Elite)</option>
                           <option value="Bicycle">Bicycle (Eco)</option>
                           <option value="Car">Sedan (Urban)</option>
                           <option value="Van">Van (Consolidated)</option>
                        </select>
                     </div>
                     <InputUnit label="Federal Number Plate" name="numberPlate" value={form.numberPlate} onChange={handleChange} required icon={IdCard} uppercase />
                     <InputUnit label="Strategic Asset Model" name="vehicleModel" value={form.vehicleModel} onChange={handleChange} required icon={Briefcase} />
                  </div>
                  <InputUnit label="Asset Visual Identity (Color)" name="vehicleColor" value={form.vehicleColor} onChange={handleChange} required icon={Camera} />
              </div>
           </section>
        </div>

        {/* ── RIGHT: MEDIA & AUTHORIZATION ── */}
        <div className="lg:col-span-4 space-y-8">
           {/* ASSET VISUAL DOCUMENTATION */}
           <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden group shadow-xl shadow-slate-200/20">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                 <Camera size={18} className="text-slate-400" />
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Visual Asset Certification</h3>
              </div>
              <div className="p-6 space-y-6">
                 <label className="cursor-pointer group block">
                    <div className="border-4 border-dashed border-slate-100 rounded-2xl p-2 text-center hover:border-slate-300 transition-all bg-slate-50 group-hover:bg-white relative overflow-hidden aspect-video flex flex-col items-center justify-center shadow-inner">
                       {form.vehicleImage || existingImage ? (
                          <img 
                            src={form.vehicleImage ? URL.createObjectURL(form.vehicleImage) : existingImage} 
                            className="absolute inset-0 w-full h-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-110" 
                            alt="Asset Preview"
                          />
                       ) : (
                          <div className="space-y-3 opacity-20 group-hover:opacity-100 transition-all transform group-hover:scale-110 duration-500">
                             <Upload size={48} className="mx-auto text-slate-900" />
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Upload Asset Telemetry Photo</p>
                          </div>
                       )}
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <p className="text-xs font-black text-white uppercase tracking-widest">Update Asset Media</p>
                       </div>
                       <input type="file" name="vehicleImage" className="hidden" accept="image/*" onChange={handleChange} />
                    </div>
                 </label>
                 <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                       <ShieldCheck className="w-5 h-5 text-blue-400" />
                       <h5 className="text-[10px] font-black uppercase tracking-widest underline decoration-blue-500 underline-offset-4">Security Protocol</h5>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-black uppercase opacity-80 relative z-10 italic">
                      Verify all operational credentials before commitment. This dossier is immutable and audited by the regional logistics board.
                    </p>
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
                 </div>
              </div>
           </section>

           {/* OPERATIONAL KPI TIP */}
           <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
             <Activity className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
             <div className="space-y-1">
               <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest leading-none">Node Sync Notice</p>
               <p className="text-[10px] text-blue-700 font-bold leading-relaxed uppercase tracking-tight italic opacity-70">New agents are synchronized across the regional mesh network within 5 operational minutes.</p>
             </div>
           </div>

           <div className="pt-2 sticky bottom-6 z-20">
              <button type="submit" disabled={loading}
                 className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.25em] hover:bg-slate-800 transition-all shadow-2xl shadow-slate-300 disabled:bg-slate-200 group flex items-center justify-center gap-3">
                 {loading ? <Loader2 size={20} className="animate-spin" /> : (id && id !== "new" ? "SERIALIZE PERSONNEL DATA" : "AUTHORIZE FIELD AGENT")}
                 {!loading && <Zap size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-blue-400 fill-blue-400" />}
              </button>
           </div>
        </div>
      </form>
    </div>
  );
}

/* --- Visual Input Component --- */
const InputUnit = ({ label, icon: Icon, textarea, fullWidth, uppercase, ...props }) => (
  <div className={`space-y-2 ${fullWidth ? 'md:col-span-2' : ''}`}>
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
      {Icon && <Icon size={12} className="opacity-70" />}
      {label}
    </label>
    {textarea ? (
      <textarea {...props} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/5 shadow-sm transition-all resize-none h-24" />
    ) : (
      <input {...props} className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-xs font-black outline-none focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/5 shadow-sm transition-all ${uppercase ? 'uppercase select-all' : ''}`} />
    )}
  </div>
);
