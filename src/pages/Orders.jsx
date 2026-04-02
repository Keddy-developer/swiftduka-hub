import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  FiCopy,
  FiEye,
  FiFilter,
  FiCalendar,
  FiDownload,
  FiPackage,
  FiTruck,
  FiMapPin,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiChevronDown,
  FiChevronUp,
  FiDollarSign,
  FiShoppingBag,
  FiRefreshCw,
  FiSearch,
  FiAlertTriangle,
  FiLoader,
  FiInbox,
  FiArchive,
  FiGift,
  FiTruck as FiTruckIcon
} from "react-icons/fi";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import logoBase64 from "../utils/logoBase64";
import autoTable from "jspdf-autotable";
import { Link, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// Utility to group orders by date
const groupOrdersByDate = (orders) => {
  return orders.reduce((groups, order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(order);
    return groups;
  }, {});
};

const statusConfig = {
  Processing: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: FiClock },
  Shipped: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: FiTruck },
  Delivered: { color: "bg-green-100 text-green-800 border-green-200", icon: FiCheckCircle },
  ReadyForPickup: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: FiPackage },
  Cancelled: { color: "bg-red-100 text-red-800 border-red-200", icon: FiXCircle },
  Pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: FiClock }
};

// Tab configuration
const TAB_CONFIG = {
  ALL: {
    label: "All Orders",
    icon: FiInbox,
    badgeColor: "bg-gray-100 text-gray-800",
    filter: (orders) => orders
  },
  PENDING_ACTIONS: {
    label: "Pending Actions",
    icon: FiAlertTriangle,
    badgeColor: "bg-red-100 text-red-800",
    filter: (orders) => orders.filter(order =>
      order.products.some(product =>
        product.deliveryStatus !== "Cancelled" &&
        product.deliveryStatus !== "Processing" &&
        product.deliveryStatus !== "Shipped" &&
        product.deliveryStatus !== "Delivered" &&
        product.deliveryStatus !== "ReadyForPickup"
      )
    )
  },
  PROCESSING: {
    label: "Processing",
    icon: FiLoader,
    badgeColor: "bg-blue-100 text-blue-800",
    filter: (orders) => orders.filter(order =>
      order.products.some(product => product.deliveryStatus === "Processing")
    )
  },
  READY_FOR_PICKUP: {
    label: "Ready for Pickup",
    icon: FiPackage,
    badgeColor: "bg-orange-100 text-orange-800",
    filter: (orders) => orders.filter(order =>
      order.products.some(product => product.deliveryStatus === "ReadyForPickup")
    )
  },
  IN_TRANSIT: {
    label: "In Transit",
    icon: FiTruckIcon,
    badgeColor: "bg-purple-100 text-purple-800",
    filter: (orders) => orders.filter(order =>
      order.products.some(product => product.deliveryStatus === "Shipped")
    )
  },
  DELIVERED: {
    label: "Delivered",
    icon: FiCheckCircle,
    badgeColor: "bg-green-100 text-green-800",
    filter: (orders) => orders.filter(order =>
      order.products.some(product => product.deliveryStatus === "Delivered")
    )
  },
  GIFT_ORDERS: {
    label: "Gift Orders",
    icon: FiGift,
    badgeColor: "bg-pink-100 text-pink-800",
    filter: (orders) => orders.filter(order => order.isGiftOrder)
  },
  CANCELLED: {
    label: "Cancelled",
    icon: FiXCircle,
    badgeColor: "bg-red-100 text-red-800",
    filter: (orders) => orders.filter(order =>
      order.products.some(product => product.deliveryStatus === "Cancelled")
    )
  }
};

const Orders = () => {
  const [activeTab, setActiveTab] = useState("ALL");
  const [period, setPeriod] = useState("all");
  const [trackingFilter, setTrackingFilter] = useState("");
  const [searchOrderId, setSearchOrderId] = useState("");
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [loadingProcessing, setLoadingProcessing] = useState(false);
  const [loadingMarkReceived, setLoadingMarkReceived] = useState(false);
  const [loadingDeliver, setLoadingDeliver] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [details, setDetails] = useState(null);
  const [orders, setOrders] = useState([]);
  const [sellerDetails, setSellerDetails] = useState(null)
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSupport = user?.role?.includes("customer_support");

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const trackingNumber = searchParams.get("trackingNumber");
    if (trackingNumber) {
      setTrackingFilter(trackingNumber);
    }
  }, [searchParams]);

  // Fetch orders on component mount
  useEffect(() => {
    handleFetchOrders();
  }, []);

  const handleFetchOrders = async (period) => {
    setLoadingOrders(true);
    try {
      const res = await axiosInstance.get(`/order/admin-orders?period=${period}`);
      console.log("Admin orders", res.data);
      setOrders(res.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleToggleProcessing = async (trackingNumber) => {
    setLoadingProcessing(true);
    try {
      await axiosInstance.patch(`/order/${trackingNumber}/processing`, {});
      toast.success("Order marked as processing!");
      handleFetchOrders();
    } catch (err) {
      toast.error("Failed to update order status.");
    } finally {
      setLoadingProcessing(false);
    }
  };

  const handleCancelOrder = async (trackingNumber, orderProductId) => {
    setLoadingCancel(true);
    if (!cancelReason.trim()) {
      toast.error("Please enter a cancellation reason.");
      return;
    }
    if (!orderProductId) {
      toast.error("Invalid order product ID.");
      return;
    }
    try {
      await axiosInstance.patch(`/order/${trackingNumber}/cancel`, {
        cancellationReason: cancelReason,
        orderProductId
      });
      toast.success("Order cancelled.");
      setIsCancelModalOpen(false);
      setCancelReason("");
      handleFetchOrders();
    } catch (err) {
      console.log("Cancel order fail", err);
      toast.error("Failed to cancel order.");
    } finally {
      setLoadingCancel(false);
    }
  };

  const handleMarkReceived = async (trackingNumber, orderProductId) => {
    setLoadingMarkReceived(true);
    try {
      await axiosInstance.patch(`/order/${trackingNumber}/mark-received`, { orderProductId });
      toast.success("Order marked as ready for pickup!");
      handleFetchOrders();
    } catch (err) {
      toast.error("Failed to update order status.");
    } finally {
      setLoadingMarkReceived(false);
    }
  };

  const handleToggleDelivered = async (trackingNumber) => {
    setLoadingDeliver(true);
    try {
      await axiosInstance.patch(`/order/${trackingNumber}/delivered`, {});
      toast.success("Order marked as delivered!");
      handleFetchOrders();
    } catch (err) {
      toast.error("Failed to update order status.");
    } finally {
      setLoadingDeliver(false);
    }
  };

  const handleShippingAddress = (order) => {
    setDetails(order);
    setShowUserModal(true);
  };

  const handlSellerDetails = (details) => {
    setSellerDetails(details);
    setShowSellerModal(true);
  };

  const toggleExpand = (id) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const toggleGroup = (groupName) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  // Filter logic
  const ordersArray = Array.isArray(orders) ? orders : (orders?.orders ?? orders?.data ?? []);
  const filteredOrders = ordersArray.filter((order) =>
    String(order?.trackingNumber || "").toLowerCase().includes(searchOrderId.toLowerCase())
  );

  const ordersByTracking = trackingFilter
    ? filteredOrders.filter((o) =>
      o.trackingNumber.toLowerCase().includes(trackingFilter.toLowerCase())
    )
    : filteredOrders;

  const now = new Date();
  const finalOrders = ordersByTracking.filter((o) => {
    const date = new Date(o.createdAt);
    if (period === "today") {
      return date.toDateString() === now.toDateString();
    }
    if (period === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return date >= startOfWeek && date <= now;
    }
    if (period === "month") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Tab-based filtering
  const tabFilteredOrders = useMemo(() => {
    const tabConfig = TAB_CONFIG[activeTab];
    if (!tabConfig) return finalOrders;
    return tabConfig.filter(finalOrders);
  }, [activeTab, finalOrders]);

  // Calculate tab counts
  const tabCounts = useMemo(() => {
    const counts = {};
    Object.keys(TAB_CONFIG).forEach(tabKey => {
      counts[tabKey] = TAB_CONFIG[tabKey].filter(finalOrders).length;
    });
    return counts;
  }, [finalOrders]);

  console.log("tabFilteredOrders", tabFilteredOrders);
  const handleCancelProductOrder = async (trackingNumber, productId) => {
    setTrackingNumber(trackingNumber);
    setSelectedProductId(productId);
    setIsCancelModalOpen(true);
  };

  // Export to PDF function
  const handleExport = () => {
    if (!tabFilteredOrders.length) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Modern Color Palette
    const colors = {
      primary: [14, 165, 233],
      secondary: [139, 92, 246],
      success: [34, 197, 94],
      warning: [234, 179, 8],
      danger: [239, 68, 68],
      light: [248, 250, 252],
      dark: [30, 41, 59]
    };

    let currentY = margin;

    // Modern Header with Gradient
    doc.setFillColor(...colors.light);
    doc.rect(0, 0, pageWidth, 70, 'F');

    // Logo
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", margin, 30, 30, 15);
    }

    // Title Section
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("ORDERS REPORT", pageWidth / 2, 35, { align: "center" });

    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(`Filter: ${TAB_CONFIG[activeTab].label} • Period: ${period}`, pageWidth / 2, 45, { align: "center" });

    currentY = 85;

    // Summary Stats with Commission Data
    const totalOrders = tabFilteredOrders.length;
    const deliveryOrders = tabFilteredOrders.filter(o => o.deliveryType === "DELIVERY").length;
    const pickupOrders = tabFilteredOrders.filter(o => o.deliveryType === "PICKUP").length;
    const nationWideorders = tabFilteredOrders.filter(o => o.deliveryType === "NATIONWIDE").length;

    // Calculate platform totals
    const totalPlatformRevenue = tabFilteredOrders.reduce((sum, order) =>
      sum + (order.totalCommission || 0), 0);
    const totalSellerEarnings = tabFilteredOrders.reduce((sum, order) =>
      sum + (order.totalSellerEarnings || 0), 0);

    const stats = [
      { label: "TOTAL ORDERS", value: totalOrders },
      { label: "DELIVERY", value: deliveryOrders },
      { label: "PICKUP", value: pickupOrders },
      { label: "PLATFORM REVENUE", value: `Ksh ${totalPlatformRevenue.toFixed(2)}` }
    ];

    const statWidth = (pageWidth - (margin * 2) - 15) / 4;

    stats.forEach((stat, index) => {
      const x = margin + (index * (statWidth + 5));

      // Stat Card
      doc.setFillColor(...colors.light);
      doc.roundedRect(x, currentY, statWidth, 28, 4, 4, 'F');

      // Value
      doc.setFontSize(index === 3 ? 9 : 11); // Smaller font for currency values
      doc.setTextColor(...colors.dark);
      doc.setFont("helvetica", "bold");
      const statValueText = stat.value.toString();
      const statValueWidth = doc.getTextWidth(statValueText);
      const statValueX = x + (statWidth / 2) - (statValueWidth / 2);
      doc.text(statValueText, statValueX, currentY + 10);

      // Label
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.text(stat.label, x + 5, currentY + 18, { maxWidth: statWidth - 10 });
    });

    currentY += 40;

    // Orders List
    tabFilteredOrders.forEach((order, orderIndex) => {
      if (currentY > pageHeight - 120) {
        doc.addPage();
        currentY = margin;
      }

      // Order Card Header
      doc.setFillColor(...colors.dark);
      doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 12, 3, 3, 'F');

      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(`ORDER #${orderIndex + 1} • ${order.trackingNumber}`, margin + 8, currentY + 7);

      currentY += 18;

      // Three Column Layout for better financial overview
      const colWidth = (pageWidth - (margin * 4)) / 3;

      // Left Column - Order Details
      doc.setFontSize(9);
      doc.setTextColor(...colors.dark);
      doc.setFont("helvetica", "bold");
      doc.text("ORDER DETAILS", margin, currentY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);

      let leftY = currentY + 8;
      const leftDetails = [
        `Customer: ${order.shippingAddress?.name || 'N/A'}`,
        `Contact: ${order.shippingAddress?.phoneNumber || 'N/A'}`,
        `Date: ${new Date(order.createdAt).toLocaleString()}`,
        `Type: ${order.deliveryType}`
      ];

      if (order.deliveryType === "DELIVERY" && order.deliveryArea) {
        leftDetails.push(`Area: ${order.deliveryArea.name}`);
      }

      if (order.shippingAddress) {
        leftDetails.push(`Location: ${order.shippingAddress.town}, ${order.shippingAddress.county}`);
      }

      if (order.isGiftOrder && order.giftDetails) {
        leftDetails.push(`GIFT: Recipient: ${order.giftDetails.recipientName}`);
        if (order.giftDetails.isAnonymous) leftDetails.push(`GIFT: ANONYMOUS SENDER`);
        if (order.giftDetails.hidePrice) leftDetails.push(`GIFT: HIDE PRICES`);
        if (order.giftDetails.message) leftDetails.push(`GIFT: Msg: ${order.giftDetails.message.substring(0, 30)}${order.giftDetails.message.length > 30 ? '...' : ''}`);
      }

      leftDetails.forEach(detail => {
        doc.text(detail, margin, leftY);
        leftY += 4.5;
      });

      // Middle Column - Payment Summary
      const middleX = margin + colWidth + 10;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.dark);
      doc.text("PAYMENT SUMMARY", middleX, currentY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);

      let middleY = currentY + 8;
      const paymentDetails = [
        `Status: ${order.paymentStatus}`,
        `Items: Ksh ${(order.totalCost - (order.deliveryFee || 0) + (order.discount || 0) - (order.giftWrappingFee || 0)).toFixed(2)}`,
        `Wrapping: Ksh ${(order.giftWrappingFee || 0).toFixed(2)}`,
        `Delivery: Ksh ${order.deliveryFee?.toFixed(2)}`,
        `Discount: Ksh ${order.discount?.toFixed(2)}`
      ];

      paymentDetails.forEach(detail => {
        doc.text(detail, middleX, middleY);
        middleY += 4.5;
      });

      // Total Highlight
      const totalAmount = order.totalCost - order.discount;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.primary);
      doc.text(`TOTAL: Ksh ${totalAmount.toFixed(2)}`, middleX, middleY + 3);

      // Right Column - Commission & Earnings
      const rightX = margin + (colWidth * 2) + 20;

      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.dark);
      doc.text("PLATFORM EARNINGS", rightX, currentY);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);

      let rightY = currentY + 8;
      const commissionDetails = [
        `Seller Earnings: Ksh ${(order.totalSellerEarnings || 0).toFixed(2)}`,
        `Platform Revenue: Ksh ${(order.totalCommission || 0).toFixed(2)}`,
        `Commission Rate: ${order.totalSellerEarnings + (order.totalCommission || 0) > 0 ?
          ((order.totalCommission || 0) / (order.totalSellerEarnings + (order.totalCommission || 0)) * 100).toFixed(1) + '%' : '0%'}`
      ];

      commissionDetails.forEach(detail => {
        doc.text(detail, rightX, rightY);
        rightY += 4.5;
      });

      // Net Profit Highlight
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.success);
      doc.text(`NET: Ksh ${totalAmount.toFixed(2)}`, rightX, rightY + 3);

      currentY = Math.max(leftY, middleY, rightY) + 12;

      // Products Table with Commission Breakdown
      const productRows = [];

      order.products?.forEach((product, productIndex) => {
        const productSubtotal = product.calculatedSubtotal || 0;
        const sellerEarnings = product.calculatedSellerEarnings || 0;
        const commissionAmount = product.calculatedCommission || 0;
        const commissionRate = product.calculatedCommissionRate || 0;

        if (product.variant && Array.isArray(product.variant) && product.variant.length > 0) {
          product.variant.forEach((variant, variantIndex) => {
            const variantData = typeof variant === 'string' ? JSON.parse(variant) : variant;
            const variantName = product.product.name.length > 25
              ? product.product.name.substring(0, 25) + "..."
              : product.product.name;

            const variantDetails = variantData.combo ?
              `${Object.values(variantData.combo.options).join(" • ")}` :
              "Custom Variant";

            const variantQuantity = variantData.quantity || 1;
            const variantPrice =
              variantData.combo?.flashSalePrice ||
              variantData.combo?.discountedPrice ||
              variantData.combo?.price ||
              variantData.priceAtPurchase ||
              product.priceAtPurchase || 0;
            const variantSubtotal = variantPrice * variantQuantity;

            // Calculate commission for this variant (proportional)
            const variantCommission = (variantSubtotal / productSubtotal) * commissionAmount;
            const variantSellerEarnings = variantSubtotal - variantCommission;

            productRows.push([
              variantIndex === 0 ? variantName : "",
              variantDetails,
              variantQuantity.toString(),
              `Ksh ${variantPrice.toFixed(2)}`,
              `Ksh ${variantSubtotal.toFixed(2)}`,
              `Ksh ${variantSellerEarnings.toFixed(2)}`,
              `Ksh ${variantCommission.toFixed(2)}`
            ]);
          });

          if (product.variant.length > 1) {
            const totalProductQuantity = product.variant.reduce((sum, v) => {
              const variant = typeof v === 'string' ? JSON.parse(v) : v;
              return sum + (variant.quantity || 1);
            }, 0);

            const totalProductSubtotal = product.variant.reduce((sum, v) => {
              const variant = typeof v === 'string' ? JSON.parse(v) : v;
              const variantPrice = variant.combo?.discountedPrice ||
                variant.combo?.price ||
                variant.priceAtPurchase ||
                product.priceAtPurchase || 0;
              return sum + (variantPrice * (variant.quantity || 1));
            }, 0);

            productRows.push([
              {
                content: `↳ Subtotal for ${product.name}`,
                colSpan: 4,
                styles: {
                  fontStyle: 'bold',
                  fillColor: [240, 240, 240],
                  textColor: colors.dark
                }
              },
              "", "", "",
              `Ksh ${totalProductSubtotal.toFixed(2)}`,
              `Ksh ${sellerEarnings.toFixed(2)}`,
              `Ksh ${commissionAmount.toFixed(2)}`
            ]);
          }
        } else {
          // Standard product without variants
          productRows.push([
            product.product.name.length > 25
              ? product.product.name.substring(0, 25) + "..."
              : product.product.name,
            "Standard",
            product.quantity?.toString() || "1",
            `Ksh ${(product.priceAtPurchase || product.price || 0).toFixed(2)}`,
            `Ksh ${productSubtotal.toFixed(2)}`,
            `Ksh ${sellerEarnings.toFixed(2)}`,
            `Ksh ${commissionAmount.toFixed(2)}`
          ]);
        }
      });

      if (productRows.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [["PRODUCT", "VARIANT", "QTY", "UNIT PRICE", "SUBTOTAL", "SELLER EARN", "COMM"]],
          body: productRows,
          styles: {
            fontSize: 7, // Smaller font to fit more columns
            cellPadding: 2,
            textColor: colors.dark,
            font: 'helvetica'
          },
          margin: { left: margin, right: margin },
          headStyles: {
            fillColor: colors.secondary,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 7,
            halign: 'center'
          },
          bodyStyles: {
            fillColor: [255, 255, 255]
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
            0: { cellWidth: 35, fontStyle: 'bold' },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 15, halign: 'center' },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 25, halign: 'right', textColor: colors.success },
            6: { cellWidth: 15, halign: 'right', textColor: colors.danger }
          },
          theme: 'grid',
          tableLineColor: [226, 232, 240],
          tableLineWidth: 0.5,
          didParseCell: function (data) {
            if (data.cell.raw && typeof data.cell.raw === 'object' && data.cell.raw.content) {
              data.cell.styles = data.cell.raw.styles || {};
              data.cell.colSpan = data.cell.raw.colSpan;
            }
          }
        });

        currentY = doc.lastAutoTable.finalY + 10;
      }

      if (orderIndex < tabFilteredOrders.length - 1) {
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = margin;
        } else {
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.5);
          doc.line(margin, currentY, pageWidth - margin, currentY);
          currentY += 15;
        }
      }
    });

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text("Confidential Business Document • Generated by BazaarShop.co.ke", pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`orders_report_${activeTab}_${timestamp}.pdf`);
  };

  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig.Pending;
    const IconComponent = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {status}
      </div>
    );
  };

  const ActionButton = ({
    children,
    onClick,
    disabled,
    variant = "primary",
    loading = false
  }) => {
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      warning: "bg-orange-500 hover:bg-orange-600 text-white",
      danger: "bg-red-600 hover:bg-red-700 text-white",
      success: "bg-green-600 hover:bg-green-700 text-white"
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]}`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <FiRefreshCw className="w-4 h-4 animate-spin" />
            Updating...
          </div>
        ) : (
          children
        )}
      </button>
    );
  };

  // Tab summary statistics
  const getTabSummary = () => {
    const totalOrders = tabFilteredOrders.length;
    const totalValue = tabFilteredOrders.reduce((sum, order) => sum + (order.totalCost + order.creditApplied), 0);
    const totalCommission = tabFilteredOrders.reduce((sum, order) => sum + (order.totalCommission || 0), 0);

    return {
      totalOrders,
      totalValue,
      totalCommission,
      avgOrderValue: totalOrders > 0 ? totalValue / totalOrders : 0
    };
  };

  const tabSummary = getTabSummary();

  return (
    <>
      <div className="space-y-6 p-5 lg:p-8">
        <button onClick={() => window.history.back()} className="mb-4 text-sm text-gray-600">
          <ArrowLeft className="w-4 h-4 inline-block mr-1" />
          Back
        </button>
        {/* Header Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Tab-specific summary */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Orders Management</h2>
              {isSupport && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider mt-1">
                  <FiAlertTriangle className="w-3 h-3" /> Read Only Access
                </div>
              )}
              <p className="text-sm text-gray-600 mt-1">
                {TAB_CONFIG[activeTab].label} • {tabSummary.totalOrders} orders • Total: Ksh {tabSummary.totalValue.toFixed(2)}
              </p>
            </div>

            {/* Period and Export */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl px-3 py-2">
                <FiCalendar className="text-slate-500 w-4 h-4" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-medium text-slate-700"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-green-500/25 transition-all duration-200"
              >
                <FiDownload className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Tracking Filter */}
          <div className="mt-4 relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter by tracking number..."
              value={trackingFilter}
              onChange={(e) => setTrackingFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none placeholder-slate-500 text-sm"
            />
          </div>

          <div className="flex gap-3 mt-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 outline-none text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>

            <button
              onClick={() => handleFetchOrders(period)}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 outline-none text-sm"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto scrollbar-hide">
              {Object.entries(TAB_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const count = tabCounts[key];
                const isActive = activeTab === key;

                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap relative ${isActive
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{config.label}</span>
                    {count > 0 && (
                      <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-semibold ${config.badgeColor}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Tab-specific Quick Actions */}
            {activeTab === "PENDING_ACTIONS" && tabSummary.totalOrders > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FiAlertTriangle className="text-yellow-600 w-5 h-5" />
                    <div>
                      <h3 className="font-semibold text-yellow-800">Action Required</h3>
                      <p className="text-sm text-yellow-700">
                        {tabSummary.totalOrders} orders need immediate attention
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFetchOrders(period)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Refresh Status
                  </button>
                </div>
              </div>
            )}

            {/* Orders List */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={activeTab}
            >
              {loadingOrders ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-slate-600 mt-4">Loading orders...</p>
                </div>
              ) : tabFilteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                  <FiPackage className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders found</h3>
                  <p className="text-slate-600">Try adjusting your filters or search criteria</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Order Details
                          </th>
                          <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Customer & Location
                          </th>
                          <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Products
                          </th>
                          <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Status
                          </th>
                          <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Payment
                          </th>
                          <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Total
                          </th>
                          <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tabFilteredOrders.map((order) => (
                          <tr
                            key={order.trackingNumber}
                            onClick={() => navigate(`/orders/${order.trackingNumber}`)}
                            className="group hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <td className="py-4 px-4 max-w-[150px]">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate block" title={order.trackingNumber}>
                                    #{order.trackingNumber}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(order.trackingNumber);
                                      toast.success("Tracking number copied!");
                                    }}
                                    className="p-1 hover:bg-slate-200 rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                                    title="Copy Tracking Number"
                                  >
                                    <FiCopy className="text-slate-500 w-3 h-3" />
                                  </button>
                                  {order.isGiftOrder && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-700 ml-1 shrink-0">
                                      <FiGift className="w-3 h-3" /> Gift
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-2 truncate" title={new Date(order.createdAt).toLocaleString()}>
                                  <FiClock className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{new Date(order.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                  <FiTruck className="w-3 h-3" />
                                  {order.deliveryType}
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 max-w-[200px]">
                              <div className="text-sm font-medium text-slate-900 truncate" title={order.shippingAddress?.name || "N/A"}>
                                {order.shippingAddress?.name || "N/A"}
                              </div>
                              <div className="text-xs text-slate-500 flex flex-col gap-0.5 mt-1 overflow-hidden">
                                <span className="flex items-center gap-1 truncate" title={order.shippingAddress?.town || "N/A"}>
                                  <FiMapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{order.shippingAddress?.town || "N/A"}</span>
                                </span>
                                <span className="truncate">{order.shippingAddress?.phoneNumber || "N/A"}</span>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="text-sm text-slate-700 font-medium">
                                {order.products.length} Item{order.products.length !== 1 ? 's' : ''}
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <StatusBadge status={order.products[0]?.deliveryStatus || "Pending"} />
                            </td>

                            <td className="py-4 px-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${order.paymentStatus === "Paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                                }`}>
                                {order.paymentStatus}
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="space-y-0.5">
                                <div className="text-sm font-bold text-slate-900">
                                  Ksh {(order.totalCost + order.creditApplied).toLocaleString()}
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-right">
                              <div className="text-blue-600 font-medium text-sm flex items-center justify-end gap-1 group-hover:underline">
                                View Details <FiChevronUp className="rotate-90 w-4 h-4" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center text-sm text-gray-500">
                      <span>Showing {tabFilteredOrders.length} orders</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-[90%] max-w-md relative">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">Cancel Order</h2>
            <textarea
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Write the reason for cancellation..."
              className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                Close
              </button>
              <button
                onClick={() => handleCancelOrder(trackingNumber, selectedProductId)}
                className="px-4 py-2 rounded text-sm bg-red-600 text-white hover:bg-red-700 transition"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserModal && details && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-50 z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-2xl p-6 shadow-lg w-96"
          >
            <h2 className="text-xl font-bold mb-4">📍 Shipping Address</h2>
            <p>
              <span className="font-semibold">Name: </span>
              {details?.shippingAddress?.name}
            </p>
            <p>
              {
                details?.deliveryArea && (
                  <>
                    <span className="font-semibold">Delivery Area: </span>
                    {details?.deliveryArea?.name}
                  </>
                )
              }

            </p>
            <p>
              <span className="font-semibold">Town: </span>
              {details?.shippingAddress?.town}
            </p>
            <p>
              <span className="font-semibold">County: </span>
              {details?.shippingAddress?.county}
            </p>
            <p>
              <span className="font-semibold">Phone: </span>
              {details?.shippingAddress?.phoneNumber}
            </p>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showSellerModal && sellerDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-50 z-50"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-2xl p-6 shadow-lg w-96"
          >
            <h2 className="text-xl font-bold mb-4">Seller Details</h2>
            <p>
              <span className="font-semibold">Store Name: </span>
              {sellerDetails?.storeName}
            </p>
            <p>
              <span className="font-semibold">Address: </span>
              {sellerDetails?.address}
            </p>
            <p>
              <span className="font-semibold">Town: </span>
              {sellerDetails?.city}
            </p>
            <p>
              <span className="font-semibold">County: </span>
              {sellerDetails?.county}
            </p>
            <p>
              <span className="font-semibold">Phone: </span>
              {sellerDetails?.phone}
            </p>
            <p>
              <span className="font-semibold">Email: </span>
              {sellerDetails?.email}
            </p>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowSellerModal(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default Orders;
