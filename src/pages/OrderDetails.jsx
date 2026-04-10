
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
   const [sellerDetails, setSellerDetails] = useState(null);

   const [showQRModal, setShowQRModal] = useState(false);
   const [qrData, setQRData] = useState(null);

   const [returnModalOpen, setReturnModalOpen] = useState(false);
   const [selectedProductForReturn, setSelectedProductForReturn] = useState(null);

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
   }, [id]);

   // Handlers
   const handleToggleProcessing = async () => {
      setLoadingProcessing(true);
      try {
         await axiosInstance.patch(`/order/${trackingNumber}/processing`, {});
         toast.success("Order marked as processing!");
         fetchOrderDetails();
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
         AuditService.logAction(hub?.id, 'HUB_RECEIPT', {
            message: `Handover received for Order #${trackingNumber}`,
            trackingNumber: trackingNumber,
            orderProductId: orderProductId
         });
         fetchOrderDetails();
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
         AuditService.logAction(hub?.id, 'READY_FOR_PICKUP_UPDATE', {
            message: `Order #${trackingNumber} moved to Ready for Pickup`,
            trackingNumber: trackingNumber,
            orderProductId: orderProductId
         });
         fetchOrderDetails();
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
         fetchOrderDetails();
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
         AuditService.logAction(hub?.id, 'ORDER_CANCELLATION', {
            message: `Cancelled item in Order #${trackingNumber}. Reason: ${cancelReason}`,
            trackingNumber: trackingNumber,
            reason: cancelReason
         });
         setIsCancelModalOpen(false);
         fetchOrderDetails();
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
      const qrSvg = document.querySelector('#qr-code-to-print').innerHTML;

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
                    </script>
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
         const qrSvg = document.getElementById('hidden-qr-print-container')?.innerHTML;
         if (!qrSvg) {
            toast.error("Failed to generate QR for label");
            return;
         }

         const printWindow = window.open('', '_blank');
         const productName = product.product.name;
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
                        </script>
                    </body>
                </html>
            `);
         printWindow.document.close();
      }, 100);
   };

   console.log("order", order);

   const StatusBadge = ({ status }) => {
      const config = {
         Processing: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: FiClock },
         Shipped: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: FiTruck },
         Delivered: { color: "bg-green-100 text-green-800 border-green-200", icon: FiCheckCircle },
         ReadyForPickup: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: FiPackage },
         Cancelled: { color: "bg-red-100 text-red-800 border-red-200", icon: FiXCircle },
         Pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: FiClock }
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

   const ActionButton = ({ onClick, loading, variant = "primary", children, className }) => {
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
         <button onClick={onClick} disabled={loading} className={btnClass}>
            {loading ? "Updating..." : children}
         </button>
      );
   };

   const CountdownTimer = ({ targetDate, onExpire }) => {
      const [timeLeft, setTimeLeft] = useState("");

      useEffect(() => {
         const calculateTime = () => {
            const now = new Date().getTime();
            const distance = new Date(targetDate).getTime() - now;

            if (distance < 0) {
               setTimeLeft("Expired");
               if (onExpire) onExpire();
               return false;
            } else {
               const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
               const seconds = Math.floor((distance % (1000 * 60)) / 1000);
               setTimeLeft(`${minutes}m ${seconds}s`);
               return true;
            }
         };

         if (!calculateTime()) return;

         const interval = setInterval(() => {
            if (!calculateTime()) {
               clearInterval(interval);
            }
         }, 1000);

         return () => clearInterval(interval);
      }, [targetDate]);

      if (timeLeft === "Expired") return null;

      return (
         <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg flex items-center gap-1 border border-blue-100">
            <FiClock className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-mono">{timeLeft}</span>
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
                  Ordered on {new Date(order.createdAt).toLocaleDateString()}
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
                              {order.products.length} Items • Total: Ksh {(order.totalCost + order.creditApplied).toLocaleString()}
                           </p>
                        </div>
                        {order.deliveryType && (
                           <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100">
                              {order.deliveryType}
                           </span>
                        )}
                        {order.isGiftOrder && (
                           <span className="ml-2 px-3 py-1 bg-pink-100 text-pink-700 text-xs font-semibold rounded-lg border border-pink-200 flex items-center gap-1">
                              <FiGift /> Gift Order
                           </span>
                        )}
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
                              <p><span className="text-gray-500">Pickup Station:</span> <span className="font-medium text-gray-900">{order.pickupStation?.name}</span></p>
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
                                 <p><span className="text-gray-500">Recipient Name:</span> <span className="font-medium text-gray-900">{order.giftDetails.recipientName}</span></p>
                                 <p><span className="text-gray-500">Recipient Phone:</span> <span className="font-medium text-gray-900">{order.recipientPhone || order.giftDetails.recipientPhone || "N/A"}</span></p>
                                 <p><span className="text-gray-500">Sender Name:</span> <span className="font-medium text-gray-900">{order.giftDetails.senderName}</span></p>
                                 <p><span className="text-gray-500">Relationship:</span> <span className="font-medium text-gray-900">{order.giftDetails.relationship || "N/A"}</span></p>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Gift Meta</h4>
                              <div className="space-y-2 text-sm">
                                 <p><span className="text-gray-500">Occasion:</span> <span className="font-medium text-gray-900">{order.giftDetails.occasion || "None"}</span></p>
                                 <p><span className="text-gray-500">Wrapping:</span> <span className="font-medium text-gray-900">{order.giftDetails.wrappingType}</span></p>
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
                                       <p><span className="text-gray-500">Address:</span> <span className="font-medium">{order.giftDetails.giftShipmentAddress.address}</span></p>
                                       <p><span className="text-gray-500">Town:</span> <span className="font-medium">{order.giftDetails.giftShipmentAddress.town}, {order.giftDetails.giftShipmentAddress.county}</span></p>
                                    </div>
                                 ) : (
                                    <div className="space-y-1 text-sm">
                                       <p><span className="text-gray-500">Type:</span> <span className="font-medium">Pickup Station</span></p>
                                       <p><span className="text-gray-500">Station:</span> <span className="font-medium">{order.giftDetails.giftPickupAddress.name}</span></p>
                                       <p><span className="text-gray-500">Location:</span> <span className="font-medium">{order.giftDetails.giftPickupAddress.address}, {order.giftDetails.giftPickupAddress.town}</span></p>
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
                        const isAssignmentActive = product.assignmentExpiresAt && new Date(product.assignmentExpiresAt) > new Date();

                        return (
                           <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                              <div className="flex flex-col gap-4">
                                 {/* Top Row: Product Info & Actions */}
                                 <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                       <h4 className="font-medium text-gray-900">{product.product.name}</h4>
                                       <div className="mt-1 flex flex-wrap gap-4 text-sm text-gray-500">
                                          <span>Qty: {product.quantity}</span>
                                          <span>Price: Ksh {product.priceAtPurchase?.toLocaleString()}</span>
                                          {product.giftWrappingFee > 0 && (
                                             <span className="text-pink-600 font-medium flex items-center gap-1">
                                                <FiGift className="w-3 h-3" /> Wrapping: Ksh {product.giftWrappingFee.toLocaleString()}
                                             </span>
                                          )}
                                       </div>
                                       {product.variant && Object.keys(product.variant).length > 0 && (
                                          <div className="mt-2 text-xs bg-gray-100 p-2 rounded text-gray-600 inline-block">
                                             Variations: {Object.values(product.variant).map(v => v.combo?.key).join(", ")}
                                          </div>
                                       )}
                                       <div className="mt-2 flex items-center gap-2">
                                          <span className="text-sm text-gray-600">Seller: {product.product.seller?.storeName}</span>
                                          <button
                                             onClick={() => handleViewSeller(product.product.seller)}
                                             className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                          >
                                             <FiEye /> View
                                          </button>
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

                                 {/* Bottom Row: Actions */}
                                 <div className="flex flex-wrap gap-2 justify-end mt-2">
                                    {/* Mark Processing (Waiting Seller) */}
                                    {product.deliveryStatus !== "Cancelled" &&
                                       product.deliveryStatus !== "Processing" &&
                                       product.deliveryStatus !== "Shipped" &&
                                       product.deliveryStatus !== "Delivered" &&
                                       product.deliveryStatus !== "ReadyForLogistics" &&
                                       product.deliveryStatus !== "ReadyForPickup" && (
                                          <span className="px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-lg">
                                             Waiting Seller to Process
                                          </span>
                                       )}

                                    {/* Assign Courier - After Hub Receipt */}
                                    {product.adminReceived && !product.courierAccepted && product.deliveryStatus === "ReadyForLogistics" && !order.pickUpStation?.isPickupStation && (
                                       isAssignmentActive ? (
                                          <CountdownTimer
                                             targetDate={product.assignmentExpiresAt}
                                             onExpire={fetchOrderDetails}
                                          />
                                       ) : (
                                          <ActionButton
                                             onClick={() => navigate(`/assign-courier/${order.shippingAddress?.id}/${product.id}?productId=${product.id}&orderId=${order.id}`)}
                                             variant="warning"
                                             className="bg-amber-500 hover:bg-amber-600"
                                          >
                                             Assign Courier
                                          </ActionButton>
                                       )
                                    )}

                                    {/* Mark Ready For Pickup - Manual Toggle */}
                                    {product.adminReceived && order.pickUpStation?.isPickupStation && product.deliveryStatus !== "ReadyForPickup" && product.deliveryStatus !== "Delivered" && product.deliveryStatus !== "Cancelled" && product.deliveryType !== "NATIONWIDE" && (
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

                                    {product.courierAccepted && product.deliveryStatus === "Processing" && (
                                       <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-lg">
                                          Courier Assigned
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
                        );
                     })}
                  </div>
               </div>
            </div>

            {/* Sidebar - Summary & Actions */}
            <div className="space-y-6">
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
                        <span className="font-medium">Ksh {(order.deliveryFee || 0).toLocaleString()}</span>
                     </div>
                     {order.discount > 0 && (
                        <div className="flex justify-between text-gray-600">
                           <span>Discount</span>
                           <span>- Ksh {(order.discount).toLocaleString()}</span>
                        </div>
                     )}

                     {/* Voucher Details */}
                     {order.voucherCode && (
                        <div className="pt-2 border-t border-dashed border-gray-100 mt-2">
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-blue-600 font-medium flex items-center gap-1">
                                 <FiPackage className="w-3 h-3" /> Voucher Applied
                              </span>
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">{order.voucherCode}</span>
                           </div>
                           <div className="flex justify-between mt-1 text-gray-500 text-xs italic">
                              <span>Voucher Discount ({order.voucherType})</span>
                              <span>- Ksh {(order.discountAmount || 0).toLocaleString()}</span>
                           </div>
                        </div>
                     )}
                     <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-bold text-gray-900">
                        <span>Total Customer Pay</span>
                        <span>Ksh {order.totalCost.toLocaleString()}</span>
                     </div>

                     <div className="pt-4 mt-2 border-t border-gray-100 space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                           <span>Total Seller Earnings</span>
                           <span className="font-medium text-green-600">Ksh {(order.totalSellerEarnings || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                           <span>Total Commission</span>
                           <span className="font-medium text-red-600">Ksh {(order.totalCommission || 0).toLocaleString()}</span>
                        </div>
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
               >
                  <motion.div
                     initial={{ scale: 0.95 }}
                     animate={{ scale: 1 }}
                     exit={{ scale: 0.95 }}
                     className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
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
                           onClick={() => setIsCancelModalOpen(false)}
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
               >
                  <motion.div
                     initial={{ scale: 0.95 }}
                     animate={{ scale: 1 }}
                     exit={{ scale: 0.95 }}
                     className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6"
                  >
                     <div className="flex items-center gap-3 mb-4">
                        <FaStore className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-bold text-gray-900">Seller Details</h3>
                     </div>

                     <div className="space-y-3 text-sm">
                        <p><span className="text-gray-500 font-medium">Store Name:</span> <span className="text-gray-900 block font-semibold text-lg">{sellerDetails.storeName}</span></p>
                        <p><span className="text-gray-500 font-medium">Email:</span> <span className="text-gray-900 block">{sellerDetails.email}</span></p>
                        <p><span className="text-gray-500 font-medium">Phone:</span> <span className="text-gray-900 block">{sellerDetails.phone}</span></p>
                        <p><span className="text-gray-500 font-medium">Address:</span> <span className="text-gray-900 block">{sellerDetails.address}</span></p>
                        <p><span className="text-gray-500 font-medium">Description:</span> <span className="text-gray-700 block italic">{sellerDetails.storeDescription}</span></p>
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
               >
                  <motion.div
                     initial={{ scale: 0.95, y: 20 }}
                     animate={{ scale: 1, y: 0 }}
                     exit={{ scale: 0.95, y: 20 }}
                     className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-8 flex flex-col items-center"
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
               >
                  <motion.div
                     initial={{ scale: 0.95, y: 20 }}
                     animate={{ scale: 1, y: 0 }}
                     exit={{ scale: 0.95, y: 20 }}
                     className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 overflow-y-auto max-h-[95vh]"
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
                     <ReturnForm
                        product={selectedProductForReturn}
                        fetchOrders={fetchOrderDetails}
                        setOpenModal={setReturnModalOpen}
                     />
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
                                 <h4 className="font-medium text-gray-800 text-sm">{product.product.name}</h4>
                              </div>

                              <div className="ml-4 border-l-2 border-gray-100 pl-8 space-y-6">
                                 {product.riderOrders.map((ro, roIdx) => (
                                    <div key={roIdx} className="relative">
                                       <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500 z-10"></div>
                                       <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                          <div>
                                             <p className="text-sm font-bold text-gray-900">
                                                Rider: {ro.rider?.name || "Unassigned"} ({ro.status})
                                             </p>
                                             <div className="mt-1 space-y-1">
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                   <FiClock className="w-3 h-3" /> {new Date(ro.createdAt).toLocaleString()}
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
      </div>
   );
};

export default OrderDetailsPage;
