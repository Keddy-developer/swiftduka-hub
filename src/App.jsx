import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { 
  BarChart3, Package, Truck, Users, Settings, LogOut, 
  Menu, X, Bell, Globe, Search, Warehouse, ClipboardList,
  Navigation
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
import SettingsPage from './pages/Settings';
import LogsPage from './pages/Logs';
import ZoneInfo from './pages/ZoneInfo';
import Logistics from './pages/Logistics';

const MainLayout = ({ children }) => {
  const { user, hub, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(window.innerWidth > 1024);
  const location = useLocation();

  const links = [
    { name: 'Workbench', icon: BarChart3, path: '/' },
    { name: 'Seller Network', icon: Users, path: '/sellers' },
    { name: 'Inbound & Stocks', icon: Package, path: '/inventory' },
    { name: 'Order Fulfillment', icon: ClipboardList, path: '/orders' },
    { name: 'Returns Management', icon: Warehouse, path: '/returns' },
    { name: 'Last-Mile Fleet', icon: Truck, path: '/fleet' },
    { name: 'Hub Logistics', icon: Navigation, path: '/logistics' },
    { name: 'Zone Logistics', icon: Globe, path: '/zone-info' },
    { name: 'Hub Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F0F2F5] font-sans">
      {/* 🌑 MOBILE OVERLAY */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 🏙️ SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-all duration-300 transform ${sidebarOpen ? 'translate-x-0 shadow-lg lg:shadow-none' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block`}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-white">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-slate-900 tracking-tight">ikoSoko</span>
             </div>
             <button 
               onClick={() => setSidebarOpen(false)}
               className="ml-auto p-2 text-slate-400 hover:text-slate-600 lg:hidden rounded transition-colors"
             >
                <X className="w-5 h-5" />
             </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
             {links.map((link) => (
               <Link
                 key={link.name}
                 to={link.path}
                 onClick={() => { if(window.innerWidth < 1024) setSidebarOpen(false); }}
                 className={`flex items-center gap-3 px-4 py-2.5 rounded text-sm font-medium transition-colors ${
                   location.pathname === link.path || location.pathname.startsWith(`${link.path}/`)
                   ? 'bg-slate-100 text-slate-900' 
                   : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                 }`}
               >
                 <link.icon className={`w-4 h-4 ${location.pathname === link.path || location.pathname.startsWith(`${link.path}/`) ? 'text-slate-900' : 'text-slate-400'}`} />
                 {link.name}
               </Link>
             ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-3 px-2">
               <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center border border-slate-200">
                 <Users className="w-4 h-4 text-slate-500" />
               </div>
               <div className="min-w-0">
                 <p className="font-bold text-slate-900 text-xs truncate uppercase tracking-tight">{user?.firstName} {user?.lastName}</p>
                 <p className="text-[10px] font-medium text-slate-400 uppercase">Hub Ops</p>
               </div>
            </div>
            <button 
              onClick={logout}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 rounded transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" /> SIGN OUT
            </button>
          </div>
        </div>
      </aside>

      {/* 🚀 MAIN CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
         {/* Top Header */}
         <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm shadow-slate-50">
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setSidebarOpen(true)}
                 className="p-2 text-slate-600 hover:bg-slate-100 lg:hidden rounded border border-slate-200"
               >
                  <Menu className="w-5 h-5" />
               </button>
               <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-tight">Active</span>
                 </div>
                 <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                 <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                    <Warehouse className="text-slate-400 w-4 h-4" />
                    {hub?.name || (user ? 'SwiftHub Network' : 'Syncing Hub...')}
                 </div>
               </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="hidden lg:flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Global search..." className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:bg-white focus:border-slate-400 transition-all w-[240px]" />
                  </div>
               </div>
               <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
               </button>
            </div>
         </header>

         {/* Content Area */}
         <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto p-3 sm:p-6 md:p-8">
               {children}
            </div>
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
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="/logs" element={<PrivateRoute><LogsPage /></PrivateRoute>} />
          <Route path="/zone-info" element={<PrivateRoute><ZoneInfo /></PrivateRoute>} />
          <Route path="/logistics" element={<PrivateRoute><Logistics /></PrivateRoute>} />
          {/* Redirect all unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="top-right" theme="colored" autoClose={3000} hideProgressBar />
    </AuthProvider>
  );
}

export default App;
