import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gavel, TrendingUp, RefreshCw, ArrowLeft, Save, Shield } from 'lucide-react';
import { toast } from 'react-toastify';
import axiosInstance from '../services/axiosConfig';

const CompensationRuleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = id && id !== 'new';
  
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  
  const [ruleForm, setRuleForm] = useState({
    name: "",
    type: "FIXED_PER_DELIVERY",
    value: "",
    priority: 0,
    isActive: true,
    config: {
      amount: '',
      baseFee: '',
      perKmRate: '',
      perOrderBonus: '',
      zones: []
    }
  });

  useEffect(() => {
    if (isEditing) {
      fetchRule();
    }
  }, [id]);

  const fetchRule = async () => {
    try {
      // In a real app, you'd fetch the specific rule by ID
      const res = await axiosInstance.get(`/delivery/compensation-rules`);
      const rule = res.data.data.find(r => r.id === id);
      if (rule) {
        setRuleForm({
          ...rule,
          config: rule.config || {}
        });
      } else {
        toast.error('Rule not found');
        navigate('/finance');
      }
    } catch (err) {
      toast.error('Failed to load rule');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let config = {};
      if (ruleForm.type === 'DISTANCE_BASED') {
         config = {
           baseFee: parseFloat(ruleForm.config.baseFee || 0),
           perKmRate: parseFloat(ruleForm.config.perKmRate || 0)
         };
      } else if (ruleForm.type === 'HYBRID') {
         config = {
           baseFee: parseFloat(ruleForm.config.baseFee || 0),
           perKmRate: parseFloat(ruleForm.config.perKmRate || 0),
           perOrderBonus: parseFloat(ruleForm.config.perOrderBonus || 0)
         };
      } else if (['PER_ORDER', 'BONUS', 'PENALTY', 'FIXED_PER_DELIVERY'].includes(ruleForm.type)) {
         config = { amount: parseFloat(ruleForm.config.amount || ruleForm.value || 0) };
      } else if (ruleForm.type === 'ZONE_BASED') {
         config = { zones: ruleForm.config.zones || [] };
      }

      const payload = {
        name: ruleForm.name,
        type: ruleForm.type,
        value: parseFloat(ruleForm.value || ruleForm.config.amount) || 0,
        priority: parseInt(ruleForm.priority) || 0,
        isActive: ruleForm.isActive,
        config
      };

      if (isEditing) {
        // Ideally PATCH /delivery/compensation-rules/:id
        await axiosInstance.put(`/delivery/compensation-rules/${id}`, payload);
        toast.success("Rule updated successfully");
      } else {
        await axiosInstance.post(`/delivery/compensation-rules`, payload);
        toast.success("Compensation rule established");
      }
      navigate('/finance');
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 opacity-30">
        <RefreshCw className="w-12 h-12 animate-spin text-slate-400 mb-4" />
        <p className="text-xs font-black tracking-widest text-slate-500">LOADING RULE...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <button onClick={() => navigate('/finance')} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            {isEditing ? 'Edit Rule' : 'New Compensation Rule'}
          </h1>
          <p className="text-xs text-slate-500 font-black tracking-widest mt-1 flex items-center gap-2 uppercase">
            <Shield size={14} className="text-emerald-600" />
            Remuneration Logic Configurator
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Rule Name</label>
            <input 
              required
              value={ruleForm.name}
              onChange={(e) => setRuleForm({...ruleForm, name: e.target.value})}
              placeholder="e.g. Standard Bike Delivery"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Rule Status</label>
            <select 
              value={ruleForm.isActive ? "true" : "false"}
              onChange={(e) => setRuleForm({...ruleForm, isActive: e.target.value === "true"})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-emerald-500 transition-all uppercase"
            >
              <option value="true">ACTIVE (Live)</option>
              <option value="false">INACTIVE (Disabled)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Computation Mode</label>
            <select 
              value={ruleForm.type}
              onChange={(e) => setRuleForm({...ruleForm, type: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-emerald-500 transition-all uppercase"
            >
              <optgroup label="Primary Earning Modes">
                <option value="PER_ORDER">Per Order (Flat Fee)</option>
                <option value="DISTANCE_BASED">Distance Based (Per KM)</option>
                <option value="HYBRID">Hybrid (Base + Per KM)</option>
                <option value="ZONE_BASED">Zone Based (By Town/City)</option>
              </optgroup>
              <optgroup label="Secondary Modifiers">
                <option value="BONUS">General Bonus</option>
                <option value="PENALTY">Penalty</option>
              </optgroup>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Execution Priority (1-100)</label>
            <input 
              type="number"
              value={ruleForm.priority}
              onChange={(e) => setRuleForm({...ruleForm, priority: parseInt(e.target.value) || 0})}
              placeholder="0 (Higher runs first)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Dynamic Config Fields */}
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Gavel size={16} />
             </div>
             <div>
                <p className="text-xs font-black text-slate-900 uppercase">Configuration Parameters</p>
                <p className="text-[10px] text-slate-500 font-bold">Set specific pricing metrics based on selected mode</p>
             </div>
          </div>
          
          {['PER_ORDER', 'BONUS', 'PENALTY', 'FIXED_PER_DELIVERY'].includes(ruleForm.type) && (
              <div className="space-y-2 max-w-sm">
                <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase ml-1">Flat Amount (KSh)</label>
                <input 
                  required
                  type="number"
                  value={ruleForm.config?.amount || ruleForm.value || ''}
                  onChange={(e) => setRuleForm({...ruleForm, value: parseFloat(e.target.value), config: {...ruleForm.config, amount: parseFloat(e.target.value)}})}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-black outline-none focus:border-emerald-500"
                />
              </div>
          )}

          {['DISTANCE_BASED', 'HYBRID'].includes(ruleForm.type) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase ml-1">Base Fee (KSh)</label>
                  <input 
                    required
                    type="number"
                    value={ruleForm.config?.baseFee || ''}
                    onChange={(e) => setRuleForm({...ruleForm, config: {...ruleForm.config, baseFee: parseFloat(e.target.value)}})}
                    placeholder="e.g. 50"
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-black outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase ml-1">Per Km Rate (KSh)</label>
                  <input 
                    required
                    type="number"
                    value={ruleForm.config?.perKmRate || ''}
                    onChange={(e) => setRuleForm({...ruleForm, config: {...ruleForm.config, perKmRate: parseFloat(e.target.value)}})}
                    placeholder="e.g. 15"
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-black outline-none focus:border-emerald-500"
                  />
                </div>
                {ruleForm.type === 'HYBRID' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase ml-1">Per Order Bonus (KSh)</label>
                    <input 
                      type="number"
                      value={ruleForm.config?.perOrderBonus || ''}
                      onChange={(e) => setRuleForm({...ruleForm, config: {...ruleForm.config, perOrderBonus: parseFloat(e.target.value)}})}
                      placeholder="Optional extra bonus"
                      className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-black outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>
          )}
          
          {ruleForm.type === 'ZONE_BASED' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase ml-1">Configuration JSON (Zones)</label>
                <textarea 
                  rows={8}
                  placeholder={'{\n  "zones": [\n    {"zone": "Nairobi CBD", "amount": 150},\n    {"zone": "Westlands", "amount": 200}\n  ]\n}'}
                  value={JSON.stringify(ruleForm.config, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setRuleForm({...ruleForm, config: parsed});
                    } catch (err) {
                      // Allow typing invalid json momentarily
                      setRuleForm({...ruleForm, config: e.target.value}); 
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-xs font-mono outline-none focus:border-emerald-500 shadow-inner"
                />
                <p className="text-[10px] text-slate-400 font-bold">Ensure the JSON is strictly formatted with a "zones" array.</p>
              </div>
          )}
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button type="button" onClick={() => navigate('/finance')} className="px-8 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black tracking-widest hover:bg-slate-100 transition-all uppercase">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl text-xs font-black tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 uppercase flex items-center justify-center gap-2">
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {isEditing ? 'SAVE CHANGES' : 'CREATE RULE'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompensationRuleForm;
