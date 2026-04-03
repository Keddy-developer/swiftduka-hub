import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import uploadToCloudinary from "../utils/uploadToCloudinary";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, User, Phone, Mail, IdCard, Truck, Upload, Loader2, Save } from "lucide-react";

export default function RegisterRider() {
  const { id } = useParams(); // if id exists → edit mode
  const { hub } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    drivingLicence: "",
    nationalId: "",
    numberPlate: "",
    phone: "",
    email: "",
    vehicleType: "",
    vehicleModel: "",
    vehicleColor: "",
    vehicleImage: null,
  });
  const [existingImage, setExistingImage] = useState(null);

  // 🔄 Fetch existing rider if editing
  useEffect(() => {
    if (id && id !== "new") {
      setFetching(true);
      axiosInstance.get(`/delivery/riders/${id}`)
        .then((res) => {
          const rider = res.data;
          setForm({
            name: rider.name || "",
            age: rider.age?.toString() || "",
            drivingLicence: rider.drivingLicence || "",
            nationalId: rider.nationalId || "",
            numberPlate: rider.numberPlate || "",
            phone: rider.phone || "",
            email: rider.email || "",
            vehicleType: rider.vehicleType || "",
            vehicleModel: rider.vehicleModel || "",
            vehicleColor: rider.vehicleColor || "",
            vehicleImage: null,
          });
          setExistingImage(rider.vehicleImage || null);
        })
        .catch(err => {
          console.error("Failed to fetch rider:", err);
          toast.error("Rider not found.");
          navigate("/fleet");
        })
        .finally(() => setFetching(false));
    }
  }, [id, navigate]);

  // 📌 Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "vehicleImage") {
      setForm({ ...form, vehicleImage: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // 📌 Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hub?.id) {
      toast.error("Hub session lost. Please login again.");
      return;
    }
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
        fulfillmentHubId: hub.id // Automatically link to current hub
      };

      if (id && id !== "new") {
        // 🔄 Update
        await axiosInstance.put(`/delivery/hubs/${hub.id}/riders/${id}`, payload);
        toast.success("Rider updated successfully!");
      } else {
        // ➕ Create
        await axiosInstance.post(`/delivery/hubs/${hub.id}/riders`, payload);
        toast.success("Rider registered successfully!");
      }
      navigate("/fleet");
    } catch (error) {
      toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to submit rider. Please try again.");
      console.error("❌ Failed to submit rider:", error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold uppercase tracking-widest text-xs">Back to Fleet</span>
        </button>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-900 px-8 py-10 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
                {id && id !== "new" ? "Modify Personnel" : "Onboard New Rider"}
              </h1>
              <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">
                {id && id !== "new" ? "Update existing credentials" : "Registration for logistics & delivery services"}
              </p>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Truck className="w-32 h-32 rotate-12" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">
            {/* 👤 Section 1: Identity */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="text-primary w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Identity Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup icon={User} label="Full Official Name" name="name" value={form.name} onChange={handleChange} placeholder="e.g. John Doe" required />
                <InputGroup icon={IdCard} label="Age" type="number" name="age" value={form.age} onChange={handleChange} placeholder="25" min={18} max={65} required />
                <InputGroup icon={IdCard} label="Driving Licence No." name="drivingLicence" value={form.drivingLicence} onChange={handleChange} placeholder="DL-XXXX" required />
                <InputGroup icon={IdCard} label="National ID Number" name="nationalId" value={form.nationalId} onChange={handleChange} placeholder="35XXXXXX" required />
              </div>
            </section>

            {/* 📞 Section 2: Communication */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Phone className="text-primary w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Communication</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup icon={Phone} label="Primary Phone Number" name="phone" value={form.phone} onChange={handleChange} placeholder="+254 7XX..." required />
                <InputGroup icon={Mail} label="Email Address" type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" required />
              </div>
            </section>

            {/* 🏍️ Section 3: Asset Details */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Truck className="text-primary w-5 h-5" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Logistics Asset</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Vehicle Type</label>
                  <div className="relative group">
                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <select
                      name="vehicleType"
                      value={form.vehicleType}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold appearance-none"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Motorbike">Motorbike</option>
                      <option value="Bicycle">Bicycle</option>
                      <option value="Car">Car</option>
                      <option value="Van">Van</option>
                      <option value="Pickup">Pickup</option>
                    </select>
                  </div>
                </div>
                <InputGroup icon={Truck} label="Number Plate" name="numberPlate" value={form.numberPlate} onChange={handleChange} placeholder="KAA XXXX" required />
                <InputGroup icon={Truck} label="Asset Model" name="vehicleModel" value={form.vehicleModel} onChange={handleChange} placeholder="TVS/Boxer" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <InputGroup icon={Truck} label="Asset Color" name="vehicleColor" value={form.vehicleColor} onChange={handleChange} placeholder="Red/Black" required />
                 
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Asset Verification Photo</label>
                   <div className="relative">
                      <label className={`w-full flex flex-col items-center justify-center px-4 py-8 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all ${form.vehicleImage ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200 hover:border-primary hover:bg-primary/5'}`}>
                        {form.vehicleImage || existingImage ? (
                          <div className="relative w-full aspect-video rounded-2xl overflow-hidden group">
                            <img 
                              src={form.vehicleImage ? URL.createObjectURL(form.vehicleImage) : existingImage} 
                              alt="Vehicle Preview" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="text-white w-8 h-8" />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <Upload className="w-8 h-8 text-slate-300 mb-2" />
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Click to upload photo</p>
                            <p className="text-[10px] text-slate-400 font-medium">PNG, JPG or JPEG (Max 5MB)</p>
                          </div>
                        )}
                        <input type="file" name="vehicleImage" className="hidden" accept="image/*" onChange={handleChange} />
                      </label>
                   </div>
                 </div>
              </div>
            </section>

            {/* 🏁 Action */}
            <div className="pt-8 border-t border-slate-100 flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-slate-200 disabled:shadow-none"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {id && id !== "new" ? "Confirm Updates" : "Finalize Registration"}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

// 🧱 Reusable Component
function InputGroup({ icon: Icon, label, name, value, onChange, placeholder, type = "text", required = false, min, max }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors">
          <Icon className="w-4 h-4 text-slate-400 group-focus-within:text-primary" />
        </div>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold placeholder:text-slate-300"
        />
      </div>
    </div>
  );
}
