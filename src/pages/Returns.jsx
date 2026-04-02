import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Package,
  User,
  Phone,
  Calendar,
  DollarSign,
  PackageOpen,
  RefreshCw,
  AlertTriangle,
  Info,
  SendHorizonal,
  Smartphone,
  CreditCard,
  Banknote
} from "lucide-react";
import axiosInstance from "../services/axiosConfig";
import { toast } from "react-toastify";

const statusStyles = {
  PENDING: {
    icon: <Clock className="text-yellow-500" size={16} />,
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  REQUESTED: {
    icon: <Clock className="text-yellow-500" size={16} />,
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  APPROVED: {
    icon: <CheckCircle className="text-green-500" size={16} />,
    color: "bg-green-100 text-green-700 border-green-200",
  },
  REJECTED: {
    icon: <XCircle className="text-red-500" size={16} />,
    color: "bg-red-100 text-red-700 border-red-200",
  },
};

const refundStatusStyles = {
  PENDING_REFUND: { color: "bg-gray-100 text-gray-600", label: "Pending Refund" },
  REFUND_INITIATED: { color: "bg-amber-100 text-amber-700", label: "Refund Initiated" },
  REFUND_COMPLETE: { color: "bg-green-100 text-green-700", label: "Refund Complete" },
  REFUND_FAILED: { color: "bg-red-100 text-red-700", label: "Refund Failed" },
};

// Detect payment method from order payments array
const detectPaymentMethod = (ret) => {
  if (ret?.order?.payments && ret.order.payments.length > 0) {
    return { method: 'MPESA', label: 'M-Pesa', phone: ret.refundPhone || ret.user?.phone };
  }
  return { method: 'OTHER', label: 'Card / Other', phone: ret.refundPhone || ret.user?.phone };
};

export default function ReturnsManagement() {
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedReturnId, setSelectedReturnId] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [openReject, setOpenReject] = useState(false);

  // Approval Modal State
  const [approveCharge, setApproveCharge] = useState(0);
  const [chargeReason, setChargeReason] = useState("Return processing fee applied");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refund Modal State
  const [refundModalReturn, setRefundModalReturn] = useState(null);
  const [refundConfirmedAmount, setRefundConfirmedAmount] = useState("");
  const [refundDeliveryFee, setRefundDeliveryFee] = useState("");
  const [refundAdminNotes, setRefundAdminNotes] = useState("");
  const [refundMpesaPhone, setRefundMpesaPhone] = useState("");
  const [refundMpesaName, setRefundMpesaName] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  const [actionLoading, setActionLoading] = useState({
    approve: null,
    reject: null
  });

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/returns/admin`);
      setReturns(res.data);
    } catch (error) {
      console.error("Failed to fetch returns:", error);
      toast.error("Failed to load returns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  // Filter logic
  const filteredReturns = returns.filter((ret) => {
    const query = search.toLowerCase();
    return (
      ret.status?.toLowerCase().includes(query) ||
      ret.reason?.toLowerCase().includes(query) ||
      ret.product?.name?.toLowerCase().includes(query) ||
      ret.user?.username?.toLowerCase().includes(query) ||
      ret.user?.phone?.toLowerCase().includes(query) ||
      ret.id?.toLowerCase().includes(query)
    );
  });

  const handleApprove = (returnId) => {
    // Open the approval modal by setting the loading state (which we use as 'open' state here)
    setActionLoading(prev => ({ ...prev, approve: returnId }));
    setApproveCharge(0);
    setChargeReason("Return processing fee applied");
    setAdminNotes("");
  };

  const handleConfirmApprove = async (returnId) => {
    setIsSubmitting(true);
    try {
      // Determine path based on charge
      const hasCharge = approveCharge > 0;
      const path = hasCharge
        ? `/returns/${returnId}/approve-with-charge`
        : `/returns/${returnId}/approve`;

      const payload = hasCharge ? {
        returnCharge: approveCharge,
        chargeReason,
        adminNotes
      } : {};

      await axiosInstance.patch(path, payload);

      toast.success(hasCharge ? "Return approved with charge applied ✅" : "Return approved successfully ✅");
      setSelectedReturn(null);
      fetchReturns();
      setActionLoading(prev => ({ ...prev, approve: null })); // Close modal
    } catch (error) {
      console.error("Error approving return:", error);
      toast.error(
        error.response?.data?.message || "Failed to approve return ❌"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (returnId, notes) => {
    if (!notes.trim()) {
      toast.error("Please add a reason for rejection");
      return;
    }

    setActionLoading(prev => ({ ...prev, reject: returnId }));
    try {
      await axiosInstance.patch(`/returns/${returnId}/reject`, { notes });

      toast.success("Return rejected successfully ❌");
      setOpenReject(false);
      setRejectNotes("");
      setSelectedReturn(null);
      setSelectedReturnId("");
      fetchReturns();
    } catch (error) {
      console.error("Error rejecting return:", error);
      toast.error(
        error.response?.data?.message || "Failed to reject return"
      );
    } finally {
      setActionLoading(prev => ({ ...prev, reject: null }));
    }
  };

  const returnWindowOpen = (orderDate, days = 7) => {
    const orderTime = new Date(orderDate).getTime();
    const now = new Date().getTime();
    const diffDays = (now - orderTime) / (1000 * 60 * 60 * 24);
    return diffDays <= days;
  };

  const formatCurrency = (amount) => {
    return `Ksh ${amount?.toLocaleString() || '0'}`;
  };

  const openRefundModal = (ret) => {
    const baseAmount = (ret.amount || 0) - (ret.returnCharge || 0);
    setRefundConfirmedAmount(baseAmount > 0 ? baseAmount.toString() : "");
    setRefundDeliveryFee("");
    setRefundAdminNotes("");
    setRefundMpesaPhone(ret.refundPhone || ret.user?.phone || "");
    setRefundMpesaName(ret.refundMpesaName || ret.user?.username || "");
    setRefundModalReturn(ret);
  };

  const handleInitiateRefund = async () => {
    if (!refundConfirmedAmount || Number(refundConfirmedAmount) <= 0) {
      toast.error("Please enter a valid confirmed amount");
      return;
    }
    if (!refundMpesaPhone) {
      toast.error("Please enter an M-Pesa number for the refund");
      return;
    }
    setIsRefunding(true);
    try {
      await axiosInstance.patch(`/returns/${refundModalReturn.id}/initiate-refund`, {
        confirmedAmount: Number(refundConfirmedAmount),
        deliveryFeeRecovery: Number(refundDeliveryFee) || 0,
        adminNotes: refundAdminNotes,
        refundPhone: refundMpesaPhone,
        refundMpesaName: refundMpesaName,
      });
      toast.success("Refund initiated via M-Pesa B2C ✅");
      setRefundModalReturn(null);
      setSelectedReturn(null);
      fetchReturns();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to initiate refund");
    } finally {
      setIsRefunding(false);
    }
  };

  const getStatusBadge = (status) => {
    const style = statusStyles[status] || statusStyles.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${style.color}`}>
        {style.icon}
        {status}
      </span>
    );
  };

  const getRefundStatusBadge = (refundStatus) => {
    const style = refundStatusStyles[refundStatus] || refundStatusStyles.PENDING_REFUND;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.color}`}>
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <PackageOpen className="text-blue-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Returns Management</h1>
            <p className="text-gray-600 text-sm">
              {returns.length} return{returns.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search returns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <button
            onClick={fetchReturns}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Returns Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        {filteredReturns.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No returns found</p>
            {search && (
              <p className="text-gray-500 text-sm mt-1">
                Try adjusting your search terms
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReturns.map((ret, idx) => (
                  <motion.tr
                    key={ret.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {ret.product?.image && (
                          <img
                            src={ret.product.image}
                            alt={ret.product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">
                            {ret.product?.name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            ID: {ret.id}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(ret.createdAt).toLocaleDateString()}
                          </p>
                          {ret.variants && ret.variants.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs text-gray-600">
                                Variants: {ret.variants.length}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {ret.user?.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {ret.user?.phone}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-700">
                          {formatCurrency(ret.amount)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ret.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedReturn(ret)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          View
                        </button>
                        {ret.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(ret.id)}
                              disabled={actionLoading.approve === ret.id}
                              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              {actionLoading.approve === ret.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedReturnId(ret.id);
                                setOpenReject(true);
                              }}
                              disabled={actionLoading.reject === ret.id}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </>
                        )}
                        {ret.status === "APPROVED" && (ret.order?.refundIssued) && (
                          <div className="flex items-center gap-1 px-3 py-1 text-sm bg-green-50 text-green-600 rounded-lg border border-green-100 font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Payment Refunded
                          </div>
                        )}
                        {ret.status === "APPROVED" && !(ret.order?.refundIssued) && (ret.refundStatus === "PENDING_REFUND" || !ret.refundStatus) && (
                          <button
                            onClick={() => openRefundModal(ret)}
                            className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1 font-medium"
                          >
                            <SendHorizonal className="w-3 h-3" />
                            Initiate Refund
                          </button>
                        )}
                        {ret.status === "APPROVED" && !(ret.order?.refundIssued) && ret.refundStatus && ret.refundStatus !== "PENDING_REFUND" && getRefundStatusBadge(ret.refundStatus)}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Return Details Modal */}
      <AnimatePresence>
        {selectedReturn && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <PackageOpen className="text-blue-600 w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Return Details
                      </h2>
                      <p className="text-sm text-gray-600">
                        ID: {selectedReturn.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReturn(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Product Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Product Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        {selectedReturn.product?.image && (
                          <img
                            src={selectedReturn.product.image}
                            alt={selectedReturn.product.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {selectedReturn.product?.name}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Product ID: {selectedReturn.productId}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Order ID</p>
                          <p className="font-medium">{selectedReturn.orderId}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Order Date</p>
                          <p className="font-medium">
                            {new Date(selectedReturn.order?.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{selectedReturn.user?.username}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedReturn.user?.shippingAddress?.phoneNumber || selectedReturn.user?.phone || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          Member since {new Date(selectedReturn.user?.createdAt).getFullYear()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Return Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Return Details
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Status</p>
                          {getStatusBadge(selectedReturn.status)}
                        </div>
                        <div>
                          <p className="text-gray-500">Refund Amount</p>
                          <p className="font-semibold text-green-700">
                            {formatCurrency(selectedReturn.amount)}
                          </p>
                        </div>
                        {selectedReturn.returnCharge > 0 && (
                          <div>
                            <p className="text-gray-500">Return Fee</p>
                            <p className="font-semibold text-red-600">
                              - {formatCurrency(selectedReturn.returnCharge)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500">Reason</p>
                          <p className="font-medium">{selectedReturn.reason}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Requested</p>
                          <p className="font-medium">
                            {new Date(selectedReturn.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {selectedReturn.notes && (
                        <div>
                          <p className="text-gray-500 text-sm">Customer Notes</p>
                          <p className="text-sm mt-1 bg-white p-2 rounded border">
                            {selectedReturn.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Variants Information */}
                  {selectedReturn.variants && selectedReturn.variants.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <PackageOpen className="w-4 h-4" />
                        Selected Variants
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {selectedReturn.variants.map((variant, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                            <div>
                              <p className="font-medium text-sm">{variant.variantKey}</p>
                              <p className="text-xs text-gray-500">
                                Qty: {variant.quantity} • {formatCurrency(variant.priceAtPurchase)} each
                              </p>
                            </div>
                            <p className="font-semibold text-green-700">
                              {formatCurrency(variant.priceAtPurchase * variant.quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons in details modal */}
                {selectedReturn.status === "PENDING" && (
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200">
                    {returnWindowOpen(selectedReturn.order?.createdAt) && (
                      <button
                        onClick={() => handleApprove(selectedReturn.id)}
                        disabled={actionLoading.approve === selectedReturn.id}
                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading.approve === selectedReturn.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Approve Return
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedReturnId(selectedReturn.id);
                        setOpenReject(true);
                      }}
                      disabled={actionLoading.reject === selectedReturn.id}
                      className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Return
                    </button>
                  </div>
                )}
                {selectedReturn.status === "APPROVED" && (selectedReturn.refundStatus === "PENDING_REFUND" || !selectedReturn.refundStatus) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => { setSelectedReturn(null); openRefundModal(selectedReturn); }}
                      className="w-full bg-amber-500 text-white py-3 px-4 rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                      <SendHorizonal className="w-4 h-4" />
                      Initiate Refund
                    </button>
                  </div>
                )}
                {selectedReturn.status === "APPROVED" && selectedReturn.refundStatus && selectedReturn.refundStatus !== "PENDING_REFUND" && (
                  <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                    {getRefundStatusBadge(selectedReturn.refundStatus)}
                    {selectedReturn.refundConversationId && (
                      <p className="text-xs text-gray-500 mt-2">M-Pesa Conversation ID: {selectedReturn.refundConversationId}</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approve Confirmation Modal */}
      <AnimatePresence>
        {actionLoading.approve && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="text-green-600 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Approve Return Request
                    </h3>
                    <p className="text-sm text-gray-600">
                      Configure return details before approving
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Return Charge Input */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <input
                        type="checkbox"
                        checked={approveCharge > 0}
                        onChange={(e) => setApproveCharge(e.target.checked ? 100 : 0)} // Default to 100 on check
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      Apply Return Processing Fee
                    </label>

                    {approveCharge > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="space-y-3"
                      >
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">KSh</span>
                          <input
                            type="number"
                            value={approveCharge}
                            onChange={(e) => setApproveCharge(Number(e.target.value))}
                            className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="0.00"
                            min="0"
                          />
                        </div>
                        <input
                          type="text"
                          value={chargeReason}
                          onChange={(e) => setChargeReason(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                          placeholder="Reason for charge (e.g. Damaged packaging)"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal notes about this return..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setActionLoading(prev => ({ ...prev, approve: null }));
                      setApproveCharge(0);
                      setChargeReason("Return processing fee applied");
                      setAdminNotes("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmApprove(actionLoading.approve)}
                    disabled={isSubmitting} // Use a separate submitting state for the actual API call
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Confirm Approve
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Confirmation Modal */}
      <AnimatePresence>
        {openReject && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="text-red-600 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Reject Return Request
                    </h3>
                    <p className="text-sm text-gray-600">
                      Please provide a reason for rejection
                    </p>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Enter detailed reason for rejection..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                />

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setOpenReject(false);
                      setRejectNotes("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReject(selectedReturnId, rejectNotes)}
                    disabled={actionLoading.reject === selectedReturnId || !rejectNotes.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {actionLoading.reject === selectedReturnId ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Confirm Reject
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initiate Refund Modal */}
      <AnimatePresence>
        {refundModalReturn && (() => {
          const pInfo = detectPaymentMethod(refundModalReturn);
          const confirmedAmt = Number(refundConfirmedAmount) || 0;
          const deliveryFee = Number(refundDeliveryFee) || 0;
          const netAmount = confirmedAmt - deliveryFee;
          return (
            <motion.div
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 40 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
              >
                <div className="p-6 border-b border-gray-100 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-xl">
                      <SendHorizonal className="text-amber-600 w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Initiate Refund</h3>
                      <p className="text-sm text-gray-500">Return #{refundModalReturn.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                  {/* Customer & Payment Info */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer Info</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{refundModalReturn.user?.username}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {pInfo.method === 'MPESA' ? <Smartphone className="w-4 h-4 text-green-500" /> : <CreditCard className="w-4 h-4 text-blue-500" />}
                      <span className="text-sm text-gray-700">
                        Original payment: <span className={`font-semibold ${pInfo.method === 'MPESA' ? 'text-green-700' : 'text-blue-700'}`}>{pInfo.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Editable M-Pesa Details */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700 border-b pb-1">M-Pesa Disbursement Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
                        <div className="relative">
                          <Smartphone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            value={refundMpesaPhone}
                            onChange={(e) => setRefundMpesaPhone(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                            placeholder="e.g. 07XXXXXXXX"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">M-Pesa Name (Opt)</label>
                        <div className="relative">
                          <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            value={refundMpesaName}
                            onChange={(e) => setRefundMpesaName(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                            placeholder="Registered Name"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">
                      Confirmed Refund Amount (KSh)
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      Return amount: {formatCurrency(refundModalReturn.amount)}
                      {refundModalReturn.returnCharge > 0 && ` — Charge applied: ${formatCurrency(refundModalReturn.returnCharge)}`}
                    </p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">KSh</span>
                      <input
                        type="number"
                        value={refundConfirmedAmount}
                        onChange={(e) => setRefundConfirmedAmount(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Optional Delivery Fee Recovery */}
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-gray-700">
                      Delivery Fee Recovery (Optional)
                    </label>
                    <p className="text-xs text-gray-400">
                      Only apply if return is NOT due to seller/rider fault and order had free delivery.
                    </p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">KSh</span>
                      <input
                        type="number"
                        value={refundDeliveryFee}
                        onChange={(e) => setRefundDeliveryFee(e.target.value)}
                        className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none bg-gray-50"
                        placeholder="0.00 (leave empty to skip)"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Net Amount Display */}
                  <div className={`rounded-xl p-4 flex items-center justify-between ${netAmount > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2">
                      <Banknote className={`w-5 h-5 ${netAmount > 0 ? 'text-green-600' : 'text-red-600'}`} />
                      <span className="font-semibold text-gray-800">Net to Disburse</span>
                    </div>
                    <span className={`text-xl font-bold ${netAmount > 0 ? 'text-green-700' : 'text-red-600'}`}>
                      KSh {netAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Notes (Optional)</label>
                    <textarea
                      rows={2}
                      value={refundAdminNotes}
                      onChange={(e) => setRefundAdminNotes(e.target.value)}
                      placeholder="Internal notes about this refund..."
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none resize-none text-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-3 border-t">
                    <button
                      onClick={() => setRefundModalReturn(null)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInitiateRefund}
                      disabled={isRefunding || netAmount <= 0}
                      className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isRefunding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SendHorizonal className="w-4 h-4" />}
                      {isRefunding ? "Initiating..." : "Send Refund via M-Pesa"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
