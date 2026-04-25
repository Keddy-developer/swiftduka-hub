import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';
import {
  Plus, Search, Package, RefreshCw,
  ArrowDown, ArrowUp, X, Loader2, AlertTriangle,
  Truck, Layers, CheckCircle, ChevronDown, MoreVertical,
  Edit2, Trash2, ExternalLink, Zap, Download  // Added Zap and Download icon
} from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import { toast } from 'react-toastify';
import QRCode from 'react-qr-code';
import { Html5QrcodeScanner } from 'html5-qrcode';
import LogisticsAuditTrail from '../components/LogisticsAuditTrail';
import { AuditService } from '../utils/AuditService';

// ─── Shared Components ──────────────────────────────────────────────────
const StatTile = ({ label, value, icon: Icon, color }) => {
  const colors = {
    blue: 'border-blue-500 text-blue-600 bg-blue-50/30',
    amber: 'border-amber-500 text-amber-600 bg-amber-50/30',
    green: 'border-green-500 text-green-600 bg-green-50/30',
    slate: 'border-slate-500 text-slate-600 bg-slate-50/30'
  };

  return (
    <div className={`border-l-4 p-4 bg-white border border-y-slate-200 border-r-slate-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${colors[color] || colors.slate}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-black tracking-widest text-slate-400">{label}</span>
        <Icon className="w-4 h-4 opacity-30" />
      </div>
      <p className="text-2xl font-black text-slate-900 leading-none tracking-tighter">{value}</p>
    </div>
  );
};

// ─── Adjust Units Modal REMOVED ──────────────────────────────────────────
// (Logically replaced by /stock-adjustment/:id page)

// ─── QR Code Modal ──────────────────────────────────────────────────────
const QRModal = ({ item, onClose }) => {
  const printQR = () => {
    const printContent = document.getElementById('qr-print-zone').innerHTML;
    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${item.product?.sku}</title>
          <style>
            @page { size: auto; margin: 0mm; }
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh;
              font-family: sans-serif;
            }
            .label { margin-top: 10px; font-weight: bold; font-size: 14px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          ${printContent}
          <div class="label">${item.product?.name}</div>
          <div class="label" style="font-size: 12px; color: #666;">SKU: ${item.product?.sku}</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function(){ window.close(); }, 100);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black text-slate-900">Product QR Code</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900"><X size={20} /></button>
        </div>

        <div id="qr-print-zone" className="bg-white p-6 inline-block border-2 border-slate-100 rounded-2xl shadow-inner mb-6">
          {(() => {
            const QRCodeComponent = QRCode.default || QRCode;
            return <QRCodeComponent value={item.product?.sku || item.productId} size={180} />;
          })()}
        </div>

        <div className="mb-8">
          <p className="font-black text-slate-900 truncate">{item.product?.name}</p>
          <p className="text-[10px] font-mono text-slate-400 font-bold tracking-widest mt-1">SKU: {item.product?.sku}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded text-[10px] font-black tracking-widest uppercase">Close</button>
          <button onClick={printQR} className="flex-1 py-3 bg-slate-900 text-white rounded text-[10px] font-black tracking-widest uppercase shadow-xl flex items-center justify-center gap-2">
            <Layers className="w-3.5 h-3.5" /> Print Tag
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Scanner Modal ──────────────────────────────────────────────────────
const ScannerModal = ({ onClose, onScan }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    });

    scanner.render((result) => {
      onScan(result);
      scanner.clear();
      onClose();
    }, (error) => {
      // Fail silently for scan errors to avoid flooding
    });

    return () => {
      scanner.clear().catch(e => console.error("Scanner cleanup failed", e));
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-900 flex items-center justify-between text-white">
          <h3 className="font-black text-sm tracking-widest uppercase">Scanner</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div id="reader" className="p-4 bg-slate-50"></div>
        <div className="p-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Point the camera at the product barcode</p>
        </div>
      </div>
    </div>
  );
};

// ─── Inventory Card Component ─────────────────────────────────────────────────────
const InventoryCard = ({ item, onAdjust, onQR, onDelete, onQuickAdd, readOnly }) => {
  const isLow = (item.quantity ?? 0) <= (item.lowStockAlert ?? 10);
  const lastDate = item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'INITIAL';

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative">
      <div className="p-4 flex gap-4">
        <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-100 p-1 flex-shrink-0 relative overflow-hidden">
          {item.product?.image ? (
            <img src={item.product.image} className="w-full h-full object-cover rounded shadow-sm group-hover:scale-110 transition-transform duration-500" alt="" />
          ) : (
            <Package size={24} className="text-slate-200 m-auto" />
          )}
          {isLow && (
            <div className="absolute top-0 right-0 p-1 bg-amber-500 shadow-lg">
              <AlertTriangle className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-black text-slate-900 text-xs truncate leading-tight tracking-tight pr-4">{item.product?.name}</h3>
            <div className="flex gap-1">
              <button onClick={onQR} className="p-1 px-2 border border-slate-100 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
                <Zap className="w-3 h-3" />
              </button>
              {!readOnly && (
                <>
                  <button onClick={onQuickAdd} title="Quick Add Stock" className="p-1 px-2 border border-slate-100 rounded text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={onAdjust} title="Adjust Stock" className="p-1 px-2 border border-slate-100 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={onDelete} className="p-1 px-2 border border-slate-100 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-[9px] font-mono text-slate-400 font-black mt-1">#{item.product?.sku || 'NO-SKU'}</p>
          <p className="text-[10px] font-bold text-slate-500 mt-2 truncate italic">{item.product?.seller?.storeName || 'PLATFORM ASSET'}</p>
        </div>
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-slate-400 tracking-widest leading-none">Stock</span>
          <span className={`text-xl font-black tracking-tighter ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
            {(item.quantity ?? 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-400">Pcs</span>
          </span>
        </div>
        <div className="text-right">
          <span className="text-[8px] font-black text-slate-400 tracking-widest leading-none">Last Updated</span>
          <p className="text-[10px] font-black text-slate-900 mt-1">{lastDate}</p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 h-1 bg-blue-600 transition-all duration-300 w-0 group-hover:w-full opacity-0 group-hover:opacity-100"></div>
    </div>
  );
};

// ─── Receive Shipment Modal ──────────────────────────────────────────────────
const ReceiveShipmentModal = ({ hub, onClose, onSuccess, preSelectedProduct }) => {
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(preSelectedProduct || null);
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const searchProducts = useCallback(async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      // Adjusted to use explicit query params as per backend requirements
      const { data } = await axiosInstance.get(`/products`, { params: { search: q, limit: 10 } });
      setSearchResults(data?.data || data?.products || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productSearch), 300);
    return () => clearTimeout(t);
  }, [productSearch, searchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return toast.error('Selection required');
    if (!quantity || parseInt(quantity) <= 0) return toast.error('Invalid quantity');
    setSubmitting(true);
    try {
      await axiosInstance.patch(`/delivery/hubs/${hub.id}/inventory`, {
        productId: selected.id,
        quantity: parseInt(quantity),
        mode: 'add',
        notes: `INBOUND: ${supplier || 'Direct Inbound'}. ${notes}`.trim()
      });
      toast.success('Inventory manifest updated');
      // Audit log
      AuditService.logAction(hub.id, 'INBOUND_RECEIPT', {
        message: `Received ${quantity} units of ${selected.name} from ${supplier || 'Direct Inbound'}`,
        sku: selected.sku,
        quantity: parseInt(quantity),
        supplier: supplier
      });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Sync error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 bg-slate-900 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">Add Stock</h2>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-1">Receive new items into the hub</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">Product</label>
            {selected ? (
              <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
                <img src={selected.image} alt="" className="w-12 h-12 rounded bg-white object-cover border border-blue-200 shadow-sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-sm truncate tracking-tight">{selected.name}</p>
                  <p className="text-[10px] font-mono text-blue-600 font-black">SKU: {selected.sku || 'N/A'}</p>
                </div>
                <button type="button" onClick={() => { setSelected(null); setProductSearch(''); }} className="p-2 text-slate-400 hover:text-rose-600 bg-white rounded-full shadow-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" placeholder="Search or scan product SKU..."
                  value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-slate-900 shadow-sm transition-all"
                />
                {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[240px] overflow-y-auto no-scrollbar border-t-0 p-1">
                    {searchResults.map(p => (
                      <button key={p.id} type="button" onClick={() => { setSelected(p); setSearchResults([]); setProductSearch(''); }}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 text-left rounded-lg transition-colors group"
                      >
                        <img src={p.image} alt="" className="w-10 h-10 rounded object-cover shadow-sm grayscale group-hover:grayscale-0 transition-all" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-slate-900 truncate tracking-tight">{p.name}</p>
                          <p className="text-[9px] font-mono text-slate-400 font-bold tracking-widest mt-0.5">{p.sku || 'NO-SKU'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">Quantity</label>
              <input type="number" min="1" placeholder="Units Count" value={quantity} onChange={e => setQuantity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-lg font-black outline-none focus:bg-white focus:border-slate-900 shadow-sm transition-all" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">Supplier</label>
              <input type="text" placeholder="Vendor / Store" value={supplier} onChange={e => setSupplier(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-slate-900 shadow-sm transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 tracking-widest ml-1">Notes</label>
            <textarea placeholder="Any extra details about this stock..." value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs font-medium outline-none focus:bg-white focus:border-slate-900 shadow-sm transition-all resize-none h-24" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 rounded text-[11px] font-black tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={submitting || !selected}
              className="flex-1 py-3 bg-slate-900 text-white rounded text-[11px] font-black tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Inventory Page ─────────────────────────────────────────────────────
const Inventory = ({ readOnly }) => {
  const { hub } = useAuth();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [qrItem, setQrItem] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState(null);

  const handleDownloadInventory = () => {
    if (!inventory.length) return toast.error("No inventory to export");
    setDownloading(true);
    toast.info("Generating inventory report...");

    const exportData = inventory.map(item => ({
      Product: item.product?.name || 'N/A',
      SKU: item.product?.sku || 'N/A',
      Seller: item.product?.seller?.storeName || 'Platform',
      Stock: item.quantity ?? 0,
      Price: item.product?.price || 0,
      TotalValue: (item.quantity ?? 0) * (item.product?.price || 0),
      LowStockLimit: item.lowStockAlert || 10,
      LastUpdate: item.lastRestocked ? new Date(item.lastRestocked).toLocaleString() : 'N/A'
    }));

    exportToCSV(exportData, `Inventory_Report_${hub?.name || 'Hub'}`, [
      "Product", "SKU", "Seller", "Stock", "Price", "TotalValue", "LowStockLimit", "LastUpdate"
    ]);

    setDownloading(false);
    toast.success("Download started");
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!hub?.id) return setLoading(false);
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await axiosInstance.get(`/delivery/hubs/${hub.id}/inventory`);
      setInventory(data.inventory || []);
    } catch {
      toast.error('Network sync failure');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hub]);

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to remove ${productName} from hub inventory? This action will decommission the product from this hub.`)) return;
    
    try {
      setRefreshing(true);
      await axiosInstance.delete(`/delivery/hubs/${hub.id}/inventory`, {
        params: { productId }
      });
      toast.success(`${productName} decommissioned successfully`);
      
      // Audit log
      AuditService.logAction(hub.id, 'INVENTORY_DECOMMISSION', {
        message: `Decommissioned ${productName} from hub inventory`,
        productId: productId
      });

      fetchData(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove product from inventory");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const lowStockCount = inventory.filter(i => i.quantity <= (i.lowStockAlert ?? 10)).length;
  const totalUnits = inventory.reduce((s, i) => s + i.quantity, 0);

  const filtered = inventory.filter(item => {
    const matchesSearch =
      item.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.product?.sku?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterLowStock ? item.quantity <= (item.lowStockAlert ?? 10) : true;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 opacity-50">
      <Loader2 className="w-8 h-8 animate-spin mb-3 text-slate-400" />
      <span className="text-xs font-bold tracking-widest text-slate-500">Loading inventory...</span>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500">
      {showReceiveModal && <ReceiveShipmentModal hub={hub} onClose={() => setShowReceiveModal(false)} onSuccess={() => fetchData(true)} readOnly={readOnly} />}
      {quickAddProduct && <ReceiveShipmentModal hub={hub} preSelectedProduct={quickAddProduct} onClose={() => setQuickAddProduct(null)} onSuccess={() => fetchData(true)} />}
      {qrItem && <QRModal item={qrItem} onClose={() => setQrItem(null)} />}
      {showScanner && <ScannerModal onClose={() => setShowScanner(false)} onScan={(res) => setSearch(res)} />}

      {/* ── TOP NAV ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-6 gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-xs md:text-sm text-slate-500 font-bold tracking-wide mt-1">Manage your hub stock</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handleDownloadInventory} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 tracking-widest">
            <Download className="w-3.5 h-3.5" /> Reports
          </button>
          <button onClick={() => fetchData(true)} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 tracking-widest">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {!readOnly && (
            <button onClick={() => setShowReceiveModal(true)} className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded text-[10px] font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200 tracking-widest">
              <Plus size={16} /> Add Stock
            </button>
          )}
        </div>
      </div>

      {/* ── KPI GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <StatTile label="Total Products" value={inventory.length} icon={Layers} color="slate" />
        <StatTile label="Total Units" value={totalUnits.toLocaleString()} icon={Package} color="blue" />
        <StatTile label="Low Stock Items" value={lowStockCount} icon={AlertTriangle} color="amber" />
        <StatTile label="Stock Status" value={`${inventory.length > 0 ? Math.round(((inventory.length - lowStockCount) / inventory.length) * 100) : 100}%`} icon={CheckCircle} color="green" />
      </div>

      {/* ── SEARCH & FILTERS ── */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          <input type="text" placeholder="Scan or search products..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-slate-900 transition-all" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowScanner(true)}
            className="px-6 py-3 bg-white border border-slate-200 rounded-lg text-[10px] font-black tracking-widest text-slate-500 hover:text-slate-900 hover:border-slate-900 transition-all flex items-center gap-2">
            <Zap className="w-4 h-4" /> Scan
          </button>
          <button onClick={() => setFilterLowStock(f => !f)}
            className={`px-6 py-3 rounded-lg text-[10px] font-black tracking-widest border transition-all flex items-center justify-center gap-2 whitespace-nowrap ${filterLowStock ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'}`}>
            <AlertTriangle className="w-3.5 h-3.5" /> {filterLowStock ? 'Filter Active' : 'Low Stock Only'}
          </button>
        </div>
      </div>

      {/* ── INVENTORY LEDGER (MOBILE OPTIMIZED) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(item => (
          <InventoryCard
            key={item.id}
            item={item}
            onAdjust={() => navigate('/stock-adjustment/' + item.id)}
            onQR={() => setQrItem(item)}
            onDelete={() => handleDelete(item.productId, item.product?.name)}
            onQuickAdd={() => setQuickAddProduct(item.product)}
            readOnly={readOnly}
          />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-3xl opacity-40">
            <Package size={48} className="mx-auto mb-4 text-slate-300 animate-pulse" />
            <h3 className="text-sm font-black tracking-[0.3em] text-slate-400">No Products Found</h3>
            <p className="text-[10px] font-bold text-slate-400 mt-2">No products were found matching your search.</p>
          </div>
        )}
      </div>

      {/* ── AUDIT TRAIL ── */}
      <div className="pt-10 border-t border-slate-200">
        <div className="mb-6">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Stock Logs</h3>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-1">Recent stock changes and updates</p>
        </div>
        <LogisticsAuditTrail hubId={hub?.id || null} filterType="INVENTORY" />
      </div>

      <div className="md:hidden h-20" /> {/* Mobile bottom spacer */}
    </div>
  );
};

export default Inventory;