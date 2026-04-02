import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import { toast } from "react-toastify";
import {
    Store,
    User,
    Mail,
    Phone,
    MapPin,
    ArrowLeft,
    ShieldCheck,
    CreditCard,
    Building,
    Globe,
    CheckCircle2,
    Truck,
    Camera,
    Info,
    Edit,
    FileText
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
        userIdentifier: "", // email of user to become seller
        seller_type: "individual",
        storeName: "",
        phone: "",
        address: "",
        city: "",
        county: "",
        country: "Kenya",
        businessType: "",
        paymentMethod: "MPESA",
        kraPin: "",
        businessRegistrationNumber: "",
        mpesaNumber: "",
        mpesaName: "",
        bankName: "",
        accountNumber: "",
        accountHolderName: "",
        storeDescription: "",
        fulfillmentHubId: hub?.id || "",
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
                setLocations(res.data.data || res.data || []);
            } catch (error) {
                console.error("Failed to fetch locations:", error);
            }
        };

        const fetchSellerForEdit = async () => {
            if (!editId) return;
            try {
                const res = await axiosInstance.get(`/seller/${editId}`);
                const s = res.data.data || res.data;
                setForm({
                    userIdentifier: s.email,
                    email: s.email || "",
                    seller_type: s.seller_type || "individual",
                    storeName: s.storeName || "",
                    phone: s.phone || "",
                    address: s.address || "",
                    city: s.city || "",
                    county: s.county || "",
                    country: s.country || "Kenya",
                    businessType: s.businessType || "",
                    paymentMethod: s.paymentMethod || "MPESA",
                    kraPin: s.kraPin || "",
                    businessRegistrationNumber: s.businessRegistrationNumber || "",
                    mpesaNumber: s.mpesaNumber || "",
                    mpesaName: s.mpesaName || "",
                    bankName: s.bankName || "",
                    accountNumber: s.accountNumber || "",
                    accountHolderName: s.accountHolderName || "",
                    storeDescription: s.storeDescription || "",
                    fulfillmentHubId: s.fulfillmentHubId || hub?.id || "",
                });
            } catch (error) {
                console.error("Failed to fetch seller for edit:", error);
                toast.error("Failed to load seller data");
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
            const payload = {
                userIdentifier: form.userIdentifier,
                profile: {
                    ...form,
                    agreeToTerms: true
                }
            };

            if (editId) {
                await axiosInstance.patch(`/sellers/${editId}/update`, payload);
                toast.success("Seller profile updated successfully!");
            } else {
                await axiosInstance.post('/become-a-seller', payload);
                toast.success("Seller registered successfully!");
            }

            navigate("/sellers");
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to process request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                {editId ? "Modify Merchant Profile" : "Onboard New Merchant"}
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">Assigned Hub: {hub?.name || "Local Distribution Center"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase rounded-lg border border-blue-100">Logistics Node Active</span>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Identity & Account Setup */}
                    <Section icon={User} title="Merchant Identity" subtitle="Platform account link & store basic info">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            <div className="space-y-2">
                                <Label>User Email (Must exist in system)</Label>
                                <InputIcon
                                    icon={Mail}
                                    name="userIdentifier"
                                    placeholder="Registered user's email"
                                    value={form.userIdentifier}
                                    onChange={handleChange}
                                    required
                                    disabled={!!editId}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Store Name</Label>
                                <InputIcon
                                    icon={Store}
                                    name="storeName"
                                    placeholder="Trade name (e.g. Premium Hub)"
                                    value={form.storeName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Support Contact Number</Label>
                                <InputIcon
                                    icon={Phone}
                                    name="phone"
                                    placeholder="254..."
                                    value={form.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Business Structure</Label>
                                <Select name="seller_type" value={form.seller_type} onChange={handleChange}>
                                    <option value="individual">Individual Enterprise</option>
                                    <option value="business">Registered Company / SME</option>
                                </Select>
                            </div>
                        </div>
                    </Section>

                    {/* Geography & Logistics */}
                    <Section icon={MapPin} title="Operational Geography" subtitle="Business physical location & logistics assignment">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                             <div className="space-y-2">
                                <Label>County / Region</Label>
                                <Select 
                                    name="county" 
                                    value={form.county} 
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setForm(prev => ({ ...prev, county: val, city: "" }));
                                    }} 
                                    required
                                >
                                    <option value="">Select County</option>
                                    {locations.map((loc, i) => (
                                        <option key={i} value={loc.name}>{loc.name}</option>
                                    ))}
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Operating Town / City</Label>
                                <Select 
                                    name="city" 
                                    value={form.city} 
                                    onChange={handleChange} 
                                    required
                                    disabled={!form.county}
                                >
                                    <option value="">{form.county ? "Select Town" : "Choose County First"}</option>
                                    {locations.find(l => l.name === form.county)?.towns?.map((town, i) => (
                                        <option key={i} value={town.name}>{town.name}</option>
                                    ))}
                                </Select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label>Full Physical Address (Warehouse/Storefront)</Label>
                                <InputIcon
                                    icon={MapPin}
                                    name="address"
                                    placeholder="Plot, Street, Building, Floor..."
                                    value={form.address}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="md:col-span-2 p-6 bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Truck className="text-white w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-black text-sm uppercase tracking-widest">Automatic Logistics Mapping</h4>
                                        <p className="text-slate-400 text-[10px] font-bold">This merchant will be tethered to: {hub?.name || "Local Distribution Center"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Tax & Financial Compliance */}
                    <Section icon={ShieldCheck} title="Regulatory & Settlements" subtitle="KRA details & disbursement channel configuration">
                        <div className="space-y-6 p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>KRA PIN (Mandatory for verified accounts)</Label>
                                    <InputIcon
                                        icon={ShieldCheck}
                                        name="kraPin"
                                        placeholder="KRA PIN #"
                                        value={form.kraPin}
                                        onChange={handleChange}
                                    />
                                </div>
                                {form.seller_type === 'business' && (
                                    <div className="space-y-2">
                                        <Label>Business Reg. Tracking Number</Label>
                                        <InputIcon
                                            icon={Building}
                                            name="businessRegistrationNumber"
                                            placeholder="Registration ID"
                                            value={form.businessRegistrationNumber}
                                            onChange={handleChange}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                        <CreditCard className="text-blue-600 w-4 h-4" /> Disbursement Configuration
                                    </h4>
                                    <Select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="w-auto bg-white">
                                        <option value="MPESA">M-Pesa Business</option>
                                        <option value="BANK">Electronic Fund Transfer (EFT)</option>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {form.paymentMethod === 'MPESA' ? (
                                        <>
                                            <InputIcon icon={Phone} name="mpesaNumber" placeholder="M-Pesa Receiving Number" value={form.mpesaNumber} onChange={handleChange} />
                                            <InputIcon icon={User} name="mpesaName" placeholder="M-Pesa Registered Name" value={form.mpesaName} onChange={handleChange} />
                                        </>
                                    ) : (
                                        <>
                                            <InputIcon icon={Building} name="bankName" placeholder="Financial Institution Name" value={form.bankName} onChange={handleChange} />
                                            <InputIcon icon={CreditCard} name="accountNumber" placeholder="IBAN / Account Number" value={form.accountNumber} onChange={handleChange} />
                                            <div className="md:col-span-2">
                                                <InputIcon icon={User} name="accountHolderName" placeholder="Account Holder Full Name" value={form.accountHolderName} onChange={handleChange} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Store Branding */}
                    <Section icon={Globe} title="Merchant Catalog Branding" subtitle="On-platform presentation & brand story">
                        <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                            <Label>Store Manifesto / Short Description (Min 50 chars)</Label>
                            <div className="relative">
                                <FileText className="absolute top-4 left-4 text-slate-300 w-5 h-5" />
                                <textarea
                                    name="storeDescription"
                                    rows={5}
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-sm font-medium"
                                    placeholder="Tell customers about your products, quality standards, and logistics commitment..."
                                    value={form.storeDescription}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <Info className="text-amber-500 w-4 h-4 shrink-0" />
                                <p className="text-[10px] text-amber-700 font-bold uppercase leading-tight">Pro tip: Avoid mentioning external websites or private contact info in the public description.</p>
                            </div>
                        </div>
                    </Section>

                    <div className="pt-10 flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex-1 py-5 bg-white border border-slate-200 text-slate-700 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Abort Process
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? "Synchronizing Infrastructure..." : (
                                <>
                                    <CheckCircle2 size={18} />
                                    {editId ? "Confirm Protocol Modifciation" : "Finalize Merchant Onboarding"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

const Section = ({ icon: Icon, title, subtitle, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-6"
    >
        <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                    <Icon className="text-white w-5 h-5" />
                </div>
                {title}
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 ml-11">{subtitle}</p>
        </div>
        {children}
    </motion.div>
);

const Label = ({ children }) => (
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{children}</label>
);

const InputIcon = ({ icon: Icon, ...props }) => (
    <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
            {...props}
            className="block w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-800 text-sm placeholder:font-medium disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
    </div>
);

const Select = ({ children, className, ...props }) => (
    <select
        {...props}
        className={`block w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-800 text-sm appearance-none ${className}`}
    >
        {children}
    </select>
);
