import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import axiosInstance from './services/axiosConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
   Package, Users, ClipboardList, Search, Warehouse, Truck, Navigation, Globe,
   Settings, RotateCw, LogOut, Menu, X, BarChart3, ChevronDown, Check, Banknote, Zap
} from 'lucide-react';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import StockAdjustment from './pages/StockAdjustment';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import AssignCourier from './pages/AssignCourier';
import TrackingPage from './pages/TrackingPage';
import Returns from './pages/Returns';
import Sellers from './pages/Sellers';
import SellerDetails from './pages/SellerDetails';
import RegisterSeller from './pages/RegisterSeller';
import Fleet from './pages/Fleet';
import RiderDetails from './pages/RiderDetails';
import RegisterRider from './pages/RegisterRider';
import SettingsPage from './pages/Settings';
import LogsPage from './pages/Logs';
import ZoneInfo from './pages/ZoneInfo';
import Logistics from './pages/Logistics';
import NotificationsPage from './pages/Notifications';
import StaffManagement from './pages/StaffManagement';
import StaffDetails from './pages/StaffDetails';
import CourierManagement from './pages/CourierManagement';
import CourierFinance from './pages/CourierFinance';
import RegisterCourier from './pages/RegisterCourier';
import Home from './pages/Home';

import NotificationDropdown from './components/NotificationDropdown';
import { hasAccess, isReadOnly } from './utils/permissions';

const MainLayout = ({ children }) => {
   const { user, hub, logout, isAdmin, isManager, isStaff } = useAuth();
   const [sidebarOpen, setSidebarOpen] = React.useState(window.innerWidth > 1024);
   const location = useLocation();

   const allLinks = [
      { name: 'Workbench', icon: BarChart3, path: '/' },
      { name: 'Staff Intelligence', icon: Users, path: '/staff-management' },
      { name: 'Seller Network', icon: Users, path: '/sellers' },
      { name: 'Inbound & Stocks', icon: Package, path: '/inventory' },
      { name: 'Order Fulfillment', icon: ClipboardList, path: '/orders' },
      { name: 'Track Order', icon: Search, path: '/tracking' },
      { name: 'Returns Management', icon: Warehouse, path: '/returns' },
      { name: 'Last-Mile Fleet', icon: Truck, path: '/fleet' },
      { name: 'Courier Management', icon: Zap, path: '/couriers' },
      { name: 'Courier Finance', icon: Banknote, path: '/finance' },
      { name: 'Hub Logistics', icon: Navigation, path: '/logistics' },
      { name: 'Zone Logistics', icon: Globe, path: '/zone-info' },
      { name: 'Hub Settings', icon: Settings, path: '/settings' },
      { name: 'System Logs', icon: RotateCw, path: '/logs' },
   ];

   const userRoles = user?.role || [];
   const links = allLinks.filter(link => hasAccess(userRoles, link.name));

   return (
      <div className="flex min-h-screen bg-[#F0F2F5] font-sans">
         {/* ... side bar and other layout part remains similar ... */}
         {/* (Updating sidebar content to use filtered links) */}
         <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-all duration-300 transform ${sidebarOpen ? 'translate-x-0 shadow-lg lg:shadow-none' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block`}>
            <div className="flex flex-col h-full">
               <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-white">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                     </div>
                     <span className="font-bold text-lg text-slate-900 tracking-tight">ikoSoko Staff</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="ml-auto p-2 text-slate-400 hover:text-slate-600 lg:hidden rounded transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
                  {links.map((link) => (
                     <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded text-sm font-medium transition-colors ${location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
                           ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                           : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                           }`}
                     >
                        <link.icon className={`w-4 h-4 ${location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path)) ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{link.name}</span>
                        {isReadOnly(userRoles, link.name) && <span className="text-[8px] bg-slate-100 text-slate-400 px-1 rounded ml-auto">READ</span>}
                     </Link>
                  ))}
               </nav>

               <div className="p-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 mb-3 px-2">
                     <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center border border-slate-200">
                        <Users className="w-4 h-4 text-slate-500" />
                     </div>
                     <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate tracking-tight">{user?.firstName} {user?.lastName}</p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                           {isStaff ? 'Hub Personnel' : isManager ? 'Hub Authority' : 'System Admin'}
                        </p>
                     </div>
                  </div>
                  <button onClick={logout} className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 rounded transition-all flex items-center justify-center gap-2">
                     <LogOut className="w-3.5 h-3.5" /> SIGN OUT
                  </button>
               </div>
            </div>
         </aside>

         <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
            <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm shadow-slate-50">
               <div className="flex items-center gap-4 flex-1">
                  <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 lg:hidden rounded border border-slate-200">
                     <Menu className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3 flex-1">
                     <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-[10px] font-bold text-green-700 tracking-tight uppercase">Operational</span>
                     </div>
                     <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                     <HubSelector />
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="hidden lg:flex items-center gap-2">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Global asset scan..." className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm outline-none focus:bg-white focus:border-slate-400 transition-all w-[240px]" />
                     </div>
                  </div>
                  <NotificationDropdown />
               </div>
            </header>
            <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
               <div className="max-w-[1600px] mx-auto p-3 sm:p-6 md:p-8">
                  {children}
               </div>
            </main>
         </div>
      </div>
   );
};

const HubSelector = () => {
   const { user, hub, setHub } = useAuth();
   const [open, setOpen] = useState(false);
   const [hubs, setHubs] = useState([]);
   const [loading, setLoading] = useState(false);

   const fetchHubs = async () => {
      if (!user) return;
      setLoading(true);
      try {
         const { data } = await axiosInstance.get('/delivery/hubs');
         setHubs(data.hubs || []);
      } catch (err) {
         console.error("Hub Discovery Failed", err);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (open && hubs.length === 0) fetchHubs();
   }, [open]);

   if (user?.fulfillmentHubId) {
      return (
         <div className="flex items-center gap-2 font-black text-slate-900 text-xs uppercase tracking-widest">
            <Warehouse className="text-blue-600 w-4 h-4" strokeWidth={3} />
            {hub?.name || 'Assigned Logistics Node'}
         </div>
      );
   }

   return (
      <div className="relative">
         <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-lg transition-all border border-transparent hover:border-slate-200 group">
            <Warehouse className={`w-4 h-4 ${hub ? 'text-blue-600' : 'text-slate-400'} group-hover:scale-110 transition-transform`} />
            <div className="text-left hidden sm:block">
               <p className="text-[10px] font-black text-slate-400 tracking-widest leading-none mb-0.5 uppercase">Controlled Node</p>
               <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  {hub?.name || 'Select Hub'}
                  <ChevronDown size={12} className={`transition-transform duration-300 ${open ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
               </p>
            </div>
         </button>
         {open && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-black text-[9px] text-slate-500 uppercase tracking-widest">
                  Nodes
               </div>
               <div className="max-h-64 overflow-y-auto no-scrollbar py-1">
                  {hubs.map(h => (
                     <button key={h.id} onClick={() => { setHub(h); setOpen(false); toast.success(`Switched to ${h.name}`); window.location.reload(); }} className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${hub?.id === h.id ? 'bg-blue-50/50' : ''}`}>
                        <div><p className="text-xs font-black text-slate-900 tracking-tight">{h.name}</p><p className="text-[10px] font-bold text-slate-400">{h.town}</p></div>
                        {hub?.id === h.id && <Check size={14} className="text-blue-600" strokeWidth={4} />}
                     </button>
                  ))}
               </div>
            </div>
         )}
      </div>
   );
};

const PrivateRoute = ({ children, resource }) => {
   const { user, loading } = useAuth();
   if (loading) return null;
   if (!user) return <Navigate to="/login" />;

   if (resource && !hasAccess(user.role || [], resource)) {
      toast.error(`Unauthorized: No access to ${resource}`);
      return <Navigate to="/home" />;
   }

   // Pass read-only state to children if they are components
   const roles = user.role || [];
   const readOnly = resource ? isReadOnly(roles, resource) : false;

   return (
      <MainLayout>
         {React.cloneElement(children, { readOnly })}
      </MainLayout>
   );
};

function App() {
   return (
      <AuthProvider>
         <BrowserRouter>
            <Routes>
               <Route path="/login" element={<Login />} />
               <Route path="/" element={<PrivateRoute resource="Workbench"><Dashboard /></PrivateRoute>} />
               <Route path="/inventory" element={<PrivateRoute resource="Inbound & Stocks"><Inventory /></PrivateRoute>} />
               <Route path="/stock-adjustment/:id" element={<PrivateRoute resource="Inbound & Stocks"><StockAdjustment /></PrivateRoute>} />
               <Route path="/orders" element={<PrivateRoute resource="Order Fulfillment"><Orders /></PrivateRoute>} />
               <Route path="/orders/:id" element={<PrivateRoute resource="Order Fulfillment"><OrderDetails /></PrivateRoute>} />
               <Route path="/assign-courier/:shippingAddressId/:orderProductId" element={<PrivateRoute resource="Order Fulfillment"><AssignCourier /></PrivateRoute>} />
               <Route path="/tracking" element={<PrivateRoute resource="Track Order"><TrackingPage /></PrivateRoute>} />
               <Route path="/returns" element={<PrivateRoute resource="Returns Management"><Returns /></PrivateRoute>} />
               <Route path="/sellers" element={<PrivateRoute resource="Seller Network"><Sellers /></PrivateRoute>} />
               <Route path="/sellers/:id" element={<PrivateRoute resource="Seller Network"><SellerDetails /></PrivateRoute>} />
               <Route path="/register-seller" element={<PrivateRoute resource="Seller Network"><RegisterSeller /></PrivateRoute>} />
               <Route path="/fleet" element={<PrivateRoute resource="Last-Mile Fleet"><Fleet /></PrivateRoute>} />
               <Route path="/fleet/:id" element={<PrivateRoute resource="Last-Mile Fleet"><RiderDetails /></PrivateRoute>} />
               <Route path="/finance" element={<PrivateRoute resource="Courier Finance"><CourierFinance /></PrivateRoute>} />
                <Route path="/couriers" element={<PrivateRoute resource="Courier Management"><CourierManagement /></PrivateRoute>} />
                <Route path="/register-courier/:id" element={<PrivateRoute resource="Courier Management"><RegisterCourier /></PrivateRoute>} />
               <Route path="/register-a-rider/:id" element={<PrivateRoute resource="Last-Mile Fleet"><RegisterRider /></PrivateRoute>} />
               <Route path="/settings" element={<PrivateRoute resource="Hub Settings"><SettingsPage /></PrivateRoute>} />
               <Route path="/logs" element={<PrivateRoute resource="System Logs"><LogsPage /></PrivateRoute>} />
               <Route path="/zone-info" element={<PrivateRoute resource="Zone Logistics"><ZoneInfo /></PrivateRoute>} />
               <Route path="/logistics" element={<PrivateRoute resource="Hub Logistics"><Logistics /></PrivateRoute>} />
               <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
               <Route path="/staff-management" element={<PrivateRoute resource="Staff Intelligence"><StaffManagement /></PrivateRoute>} />
               <Route path="/staff/:id" element={<PrivateRoute resource="Staff Intelligence"><StaffDetails /></PrivateRoute>} />
               <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
               <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
         </BrowserRouter>
         <ToastContainer position="top-right" theme="colored" autoClose={3000} hideProgressBar />
      </AuthProvider>
   );
}

export default App;
