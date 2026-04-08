import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, Check, Trash2, Clock, AlertTriangle,
  Info, ShieldAlert, CheckCircle2, ChevronRight,
  Filter, MoreVertical, Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const { hub } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, archived
  const [search, setSearch] = useState('');

  const fetchNotifications = useCallback(async () => {
    if (!hub?.id) return;
    try {
      const { data } = await axiosInstance.get(`/delivery/hubs/${hub.id}/notifications`);
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync notifications');
    } finally {
      setLoading(false);
    }
  }, [hub?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await axiosInstance.patch(`/delivery/hubs/${hub.id}/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const markAllRead = async () => {
    try {
      await axiosInstance.patch(`/delivery/hubs/${hub.id}/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const deleteNotif = async (id) => {
    try {
      await axiosInstance.delete(`/delivery/hubs/${hub.id}/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'URGENT': return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const filtered = notifications.filter(n => {
    const matchesFilter = filter === 'all' || (filter === 'unread' && !n.isRead);
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* 🏙️ HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            NOTIFICATIONS
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded ">
              {notifications.filter(n => !n.isRead).length} Unread
            </span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Real-time tactical alerts for {hub?.name || 'Assigned Node'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            disabled={!notifications.some(n => !n.isRead)}
            className="px-4 py-2 bg-white border border-slate-200 rounded text-[11px] font-black  tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark All Read
          </button>
          <button
            onClick={fetchNotifications}
            className="p-2.5 bg-slate-900 text-white rounded hover:bg-slate-800 transition-all shadow-lg"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🔍 FILTERS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {['all', 'unread'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold  tracking-tight transition-all whitespace-nowrap ${filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search intelligence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* 📃 NOTIFICATIONS LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden divide-y divide-slate-100">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-6 animate-pulse flex gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-100 rounded w-1/4" />
                <div className="h-3 bg-slate-100 rounded w-3/4" />
              </div>
            </div>
          ))
        ) : filtered.length > 0 ? (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`p-6 flex flex-col sm:flex-row gap-4 sm:items-center hover:bg-slate-50/50 transition-all group ${!n.isRead ? 'bg-blue-50/20 ring-1 ring-inset ring-blue-100/50' : ''}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'URGENT' ? 'bg-rose-50 text-rose-500' :
                n.type === 'WARNING' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                }`}>
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`text-sm font-black  tracking-tight truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                    {n.title}
                  </h3>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-2 sm:mb-0">
                  {n.message}
                </p>
                <div className="flex items-center gap-3 mt-2 sm:mt-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400  tracking-tighter">
                    <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(n.createdAt))} ago
                  </div>
                  {n.type === 'URGENT' && (
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full  italic animate-pulse">Critical Priority</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotif(n.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  title="Discard notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-lg font-black text-slate-900  tracking-tight">Zero tactical alerts</h3>
            <p className="text-slate-400 text-sm font-medium max-w-[280px] mx-auto mt-2 italic">
              Your perimeter is secure. No new intelligence reports available for this node.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
