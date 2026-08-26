"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from "react";
import { Save, Shield, Bell, Percent, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/app/store/store";
import { fetchSettings, updateSettings } from "@/app/store/slices/settingsSlice";
import { useAlert } from "@/app/context/AlertContext";
import ErrorState from "@/app/components/ErrorState";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { data, loading, saving } = useAppSelector((state) => state.settings);
  const { showAlert } = useAlert();

  const [purchaseCommission, setPurchaseCommission] = useState("5");
  const [tradeCommission, setTradeCommission] = useState("2.5");
  const [paymentProcessor, setPaymentProcessor] = useState("Stripe");
  const [apiKey, setApiKey] = useState("sk_live_••••••••••••••••••••");
  const [testMode, setTestMode] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [toggles, setToggles] = useState({
    newOrder: true,
    dispute: true,
    system: true,
    twoFactor: true,
    ipWhitelist: false,
  });

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (data) {
      setPurchaseCommission(String(data.commissionSettings?.purchaseCommission ?? "5"));
      setTradeCommission(String(data.commissionSettings?.tradeCommission ?? "2.5"));
      setPaymentProcessor(data.paymentGateway?.processor ?? "Stripe");
      setApiKey("sk_live_••••••••••••••••••••");
      setTestMode(!!data.paymentGateway?.testMode);
      setSessionTimeout(String(data.securitySettings?.sessionTimeout ?? "30"));
      setToggles({
        newOrder: data.notificationSettings?.newOrderNotifications ?? true,
        dispute: data.notificationSettings?.disputeAlerts ?? true,
        system: data.notificationSettings?.systemAlerts ?? true,
        twoFactor: data.securitySettings?.twoFactor ?? true,
        ipWhitelist: !!data.securitySettings?.ipWhitelist,
      });
    }
  }, [data]);

  const toggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      await dispatch(
        updateSettings({
          commissionPurchase: parseFloat(purchaseCommission),
          commissionTrade: parseFloat(tradeCommission),
          gatewayName: paymentProcessor,
          gatewayKey: apiKey,
          testMode,
          toggles,
          sessionTimeout,
        })
      ).unwrap();
      showAlert("Settings saved successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showAlert(err?.message || "Failed to save settings.", "error");
    }
  };

  const { error } = useAppSelector((state) => state.settings);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#155DFC]" size={40} />
      </div>
    );
  }
  if (error) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchSettings())} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-white">Platform Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Commission Settings */}
        <section className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-zinc-100">
            <Percent size={20} className="text-blue-500" />
            <h2 className="text-xl font-semibold">Commission Settings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Purchase Commission (%)</label>
              <input
                type="number"
                value={purchaseCommission}
                onChange={(e) => setPurchaseCommission(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#155DFC] transition-colors"
              />
              <p className="text-xs text-zinc-600">Standard commission rate for purchases</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Trade Commission (%)</label>
              <input
                type="number"
                value={tradeCommission}
                onChange={(e) => setTradeCommission(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-[#155DFC] transition-colors"
              />
              <p className="text-xs text-zinc-600">Commission rate for trades</p>
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="bg-[#111111] border border-white/5 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 text-zinc-100">
            <Bell size={20} className="text-blue-500" />
            <h2 className="text-xl font-semibold">Notification Settings</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'newOrder', title: 'New Order Notifications', desc: 'Receive alerts for new orders' },
              { key: 'dispute', title: 'Dispute Alerts', desc: 'Get notified about new disputes' },
              { key: 'system', title: 'System Alerts', desc: 'Critical system notifications' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">{item.title}</h4>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
                <button
                  onClick={() => toggle(item.key as keyof typeof toggles)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${toggles[item.key as keyof typeof toggles] ? 'bg-[#155DFC]' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${toggles[item.key as keyof typeof toggles] ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#155DFC] hover:bg-blue-600 disabled:bg-blue-800 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save size={20} />
          )}
          <span>{saving ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>
    </div>
  );
}
