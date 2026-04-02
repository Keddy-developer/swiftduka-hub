import axiosInstance from "../services/axiosConfig";
import { Eye, Trash2, UserRound, Store, Star, Calendar, Phone, Mail, MapPin, Shield, TrendingUp, Plus, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { FaAngleLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/ui/button";

export default function SellersPage() {
  const [sellers, setSellers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSellers = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const res = await axiosInstance.get(`/admin/sellers`);
      // Handle different response formats and ensure sellers is always an array
      const sellersData = res.data?.data || res.data;
      setSellers(Array.isArray(sellersData) ? sellersData : []);
    } catch (error) {
      console.error("Error fetching sellers:", error);
      toast.error("Failed to load sellers");
      setSellers([]); // Ensure sellers is array even on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleShowModal = (id) => {
    setShowModal(true);
    setSelectedSellerId(id);
  };

  // toggle deleted sellers


  const handleDelete = async (id) => {
    setLoadingDelete(true);
    const token = localStorage.getItem("token");
    try {
      await axiosInstance.delete(`/admin/delete-seller-account/${id}`);
      setSellers((prev) => prev.filter((seller) => seller.id !== id));
      toast.success("Seller deleted successfully.");
    } catch (error) {
      console.error("Error deleting seller:", error);
      toast.error("Failed to delete seller. Please try again later.");
    } finally {
      setLoadingDelete(false);
      setShowModal(false);
      setSelectedSellerId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  console.log("seller", sellers);
  const getApprovalColor = (status) => {
    switch (status) {
      case "approved":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 ">
      {/* Header */}
      <div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-white"
          >
            <FaAngleLeft className="text-lg" />
            <span className="font-medium">Back</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Store className="text-white text-2xl" />
              </div>
              Seller Accounts
            </h1>
            <p className="text-gray-600 mt-2">
              Manage and monitor all seller accounts in your platform
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link to="/register-seller">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-all">
                <Plus size={20} />
                Register New Seller
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sellers</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{sellers.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <UserRound className="text-blue-600 text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {sellers.filter(s => s.approvalStatus === 'approved').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <Shield className="text-green-600 text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {sellers.filter(s => s.approvalStatus === 'pending').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Calendar className="text-yellow-600 text-xl" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {sellers.reduce((acc, seller) => acc + (seller.sales || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="text-purple-600 text-xl" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sellers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {sellers.map((seller, index) => {
          const joinDateObj = new Date(seller.created_at || seller.createdAt || Date.now());
          const joinDate = joinDateObj.toLocaleDateString();
          const isNewSeller = (new Date() - joinDateObj) / (1000 * 60 * 60 * 24) <= 30;

          return (
            <motion.div
              key={seller.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {seller.profilePicture ? (
                        <img
                          src={seller.profilePicture}
                          alt={seller.storeName}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Store className="text-white text-lg" />
                        </div>
                      )}
                      {seller.emailVerified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <Shield className="text-white text-xs" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                         <h3 className="font-bold text-gray-900 text-lg leading-tight">
                           {seller.storeName || "Unnamed Store"}
                         </h3>
                         {isNewSeller && <span className="badge-new">New Seller</span>}
                      </div>
                      <span className="text-xs text-gray-500 font-mono">#{seller.id.slice(0, 8)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(seller.approvalStatus)}`}>
                      {seller.approvalStatus}
                    </span>
                    {seller.deleted && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
                        Deleted
                      </span>
                    )}
                  </div>
                </div>

                {/* Store Info */}
                <div className="space-y-2">
                  {seller.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{seller.phone}</span>
                    </div>
                  )}
                  {seller.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{seller.email}</span>
                    </div>
                  )}
                  {(seller.city || seller.county) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{[seller.city, seller.county].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 bg-gray-50 border-b border-gray-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{seller.sales || 0}</p>
                    <p className="text-xs text-gray-500">Sales</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {seller.rating || 0}
                    </p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{seller.numRatings || 0}</p>
                    <p className="text-xs text-gray-500">Reviews</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {joinDate}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex gap-1">
                    <Link
                      to={`/sellers/${seller.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      to={`/register-seller?edit=${seller.id}`}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => handleShowModal(seller.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {sellers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Store className="text-gray-300 text-6xl mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">No Sellers Found</h3>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="text-red-600 text-lg" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Seller</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this seller account? This action cannot be undone and all associated data will be permanently removed.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                  onClick={() => selectedSellerId && handleDelete(selectedSellerId)}
                  disabled={loadingDelete}
                >
                  {loadingDelete ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Deleting...
                    </>
                  ) : (
                    "Delete Seller"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
