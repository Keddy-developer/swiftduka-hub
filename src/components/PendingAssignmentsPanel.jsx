import { useState, useEffect } from "react";
import axiosInstance from "../services/axiosConfig";
import { formatDistanceToNow, addMinutes, differenceInSeconds } from "date-fns";
import { Clock, AlertCircle, RefreshCw, Bike, MapPin, Package } from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

export default function PendingAssignmentsPanel() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timers, setTimers] = useState({});

    useEffect(() => {
        fetchPendingAssignments();
        const interval = setInterval(fetchPendingAssignments, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Timer countdown logic
    useEffect(() => {
        const timerInterval = setInterval(() => {
            setTimers((prevTimers) => {
                const newTimers = { ...prevTimers };
                assignments.forEach((assignment) => {
                    if (assignment.assignmentExpiresAt) {
                        const now = new Date();
                        const expiresAt = new Date(assignment.assignmentExpiresAt);
                        const secondsLeft = differenceInSeconds(expiresAt, now);
                        newTimers[assignment.id] = secondsLeft > 0 ? secondsLeft : 0;
                    }
                });
                return newTimers;
            });
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [assignments]);

    const fetchPendingAssignments = async () => {
        try {
            const response = await axiosInstance.get('/riders/pending-assignments');
            if (response.data.success) {
                setAssignments(response.data.data);
            }
        } catch (err) {
            // Silently ignore 404 — endpoint may not be available yet
            if (err?.response?.status !== 404) {
                console.error("Error fetching pending assignments:", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const getTimerColor = (seconds) => {
        if (seconds > 300) return "text-green-600 bg-green-50"; // > 5 mins
        if (seconds > 60) return "text-yellow-600 bg-yellow-50"; // > 1 min
        if (seconds > 0) return "text-red-600 bg-red-50"; // < 1 min
        return "text-gray-500 bg-gray-100"; // Expired
    };

    if (loading && assignments.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (assignments.length === 0) {
        return null; // Don't show panel if no pending assignments
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Pending Assignments</h2>
                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {assignments.length}
                    </span>
                </div>
                <button
                    onClick={fetchPendingAssignments}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Refresh assignments"
                >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                    {assignments.map((assignment) => {
                        const secondsLeft = timers[assignment.id] || 0;
                        const timerColorClass = getTimerColor(secondsLeft);

                        return (
                            <motion.div
                                key={assignment.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`px-2.5 py-1 rounded-md text-sm font-bold flex items-center gap-1.5 ${timerColorClass}`}>
                                        <Clock className="w-3.5 h-3.5" />
                                        {secondsLeft > 0 ? formatTime(secondsLeft) : "Expired"}
                                    </div>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        #{assignment.order?.trackingNumber}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {/* Rider Info */}
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <Bike className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">{assignment.rider?.name}</p>
                                            <p className="text-xs text-gray-500">{assignment.rider?.phone}</p>
                                        </div>
                                    </div>

                                    {/* Order Info */}
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <Package className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-700 line-clamp-1">
                                                {assignment.orderProduct?.product?.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Qty: {assignment.orderProduct?.quantity} • {assignment.order?.deliveryType}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Delivery Info */}
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                To: {assignment.order?.shippingAddress?.city}, {assignment.order?.shippingAddress?.address}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                                    {/* We can add reassign button here later if needed, 
                       but standard flow is to just let it expire or manually reassign from order list */}
                                    <div className="text-xs text-gray-400 italic">
                                        {secondsLeft > 0 ? "Waiting for acceptance..." : "Assignment expired"}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
