import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import { toast } from "react-toastify";
import {
    Store, User, Mail, Phone, MapPin, ArrowLeft,
    ShieldCheck, CreditCard, Building, Globe,
    CheckCircle2, Truck, Camera, Info, Edit, FileText, X, Loader2
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterSeller() {
    const { hub } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("edit");
    const [loading, setLoading] = useState(false);
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
            } catch (error) {}
        };

        const fetchSellerForEdit = async () => {
            if (!editId) return;
            try {
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
                await axiosInstance.patch(`/sellers/${editId}/update`, payload);
                toast.success("Merchant dossier updated");
            } else {
                await axiosInstance.post('/become-a-seller', payload);
                toast.success("Merchant onboarded");
            }
            navigate("/sellers");
        } catch (error) {
            toast.error("Onboarding protocol failure");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 md:space-y-8">
            {/* 🏙️ HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                    <button onClick={() => navigate('/sellers')} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-900 transition-colors">
                        <ArrowLeft size={14} /> Back to Partners
                    </button>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tighter uppercase whitespace-nowrap">
                        {editId ? 'Modify Merchant' : 'Onboard Merchant'}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded border border-blue-100">LOGISTICS NODE: {hub?.name?.slice(0,10)}...</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
                <div className="lg:col-span-8 space-y-6">
                    {/* ── SECTION 1: IDENTITY ── */}
                    <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                            <Store size={14} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Merchant Profile</span>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Account Identity (Email)</label>
                                    <input type="email" name="userIdentifier" value={form.userIdentifier} onChange={handleChange} required disabled={!!editId}
                                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm disabled:bg-slate-50" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Store Name</label>
                                    <input type="text" name="storeName" value={form.storeName} onChange={handleChange} required
                                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Support Phone</label>
                                    <input type="text" name="phone" value={form.phone} onChange={handleChange} required
                                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Entity Type</label>
                                    <select name="seller_type" value={form.seller_type} onChange={handleChange} required
                                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm uppercase">
                                        <option value="individual">Individual</option>
                                        <option value="business">Business</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── SECTION 2: GEOGRAPHY ── */}
                    <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                            <MapPin size={14} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operational Center</span>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Regional County</label>
                                    <select name="county" value={form.county} onChange={e => setForm(prev => ({...prev, county: e.target.value, city: ""}))} required
                                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm uppercase">
                                        <option value="">SELECT</option>
                                        {locations.map((loc, i) => <option key={i} value={loc.name}>{loc.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Logistics City</label>
                                    <select name="city" value={form.city} onChange={handleChange} required disabled={!form.county}
                                      className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm uppercase disabled:opacity-50">
                                        <option value="">{form.county ? "SELECT" : "CHOOSE COUNTY"}</option>
                                        {(locations.find(l => l.name === form.county)?.towns || [])
                                            .sort((a,b) => a.name.localeCompare(b.name))
                                            .map((town, i) => <option key={i} value={town.name}>{town.name}</option>)
                                        }
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Fulfillment Address</label>
                                <input type="text" name="address" value={form.address} onChange={handleChange} required
                                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900 shadow-sm" />
                            </div>
                        </div>
                    </section>

                    {/* ── SECTION 3: STORY ── */}
                    <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                            <FileText size={14} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Partner Dossier</span>
                        </div>
                        <div className="p-5">
                            <textarea name="storeDescription" value={form.storeDescription} onChange={handleChange} required
                              placeholder="Brief description of store logistics & products..."
                              className="w-full bg-slate-50 border border-slate-200 rounded p-4 text-xs font-medium outline-none focus:border-slate-900 h-32 resize-none" />
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    {/* ── SETTLEMENTS ── */}
                    <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                            <CreditCard size={14} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Settlement Gateway</span>
                        </div>
                        <div className="p-5 space-y-6">
                            <div className="space-y-2">
                               <label className="text-[9px] font-bold text-slate-400 uppercase">Primary Protocol</label>
                               <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}
                                 className="w-full bg-slate-900 text-white rounded px-3 py-2 text-[10px] font-black uppercase outline-none">
                                  <option value="MPESA">M-PESA BUSINESS</option>
                                  <option value="BANK">BANK (EFT)</option>
                               </select>
                            </div>
                            
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                               {form.paymentMethod === 'MPESA' ? (
                                  <>
                                     <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">M-Pesa ID</label>
                                        <input type="text" name="mpesaNumber" value={form.mpesaNumber} onChange={handleChange}
                                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900" />
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Registered Proxy</label>
                                        <input type="text" name="mpesaName" value={form.mpesaName} onChange={handleChange}
                                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900" />
                                     </div>
                                  </>
                               ) : (
                                  <>
                                     <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Branch Authority</label>
                                        <input type="text" name="bankName" value={form.bankName} onChange={handleChange}
                                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900" />
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase">Account Identifier</label>
                                        <input type="text" name="accountNumber" value={form.accountNumber} onChange={handleChange}
                                          className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900" />
                                     </div>
                                  </>
                               )}
                            </div>
                        </div>
                    </section>

                    <section className="bg-slate-50 border border-slate-200 rounded p-5 space-y-4">
                        <div className="flex items-center gap-2 text-slate-400">
                           <ShieldCheck size={16} />
                           <h4 className="text-[10px] font-bold uppercase tracking-widest">Compliance Registry</h4>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-bold text-slate-400 uppercase">Taxation PIN</label>
                           <input type="text" name="kraPin" value={form.kraPin} onChange={handleChange}
                             className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-bold outline-none focus:border-slate-900" />
                        </div>
                    </section>

                    <div className="pt-2">
                        <button type="submit" disabled={loading}
                           className="w-full py-3.5 bg-slate-900 text-white rounded text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:bg-slate-300">
                           {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editId ? "COMMIT UPDATES" : "FINALIZE ONBOARDING")}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
