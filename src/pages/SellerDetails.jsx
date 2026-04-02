import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    AlertCircle,
    User,
    MapPin,
    CreditCard,
    CheckCheck,
    FileText,
    Building,
    Globe,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui/button';


const AdminSellerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);


    useEffect(() => {
        const fetchSeller = async () => {
            console.log('Fetching seller with ID:', id);
            setLoading(true);
            try {
                if (!id) {
                    toast.error('No seller ID provided');
                    setLoading(false);
                    return;
                }
                const response = await axiosInstance.get(`/seller/${id}`);
                console.log('Seller API response:', response.data);

                // Correctly unwrap data from response
                const sellerData = response.data.data || response.data;
                if (sellerData && (sellerData.id || sellerData.storeName)) {
                    setSeller(sellerData);
                } else {
                    console.error('No valid seller data found in response:', response.data);
                    toast.error('Seller not found');
                }
            } catch (error) {
                console.error('Error fetching seller details:', error);
                const message = error.response?.data?.message || error.response?.data?.error || 'Failed to load seller details';
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchSeller();
    }, [id]);

    const hasExternalContactInfo = (text, allowedDomains = []) => {
        if (!text) return false;
        const normalized = text.toLowerCase().replace(/[-\s.()]/g, '');
        const phonePatterns = [/\+\d{10,15}/, /254\d{9}/, /0[17]\d{8}/, /\d{10,15}/];
        const contactContexts = [/call[\s\d]{5,15}/, /phone[\s\d]{5,15}/, /contact[\s\d]{5,15}/, /tel[\s\d]{5,15}/, /mobile[\s\d]{5,15}/, /reach[\s\w]{1,10}[\s\d]{5,15}/, /whatsapp[\s\d]{5,15}/, /sms[\s\d]{5,15}/];
        const emailPatterns = [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/];
        const linkRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.[a-z]{2,}(\/[^\s]*)?)/gi;
        const links = text.match(linkRegex) || [];
        const hasExternalLinks = links.some(link => !allowedDomains.some(domain => link.toLowerCase().includes(domain.toLowerCase())));
        const hasPhone = phonePatterns.some(pattern => pattern.test(normalized));
        const hasContactContext = contactContexts.some(pattern => pattern.test(normalized));
        const hasEmail = emailPatterns.some(pattern => pattern.test(text));
        return hasPhone || hasContactContext || hasEmail || hasExternalLinks;
    };

    const isPaymentMethodValid = (s) => {
        if (!s.paymentMethod) return false;
        switch (s.paymentMethod) {
            case 'BANK': return s.bankName && s.accountNumber && s.accountHolderName;
            case 'MPESA': return s.mpesaNumber && s.mpesaName;
            case 'JENGA': return s.jengaAccountNumber && s.jengaAccountName;
            case 'PAYPAL': return s.paypalEmail && s.paypalAccountHolder;
            default: return false;
        }
    };

    const validationChecks = useMemo(() => {
        if (!seller) return [];
        const isIndividual = seller.seller_type === 'individual';
        const hasProhibitedInfo = hasExternalContactInfo(seller.storeDescription || '', ['ikosoko.com']);

        return [
            { id: 'email-verified', label: 'Email Verification', description: 'Seller email must be verified', status: !!(seller.emailVerified || seller.isEmailVerified), required: true },
            { id: 'contact-details', label: 'Contact Details', description: 'Valid phone number and email', status: !!(seller.phone && seller.phone.length >= 10 && seller.email), required: true },
            { id: 'store-location', label: 'Store Location', description: 'Complete location details', status: !!(seller.country && seller.county && seller.city && seller.address), required: true },
            { id: 'business-details', label: 'Business Details', description: 'Store name and business type', status: !!(seller.storeName && seller.businessType), required: true },
            { id: 'kra-pin', label: 'KRA PIN', description: 'Valid KRA PIN provided', status: !!(seller.kraPin || seller.profile?.kraPin), required: !isIndividual },
            { id: 'payment-method', label: 'Payment Method', description: 'Valid payment method configured', status: isPaymentMethodValid(seller), required: true },
            { id: 'store-description', label: 'Store Description', description: 'Min 50 chars, no prohibited info', status: !!(seller.storeDescription && seller.storeDescription.length >= 50 && !hasProhibitedInfo), required: true },
            { id: 'business-registration', label: 'Business Reg', description: 'Registration number provided', status: !!seller.businessRegistrationNumber, required: seller.seller_type === 'business' }
        ];
    }, [seller]);

    const validationResults = useMemo(() => {
        const requiredChecks = validationChecks.filter(c => c.required);
        const passedRequired = requiredChecks.filter(c => c.status).length;
        const totalRequired = requiredChecks.length;
        return {
            requiredScore: totalRequired > 0 ? (passedRequired / totalRequired) * 100 : 100,
            isEligible: passedRequired === totalRequired,
            passedRequired,
            totalRequired
        };
    }, [validationChecks]);

    const handleApprove = async () => {
        if (!validationResults.isEligible && !window.confirm("Seller has not met all validation criteria. Approve anyway?")) return;
        setProcessing(true);
        try {
            await axiosInstance.patch(`/sellers/${id}/approve`, {});
            toast.success('Seller approved successfully');
            navigate('/sellers');
        } catch (error) {
            toast.error('Failed to approve seller');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.warning('Please provide a reason for rejection');
            return;
        }
        setProcessing(true);
        try {
            await axiosInstance.patch(`/sellers/${id}/disapprove`, { reason: rejectionReason });
            toast.success('Seller application rejected');
            setShowRejectModal(false);
            navigate('/sellers');
        } catch (error) {
            toast.error('Failed to reject seller');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><LoadingSpinner /></div>;
    if (!seller || (seller.success === false)) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Seller not found</div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    const InfoRow = ({ label, value, icon, verified }) => (
        <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
            <span className="text-xs font-bold text-slate-400 capitalize">{label}</span>
            <div className="flex items-center gap-2">
                {icon && <span className="text-slate-400">{icon}</span>}
                <span className="text-sm font-bold text-slate-700">{value || <span className="text-slate-300 italic">Not set</span>}</span>
                {verified && <CheckCircle size={14} className="text-emerald-500" />}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                                <ArrowLeft size={18} />
                            </button>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">Seller Application Review</h1>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusColor(seller.approvalStatus)}`}>
                                        {seller.approvalStatus}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold">ID: {seller.id}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {seller.approvalStatus !== 'approved' && (
                                <>
                                    <Button onClick={() => setShowRejectModal(true)} variant="ghost" className="text-rose-600 hover:bg-rose-50 text-xs font-bold">
                                        <XCircle size={16} /> Reject
                                    </Button>
                                    <Button onClick={handleApprove} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 text-xs font-bold">
                                        {processing ? 'Processing...' : <><CheckCircle size={16} /> Approve Seller</>}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                    {/* Left: Validation & Profile */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Validation Snapshot */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${validationResults.isEligible ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                                        <ShieldCheck className={`w-6 h-6 ${validationResults.isEligible ? 'text-emerald-600' : 'text-amber-600'}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Verification Score</h3>
                                        <p className="text-sm text-slate-500 font-medium">Compliance with platform standards</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-3xl font-black ${validationResults.isEligible ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {Math.round(validationResults.requiredScore)}%
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Score</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {validationChecks.map(check => (
                                    <div key={check.id} className={`flex items-center gap-4 p-4 rounded-[1.5rem] border ${check.status ? 'bg-emerald-50/50 border-emerald-100' : check.required ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className={`p-2 rounded-xl ${check.status ? 'bg-emerald-100 text-emerald-600' : check.required ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {check.status ? <CheckCheck size={16} /> : <AlertCircle size={16} />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800">{check.label}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{check.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Profile & Business Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                                    <User size={18} className="text-indigo-500" /> Account Identity
                                </h3>
                                <div className="space-y-1">
                                    <InfoRow label="Store Name" value={seller.storeName} />
                                    <InfoRow label="Business Type" value={seller.businessType} />
                                    <InfoRow label="Seller Type" value={seller.seller_type} />
                                    <InfoRow label="Email" value={seller.email} verified={seller.emailVerified || seller.isEmailVerified} />
                                    <InfoRow label="Phone" value={seller.phone} />
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
                                <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                                    <Building size={18} className="text-indigo-500" /> Business Registration
                                </h3>
                                <div className="space-y-1">
                                    <InfoRow label="Registration #" value={seller.businessRegistrationNumber} />
                                    <InfoRow label="KRA PIN" value={seller.kraPin || seller.profile?.kraPin} />
                                    <InfoRow label="Category" value={seller.category} />
                                    <InfoRow label="Status" value={seller.approvalStatus} />
                                </div>
                            </div>
                        </div>

                        {/* Store Description */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                                <FileText size={18} className="text-indigo-500" /> Store Description
                            </h3>
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-sm text-slate-600 leading-relaxed min-h-[150px]">
                                {seller.storeDescription || 'No description provided.'}
                            </div>
                        </div>
                    </div>

                    {/* Right: Location & Payment */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Subscription Status Card */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8">
                                <Zap className="w-8 h-8 text-indigo-500/20 group-hover:text-indigo-500/40 transition-colors" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <Zap className="w-6 h-6 text-indigo-600" />
                                Subscription
                            </h3>
                            <div className="space-y-6">
                                {seller.PremiumSubscription ? (
                                    <>
                                        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Active Plan</span>
                                                <span className="px-2 py-1 bg-white text-indigo-700 text-[10px] font-black rounded-lg shadow-sm border border-indigo-200">
                                                    {seller.PremiumSubscription.plan.planType}
                                                </span>
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-2xl font-black text-slate-900">
                                                        KES {seller.PremiumSubscription.plan.monthlyPrice.toLocaleString()}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Per Month</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Renews On</p>
                                                    <p className="text-xs font-black text-slate-700">
                                                        {new Date(seller.PremiumSubscription.currentPeriodEnd).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                                                <p className="text-xs font-black text-indigo-600 uppercase flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    {seller.PremiumSubscription.status}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cycle</p>
                                                <p className="text-xs font-black text-slate-700 uppercase">Monthly</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                            <Zap className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-500 mb-1">No Active Subscription</p>
                                        <p className="text-[10px] text-slate-400 font-medium">This seller is on the Free tier.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location Card */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <h3 className="text-lg font-black mb-6 flex items-center gap-3 relative z-10">
                                <MapPin size={24} className="text-emerald-400" /> Business Location
                            </h3>
                            <div className="space-y-6 relative z-10">
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Country / City</p>
                                    <p className="text-xl font-bold">{seller.country}, {seller.city}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">County / Area</p>
                                    <p className="text-sm font-medium text-white/80">{seller.county || seller.profile?.county || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Physical Address</p>
                                    <p className="text-sm font-medium text-white/80">{seller.address}</p>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase">
                                        <Globe size={12} /> Assigned Hub: {seller.fulfillmentHub?.name || 'Local Distribution'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Card */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                                <CreditCard size={18} className="text-indigo-500" /> Disbursement Info
                            </h3>
                            <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 mb-6">
                                <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Primary Method</p>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500 text-white rounded-xl">
                                        <CreditCard size={20} />
                                    </div>
                                    <h4 className="text-xl font-black text-indigo-900">{seller.paymentMethod}</h4>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {seller.paymentMethod === 'BANK' && (
                                    <>
                                        <InfoRow label="Bank" value={seller.bankName} />
                                        <InfoRow label="Account #" value={seller.accountNumber} />
                                        <InfoRow label="Holder" value={seller.accountHolderName} />
                                    </>
                                )}
                                {seller.paymentMethod === 'MPESA' && (
                                    <>
                                        <InfoRow label="M-Pesa #" value={seller.mpesaNumber} />
                                        <InfoRow label="Name" value={seller.mpesaName} />
                                    </>
                                )}
                                {seller.paymentMethod === 'JENGA' && (
                                    <>
                                        <InfoRow label="Account" value={seller.jengaAccountNumber} />
                                        <InfoRow label="Name" value={seller.jengaAccountName} />
                                    </>
                                )}
                                {seller.paymentMethod === 'PAYPAL' && (
                                    <>
                                        <InfoRow label="Email" value={seller.paypalEmail} />
                                        <InfoRow label="Name" value={seller.paypalAccountHolder} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reject Modal */}
            <AnimatePresence>
                {showRejectModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl">
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Reject Application</h3>
                            <p className="text-slate-500 mb-6 font-bold text-sm">Provide feedback for the seller to rectify.</p>
                            <textarea
                                className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow mb-8 font-medium text-sm"
                                placeholder="e.g., KRA PIN document is missing or invalid..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                            <div className="flex gap-4">
                                <Button variant="outline" className="flex-1 py-4 font-black rounded-2xl text-[10px] uppercase border-slate-200" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                                <Button className="flex-1 py-4 font-black rounded-2xl text-[10px] uppercase bg-rose-600 hover:bg-rose-700 text-white" onClick={handleReject} disabled={processing}>Confirm Rejection</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminSellerDetails;
