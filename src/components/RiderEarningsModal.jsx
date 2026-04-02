import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Calendar, TrendingUp, Download, CreditCard } from "lucide-react";
import axiosInstance from "../services/axiosConfig";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export default function RiderEarningsModal({ riderId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (riderId) {
            fetchEarnings();
        }
    }, [riderId]);

    const fetchEarnings = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(
                `/riders/${riderId}/earnings`
            );
            if (response.data.success) {
                setData(response.data.data);
            } else {
                setError("Failed to load earnings data");
            }
        } catch (err) {
            console.error("Error fetching earnings:", err);
            setError("Failed to load earnings data");
        } finally {
            setLoading(false);
        }
    };

    if (!riderId) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Rider Earnings</h2>
                            {data?.rider && (
                                <p className="text-sm text-gray-500">
                                    Financial overview for <span className="font-medium text-gray-900">{data.rider.name}</span>
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center text-red-500 py-10">
                                <p>{error}</p>
                                <button
                                    onClick={fetchEarnings}
                                    className="mt-4 text-sm text-primary underline"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-green-100 rounded-lg">
                                                <DollarSign className="w-5 h-5 text-green-600" />
                                            </div>
                                            <span className="text-sm font-medium text-green-800">Total Earnings</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            KES {(data.summary.totalEarnings || 0).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-orange-100 rounded-lg">
                                                <TrendingUp className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <span className="text-sm font-medium text-orange-800">Pending Amount</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            KES {(data.summary.pendingEarnings || 0).toLocaleString()}
                                        </p>
                                    </div>

                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <CreditCard className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <span className="text-sm font-medium text-blue-800">Last Payout</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">
                                            KES {(data.summary.lastPayoutAmount || 0).toLocaleString()}
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            {data.summary.lastPayoutDate ? format(new Date(data.summary.lastPayoutDate), 'MMM d, yyyy') : 'No payouts yet'}
                                        </p>
                                    </div>
                                </div>

                                {/* Chart Section */}
                                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-gray-900">Earnings Trend</h3>
                                        <div className="flex gap-2">
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                                Daily Earnings
                                            </span>
                                        </div>
                                    </div>

                                    <div className="h-[300px] w-full">
                                        {data.recentCompletedOrders.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={data.recentCompletedOrders.slice().reverse()}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                    <XAxis
                                                        dataKey="completedAt"
                                                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tickFormatter={(value) => `KES ${value}`}
                                                    />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        formatter={(value) => [`KES ${value}`, 'Earnings']}
                                                        labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy h:mm a')}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="totalEarnings"
                                                        stroke="#D97706"
                                                        strokeWidth={3}
                                                        dot={{ r: 4, fill: '#D97706', strokeWidth: 2, stroke: '#fff' }}
                                                        activeDot={{ r: 6 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                                <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
                                                <p>No earnings data available for chart</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Transactions Table */}
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-4">Recent Transactions</h3>
                                    <div className="overflow-hidden rounded-xl border border-gray-200">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 text-gray-500 font-medium">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Order ID</th>
                                                    <th className="px-4 py-3">Delivery Fee</th>
                                                    <th className="px-4 py-3">Bonus</th>
                                                    <th className="px-4 py-3 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {data.recentCompletedOrders.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                                            No completed orders found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    data.recentCompletedOrders.map((order) => (
                                                        <tr key={order.id} className="hover:bg-gray-50/50">
                                                            <td className="px-4 py-3 text-gray-600">
                                                                {format(new Date(order.completedAt), 'MMM d, yyyy h:mm a')}
                                                            </td>
                                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                                {order.trackingNumber || order.id.substring(0, 8)}
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-600">
                                                                KES {order.deliveryFee?.toLocaleString() || 0}
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-600">
                                                                {order.bonusAmount > 0 ? (
                                                                    <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs px-2">+ KES {order.bonusAmount}</span>
                                                                ) : '-'}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                                KES {(order.totalEarnings || 0).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
