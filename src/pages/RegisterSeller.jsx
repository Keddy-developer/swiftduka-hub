import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import { toast } from "react-toastify";
import {
    Store, User, Mail, Phone, MapPin, ArrowLeft,
    ShieldCheck, CreditCard, Building, Globe,
    CheckCircle2, Truck, Camera, Info, Edit, FileText, X, Loader2,
    Briefcase, Landmark, Zap, Shield, Navigation, Share2, ClipboardList
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterSeller() {
    const { hub } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("edit");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [locations, setLocations] = useState([]);

    const [form, setForm] = useState({
        userIdentifier: "", seller_type: "individual", storeName: "",
        phone: "", address: "", city: "", county: "", country: "Kenya",
        businessType: "", paymentMethod: "MPESA", kraPin: "",
        businessRegistrationNumber: "", mpesaNumber: "", mpesaName: "",
        bankName: "", accountNumber: "", accountHolderName: "",
        storeDescription: "", fulfillmentHubId: hub?.id || "",
    });

    useEffect(() => {
        if (hub?.id && !form.fulfillmentHubId) {
            setForm(prev => ({ ...prev, fulfillmentHubId: hub.id }));
        }
    }, [hub, form.fulfillmentHubId]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await axiosInstance.get("/location/all");
                const data = res.data.data || res.data || [];
                setLocations(Array.isArray(data) ? [...data].sort((a, b) => a.name.localeCompare(b.name)) : []);
            } catch (error) { }
        };

        const fetchSellerForEdit = async () => {
            if (!editId) return;
            try {
                setFetching(true);
                const res = await axiosInstance.get(`/seller/${editId}`);
                const s = res.data.data || res.data;
                setForm({
                    userIdentifier: s.email, email: s.email || "",
                    seller_type: s.seller_type || "individual", storeName: s.storeName || "",
                    phone: s.phone || "", address: s.address || "",
                    city: s.city || "", county: s.county || "",
                    country: s.country || "Kenya", businessType: s.businessType || "",
                    paymentMethod: s.paymentMethod || "MPESA", kraPin: s.kraPin || "",
                    businessRegistrationNumber: s.businessRegistrationNumber || "",
                    mpesaNumber: s.mpesaNumber || "", mpesaName: s.mpesaName || "",
                    bankName: s.bankName || "", accountNumber: s.accountNumber || "",
                    accountHolderName: s.accountHolderName || "", storeDescription: s.storeDescription || "",
                    fulfillmentHubId: s.fulfillmentHubId || hub?.id || "",
                });
            } catch (error) {
                toast.error("Manifest retrieval failure");
            } finally {
                setFetching(false);
            }
        };

        fetchLocations();
        fetchSellerForEdit();
    }, [editId, hub?.id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { userIdentifier: form.userIdentifier, profile: { ...form, agreeToTerms: true } };
            if (editId) {
                await axiosInstance.patch(`/seller/${editId}/update`, payload);
                toast.success("Merchant dossier serialized");
            } else {
                await axiosInstance.post('/seller/become-a-seller', payload);
                toast.success("Merchant node activated");
            }
            navigate("/sellers");
        } catch (error) {
            toast.error("Activation protocol failure");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="flex flex-col items-center justify-center p-20 opacity-50">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-400" />
            <span className="text-xs font-bold  tracking-widest text-slate-500">Retrieving Merchant Identity...</span>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-20">
            {/* 🏙️ ACTION HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
                <div>
                    <button onClick={() => navigate('/sellers')} className="flex items-center gap-2 text-[10px] font-black text-slate-400  tracking-widest hover:text-slate-900 transition-colors mb-4 group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Partner Directory
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                        {editId ? 'Merchant Modification Center' : 'Global Merchant Onboarding'}
                    </h1>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] md:text-[11px] text-slate-500 font-black  tracking-widest flex items-center gap-2">
                            <Navigation size={14} className="text-blue-600 mb-0.5" />
                            Target Hub: {hub?.name || 'Central Distribution'}
                        </p>
                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-[10px] font-black text-slate-400  tracking-tighter">Status: Security Screening</span>
                    </div>
                </div>
                <div className="hidden md:flex gap-4">
                    <div className="flex flex-col items-end">
                        <p className="text-[9px] font-black text-slate-400  tracking-widest">Onboarding Progress</p>
                        <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4].map(i => <div key={i} className={`h-1 w-8 rounded-full ${i <= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />)}
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* ── LEFT: MERCHANT DOSSIER ── */}
                <div className="lg:col-span-8 space-y-6 md:space-y-8">
                    {/* SECTION 1: IDENTITY & STORE */}
                    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden group">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                            <Store size={18} className="text-slate-400" />
                            <h3 className="text-xs font-black text-slate-900  tracking-widest">Merchant Identity & Brand Profile</h3>
                        </div>
                        <div className="p-6 md:p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <InputUnit label="Account Email Identity" name="userIdentifier" type="email" value={form.userIdentifier}
                                    onChange={handleChange} required disabled={!!editId} icon={Mail} />
                                <InputUnit label="Official Store Label" name="storeName" value={form.storeName}
                                    onChange={handleChange} required icon={Briefcase} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <InputUnit label="Operational Contact Signal" name="phone" value={form.phone}
                                    onChange={handleChange} required icon={Phone} />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1 flex items-center gap-2">
                                        <Zap size={12} /> Merchant Entity Class
                                    </label>
                                    <select name="seller_type" value={form.seller_type} onChange={handleChange} required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-slate-900 focus:bg-white shadow-sm transition-all ">
                                        <option value="individual">Individual Professional</option>
                                        <option value="business">Registered Corporate Body</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2: LOGISTICS CENTER */}
                    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden group">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                            <MapPin size={18} className="text-slate-400" />
                            <h3 className="text-xs font-black text-slate-900  tracking-widest">Logistics Operational Center</h3>
                        </div>
                        <div className="p-6 md:p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1">Regional Strategic County</label>
                                    <select name="county" value={form.county} onChange={e => setForm(prev => ({ ...prev, county: e.target.value, city: "" }))} required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-slate-900 focus:bg-white shadow-sm transition-all">
                                        <option value="">SELECT REGION</option>
                                        {locations.map((loc, i) => <option key={i} value={loc.name}>{loc.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1">Logistics Primary City</label>
                                    <select name="city" value={form.city} onChange={handleChange} required disabled={!form.county}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:border-slate-900 focus:bg-white shadow-sm transition-all disabled:opacity-30">
                                        <option value="">{form.county ? "SELECT CITY" : "AWAITING REGION"}</option>
                                        {(locations.find(l => l.name === form.county)?.towns || [])
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map((town, i) => <option key={i} value={town.name}>{town.name}</option>)
                                        }
                                    </select>
                                </div>
                            </div>
                            <InputUnit label="Fulfillment Physical Address" name="address" fullWidth textarea value={form.address} onChange={handleChange} required icon={MapPin} />
                        </div>
                    </section>

                    {/* SECTION 3: STRATEGIC DESCRIPTION */}
                    <section className="bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden group">
                        <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center gap-3">
                            <FileText size={18} className="text-blue-400" />
                            <h3 className="text-xs font-black  tracking-widest">Merchant Strategic Dossier</h3>
                        </div>
                        <div className="p-6 md:p-8">
                            <textarea name="storeDescription" value={form.storeDescription} onChange={handleChange} required
                                placeholder="Describe merchant's logistics capabilities, product specialty, and operational volume..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white/10 h-40 resize-none transition-all placeholder:text-slate-600" />
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-[9px] font-black text-slate-500  tracking-widest flex items-center gap-2">
                                    <Shield size={12} /> Encrypted at rest
                                </p>
                                <p className="text-[9px] font-black text-slate-500  tracking-widest">Min: 50 Chars</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* ── RIGHT: FINANCIAL & COMPLIANCE ── */}
                <div className="lg:col-span-4 space-y-6 md:space-y-8">
                    {/* SETTLEMENT GATEWAY */}
                    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden shadow-xl shadow-slate-200/20">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                            <CreditCard size={18} className="text-slate-400" />
                            <h3 className="text-xs font-black text-slate-900  tracking-widest">Financial Settlement Protocol</h3>
                        </div>
                        <div className="p-6 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1">Settlement Gateway Protocol</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setForm({ ...form, paymentMethod: 'MPESA' })}
                                        className={`py-3 rounded-xl text-[10px] font-black  tracking-widest border transition-all ${form.paymentMethod === 'MPESA' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-400'}`}>
                                        M-Pesa ID
                                    </button>
                                    <button type="button" onClick={() => setForm({ ...form, paymentMethod: 'BANK' })}
                                        className={`py-3 rounded-xl text-[10px] font-black  tracking-widest border transition-all ${form.paymentMethod === 'BANK' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-400'}`}>
                                        Bank EFT
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                                {form.paymentMethod === 'MPESA' ? (
                                    <>
                                        <InputUnit label="Authorized M-Pesa ID" name="mpesaNumber" value={form.mpesaNumber} onChange={handleChange} icon={Smartphone} />
                                        <InputUnit label="Registered M-Pesa Protocol Name" name="mpesaName" value={form.mpesaName} onChange={handleChange} icon={User} />
                                    </>
                                ) : (
                                    <>
                                        <InputUnit label="Landmark Branch Authority" name="bankName" value={form.bankName} onChange={handleChange} icon={Landmark} />
                                        <InputUnit label="Financial Account Identifier" name="accountNumber" value={form.accountNumber} onChange={handleChange} icon={ClipboardList} />
                                    </>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* COMPLIANCE REGISTRY */}
                    <section className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-6 space-y-6 relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-2 relative z-10">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center border border-blue-500 shadow-lg shadow-blue-200">
                                <ShieldCheck size={18} className="text-white" />
                            </div>
                            <h4 className="text-[10px] font-black text-blue-900  tracking-widest">Global Compliance Registry</h4>
                        </div>
                        <div className="space-y-4 relative z-10">
                            <InputUnit label="Federal Taxation (KRA) PIN" name="kraPin" value={form.kraPin} onChange={handleChange} icon={Landmark} light />
                            <InputUnit label="Authorized Entity Reg. No." name="businessRegistrationNumber" value={form.businessRegistrationNumber} onChange={handleChange} icon={Building} light />
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                    </section>

                    <div className="pt-2 sticky bottom-6 z-20">
                        <button type="submit" disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black  tracking-[0.25em] hover:bg-slate-800 transition-all shadow-2xl shadow-slate-300 disabled:bg-slate-200 group flex items-center justify-center gap-3">
                            {loading ? <Loader2 size={20} className="animate-spin" /> : (editId ? "COMMIT MERCHANT UPDATES" : "FINALIZE ONBOARDING PROTOCOL")}
                            {!loading && <Zap size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-blue-400 fill-blue-400" />}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

/* --- Visual Input Component --- */
const InputUnit = ({ label, icon: Icon, textarea, fullWidth, light, ...props }) => (
    <div className={`space-y-2 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <label className="text-[10px] font-black text-slate-400  tracking-widest ml-1 flex items-center gap-2">
            {Icon && <Icon size={12} className="opacity-70" />}
            {label}
        </label>
        {textarea ? (
            <textarea {...props} className={`w-full border rounded-xl px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-slate-900/5 transition-all resize-none h-24 ${light ? 'bg-white border-blue-200 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-slate-900 focus:bg-white shadow-sm'}`} />
        ) : (
            <input {...props} className={`w-full border rounded-xl px-4 py-3.5 text-xs font-black outline-none focus:ring-2 focus:ring-slate-900/5 transition-all ${light ? 'bg-white border-blue-200 focus:border-blue-500' : 'bg-slate-50 border-slate-200 focus:border-slate-900 focus:bg-white shadow-sm'}`} />
        )}
    </div>
);

const Smartphone = ({ size, className }) => <Phone size={size} className={className} />;
