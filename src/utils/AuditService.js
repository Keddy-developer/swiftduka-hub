import axiosInstance from "../services/axiosConfig";

/**
 * AuditService
 * Centralized service to log actions performed by fulfillment staff
 */
export const AuditService = {
  /**
   * Log a specific action to the backend
   * @param {string} hubId 
   * @param {string} action - e.g. "PRODUCT_UPDATE", "ORDER_DISPATCH"
   * @param {object} details - { message: "Updated stock for SKU-123", ... }
   * @param {object} metadata - Optional additional data
   */
  logAction: async (hubId, action, details = {}, metadata = {}) => {
    try {
      if (!hubId) return;
      await axiosInstance.post(`/delivery/hubs/${hubId}/logs`, {
        action,
        details,
        metadata
      });
    } catch (err) {
      console.error("Action logging failed:", err);
      // Fail silently as logging shouldn't break the UI
    }
  }
};
