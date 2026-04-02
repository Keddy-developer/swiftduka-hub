import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Warehouse, Lock, Contact, Mail, Phone, ChevronRight, Globe } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showAccessModal, setShowAccessModal] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await login(identifier, password);
        if (res.success) {
            toast.success("Security validation successful");
            navigate('/');
        } else {
            toast.error(res.message || "Invalid credentials");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white relative overflow-hidden font-outfit">
            {/* 🌅 DECORATIVE SIDE (LEFT on Desktop) */}
            <div className="hidden lg:flex w-1/2 bg-blue-600 relative p-20 items-end overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-multiply opacity-40 brightness-50" />
                <div className="relative z-10 text-white max-w-lg">
                   <div className="w-16 h-1 bg-white mb-8 rounded-full" />
                   <h1 className="text-6xl font-black mb-6 leading-tight tracking-tighter">Accelerate The Global Flow.</h1>
                   <p className="text-xl font-medium text-blue-100/80 leading-relaxed mb-10">Smart fulfillment infrastructure for the next generation of commerce.</p>
                   <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-blue-100">
                      <div className="flex items-center gap-2 px-4 py-2 border border-blue-500 rounded-lg backdrop-blur-md">Secure Cloud API</div>
                      <div className="flex items-center gap-2 px-4 py-2 border border-blue-500 rounded-lg backdrop-blur-md">Operational Excellence</div>
                   </div>
                </div>
            </div>

            {/* 🔑 LOGIN SECTION (RIGHT) */}
            <div className="flex-1 flex items-center justify-center p-8 md:p-20 relative">
               <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-[100px] -m-20 pointer-events-none" />
               <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50 rounded-full blur-[100px] -m-20 pointer-events-none" />

               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="w-full max-w-lg relative z-10"
                >
                  <div className="flex items-center gap-4 mb-14">
                      <div className="bg-white rounded-2xl flex items-center justify-center p-2 border border-slate-100 shadow-sm">
                         <img src="/logo.svg" alt="ikoSoko Logo" className="h-10 object-contain" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 leading-none">Logistics Portal</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Hub Security Access System</p>
                      </div>
                  </div>

                  <div className="mb-10">
                    <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Enterprise Login</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">Enter your operational credentials to access your assigned fulfillment center.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 block">Staff Identifier</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <input 
                                  type="text" 
                                  required 
                                  placeholder="Email or Hub ID"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-5 py-5 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-400 shadow-sm"
                                  value={identifier}
                                  onChange={(e) => setIdentifier(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 block">Security Passphrase</label>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <input 
                                  type="password" 
                                  required 
                                  placeholder="••••••••••••"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-5 py-5 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:font-medium placeholder:text-slate-300 shadow-sm"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                       <label className="flex items-center gap-3 cursor-pointer group">
                          <input type="checkbox" className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
                          <span className="text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Remember Station</span>
                       </label>
                       <button type="button" onClick={() => setShowAccessModal(true)} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">Access Issues?</button>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg shadow-xl shadow-slate-200/50 flex items-center justify-center gap-3 hover:bg-slate-800 transition-all transform active:scale-[0.98]"
                    >
                       {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                         <>
                           Initialize Sync <ChevronRight className="w-6 h-6" />
                         </>
                       )}
                    </button>
                  </form>

                  <div className="mt-14 pt-8 border-t border-slate-100 flex items-center justify-between">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 ikoSoko Logistics</p>
                     <div className="flex items-center gap-4">
                        <Globe className="w-4 h-4 text-slate-300" />
                        <span className="text-xs font-bold text-slate-400">Production Enviroment</span>
                     </div>
                  </div>
               </motion.div>
            </div>

            {/* Access Issues Modal */}
            <AnimatePresence>
               {showAccessModal && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                   <motion.div 
                     initial={{ scale: 0.95, opacity: 0 }} 
                     animate={{ scale: 1, opacity: 1 }} 
                     exit={{ scale: 0.95, opacity: 0 }} 
                     className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
                   >
                     <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
                        <Lock className="w-8 h-8" />
                     </div>
                     <h3 className="text-2xl font-black text-slate-900 mb-2">Credential Recovery</h3>
                     <p className="text-slate-500 font-medium leading-relaxed mb-6">
                       For strict security compliance within the hub network, self-service automated password resets are restricted for operational staff.
                     </p>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 mb-8">
                        <div className="flex items-center gap-3">
                           <Phone className="w-5 h-5 text-slate-400" />
                           <p className="text-sm font-bold text-slate-700">Call IT Support (+254 700 000)</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <Contact className="w-5 h-5 text-slate-400" />
                           <p className="text-sm font-bold text-slate-700">Contact Hub Manager</p>
                        </div>
                     </div>
                     <button 
                       type="button"
                       onClick={() => setShowAccessModal(false)}
                       className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all"
                     >
                        Acknowledged
                     </button>
                   </motion.div>
                 </div>
               )}
            </AnimatePresence>
        </div>
    );
};

export default Login;
