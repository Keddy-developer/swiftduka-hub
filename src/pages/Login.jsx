import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Warehouse, Lock, Contact, Mail, Phone, ChevronRight, Globe, ShieldCheck, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showAccessModal, setShowAccessModal] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await login(identifier, password);
            if (res.success) {
                toast.success("Security validation successful");
                navigate('/');
            } else {
                toast.error(res.message || "Invalid credentials");
            }
        } catch (err) {
            toast.error("Authentication protocol failure");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm space-y-8">
                {/* 🛡️ BRANDING */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-3 bg-slate-900 text-white rounded-xl shadow-xl shadow-slate-200 mb-2">
                        <Warehouse size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase whitespace-nowrap">HUB OPERATIONAL PORTAL</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Restricted Fulfillment Infrastructure Access</p>
                </div>

                {/* 🔑 LOGIN FORM */}
                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Staff Identifier</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                                <input 
                                    type="text" required placeholder="Email or Hub ID"
                                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:border-slate-900 focus:bg-white shadow-sm"
                                    value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Security Passphrase</label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                                <input 
                                    type="password" required placeholder="••••••••••••"
                                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold outline-none focus:border-slate-900 focus:bg-white shadow-sm"
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer group">
                           <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-200 text-slate-900 focus:ring-slate-900" />
                           <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-900 uppercase">Remember Station</span>
                        </label>
                        <button type="button" onClick={() => setShowAccessModal(true)} className="text-[10px] font-bold text-slate-900 hover:underline uppercase">Access Issue?</button>
                    </div>

                    <button 
                        type="submit" disabled={loading}
                        className="w-full py-3 bg-slate-900 text-white rounded text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                    >
                       {loading ? <Loader2 size={16} className="animate-spin" /> : "INITIALIZE SYNC"}
                    </button>
                </form>

                {/* 📋 FOOTER */}
                <div className="flex flex-col items-center gap-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                        <Globe size={12} className="text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Protocol: Cloud-Alpha-Ready</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">© 2026 ikoSoko Logistics Engineering</p>
                </div>
            </div>

            {/* Access Issues Modal */}
            {showAccessModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded shadow-2xl w-full max-w-xs p-6 space-y-4 animate-in zoom-in duration-200 text-center">
                        <ShieldCheck size={40} className="text-red-500 mx-auto" />
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Security Restriction</h3>
                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">Self-service resets are restricted for operational staff within the hub network.</p>
                        </div>
                        <div className="p-4 bg-slate-50 border border-slate-100 rounded text-left space-y-2">
                           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700 uppercase"><Phone size={12} className="text-slate-400" /> +254 700 000 000</div>
                           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700 uppercase"><Mail size={12} className="text-slate-400" /> support@ikosoko.com</div>
                        </div>
                        <button onClick={() => setShowAccessModal(false)} className="w-full py-2.5 bg-slate-900 text-white rounded text-[10px] font-bold uppercase tracking-widest">ACKNOWLEDGEMENT RECEIVED</button>
                    </div>
                </div>
            )}
        </div>
    );
}
