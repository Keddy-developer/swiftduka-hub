import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
   FiArrowLeft,
   FiPackage,
   FiTruck,
   FiMapPin,
   FiUser,
   FiCheckCircle,
   FiXCircle,
   FiClock,
   FiEye,
   FiAlertTriangle,
   FiRefreshCw,
   FiGift
} from "react-icons/fi";
import {
   FaMoneyBillWave,
   FaStore,
   FaPrint
} from "react-icons/fa";
import { QRCode } from "react-qr-code";
import ReturnForm from "../components/ReturnForm";
import { AuditService } from "../utils/AuditService";
import { useAuth } from "../contexts/AuthContext";

const OrderDetailsPage = () => {
   const { hub } = useAuth();
   const { id } = useParams();
   const navigate = useNavigate();
   const [order, setOrder] = useState(null);
   const [loading, setLoading] = useState(true);
   const [trackingNumber, setTrackingNumber] = useState(id);
   // Action Loading States
   const [loadingProcessing, setLoadingProcessing] = useState(false);
   const [loadingMarkReceived, setLoadingMarkReceived] = useState(false);
   const [loadingMarkReadyForPickup, setLoadingMarkReadyForPickup] = useState(false);
   const [loadingDeliver, setLoadingDeliver] = useState(false);
   const [loadingCancel, setLoadingCancel] = useState(false);

   // Modals Data
   const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
   const [cancelReason, setCancelReason] = useState("");
   const [selectedProductId, setSelectedProductId] = useState(null);
   const [showSellerModal, setShowSellerModal] = useState(false);

   // Assignment Selection Modal States
   const [isAssignSelectionModalOpen, setIsAssignSelectionModalOpen] = useState(false);
   const [assignmentData, setAssignmentData] = useState(null);
   const [sellerDetails, setSellerDetails] = useState(null);

   const [showQRModal, setShowQRModal] = useState(false);
   const [qrData, setQRData] = useState(null);

   const [returnModalOpen, setReturnModalOpen] = useState(false);
   const [selectedProductForReturn, setSelectedProductForReturn] = useState(null);

   const [revokingProductId, setRevokingProductId] = useState(null);

   const formatImgSrc = (src) => {
      if (!src) return "";
      if (src.startsWith('http') || src.startsWith('data:')) return src;
      // Detection for common base64 patterns
      if (src.startsWith('/9j/')) return `data:image/jpeg;base64,${src}`;
      if (src.startsWith('iVBOR')) return `data:image/png;base64,${src}`;
      if (src.startsWith('PHN2')) return `data:image/svg+xml;base64,${src}`;
      return `data:image/png;base64,${src}`;
   };

   const handleRevokeAssignment = async (productId, orderId, reassignCourierId = null) => {
      setRevokingProductId(productId);
      try {
         await axiosInstance.post(`/delivery/hubs/${hub?.id}/couriers/revoke-assignment`, {
            orderProductId: productId,
            orderId,
            reassignToCourierId: reassignCourierId || undefined
         });
         toast.success(reassignCourierId ? 'Assignment revoked and reassigned' : 'Assignment revoked — courier notified');
         await fetchOrderDetails();
      } catch (err) {
         toast.error(err.response?.data?.message || 'Failed to revoke assignment');
      } finally {
         setRevokingProductId(null);
      }
   };

   const fetchOrderDetails = async () => {
      try {
         const res = await axiosInstance.get(`/order/admin/${id}`);
         const data = res.data.data || res.data;

         // Validate data structure to prevent crashes in render
         if (data && typeof data === 'object' && Array.isArray(data.products)) {
            setOrder(data);
            setTrackingNumber(data.trackingNumber);
         } else {
            console.error("Invalid order data format:", data);
            toast.error("Invalid order data received from server");
            setOrder(null);
         }
      } catch (error) {
         console.error("Error fetching order details:", error);
         toast.error("Failed to load order details");
         setOrder(null);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (id) {
         fetchOrderDetails();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [id]);

   // Handlers
   const handleToggleProcessing = async () => {
      setLoadingProcessing(true);
      try {
         await axiosInstance.patch(`/order/${trackingNumber}/processing`, {});
         toast.success("Order marked as processing!");
         await fetchOrderDetails();
      } catch (err) {
         toast.error("Failed to update order status.");
      } finally {
         setLoadingProcessing(false);
      }
   };

   const handleMarkReceived = async (orderProductId) => {
      setLoadingMarkReceived(true);
      try {
         await axiosInstance.patch(`/order/${trackingNumber}/mark-received`, { orderProductId });
         toast.success("Order marked as received!");
         // Audit Log
         if (AuditService && hub?.id) {
            AuditService.logAction(hub?.id, 'HUB_RECEIPT', {
               message: `Handover received for Order #${trackingNumber}`,
               trackingNumber: trackingNumber,
               orderProductId: orderProductId
            });
         }
         await fetchOrderDetails();
      } catch (err) {
         toast.error("Failed to update order status.");
      } finally {
         setLoadingMarkReceived(false);
      }
   };

   const handleMarkReadyForPickup = async (orderProductId) => {
      setLoadingMarkReadyForPickup(true);
      try {
         await axiosInstance.patch(`/order/${trackingNumber}/admin-ready-for-pickup`, { orderProductId });
         toast.success("Order marked as ready for pickup!");
         // Audit Log
         if (AuditService && hub?.id) {
            AuditService.logAction(hub?.id, 'READY_FOR_PICKUP_UPDATE', {
               message: `Order #${trackingNumber} moved to Ready for Pickup`,
               trackingNumber: trackingNumber,
               orderProductId: orderProductId
            });
         }
         await fetchOrderDetails();
      } catch (err) {
         toast.error(`Failed to update order status: ${err.response?.data?.message || err.message}`);
      } finally {
         setLoadingMarkReadyForPickup(false);
      }
   };

   const handleToggleDelivered = async () => {
      setLoadingDeliver(true);
      try {
         await axiosInstance.patch(`/order/${trackingNumber}/delivered`, {});
         toast.success("Order marked as delivered!");
         await fetchOrderDetails();
      } catch (err) {
         toast.error("Failed to update order status.");
      } finally {
         setLoadingDeliver(false);
      }
   };

   const handleCancelProductOrder = (productId) => {
      setSelectedProductId(productId);
      setIsCancelModalOpen(true);
   };

   const handleConfirmCancel = async () => {
      if (!cancelReason.trim()) {
         toast.error("Please enter a cancellation reason.");
         return;
      }
      setLoadingCancel(true);
      try {
         await axiosInstance.patch(`/order/${trackingNumber}/cancel`, {
            cancellationReason: cancelReason,
            orderProductId: selectedProductId
         });
         toast.success("Product/Order cancelled.");
         // Audit Log
         if (AuditService && hub?.id) {
            AuditService.logAction(hub?.id, 'ORDER_CANCELLATION', {
               message: `Cancelled item in Order #${trackingNumber}. Reason: ${cancelReason}`,
               trackingNumber: trackingNumber,
               reason: cancelReason
            });
         }
         setIsCancelModalOpen(false);
         setCancelReason("");
         await fetchOrderDetails();
      } catch (err) {
         toast.error("Failed to cancel order.");
      } finally {
         setLoadingCancel(false);
      }
   };

   const handleViewSeller = (seller) => {
      setSellerDetails(seller);
      setShowSellerModal(true);
   };

   const handleShowQR = (product) => {
      setQRData(`${trackingNumber}|${product.id}`);
      setShowQRModal(true);
   };

   const handlePrintQR = () => {
      const printWindow = window.open('', '_blank');
      const qrElement = document.querySelector('#qr-code-to-print');
      if (!qrElement || !printWindow) {
         toast.error("Failed to generate QR for printing");
         return;
      }

      const qrSvg = qrElement.innerHTML;

      printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR Code - ${trackingNumber}</title>
                    <style>
                        body { 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            justify-content: center; 
                            height: 100vh; 
                            margin: 0;
                            font-family: sans-serif;
                        }
                        .qr-container { 
                            padding: 20px; 
                            border: 1px solid #eee;
                            text-align: center;
                        }
                        .label { 
                            margin-top: 15px; 
                            font-size: 14px; 
                            color: #666; 
                        }
                        .tracking {
                            font-weight: bold;
                            font-size: 18px;
                            margin-top: 5px;
                        }
                    </style>
                </head>
                <body>
                    <div class="qr-container">
                        ${qrSvg}
                        <div class="label">IKOSOKO Tracking ID</div>
                        <div class="tracking">${trackingNumber}</div>
                    </div>
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => window.close();
                        };
                    <\/script>
                </body>
            </html>
        `);
      printWindow.document.close();
   };

   const handlePrintLabel = (product) => {
      // Set QR data for the specific product
      const qrVal = `${trackingNumber}|${product.id}`;
      setQRData(qrVal);

      // Wait a tiny bit for the hidden QR component to render/update
      setTimeout(() => {
         const qrContainer = document.getElementById('hidden-qr-print-container');
         if (!qrContainer) {
            toast.error("Failed to generate QR for label");
            return;
         }

         const qrSvg = qrContainer.innerHTML;
         if (!qrSvg) {
            toast.error("Failed to generate QR for label");
            return;
         }

         const printWindow = window.open('', '_blank');
         if (!printWindow) {
            toast.error("Failed to open print window");
            return;
         }

         const productName = product.product?.name || "N/A";
         const variant = product.variant && typeof product.variant === 'object'
            ? Object.values(product.variant).map(v => v.combo?.key || v.key).join(", ")
            : "Standard";
         const customerName = order.shippingAddress?.name || "N/A";
         const town = order.shippingAddress?.town || (order.pickUpStation?.name) || "N/A";

         printWindow.document.write(`
                <html>
                    <head>
                        <title>Label - ${trackingNumber}</title>
                        <style>
                            @page { size: auto; margin: 0mm; }
                            body { font-family: 'Inter', system-ui, sans-serif; margin: 0; padding: 10px; display: flex; justify-content: center; background: #fff; }
                            .label-card { 
                                width: 380px; 
                                border: 2.5px solid #000; 
                                padding: 20px; 
                                display: flex; 
                                flex-direction: column; 
                                align-items: center;
                                position: relative;
                            }
                            .header { 
                                font-size: 18px; 
                                font-weight: 900; 
                                border-bottom: 3px solid #000; 
                                width: 100%; 
                                text-align: center; 
                                padding-bottom: 15px; 
                                margin-bottom: 20px;
                                letter-spacing: 1px;
                            }
                            .qr-section { margin-bottom: 15px; }
                            .tracking-id { 
                                font-size: 28px; 
                                font-weight: 900; 
                                margin-bottom: 20px; 
                                border: 2px dashed #000; 
                                padding: 8px 15px;
                                letter-spacing: 2px;
                            }
                            .info-section { 
                                width: 100%; 
                                text-align: left; 
                                font-size: 14px; 
                                line-height: 1.6; 
                                border-top: 2px solid #000; 
                                padding-top: 15px; 
                            }
                            .row { display: flex; margin-bottom: 6px; }
                            .info-label { font-weight: 500; width: 100px; color: #444; }
                            .info-value { font-weight: 800; flex: 1; color: #000; word-break: break-word; }
                            .footer { 
                                margin-top: 20px; 
                                font-size: 10px; 
                                font-weight: 600;
                                color: #666; 
                                text-transform: uppercase;
                                border-top: 1px solid #eee;
                                width: 100%;
                                padding-top: 10px;
                                text-align: center;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="label-card">
                            <div class="header">IKOSOKO HANDOVER</div>
                            <div class="qr-section">${qrSvg}</div>
                            <div class="tracking-id">${trackingNumber}</div>
                            <div class="info-section">
                                <div class="row"><div class="info-label">Product:</div><div class="info-value">${productName}</div></div>
                                <div class="row"><div class="info-label">Variant:</div><div class="info-value">${variant}</div></div>
                                <div class="row"><div class="info-label">Customer:</div><div class="info-value">${customerName}</div></div>
                                <div class="row"><div class="info-label">Dest:</div><div class="info-value">${town}</div></div>
                                <div class="row"><div class="info-label">Order Prod:</div><div class="info-value">#${product.id || product.orderProductId}</div></div>
                            </div>
                            <div class="footer">Printed: ${new Date().toLocaleString()}</div>
                        </div>
                        <script>
                            window.onload = () => {
                                window.print();
                                setTimeout(() => window.close(), 1000);
                            };
                        <\/script>
                    </body>
                </html>
            `);
         printWindow.document.close();
      }, 100);
   };

   const StatusBadge = ({ status }) => {
      const config = {
         Processing: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: FiClock },
         Shipped: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: FiTruck },
         Delivered: { color: "bg-green-100 text-green-800 border-green-200", icon: FiCheckCircle },
         ReadyForPickup: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: FiPackage },
         ArrivedAtStation: { color: "bg-teal-100 text-teal-800 border-teal-200", icon: FiMapPin },
         Cancelled: { color: "bg-red-100 text-red-800 border-red-200", icon: FiXCircle },
         Pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: FiClock },
         ReadyForLogistics: { color: "bg-indigo-100 text-indigo-800 border-indigo-200", icon: FiTruck }
      };
      const style = config[status] || config.Pending;
      const Icon = style.icon;

      return (
         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style.color}`}>
            <Icon className="w-3.5 h-3.5" />
            {status}
         </span>
      );
   };

   const ActionButton = ({ onClick, loading, variant = "primary", children, className, disabled = false }) => {
      const variants = {
         primary: "bg-blue-600 hover:bg-blue-700 text-white",
         warning: "bg-orange-500 hover:bg-orange-600 text-white",
         danger: "bg-red-600 hover:bg-red-700 text-white",
         success: "bg-green-600 hover:bg-green-700 text-white",
         purple: "bg-purple-600 hover:bg-purple-700 text-white"
      };

      // Combine base variant class with custom className if provided
      const btnClass = `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${variants[variant] || variants.primary} ${className || ""}`;

      return (
         <button onClick={onClick} disabled={loading || disabled} className={btnClass}>
            {loading ? "Updating..." : children}
         </button>
      );
   };

   // Elapsed time since assignment was made (counts UP). expiresAt = assignedAt + 20min
   const ElapsedTimer = ({ assignmentExpiresAt }) => {
      const WINDOW_MS = 20 * 60 * 1000;
      const assignedAt = new Date(new Date(assignmentExpiresAt).getTime() - WINDOW_MS);
      const [elapsed, setElapsed] = useState(Math.max(0, Date.now() - assignedAt.getTime()));

      useEffect(() => {
         const interval = setInterval(() => {
            setElapsed(Math.max(0, Date.now() - assignedAt.getTime()));
         }, 1000);
         return () => clearInterval(interval);
      }, [assignmentExpiresAt]);

      const totalSeconds = Math.floor(elapsed / 1000);
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      const isOverdue = elapsed >= WINDOW_MS;

      return (
         <span className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 border ${isOverdue
            ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
            : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
            <FiClock className="w-3.5 h-3.5" />
            <span className="font-mono">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
            <span className="font-normal">{isOverdue ? '— OVERDUE' : ' elapsed'}</span>
         </span>
      );
   };

   if (loading) {
      return (
         <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
         </div>
      );
   }
   if (!order) {
      return (
         <div className="flex flex-col items-center justify-center py-20">
            <FiPackage className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">Order not found</h3>
            <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">
               Go Back
            </button>
         </div>
      );
   }

   return (
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
               onClick={() => navigate(-1)}
               className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
               <FiArrowLeft className="w-5 h-5" />
               <span>Back to Orders</span>
            </button>
            <div className="flex items-center gap-3">
               <span className="text-sm text-gray-500">
                  Ordered on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recent"}
               </span>
               <StatusBadge status={order.products[0]?.deliveryStatus || "Pending"} />
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Order Details */}
            <div className="lg:col-span-2 space-y-6">

               {/* Order Info Card */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                     <div className="flex items-center justify-between">
                        <div>
                           <h1 className="text-2xl font-bold text-gray-900 truncate max-w-[300px]" title={order.trackingNumber}>#{order.trackingNumber}</h1>
                           <p className="text-sm text-gray-500 mt-1">
                              {order.products.length} Items • Total: Ksh {((order.totalCost ?? 0) + (order.creditApplied ?? 0)).toLocaleString()}
                           </p>
                        </div>
                        <div className="flex items-center gap-2">
                           {order.deliveryType && (
                              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100">
                                 {order.deliveryType}
                              </span>
                           )}
                           {order.isGiftOrder && (
                              <span className="px-3 py-1 bg-pink-100 text-pink-700 text-xs font-semibold rounded-lg border border-pink-200 flex items-center gap-1">
                                 <FiGift /> Gift Order
                              </span>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Customer Details */}
                     <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                           <FiUser className="text-gray-400" /> Customer Details
                        </h3>
                        <div className="space-y-2 text-sm overflow-hidden">
                           <p className="truncate" title={order.shippingAddress?.name || "N/A"}><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{order.shippingAddress?.name || "N/A"}</span></p>
                           <p className="truncate" title={order.shippingAddress?.phoneNumber || "N/A"}><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-900">{order.shippingAddress?.phoneNumber || "N/A"}</span></p>
                           <p className="truncate" title={order.shippingAddress?.email || "N/A"}><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{order.shippingAddress?.email || "N/A"}</span></p>
                        </div>
                     </div>

                     {/* Shipping Details */}
                     <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                           <FiMapPin className="text-gray-400" /> Shipping Info
                        </h3>
                        <div className="space-y-2 text-sm">
                           <p><span className="text-gray-500">Town:</span> <span className="font-medium text-gray-900">{order.shippingAddress?.town || "N/A"}</span></p>
                           <p><span className="text-gray-500">Address:</span> <span className="font-medium text-gray-900">{order.shippingAddress?.address || "N/A"}</span></p>
                           {(order.deliveryArea || order.shippingAddress?.deliveryArea || order.shippingAddress?.town) && (
                              <p><span className="text-gray-500">Area:</span> <span className="font-medium text-gray-900">
                                 {order.deliveryArea?.name || order.shippingAddress?.deliveryArea?.name || order.shippingAddress?.town || "N/A"}
                              </span></p>
                           )}
                        </div>
                     </div>

                     {/* Pickup station/ delivery area */}
                     {order.deliveryType === "PICKUP" ? (
                        <div className="space-y-4">
                           <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              <FiMapPin className="text-gray-400" /> Pickup Station
                           </h3>
                           <div className="space-y-2 text-sm">
                              <p><span className="text-gray-500">Pickup Station:</span> <span className="font-medium text-gray-900">{order.pickupStation?.name || "N/A"}</span></p>
                           </div>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              <FiMapPin className="text-gray-400" /> Delivery Area
                           </h3>
                           <div className="space-y-2 text-sm">
                              <p><span className="text-gray-500">Delivery Area:</span> <span className="font-medium text-gray-900">
                                 {order.deliveryArea?.name || order.shippingAddress?.deliveryArea?.name || order.shippingAddress?.town || "N/A"}
                              </span></p>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Gift Details */}
                  {order.isGiftOrder && order.giftDetails && (
                     <div className="bg-white rounded-xl shadow-sm border border-pink-200 overflow-hidden">
                        <div className="p-6 border-b border-pink-100 bg-pink-50/50">
                           <h3 className="font-semibold text-pink-900 flex items-center gap-2">
                              <FiGift className="text-pink-500" /> Gift Order Details
                           </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Recipient Info</h4>
                              <div className="space-y-2 text-sm">
                                 <p><span className="text-gray-500">Recipient Name:</span> <span className="font-medium text-gray-900">{order.giftDetails.recipientName || "N/A"}</span></p>
                                 <p><span className="text-gray-500">Recipient Phone:</span> <span className="font-medium text-gray-900">{order.recipientPhone || order.giftDetails.recipientPhone || "N/A"}</span></p>
                                 <p><span className="text-gray-500">Sender Name:</span> <span className="font-medium text-gray-900">{order.giftDetails.senderName || "N/A"}</span></p>
                                 <p><span className="text-gray-500">Relationship:</span> <span className="font-medium text-gray-900">{order.giftDetails.relationship || "N/A"}</span></p>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Gift Meta</h4>
                              <div className="space-y-2 text-sm">
                                 <p><span className="text-gray-500">Occasion:</span> <span className="font-medium text-gray-900">{order.giftDetails.occasion || "None"}</span></p>
                                 <p><span className="text-gray-500">Wrapping:</span> <span className="font-medium text-gray-900">{order.giftDetails.wrappingType || "None"}</span></p>
                                 <p><span className="text-gray-500">Scheduled:</span> <span className="font-medium text-gray-900">{order.giftDetails.scheduledDate ? new Date(order.giftDetails.scheduledDate).toLocaleDateString() : "Immediate"}</span></p>
                                 <p><span className="text-gray-500">Hide Prices:</span> <span className={`font-medium ${order.giftDetails.hidePrice ? 'text-green-600' : 'text-gray-900'}`}>{order.giftDetails.hidePrice ? 'Yes' : 'No'}</span></p>
                                 <p><span className="text-gray-500">Send Anonymously:</span> <span className={`font-medium ${order.giftDetails.isAnonymous ? 'text-green-600' : 'text-gray-900'}`}>{order.giftDetails.isAnonymous ? 'Yes' : 'No'}</span></p>
                              </div>
                           </div>

                           {/* Gift Address Details */}
                           {(order.giftDetails.giftShipmentAddress || order.giftDetails.giftPickupAddress) && (
                              <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                 <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Delivery/Pickup Address</h4>
                                 {order.giftDetails.giftShipmentAddress ? (
                                    <div className="space-y-1 text-sm">
                                       <p><span className="text-gray-500">Type:</span> <span className="font-medium">Direct Delivery</span></p>
                                       <p><span className="text-gray-500">Address:</span> <span className="font-medium">{order.giftDetails.giftShipmentAddress.address || "N/A"}</span></p>
                                       <p><span className="text-gray-500">Town:</span> <span className="font-medium">{order.giftDetails.giftShipmentAddress.town || "N/A"}, {order.giftDetails.giftShipmentAddress.county || "N/A"}</span></p>
                                    </div>
                                 ) : order.giftDetails.giftPickupAddress && (
                                    <div className="space-y-1 text-sm">
                                       <p><span className="text-gray-500">Type:</span> <span className="font-medium">Pickup Station</span></p>
                                       <p><span className="text-gray-500">Station:</span> <span className="font-medium">{order.giftDetails.giftPickupAddress.name || "N/A"}</span></p>
                                       <p><span className="text-gray-500">Location:</span> <span className="font-medium">{order.giftDetails.giftPickupAddress.address || "N/A"}, {order.giftDetails.giftPickupAddress.town || "N/A"}</span></p>
                                    </div>
                                 )}
                              </div>
                           )}
                           {order.giftDetails.message && (
                              <div className="md:col-span-2 bg-pink-50 p-4 rounded-xl border border-pink-100">
                                 <h4 className="text-xs font-bold text-pink-800 uppercase mb-2">Gift Message</h4>
                                 <p className="text-sm text-gray-700 italic">"{order.giftDetails.message}"</p>
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </div>

               {/* Products List */}
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                     <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <FiPackage className="text-gray-400" /> Order Items & Admin Actions
                     </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                     {order.products.map((product, index) => {
                        const sellerEarnings = product.calculatedSellerEarnings || 0;
                        const commissionAmount = product.calculatedCommission || 0;
                        const commissionRate = product.calculatedCommissionRate || 0;
                        const deliveryAssignment = product.deliveryAssignment || 
                           (product.deliveryAssignments && product.deliveryAssignments[0]) || 
                           order.deliveryAssignment || 
                           (order.deliveryAssignments && order.deliveryAssignments[0]);

                        const isAssignmentPending = product.assignmentExpiresAt &&
                           new Date(product.assignmentExpiresAt) > new Date() &&
                           product.assignmentStatus !== 'EXPIRED' &&
                           product.assignmentStatus !== 'ACCEPTED' &&
                           deliveryAssignment?.status === 'PENDING';

                        const isAssignmentAccepted = product.courierAccepted || 
                           ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'ARRIVED_AT_STATION'].includes(deliveryAssignment?.status);

                        const cashCollection = product.cashCollection || order.cashCollection;

                        return (
                           <div key={product.id || index} className="p-6 hover:bg-gray-50 transition-colors">
                              <div className="flex flex-col gap-4">
                                 {/* Top Row: Product Info & Actions */}
                                 <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                       <h4 className="font-medium text-gray-900">{product.product?.name || "Product Name Unavailable"}</h4>
                                       <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-500">
                                          <span>Qty: {product.quantity}</span>
                                          <span>Price: Ksh {(product.priceAtPurchase ?? 0).toLocaleString()}</span>
                                          {product.giftWrappingFee > 0 && (
                                             <span className="text-pink-600 font-medium flex items-center gap-1">
                                                <FiGift className="w-3 h-3" /> Wrapping: Ksh {(product.giftWrappingFee ?? 0).toLocaleString()}
                                             </span>
                                          )}
                                       </div>
                                       {product.variant && Object.keys(product.variant).length > 0 && (
                                          <div className="mt-2 text-xs bg-gray-100 p-2 rounded text-gray-600 inline-block">
                                             Variations: {Object.values(product.variant).map(v => v.combo?.key || v.key).join(", ")}
                                          </div>
                                       )}
                                       <div className="mt-2 flex items-center gap-2">
                                          <span className="text-sm text-gray-600">Seller: {product.product?.seller?.storeName || "N/A"}</span>
                                          {product.product?.seller && (
                                             <button
                                                onClick={() => handleViewSeller(product.product.seller)}
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                             >
                                                <FiEye /> View
                                             </button>
                                          )}
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                       <StatusBadge status={product.deliveryStatus} />
                                    </div>
                                 </div>

                                 {/* Middle Row: Financials */}
                                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-3 rounded-lg text-sm">
                                    <div className="text-center">
                                       <span className="block text-gray-500 text-xs">Seller Earns</span>
                                       <span className="font-bold text-green-600">Ksh {sellerEarnings.toFixed(2)}</span>
                                    </div>
                                    <div className="text-center">
                                       <span className="block text-gray-500 text-xs">Commission</span>
                                       <span className="font-bold text-red-600">Ksh {commissionAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="text-center">
                                       <span className="block text-gray-500 text-xs">Rate</span>
                                       <span className="font-bold text-gray-700">{commissionRate}%</span>
                                    </div>
                                    <div className="text-center">
                                       <span className="block text-gray-500 text-xs">Product Total</span>
                                       <span className="font-bold text-blue-600">Ksh {(product.calculatedSubtotal || 0).toFixed(2)}</span>
                                    </div>
                                 </div>

                                 {/* Bottom Row: Actions & Proofs */}
                                 <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                                    <div className="flex flex-wrap gap-3">
                                       {deliveryAssignment?.status === 'DELIVERED' && (deliveryAssignment.proofOfDelivery || deliveryAssignment.signature) && (
                                          <div className="flex gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                                             {deliveryAssignment.proofOfDelivery && (
                                                <div className="group relative">
                                                   <img src={formatImgSrc(deliveryAssignment.proofOfDelivery)} className="w-10 h-10 object-cover rounded-lg shadow-sm border border-white" alt="POD" />
                                                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer" onClick={() => window.open(deliveryAssignment.proofOfDelivery, '_blank')}>
                                                      <FiEye className="text-white w-4 h-4" />
                                                   </div>
                                                </div>
                                             )}
                                             {deliveryAssignment.signature && (
                                                <div className="group relative">
                                                   <img src={formatImgSrc(deliveryAssignment.signature)} className="w-10 h-10 object-contain bg-white rounded-lg shadow-sm border border-white" alt="Signature" />
                                                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer" onClick={() => window.open(deliveryAssignment.signature, '_blank')}>
                                                      <FiEye className="text-white w-4 h-4" />
                                                   </div>
                                                </div>
                                             )}
                                             <div className="flex flex-col justify-center px-1">
                                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">POD ASSETS</span>
                                                <span className="text-[9px] font-bold text-emerald-700">VERIFIED</span>
                                             </div>
                                          </div>
                                       )}

                                       {cashCollection && (
                                          <div className={`flex flex-col justify-center px-3 py-1.5 rounded-xl border ${cashCollection.surrenderedStatus === 'SURRENDERED' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                             <div className="flex items-center gap-1.5 mb-0.5">
                                                <FaMoneyBillWave size={10} />
                                                <span className="text-[8px] font-black uppercase tracking-widest">COD: KSh {cashCollection.cashAmount?.toLocaleString() || 0}</span>
                                             </div>
                                             <span className="text-[9px] font-black uppercase tracking-tighter">{cashCollection.surrenderedStatus?.replace('_', ' ') || "PENDING"}</span>
                                          </div>
                                       )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 justify-end">
                                       {/* Mark Processing (Waiting Seller) */}
                                       {product.deliveryStatus !== "Cancelled" &&
                                          product.deliveryStatus !== "Processing" &&
                                          product.deliveryStatus !== "Shipped" &&
                                          product.deliveryStatus !== "Delivered" &&
                                          product.deliveryStatus !== "ReadyForLogistics" &&
                                          product.deliveryStatus !== "ReadyForPickup" &&
                                          product.deliveryStatus !== "ArrivedAtStation" && (
                                             <span className="px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-lg">
                                                Waiting Seller to Process
                                             </span>
                                          )}

                                       {/* Courier Assignment Block */}
                                       {product.adminReceived && !isAssignmentAccepted && product.deliveryStatus === "ReadyForLogistics" && !order.pickUpStation?.isPickupStation && (
                                          isAssignmentPending ? (
                                             <div className="flex flex-wrap items-center gap-2 w-full mt-1">
                                                <ElapsedTimer assignmentExpiresAt={product.assignmentExpiresAt} />
                                                <span className="px-2.5 py-1.5 bg-orange-50 text-orange-700 text-[10px] font-bold rounded-lg border border-orange-200 uppercase tracking-wider">
                                                   Awaiting Courier Acceptance
                                                </span>
                                                <div className="flex gap-2 ml-auto">
                                                   <button
                                                      disabled={revokingProductId === product.id}
                                                      onClick={() => handleRevokeAssignment(product.id, order.id)}
                                                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                                                   >
                                                      {revokingProductId === product.id ? 'Revoking...' : 'Revoke'}
                                                   </button>
                                                   <button
                                                      disabled={revokingProductId === product.id}
                                                      onClick={async () => {
                                                         await handleRevokeAssignment(product.id, order.id);
                                                         navigate(`/assign-courier/${product.id}?orderId=${order.id}&productId=${product.productId}`);
                                                      }}
                                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                                                   >
                                                      Revoke &amp; Reassign
                                                   </button>
                                                </div>
                                             </div>
                                          ) : (
                                             <ActionButton
                                                onClick={() => {
                                                   setAssignmentData({
                                                      addressId: order.shippingAddress?.id,
                                                      productId: product.id,
                                                      orderId: order.id
                                                   });
                                                   setIsAssignSelectionModalOpen(true);
                                                }}
                                                variant="warning"
                                                className="bg-amber-500 hover:bg-amber-600"
                                             >
                                                Assign Courier
                                             </ActionButton>
                                          )
                                       )}

                                       {/* Mark Ready For Pickup - Manual Toggle */}
                                       {product.deliveryStatus === "ArrivedAtStation" && (
                                          <ActionButton
                                             onClick={() => handleMarkReadyForPickup(product.id)}
                                             loading={loadingMarkReadyForPickup}
                                             variant="success"
                                             className="bg-green-600 hover:bg-green-700"
                                          >
                                             Ready For Pickup
                                          </ActionButton>
                                       )}

                                       {/* Ready For Pickup Status Label */}
                                       {product.deliveryStatus === "ReadyForPickup" && (
                                          <span className="px-3 py-1.5 bg-green-100 text-green-800 text-xs font-medium rounded-lg flex items-center gap-1">
                                             <FiCheckCircle className="w-3 h-3" /> Ready For Pickup
                                          </span>
                                       )}

                                       {isAssignmentAccepted && (
                                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1.5">
                                             <FiCheckCircle className="w-3.5 h-3.5" />
                                             Courier Accepted — En Route
                                          </span>
                                       )}

                                       {/* Mark Received */}
                                       {product.deliveryStatus === "ReadyForLogistics" && !product.adminReceived && (
                                          <ActionButton
                                             onClick={() => handleMarkReceived(product.id)}
                                             loading={loadingMarkReceived}
                                             variant="purple"
                                          >
                                             Mark Received
                                          </ActionButton>
                                       )}

                                       {/* Show QR Code */}
                                       <ActionButton
                                          onClick={() => handleShowQR(product)}
                                          variant="primary"
                                          className="bg-gray-800 hover:bg-black"
                                       >
                                          Show QR
                                       </ActionButton>

                                       {/* Print QR Label */}
                                       <ActionButton
                                          onClick={() => handlePrintLabel(product)}
                                          variant="primary"
                                          className="bg-blue-600 hover:bg-blue-700 font-bold"
                                       >
                                          <FaPrint className="mr-1 inline-block" /> Print Label
                                       </ActionButton>

                                       {/* Cancel Product */}
                                       {product.deliveryStatus !== "Delivered" && product.deliveryStatus !== "Cancelled" && (
                                          <ActionButton
                                             onClick={() => handleCancelProductOrder(product.id)}
                                             variant="danger"
                                          >
                                             Cancel Product
                                          </ActionButton>
                                       )}

                                       {/* Admin Initiate Return */}
                                       <ActionButton
                                          onClick={() => {
                                             setSelectedProductForReturn({
                                                ...product,
                                                orderId: order.trackId || order.id,
                                                productId: product.productId || product.id,
                                                priceAtPurchase: product.priceAtPurchase || (product.total / (product.quantity || 1))
                                             });
                                             setReturnModalOpen(true);
                                          }}
                                          variant="warning"
                                       >
                                          Initiate Return
                                       </ActionButton>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>

            {/* Sidebar - Summary & Actions */}
            <div className="lg:sticky lg:top-8 space-y-6 h-fit max-h-[calc(100vh-4rem)] overflow-y-auto pr-2 custom-scrollbar">
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <FaMoneyBillWave className="text-gray-400" /> Financial Summary
                  </h3>
                  <div className="space-y-3 text-sm">
                     <div className="flex justify-between">
                        <span className="text-gray-600">Products</span>
                        <span className="font-medium">Ksh {((order.totalCost + order.creditApplied) - (order.deliveryFee || 0) + (order.discount || 0) - (order.giftWrappingFee || 0)).toFixed(2)}</span>
                     </div>
                     {
                        order.creditApplied > 0 && (
                           <div className="flex justify-between text-green-600 font-medium">
                              <span>Credit Applied</span>
                              <span>Ksh {(order.creditApplied || 0).toFixed(2)}</span>
                           </div>
                        )
                     }
                     {(order.giftWrappingFee || 0) > 0 && (
                        <div className="flex justify-between text-pink-600 font-medium">
                           <span>Gift Wrapping</span>
                           <span>Ksh {(order.giftWrappingFee || 0).toFixed(2)}</span>
                        </div>
                     )}
                     <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-medium">Ksh {(order.deliveryFee ?? 0).toLocaleString()}</span>
                     </div>
                     {order.discount > 0 && (
                        <div className="flex justify-between text-gray-600">
                           <span>Discount</span>
                           <span>- Ksh {(order.discount ?? 0).toLocaleString()}</span>
                        </div>
                     )}

                     {/* Voucher Details */}
                     {order.voucherCode && order.discount > 0 && (
                        <div className="pt-2 border-t border-dashed border-gray-100 mt-2">
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-blue-600 font-medium flex items-center gap-1">
                                 <FiPackage className="w-3 h-3" /> Voucher Applied
                              </span>
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">{order.voucherCode}</span>
                           </div>
                           <div className="flex justify-between mt-1 text-gray-500 text-xs italic">
                              <span>Voucher Discount ({order.voucherType})</span>
                              <span>- Ksh {(order.discountAmount ?? 0).toLocaleString()}</span>
                           </div>
                        </div>
                     )}
                     {order.loyaltyDiscountAmount && order.loyaltyDiscountAmount > 0 && (
                        <div className="flex justify-between text-orange-600 font-medium">
                           <span>Platform Loyalty ({order.loyaltyDiscountCode})</span>
                           <span>- Ksh {(order.loyaltyDiscountAmount ?? 0).toLocaleString()}</span>
                        </div>
                     )}
                     <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-bold text-gray-900">
                        <span>Total Customer Pay</span>
                        <span>Ksh {(order.totalCost ?? 0).toLocaleString()}</span>
                     </div>

                     <div className="pt-3">
                        <span className={`block w-full text-center py-2 rounded-lg text-xs font-bold uppercase ${order.paymentStatus === "Paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                           }`}>
                           Payment {order.paymentStatus}
                        </span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Cancel Modal */}
         <AnimatePresence>
            {isCancelModalOpen && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                  onClick={() => setIsCancelModalOpen(false)}
               >
                  <motion.div
                     initial={{ scale: 0.95 }}
                     animate={{ scale: 1 }}
                     exit={{ scale: 0.95 }}
                     className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
                     onClick={(e) => e.stopPropagation()}
                  >
                     <h3 className="text-lg font-bold text-gray-900 mb-4">Cancel Product/Order</h3>
                     <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Reason for cancellation..."
                        className="w-full p-3 border border-gray-200 rounded-lg mb-4 focus:ring-2 focus:ring-red-500 outline-none"
                        rows={4}
                     />
                     <div className="flex justify-end gap-3">
                        <button
                           onClick={() => {
                              setIsCancelModalOpen(false);
                              setCancelReason("");
                           }}
                           className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                        >
                           Close
                        </button>
                        <button
                           onClick={handleConfirmCancel}
                           disabled={loadingCancel}
                           className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                           {loadingCancel ? "Cancelling..." : "Confirm Cancel"}
                        </button>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Seller Modal */}
         <AnimatePresence>
            {showSellerModal && sellerDetails && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                  onClick={() => setShowSellerModal(false)}
               >
                  <motion.div
                     initial={{ scale: 0.95 }}
                     animate={{ scale: 1 }}
                     exit={{ scale: 0.95 }}
                     className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"
                     onClick={(e) => e.stopPropagation()}
                  >
                     <div className="flex items-center gap-3 mb-4">
                        <FaStore className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">Seller Details</h3>
                     </div>

                     <div className="space-y-3 text-sm">
                        <p><span className="text-gray-500 font-medium">Store Name:</span> <span className="text-gray-900 block font-semibold text-lg">{sellerDetails.storeName || "N/A"}</span></p>
                        <p><span className="text-gray-500 font-medium">Email:</span> <span className="text-gray-900 block">{sellerDetails.email || "N/A"}</span></p>
                        <p><span className="text-gray-500 font-medium">Phone:</span> <span className="text-gray-900 block">{sellerDetails.phone || "N/A"}</span></p>
                        <p><span className="text-gray-500 font-medium">Address:</span> <span className="text-gray-900 block">{sellerDetails.address || "N/A"}</span></p>
                        <p><span className="text-gray-500 font-medium">Description:</span> <span className="text-gray-700 block italic">{sellerDetails.storeDescription || "N/A"}</span></p>
                     </div>

                     <div className="flex justify-end mt-6">
                        <button
                           onClick={() => setShowSellerModal(false)}
                           className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                        >
                           Close
                        </button>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* QR Code Modal */}
         <AnimatePresence>
            {showQRModal && qrData && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                  onClick={() => setShowQRModal(false)}
               >
                  <motion.div
                     initial={{ scale: 0.95, y: 20 }}
                     animate={{ scale: 1, y: 0 }}
                     exit={{ scale: 0.95, y: 20 }}
                     className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center"
                     onClick={(e) => e.stopPropagation()}
                  >
                     <div className="w-full flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Product QR Code</h3>
                        <button
                           onClick={() => setShowQRModal(false)}
                           className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                           <FiXCircle className="w-6 h-6 text-gray-400" />
                        </button>
                     </div>

                     <div id="qr-code-to-print" className="bg-white p-4 rounded-xl border border-gray-100 shadow-inner mb-6">
                        <QRCode value={qrData} size={200} />
                     </div>

                     <p className="text-sm text-gray-500 text-center mb-2 px-4">
                        Scan this code at the agent station to process this product.
                     </p>
                     <code className="text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-400 break-all w-full text-center">
                        {qrData}
                     </code>

                     <div className="w-full flex gap-3 mt-8">
                        <button
                           onClick={handlePrintQR}
                           className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                           <FaPrint className="w-4 h-4" />
                           Print QR
                        </button>
                        <button
                           onClick={() => setShowQRModal(false)}
                           className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black transition-colors"
                        >
                           Done
                        </button>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Return Initiation Modal */}
         <AnimatePresence>
            {returnModalOpen && selectedProductForReturn && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                  onClick={() => setReturnModalOpen(false)}
               >
                  <motion.div
                     initial={{ scale: 0.95, y: 20 }}
                     animate={{ scale: 1, y: 0 }}
                     exit={{ scale: 0.95, y: 20 }}
                     className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[95vh]"
                     onClick={(e) => e.stopPropagation()}
                  >
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Return Management</h3>
                        <button
                           onClick={() => setReturnModalOpen(false)}
                           className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                           <FiXCircle className="w-6 h-6 text-gray-400" />
                        </button>
                     </div>
                     {ReturnForm && (
                        <ReturnForm
                           product={selectedProductForReturn}
                           fetchOrders={fetchOrderDetails}
                           setOpenModal={setReturnModalOpen}
                        />
                     )}
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         {/* Hidden QR Generator for Background Printing */}
         <div style={{ display: 'none' }} aria-hidden="true">
            <div id="hidden-qr-print-container">
               {qrData && <QRCode value={qrData} size={256} />}
            </div>
         </div>

         {/* Tracking & Logistics Trail */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
               <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiTruck className="text-gray-400" /> Tracking & Logistics Trail
               </h3>
            </div>
            <div className="p-6">
               {order.products.some(p => p.riderOrders && p.riderOrders.length > 0) ? (
                  <div className="space-y-8">
                     {order.products.map((product, pIdx) => (
                        product.riderOrders && product.riderOrders.length > 0 && (
                           <div key={pIdx} className="space-y-4">
                              <div className="flex items-center gap-2">
                                 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                    {pIdx + 1}
                                 </div>
                                 <h4 className="font-medium text-gray-800 text-sm">{product.product?.name || "Product"}</h4>
                              </div>

                              <div className="ml-4 border-l-2 border-gray-100 pl-8 space-y-6">
                                 {product.riderOrders.map((ro, roIdx) => (
                                    <div key={ro.id || roIdx} className="relative">
                                       <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500 z-10"></div>
                                       <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                          <div>
                                             <p className="text-sm font-bold text-gray-900">
                                                Rider: {ro.rider?.name || "Unassigned"} ({ro.status})
                                             </p>
                                             <div className="mt-1 space-y-1">
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                   <FiClock className="w-3 h-3" /> {ro.createdAt ? new Date(ro.createdAt).toLocaleString() : "Recent"}
                                                </p>
                                                {ro.rider?.phone && (
                                                   <p className="text-xs text-gray-500 flex items-center gap-1">
                                                      <FiUser className="w-3 h-3" /> Phone: {ro.rider.phone} | Plate: {ro.rider.numberPlate}
                                                   </p>
                                                )}
                                             </div>
                                          </div>
                                          <div className="text-right">
                                             <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ro.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                                ro.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                                   "bg-blue-100 text-blue-700"
                                                }`}>
                                                {ro.status}
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                 ))}

                                 {/* Static logs for statuses that don't have riderOrders yet */}
                                 {product.adminReceived && (
                                    <div className="relative">
                                       <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-white border-2 border-green-500 z-10"></div>
                                       <p className="text-sm font-bold text-gray-900">Received at Hub / Agent Station</p>
                                       <p className="text-xs text-gray-500">The product has been physically received and scanned.</p>
                                    </div>
                                 )}
                              </div>
                           </div>
                        )
                     ))}
                  </div>
               ) : (
                  <div className="text-center py-12">
                     <FiClock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                     <p className="text-gray-500 text-sm">No rider assignments or detailed logs for this order yet.</p>
                  </div>
               )}
            </div>
         </div>

         {/* Assignment Selection Modal */}
         <AssignmentSelectionModal
            isOpen={isAssignSelectionModalOpen}
            onClose={() => setIsAssignSelectionModalOpen(false)}
            onSelect={(type) => {
               setIsAssignSelectionModalOpen(false);
               if (type === 'internal') {
                  navigate(`/assign-courier/${assignmentData?.addressId}/${assignmentData?.productId}?productId=${assignmentData?.productId}&orderId=${assignmentData?.orderId}`);
               } else {
                  navigate(`/assign-external-courier/${assignmentData?.addressId}/${assignmentData?.productId}?productId=${assignmentData?.productId}&orderId=${assignmentData?.orderId}`);
               }
            }}
         />
      </div>
   );
};

// --- Selection Modal Component ---
const AssignmentSelectionModal = ({ isOpen, onClose, onSelect }) => {
   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
         <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h3 className="text-xl font-black text-slate-900 tracking-tight">Dispatch Strategy</h3>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select Fulfillment Method</p>
                  </div>
                  <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                     <FiXCircle size={20} />
                  </button>
               </div>

               <div className="space-y-4">
                  <button
                     onClick={() => onSelect('internal')}
                     className="w-full group p-6 bg-slate-50 border border-slate-100 rounded-2xl text-left hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center gap-6"
                  >
                     <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <FiTruck size={28} className="text-blue-600" />
                     </div>
                     <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm mb-1">Internal Rider</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Assign to hub-managed fleet</p>
                     </div>
                  </button>

                  <button
                     onClick={() => onSelect('external')}
                     className="w-full group p-6 bg-slate-50 border border-slate-100 rounded-2xl text-left hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center gap-6"
                  >
                     <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <FiPackage size={28} className="text-emerald-600" />
                     </div>
                     <div>
                        <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm mb-1">Courier Service</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Outsource to 3rd party providers</p>
                     </div>
                  </button>
               </div>

               <div className="mt-8 pt-6 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest italic opacity-60">
                     Verification required for all external dispatch
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default OrderDetailsPage;