import React, { useState, useEffect } from 'react';
import {
  Globe, MapPin, Building2, DollarSign, Truck,
  ArrowRight, Home, Package, AlertCircle, RefreshCw,
  Shield, Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../services/axiosConfig';

/**
 * ZoneInfoPage – Fulfillment Portal (Read-Only)
 *
 * Fulfillment Managers can VIEW their hub's assigned zone, its pricing
 * tiers, and last-mile rates. They CANNOT edit anything here.
 * All mutations are Admin-only via the Admin Panel.
 */
const ZoneInfoPage = () => {
  const { hub } = useAuth();

  const [zone, setZone] = useState(null);
  const [pricingTiers, setPricingTiers] = useState([]);
  const [lastMileTiers, setLastMileTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hub?.zoneId) {
      fetchZoneData(hub.zoneId);
    } else {
      setLoading(false);
    }
  }, [hub]);

  const fetchZoneData = async (zoneId) => {
    setLoading(true);
    setError(null);
    try {
      const [zoneRes, tiersRes, lmRes] = await Promise.all([
        axiosInstance.get(`/delivery/zones/${zoneId}`),
        axiosInstance.get(`/delivery/zones/${zoneId}/pricing`),
        axiosInstance.get(`/delivery/last-mile-tiers?zoneId=${zoneId}`)
      ]);

      setZone(zoneRes.data.zone);
      setPricingTiers(tiersRes.data.tiers || []);
      setLastMileTiers(lmRes.data.tiers || []);
    } catch (err) {
      setError('Failed to load zone data. Please try again.');
      console.error('[ZoneInfoPage] error:', err);
    } finally {
      setLoading(false);
    }
  };

  const doorTiers = lastMileTiers.filter(t => t.deliveryType === 'DOOR');
  const pickupTiers = lastMileTiers.filter(t => t.deliveryType === 'PICKUP');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
        <p className="text-sm text-slate-500">Loading zone information…</p>
      </div>
    );
  }

  if (!hub?.zoneId || !zone) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-800 mb-1">No Zone Assigned</h3>
            <p className="text-sm text-amber-700">
              This fulfillment hub has not been assigned to a delivery zone yet.
              Please contact your Administrator to assign this hub to a zone and configure pricing tiers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex gap-4">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <button onClick={() => fetchZoneData(hub.zoneId)} className="mt-2 text-xs text-red-600 underline">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Read-Only Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 text-blue-700">
          <Shield className="w-4 h-4" />
          <Eye className="w-4 h-4" />
        </div>
        <p className="text-sm text-blue-800">
          <strong>Read-Only View.</strong> Zone configuration and pricing is managed exclusively by Administrators via the Admin Panel.
        </p>
      </div>

      {/* Zone Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md shrink-0">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{zone.name}</h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${zone.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${zone.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {zone.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {zone.description && <p className="text-sm text-slate-500 mt-1">{zone.description}</p>}
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Building2 className="w-3.5 h-3.5" />
                {zone.hubs?.length || 0} hubs in this zone
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <DollarSign className="w-3.5 h-3.5" />
                {pricingTiers.length} inter-zone pricing tiers
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Truck className="w-3.5 h-3.5" />
                {lastMileTiers.length} last-mile tiers
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* This Hub */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-slate-700 text-sm">Your Hub in This Zone</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100 shrink-0">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800">{hub?.name}</p>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />{hub?.town}
              </p>
            </div>
          </div>

          {/* Other hubs in zone */}
          {zone.hubs && zone.hubs.filter(h => h.id !== hub?.id).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-400  tracking-widest mb-2">Other Hubs in Zone</p>
              <div className="flex flex-wrap gap-2">
                {zone.hubs.filter(h => h.id !== hub?.id).map(h => (
                  <span key={h.id} className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600 font-medium">
                    <Building2 className="w-3 h-3" />{h.name} · <MapPin className="w-3 h-3" />{h.town}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inter-Zone Pricing */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-slate-700 text-sm">Inter-Zone Delivery Rates</h3>
          <span className="ml-auto text-xs text-slate-400">From {zone.name}</span>
        </div>

        <div className="p-5">
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4 flex gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>How it works:</strong> When a customer orders from your hub, the system finds the matching weight tier for the destination zone. For multi-seller carts, only the <strong>highest inter-zone fee applies</strong> — no fee stacking. Chargeable weight = MAX(actual kg, volumetric ÷ 5000).
            </p>
          </div>

          {pricingTiers.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">No inter-zone pricing configured yet. Contact Admin.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border border-slate-100 rounded-lg">
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500  tracking-wider">Route</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500  tracking-wider">Weight Range</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500  tracking-wider">Rate (KES)</th>
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500  tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pricingTiers.map(tier => (
                    <tr key={tier.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                            {tier.fromZone?.name || 'This Zone'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">
                            {tier.toZone?.name || tier.toZoneId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-sm">
                        {tier.minWeight}kg – {tier.maxWeight >= 9999 ? '∞' : `${tier.maxWeight}kg`}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">KES {tier.price.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tier.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {tier.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Last-Mile Pricing */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Truck className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-slate-700 text-sm">Last-Mile Delivery Pricing</h3>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 mb-4">Last-mile fee is added on top of the inter-zone fee. It's based on the customer's delivery preference and total cart weight.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Door Delivery', icon: Home, type: 'DOOR', tiers: doorTiers, color: 'blue' },
              { label: 'Pickup Station', icon: Package, type: 'PICKUP', tiers: pickupTiers, color: 'green' }
            ].map(({ label, icon: Icon, tiers, color }) => (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                <div className={`px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-${color}-50`}>
                  <Icon className={`w-4 h-4 text-${color}-600`} />
                  <span className="font-bold text-sm text-slate-800">{label}</span>
                </div>
                {tiers.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">Not configured</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-3 py-2 text-left text-xs text-slate-400 font-bold ">Weight</th>
                        <th className="px-3 py-2 text-left text-xs text-slate-400 font-bold ">Price (KES)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {tiers.map(tier => (
                        <tr key={tier.id} className="hover:bg-white transition-colors">
                          <td className="px-3 py-2.5 text-slate-600">
                            {tier.minWeight}–{tier.maxWeight >= 9999 ? '∞' : tier.maxWeight}kg
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-900">{tier.price.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneInfoPage;
