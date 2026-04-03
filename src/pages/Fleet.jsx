import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import axiosInstance from "../services/axiosConfig";
import { Pencil, Trash2, Plus, ArrowLeft, Truck, Package, Star, Phone, IdCard, Wallet, TrendingUp } from "lucide-react";
import { toast } from "react-toastify";
import PendingAssignmentsPanel from "../components/PendingAssignmentsPanel";
import RiderEarningsModal from "../components/RiderEarningsModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RidersManagement() {
  const { hub } = useAuth();
  const [riders, setRiders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRiders();
  }, [hub]);

  const fetchRiders = async () => {
    if (!hub?.id) return;
    try {
      const response = await axiosInstance.get(`/delivery/hubs/${hub.id}/riders`);
      setRiders(response.data?.riders || response.data || []);
    } catch (err) {
      console.error("Failed to fetch riders:", err);
      toast.error("Failed to load riders");
      setRiders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (id) => {
    setShowModal(true);
    setSelectedRiderId(id);
  };

  const handleDelete = async (id) => {
    setLoadingDelete(true);
    try {
      await axiosInstance.delete(`/delivery/hubs/${hub.id}/riders/${id}`);
      setRiders((prev) => prev.filter((rider) => rider.id !== id));
      toast.success("Rider removed from hub.");
    } catch (error) {
      console.error("Error removing rider:", error);
      toast.error("Failed to remove rider.");
    } finally {
      setLoadingDelete(false);
      setShowModal(false);
      setSelectedRiderId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="loading-skeleton h-8 w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="loading-skeleton h-6 w-32 mb-4"></div>
                <div className="loading-skeleton h-4 w-full mb-2"></div>
                <div className="loading-skeleton h-4 w-full mb-2"></div>
                <div className="loading-skeleton h-4 w-3/4 mb-4"></div>
                <div className="loading-skeleton h-12 w-full rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="btn-ghost flex items-center gap-2 text-primary hover:text-primary-700"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Rider Management</h1>
          </div>
          <button
            onClick={() => navigate("/register-a-rider/new")}
            className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Rider</span>
          </button>
        </div>

        {/* Pending Assignments Panel */}
        <PendingAssignmentsPanel />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{riders.length}</p>
            <p className="text-sm text-gray-600">Total Riders</p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {riders.reduce((total, rider) => total + (rider.totalDeliveries || 0), 0)}
            </p>
            <p className="text-sm text-gray-600">Total Deliveries</p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {riders.reduce((total, rider) => total + (rider.pendingDeliveries || 0), 0)}
            </p>
            <p className="text-sm text-gray-600">Pending Deliveries</p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {riders.length > 0
                ? (riders.reduce((total, rider) => total + (rider.rating || 0), 0) / riders.length).toFixed(1)
                : "0.0"
              }
            </p>
            <p className="text-sm text-gray-600">Average Rating</p>
          </div>
        </div>

        {/* Riders Grid */}
        {riders.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Riders Yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first rider to the team</p>
            <Link to="/register-a-rider/new">
              <button className="btn-primary flex items-center gap-2 mx-auto">
                <Plus className="w-5 h-5" />
                <span>Add First Rider</span>
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {riders.map((rider) => (
              <motion.div
                key={rider.id}
                className="card card-hover p-6 border border-gray-100"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col gap-4">
                  {/* Rider Header & Status */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {rider.vehicleImage ? (
                        <img
                          src={rider.vehicleImage}
                          alt={rider.name}
                          className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <Truck className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {rider.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${rider.status === "AVAILABLE" ? "bg-green-500" :
                            rider.status === "BUSY" ? "bg-orange-500" : "bg-gray-400"
                            }`} />
                          <span className="text-xs font-medium text-gray-600 capitalize">
                            {rider.status?.toLowerCase() || "offline"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                        <Wallet className="w-3.5 h-3.5" />
                        <span className="text-xs text-xs">Earnings</span>
                      </div>
                      <p className="font-bold text-gray-900">
                        KES {(rider.totalEarnings || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="text-xs">Acceptance</span>
                      </div>
                      <p className="font-bold text-gray-900">
                        {rider.acceptanceRate ? `${rider.acceptanceRate}%` : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Rider Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{rider.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{rider.numberPlate} • {rider.vehicleType}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/register-a-rider/${rider.id}`)}
                      className="btn-ghost flex items-center justify-center gap-2 flex-1 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleShowModal(rider.id)}
                      className="btn-ghost flex items-center justify-center gap-2 flex-1 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Earnings Modal */}
      {showEarningsModal && selectedRiderId && (
        <RiderEarningsModal
          riderId={selectedRiderId}
          onClose={() => {
            setShowEarningsModal(false);
            setSelectedRiderId(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {
        showModal && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Rider</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this rider? All their delivery history and data will be permanently removed.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  className="btn-ghost px-4 py-2"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRiderId(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500 px-4 py-2 flex items-center gap-2"
                  onClick={() => handleDelete(selectedRiderId)}
                  disabled={loadingDelete}
                >
                  {loadingDelete ? (
                    <>
                      <div className="loading-spinner w-4 h-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Rider
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )
      }
    </div >
  );
}
