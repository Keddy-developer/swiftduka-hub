import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, CheckCircle, XCircle, AlertCircle, User,
    MapPin, CreditCard, CheckCheck, FileText, Building,
    Globe, ShieldCheck, Zap, X, Smartphone, Mail, Info
} from 'lucide-react';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';

const InfoRow = ({ label, value, verified }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 truncate">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
        <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate">{value || <span className="text-slate-300 italic font-medium">N/A</span>}</span>
            {verified && <CheckCircle size={12} className="text-green-500" />}
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const colors = {
        ACTIVE: "bg-blue-100 text-blue-700 border-blue-200",
        BASIC: "bg-slate-100 text-slate-700 border-slate-200",
        PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${colors[status] || colors.BASIC}`}>
            {status}
        </span>
    );
};

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
            setLoading(true);
            try {
                const response = await axiosInstance.get(`/seller/${id}`);
                setSeller(response.data.data || response.data);
            } catch (error) {
                toast.error('Manifest retrieval failure');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchSeller();
    }, [id]);

    const handleApprove = async () => {
        if (!window.confirm("Authorize this seller for hub operations?")) return;
        setProcessing(true);
        try {
            await axiosInstance.patch(`/sellers/${id}/approve`, {});
            toast.success('Seller authorized');
            navigate('/sellers');
        } catch (error) {
            toast.error('Authorization failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) return toast.warning('Operational justification required');
        setProcessing(true);
        try {
            await axiosInstance.patch(`/sellers/${id}/disapprove`, { reason: rejectionReason });
            toast.success('Application rejected');
            setShowRejectModal(false);
            navigate('/sellers');
        } catch (error) {
            toast.error('Rejection failed');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-400 font-medium italic text-sm">Syncing partner manifest...</div>;
    if (!seller) return <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest">Partner not found in registry.</div>;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 🏙️ HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <button onClick={() => navigate('/sellers')} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase hover:text-slate-900 transition-colors">
            <ArrowLeft size={14} /> Back to Partners
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tighter flex items-center gap-3 lowercase">
             @{seller.storeName?.replace(/\s+/g, '')}
             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${seller.approvalStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                {seller.approvalStatus}
             </span>
          </h2>
        </div>
        <div className="flex gap-2">
            {seller.approvalStatus !== 'approved' && (
               <>
                  <button onClick={() => setShowRejectModal(true)} className="px-4 py-2 bg-white border border-slate-200 rounded text-[10px] font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 shadow-sm uppercase">REJECT</button>
                  <button onClick={handleApprove} disabled={processing} className="px-4 py-2 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-sm uppercase">AUTHORIZE PARTNER</button>
               </>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
         {/* ── LEFT: BUSINESS PROFILE ── */}
         <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                     <Building size={14} className="text-slate-400" />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Entity Identity</span>
                  </div>
                  <div className="p-5 space-y-1">
                     <InfoRow label="Legal Name" value={seller.storeName} />
                     <InfoRow label="Business Class" value={seller.businessType} />
                     <InfoRow label="Taxation PIN" value={seller.kraPin || seller.profile?.kraPin} verified={!!(seller.kraPin || seller.profile?.kraPin)} />
                     <InfoRow label="Reg. Number" value={seller.businessRegistrationNumber} />
                     <InfoRow label="Email Authority" value={seller.email} verified={seller.emailVerified} />
                  </div>
               </section>

               <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                     <MapPin size={14} className="text-slate-400" />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logistics Anchor</span>
                  </div>
                  <div className="p-5 space-y-1">
                     <InfoRow label="Global Region" value={seller.country} />
                     <InfoRow label="Strategic Hub" value={seller.city} />
                     <InfoRow label="Operational County" value={seller.county} />
                     <div className="pt-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">Fulfillment Address</p>
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-50 border border-slate-100 p-2 rounded">{seller.address}</p>
                     </div>
                  </div>
               </section>
            </div>

            <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
               <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <FileText size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Partner Dossier</span>
               </div>
               <div className="p-5">
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed min-h-[100px] border border-slate-100 p-4 rounded bg-slate-50/50 italic">{seller.storeDescription || 'No operational narrative provided by partner.'}</p>
               </div>
            </section>
         </div>

         {/* ── RIGHT: SETTLEMENT & OPS ── */}
         <div className="lg:col-span-4 space-y-6">
            <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
               <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <CreditCard size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Settlement Protocols</span>
               </div>
               <div className="p-5">
                  <div className="mb-4 bg-slate-900 text-white p-4 rounded shadow-inner">
                     <p className="text-[9px] font-bold text-slate-440 gap-1 uppercase tracking-widest leading-none opacity-60 mb-2">Primary Disbursement Gateway</p>
                     <p className="text-lg font-black tracking-tight">{seller.paymentMethod || 'UNDEFINED'}</p>
                  </div>
                  <div className="space-y-1">
                     {seller.paymentMethod === 'BANK' && (
                        <>
                           <InfoRow label="Bank Authority" value={seller.bankName} />
                           <InfoRow label="Account Number" value={seller.accountNumber} />
                           <InfoRow label="Bene. Name" value={seller.accountHolderName} />
                        </>
                     )}
                     {seller.paymentMethod === 'MPESA' && (
                        <>
                           <InfoRow label="Mobile Token" value={seller.mpesaNumber} />
                           <InfoRow label="Authorized Persona" value={seller.mpesaName} />
                        </>
                     )}
                     {!seller.paymentMethod && <InfoRow label="Status" value="Payment Profile Incomplete" verified={false} />}
                  </div>
               </div>
            </section>

            <section className="bg-slate-50 border border-slate-200 rounded p-5 relative overflow-hidden group">
               <Zap size={40} className="absolute -right-4 -bottom-4 text-slate-200/50 rotate-12 group-hover:text-slate-200 transition-colors" />
               <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><ShieldCheck size={14} /> Compliance Tier</h3>
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-black text-slate-900 uppercase">{seller.PremiumSubscription ? 'Premium Service' : 'Standard Pipeline'}</span>
                     <StatusBadge status={seller.PremiumSubscription ? 'ACTIVE' : 'BASIC'} />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold leading-tight uppercase">Partner is operating under protocol version Alpha-4. Performance monitoring is active.</p>
               </div>
            </section>
         </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
           <div className="bg-white border border-slate-200 rounded shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in duration-200">
              <div className="flex items-center gap-3 text-red-600">
                 <XCircle size={20} />
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Reject Application</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">Provide an operational justification for the rejection of this partner application. The partner will be notified to correct these parameters.</p>
              <textarea 
                value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                placeholder="Operational justification..."
                className="w-full border border-slate-200 rounded p-3 text-xs font-medium outline-none focus:border-slate-900 h-24 resize-none"
              />
              <div className="flex gap-2">
                 <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold uppercase hover:bg-slate-100">Cancel</button>
                 <button onClick={handleReject} disabled={processing} className="flex-1 py-2 bg-red-600 text-white rounded text-[10px] font-bold uppercase hover:bg-red-700 transition-all shadow-sm">
                    {processing ? 'SYNCING...' : 'CONFIRM REJECT'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellerDetails;
