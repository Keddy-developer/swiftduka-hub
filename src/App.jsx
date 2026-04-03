import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { 
  BarChart3, Package, Truck, Users, Settings, LogOut, 
  Menu, X, Bell, Globe, Search, Warehouse, ClipboardList
} from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// PAGES
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Fleet from './pages/Fleet';
import RiderDetails from './pages/RiderDetails';
import Sellers from './pages/Sellers';
import SellerDetails from './pages/SellerDetails';
import Returns from './pages/Returns';
import Login from './pages/Login';
import RegisterSeller from './pages/RegisterSeller';
import RegisterRider from './pages/RegisterRider';

const MainLayout = ({ children }) => {
  const { user, hub, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(window.innerWidth > 1024);
  const location = useLocation();

  const links = [
    { name: 'Dashboard', icon: BarChart3, path: '/' },
    { name: 'Sellers', icon: Users, path: '/sellers' },
    { name: 'Inbound & Inventory', icon: Package, path: '/inventory' },
    { name: 'Pick & Pack Orders', icon: ClipboardList, path: '/orders' },
    { name: 'Returns Mgmt', icon: Truck, path: '/returns' },
    { name: 'Hub Fleet (Riders)', icon: Truck, path: '/fleet' },
    { name: 'Site Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F0F2F5]">
      {/* 🌑 MOBILE OVERLAY */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 🏙️ SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-all duration-300 transform ${sidebarOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block`}>
        <div className="flex flex-col h-full bg-white">
          <div className="px-6 py-8 flex items-center justify-between border-b border-slate-100">
             <img src="/logo.svg" alt="ikoSoko" className="h-10 object-contain" />
             <button 
               onClick={() => setSidebarOpen(false)}
               className="p-2 text-slate-400 hover:text-slate-600 lg:hidden rounded-lg hover:bg-slate-50 transition-colors"
             >
                <X className="w-6 h-6" />
             </button>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto scrollbar-hide">
             {links.map((link) => (
               <Link
                 key={link.name}
                 to={link.path}
                 onClick={() => { if(window.innerWidth < 1024) setSidebarOpen(false); }}
                 className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all ${
                   location.pathname === link.path || location.pathname.startsWith(`${link.path}/`)
                   ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                   : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                 }`}
               >
                 <link.icon className={`w-5 h-5 ${location.pathname === link.path || location.pathname.startsWith(`${link.path}/`) ? 'text-white' : 'text-slate-400'}`} />
                 {link.name}
               </Link>
             ))}
          </nav>

          <div className="p-5 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <Users className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 text-sm truncate uppercase tracking-tight">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">Hub Manager</p>
                  </div>
               </div>
               <button 
                onClick={logout}
                className="w-full py-3 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-xl text-slate-600 text-xs font-black border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-sm"
               >
                 <LogOut className="w-4 h-4" /> SECURE EXIT
               </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 🚀 MAIN CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
         {/* Top Header */}
         <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setSidebarOpen(true)}
                 className="p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden rounded-xl border border-slate-200 transition-all active:scale-95"
               >
                  <Menu className="w-6 h-6" />
               </button>
               <div className="flex items-center gap-4">
                 <div className="hidden sm:flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">System Live</span>
                 </div>
                 <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                 <div className="flex items-center gap-2 font-black text-slate-900 text-sm uppercase tracking-tighter">
                    <Warehouse className="text-primary w-5 h-5" />
                    {hub?.name || 'Loading Architecture...'}
                 </div>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="hidden lg:flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Global Logistics Search..." className="pl-11 pr-4 py-2.5 bg-slate-100/50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 text-sm font-bold transition-all w-[300px]" />
                  </div>
               </div>
               <button className="relative p-2.5 text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
               </button>
            </div>
         </header>

         {/* Content Area */}
         <main className="flex-1 overflow-y-auto p-6">
            {children}
         </main>
      </div>
    </div>
  );
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/orders/:id" element={<PrivateRoute><OrderDetails /></PrivateRoute>} />
          <Route path="/returns" element={<PrivateRoute><Returns /></PrivateRoute>} />
          <Route path="/sellers" element={<PrivateRoute><Sellers /></PrivateRoute>} />
          <Route path="/sellers/:id" element={<PrivateRoute><SellerDetails /></PrivateRoute>} />
          <Route path="/register-seller" element={<PrivateRoute><RegisterSeller /></PrivateRoute>} />
          <Route path="/fleet" element={<PrivateRoute><Fleet /></PrivateRoute>} />
          <Route path="/fleet/:id" element={<PrivateRoute><RiderDetails /></PrivateRoute>} />
          <Route path="/register-a-rider/:id" element={<PrivateRoute><RegisterRider /></PrivateRoute>} />
          {/* Redirect all unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" theme="colored" autoClose={3000} hideProgressBar />
    </AuthProvider>
  );
}

export default App;
