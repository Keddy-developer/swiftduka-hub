import React, { useState, useEffect } from "react";
import axiosInstance from "../services/axiosConfig";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FaUndo, FaExclamationTriangle, FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function ReturnRequestForm({ product, fetchOrders, setOpenModal }) {
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedVariants, setSelectedVariants] = useState([]);
    const [variantQuantities, setVariantQuantities] = useState({});
    const [expandedVariant, setExpandedVariant] = useState(null);

    const orderId = product.orderId;
    const productId = product.productId;
    const hasVariants = product.variant && product.variant.length > 0;

    // Initialize selected variants and quantities
    useEffect(() => {
        if (hasVariants) {
            const initialSelected = product.variant.map(v => v.combo.key);
            setSelectedVariants(initialSelected);

            const initialQuantities = {};
            product.variant.forEach(variant => {
                initialQuantities[variant.combo.key] = variant.quantity || 1;
            });
            setVariantQuantities(initialQuantities);
        }
    }, [product.variant, hasVariants]);

    const calculateTotalAmount = () => {
        if (!hasVariants || selectedVariants.length === 0) {
            return (product.priceAtPurchase || product.price) * product.quantity;
        }

        return selectedVariants.reduce((total, variantKey) => {
            const variant = product.variant.find(v => v.combo.key === variantKey);
            const quantity = variantQuantities[variantKey] || 1;
            const price = variant?.combo.discountedPrice || variant?.combo.price || product.priceAtPurchase || product.price;
            return total + (price * quantity);
        }, 0);
    };

    const getMaxQuantity = (variantKey) => {
        const variant = product.variant.find(v => v.combo.key === variantKey);
        return variant?.quantity || product.quantity;
    };

    const handleVariantSelection = (variantKey, isSelected) => {
        if (isSelected) {
            setSelectedVariants(prev => [...prev, variantKey]);
        } else {
            setSelectedVariants(prev => prev.filter(key => key !== variantKey));
            setVariantQuantities(prev => ({ ...prev, [variantKey]: 1 }));
        }
    };

    const handleQuantityChange = (variantKey, newQuantity) => {
        const maxQuantity = getMaxQuantity(variantKey);
        const quantity = Math.max(1, Math.min(newQuantity, maxQuantity));
        setVariantQuantities(prev => ({ ...prev, [variantKey]: quantity }));
    };

    const validateForm = () => {
        if (!reason.trim()) {
            toast.warning("Please select a return reason");
            return false;
        }
        if (hasVariants && selectedVariants.length === 0) {
            toast.warning("Please select at least one variant to return");
            return false;
        }
        return true;
    };

    const returnReasons = [
        "Wrong item received",
        "Item damaged or defective",
        "Item doesn't match description",
        "Changed my mind",
        "Better price available",
        "Size doesn't fit",
        "Quality not as expected",
        "Other reason"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const requestData = {
                orderId,
                productId,
                reason,
                notes,
            };

            if (hasVariants) {
                requestData.variants = selectedVariants.map(variantKey => {
                    const variant = product.variant.find(v => v.combo.key === variantKey);
                    return {
                        variantKey,
                        quantity: variantQuantities[variantKey] || 1,
                        priceAtPurchase: variant?.combo.discountedPrice || variant?.combo.price || product.priceAtPurchase || product.price
                    };
                });
                requestData.totalAmount = calculateTotalAmount();
            } else {
                requestData.quantity = product.quantity;
                requestData.totalAmount = calculateTotalAmount();
            }

            await axiosInstance.post(`/returns`, requestData);

            toast.success("🎉 Return request initiated successfully!");
            if (fetchOrders) fetchOrders();
            setOpenModal(false);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to initiate return");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalAmount = calculateTotalAmount();

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-3 p-2 bg-blue-50/50 rounded-2xl mb-6">
                    <div className="p-2 bg-blue-600 rounded-full">
                        <FaUndo className="text-white text-sm" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Admin-Initiated Return</h2>
                        <p className="text-xs text-slate-500">Bypassing standard customer checks</p>
                    </div>
                </div>

                <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                    <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                            {product.product?.image && (
                                <img
                                    src={product.product.image}
                                    alt={product.product.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-800 truncate">{product.product?.name || product.name}</p>
                                <p className="text-sm text-gray-600">
                                    {hasVariants ? `${product.variant.length} variant(s)` : `Qty: ${product.quantity}`} • Order ID: {orderId}
                                </p>
                            </div>
                        </div>
                    </div>

                    {hasVariants && (
                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-gray-700">
                                Select Variants to Return <span className="text-red-500">*</span>
                            </label>

                            {product.variant.map((variantItem, index) => {
                                const variantKey = variantItem.combo.key;
                                const isSelected = selectedVariants.includes(variantKey);
                                const maxQuantity = getMaxQuantity(variantKey);
                                const currentQuantity = variantQuantities[variantKey] || 1;
                                const variantPrice = variantItem.combo.discountedPrice || variantItem.combo.price || product.priceAtPurchase || product.price;
                                const isExpanded = expandedVariant === index;

                                return (
                                    <div key={variantKey} className="border-2 border-gray-200 rounded-2xl overflow-hidden">
                                        <div className="p-4">
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center gap-3 cursor-pointer flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => handleVariantSelection(variantKey, e.target.checked)}
                                                        className="text-blue-600 focus:ring-blue-500 rounded"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-800">{variantKey}</p>
                                                        <p className="text-sm text-gray-600">
                                                            Ksh {variantPrice.toLocaleString()} • Available: {maxQuantity}
                                                        </p>
                                                    </div>
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedVariant(isExpanded ? null : index)}
                                                    className="text-gray-400 hover:text-gray-600 p-1"
                                                >
                                                    {isExpanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                                                </button>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="border-t border-gray-200 bg-gray-50/50 p-4"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-700">Quantity:</span>
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuantityChange(variantKey, currentQuantity - 1)}
                                                                disabled={currentQuantity <= 1 || !isSelected}
                                                                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center disabled:opacity-30"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-8 text-center font-medium">{currentQuantity}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuantityChange(variantKey, currentQuantity + 1)}
                                                                disabled={currentQuantity >= maxQuantity || !isSelected}
                                                                className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center disabled:opacity-30"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                                                            Subtotal: <span className="font-semibold text-green-600">Ksh {(variantPrice * currentQuantity).toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Refund Amount:</span>
                        <span className="text-lg font-bold text-green-600">Ksh {totalAmount.toLocaleString()}</span>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">Reason for Return <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                            {returnReasons.map((r) => (
                                <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${reason === r ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                                    <input type="radio" name="reason" value={r} checked={reason === r} onChange={(e) => setReason(e.target.value)} className="text-blue-600 focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">{r}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">Admin Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Why are you initiating this return?"
                            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                        <FaExclamationTriangle className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700">
                            <span className="font-bold">Important:</span> This will initiate a return even if the product hasn't been delivered. Use with caution.
                        </p>
                    </div>

                    <div className="sticky bottom-0 flex gap-3 bg-white pt-4 pb-2">
                        <button type="button" onClick={() => setOpenModal(false)} disabled={isSubmitting} className="flex-1 bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
                        <button type="submit" disabled={isSubmitting || !reason.trim() || (hasVariants && selectedVariants.length === 0)} className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                            {isSubmitting ? "Initiating..." : "Initiate Return"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
