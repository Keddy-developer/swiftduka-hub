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

const MainLayout = ({ children }) => {
  const { user, hub, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
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
      {/* 🏙️ SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="flex flex-col h-full bg-white">
          <div className="px-6 py-6 flex items-center justify-center border-b border-slate-100">
             <img src="/logo.svg" alt="ikoSoko" className="h-10 object-contain" />
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
             {links.map((link) => (
               <Link
                 key={link.name}
                 to={link.path}
                 className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-semibold transition-all ${
                   location.pathname === link.path || location.pathname.startsWith(`${link.path}/`)
                   ? 'bg-primary text-white shadow-sm' 
                   : 'text-slate-600 hover:bg-slate-50'
                 }`}
               >
                 <link.icon className={`w-5 h-5 ${location.pathname === link.path || location.pathname.startsWith(`${link.path}/`) ? 'text-white' : 'text-slate-400'}`} />
                 {link.name}
               </Link>
             ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
               <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                    <Users className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[10px] font-bold text-primary uppercase">Hub Staff</p>
                  </div>
               </div>
               <button 
                onClick={logout}
                className="w-full py-2 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded text-slate-600 text-xs font-semibold border border-slate-200 transition-all flex items-center justify-center gap-2"
               >
                 <LogOut className="w-4 h-4" /> Secure Disconnect
               </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 🚀 MAIN CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
         {/* Top Header */}
         <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
               <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-[10px] font-bold uppercase border border-green-200">
                 Connected
               </span>
               <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                  <Warehouse className="w-4 h-4 text-primary" />
                  {hub?.name || 'Loading hub...'}
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="hidden md:flex items-center gap-2 group">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Global Search..." className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm transition-all" />
                  </div>
               </div>
               <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded transition-all">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
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
          {/* Redirect all unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" theme="colored" autoClose={3000} hideProgressBar />
    </AuthProvider>
  );
}

export default App;
