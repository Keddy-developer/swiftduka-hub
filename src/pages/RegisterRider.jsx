import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import uploadToCloudinary from "../utils/uploadToCloudinary";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { 
  ArrowLeft, User, Phone, Mail, IdCard, Truck, Upload, 
  Loader2, Save, X, Camera, Info, ShieldCheck
} from "lucide-react";

export default function RegisterRider() {
  const { id } = useParams();
  const { hub } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [form, setForm] = useState({
    name: "", age: "", drivingLicence: "", nationalId: "",
    numberPlate: "", phone: "", email: "", vehicleType: "",
    vehicleModel: "", vehicleColor: "", vehicleImage: null,
  });
  const [existingImage, setExistingImage] = useState(null);

  useEffect(() => {
    if (id && id !== "new") {
      setFetching(true);
      axiosInstance.get(`/delivery/riders/${id}`)
        .then((res) => {
          const rider = res.data;
          setForm({
            name: rider.name || "", age: rider.age?.toString() || "",
            drivingLicence: rider.drivingLicence || "", nationalId: rider.nationalId || "",
            numberPlate: rider.numberPlate || "", phone: rider.phone || "",
            email: rider.email || "", vehicleType: rider.vehicleType || "",
            vehicleModel: rider.vehicleModel || "", vehicleColor: rider.vehicleColor || "",
            vehicleImage: null,
          });
          setExistingImage(rider.vehicleImage || null);
        })
        .catch(err => {
          toast.error("Manifest retrieval failure");
          navigate("/fleet");
        })
        .finally(() => setFetching(false));
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "vehicleImage") setForm({ ...form, vehicleImage: files[0] });
    else setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hub?.id) return toast.error("Hub session expired");
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
        fulfillmentHubId: hub.id 
      };

      if (id && id !== "new") {
        await axiosInstance.put(`/delivery/hubs/${hub.id}/riders/${id}`, payload);
        toast.success("Rider dossier updated");
      } else {
        await axiosInstance.post(`/delivery/hubs/${hub.id}/riders`, payload);
        toast.success("Rider registered");
      }
      navigate("/fleet");
    } catch (error) {
      toast.error("Registration failure");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-8 text-slate-400 font-medium italic text-sm text-center">Retrieving agent credentials...</div>;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 🏙️ HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <button onClick={() => navigate('/fleet')} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-900 transition-colors">
            <ArrowLeft size={14} /> Back to Fleet
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tighter uppercase whitespace-nowrap">
            {id && id !== "new" ? 'Modify Personnel' : 'Onboard Agent'}
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* ── LEFT: PERSONNEL INFO ── */}
        <div className="lg:col-span-7 space-y-6">
           <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                 <User size={14} className="text-slate-400" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Personnel Identity</span>
              </div>
              
              <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Legal Name</label>
                        <input type="text" name="name" value={form.name} onChange={handleChange} required
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Personnel Age</label>
                        <input type="number" name="age" value={form.age} onChange={handleChange} required min={18}
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">DL Number</label>
                        <input type="text" name="drivingLicence" value={form.drivingLicence} onChange={handleChange} required
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm uppercase" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">National ID</label>
                        <input type="text" name="nationalId" value={form.nationalId} onChange={handleChange} required
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Signal Phone</label>
                        <input type="text" name="phone" value={form.phone} onChange={handleChange} required
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Email Authority</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange} required
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                     </div>
                  </div>
              </div>
           </section>

           <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                 <Truck size={14} className="text-slate-400" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asset Parameters</span>
              </div>
              <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Vehicle Type</label>
                        <select name="vehicleType" value={form.vehicleType} onChange={handleChange} required
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm uppercase">
                           <option value="">SELECT</option>
                           <option value="Motorbike">Motorbike</option>
                           <option value="Bicycle">Bicycle</option>
                           <option value="Car">Car</option>
                           <option value="Van">Van</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Number Plate</label>
                        <input type="text" name="numberPlate" value={form.numberPlate} onChange={handleChange} required
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm uppercase" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Asset Model</label>
                        <input type="text" name="vehicleModel" value={form.vehicleModel} onChange={handleChange} required
                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Asset Visual Color</label>
                     <input type="text" name="vehicleColor" value={form.vehicleColor} onChange={handleChange} required
                       className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                  </div>
              </div>
           </section>
        </div>

        {/* ── RIGHT: MEDIA & SUBMIT ── */}
        <div className="lg:col-span-5 space-y-6">
           <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                 <Camera size={14} className="text-slate-400" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Asset Documentation</span>
              </div>
              <div className="p-5">
                 <label className="cursor-pointer group">
                    <div className="border-2 border-dashed border-slate-200 rounded p-6 text-center hover:border-slate-900 transition-all bg-slate-50 group-hover:bg-white relative overflow-hidden aspect-video flex flex-col items-center justify-center">
                       {form.vehicleImage || existingImage ? (
                          <img src={form.vehicleImage ? URL.createObjectURL(form.vehicleImage) : existingImage} className="absolute inset-0 w-full h-full object-cover" />
                       ) : (
                          <div className="space-y-2 opacity-30 group-hover:opacity-100 transition-all">
                             <Upload size={32} className="mx-auto" />
                             <p className="text-[10px] font-bold uppercase tracking-widest">Upload Asset Photo</p>
                          </div>
                       )}
                       <input type="file" name="vehicleImage" className="hidden" accept="image/*" onChange={handleChange} />
                    </div>
                 </label>
                 <div className="mt-4 p-4 bg-slate-900 text-white rounded shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                       <ShieldCheck size={14} className="text-slate-400" />
                       <h5 className="text-[10px] font-black uppercase tracking-tight">Onboarding Protocol</h5>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase opacity-80">Ensure all documents are legible. Data is synced directly to the hub dispatch infrastructure upon submission.</p>
                 </div>
              </div>
           </section>

           <div className="pt-2">
              <button type="submit" disabled={loading}
                 className="w-full py-3.5 bg-slate-900 text-white rounded text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:bg-slate-300">
                 {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (id && id !== "new" ? "COMMIT UPDATES" : "FINALIZE ONBOARDING")}
              </button>
           </div>
        </div>
      </form>
    </div>
  );
}
