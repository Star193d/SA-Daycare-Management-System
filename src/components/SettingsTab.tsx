import React, { useState } from 'react';
import { StateService } from '../lib/services/StateService';
import { DaycareSettings } from '../lib/types';
import { ShieldAlert, Award, CreditCard, Building, CheckCircle } from 'lucide-react';

interface SettingsTabProps {
  stateService: StateService;
  onSettingsUpdated: (settings: DaycareSettings) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ stateService, onSettingsUpdated }) => {
  const [settings, setSettings] = useState<DaycareSettings>(stateService.settings);
  const [feedback, setFeedback] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');

    if (!settings.name.trim() || !settings.vatNumber.trim() || !settings.accountNumber.trim()) {
      setFeedback('You must populate key statutory fields to maintain corporate legitimacy.');
      return;
    }

    stateService.updateSettings(settings);
    onSettingsUpdated(settings);
    setFeedback('Success! Institutional settings updated and locked into sandbox storage.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <h3 className="font-semibold text-base mb-1">Institutional Profile & Statutory Settings</h3>
        <p className="text-xs text-slate-400 mb-6">These fields are used to automatically populate invoice headers, tax references, and POPIA declarations.</p>

        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
          {feedback && (
            <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="text-emerald-600 shrink-0" size={16} />
              <span>{feedback}</span>
            </div>
          )}

          <div className="space-y-5">
            <h4 className="text-xxs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 pb-2 flex items-center gap-1">
              <Building size={12} /> Registry Metadata
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Daycare Facility Name</label>
                <input
                  required
                  type="text"
                  value={settings.name}
                  onChange={e => setSettings({ ...settings, name: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">SARS VAT Number</label>
                <input
                  required
                  type="text"
                  value={settings.vatNumber}
                  onChange={e => setSettings({ ...settings, vatNumber: e.target.value })}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Physical Facility Address</label>
                <input
                  required
                  type="text"
                  value={settings.address}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Principal Contact Phone</label>
                <input
                  required
                  type="text"
                  value={settings.phone}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3.5 py-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Institutional Email</label>
                <input
                  required
                  type="email"
                  value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3.5 py-2.5 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-5 pt-4">
            <h4 className="text-xxs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 pb-2 flex items-center gap-1">
              <CreditCard size={12} /> Corporate EFT Banking Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bank Name</label>
                <input
                  required
                  type="text"
                  value={settings.bankName}
                  onChange={e => setSettings({ ...settings, bankName: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3.5 py-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Account Number</label>
                <input
                  required
                  type="text"
                  value={settings.accountNumber}
                  onChange={e => setSettings({ ...settings, accountNumber: e.target.value })}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg px-3.5 py-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Branch Clearing Code</label>
                <input
                  required
                  type="text"
                  value={settings.branchCode}
                  onChange={e => setSettings({ ...settings, branchCode: e.target.value })}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg px-3.5 py-2.5 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-5 pt-4">
            <h4 className="text-xxs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100 pb-2 flex items-center gap-1">
              <ShieldAlert size={12} /> POPIA Sec-14 Data Retention Policy
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Retention Period (Years)</label>
                <select
                  value={settings.dataRetentionYears}
                  onChange={e => setSettings({ ...settings, dataRetentionYears: parseInt(e.target.value, 10) })}
                  className="w-full text-xs border border-slate-300 bg-white rounded-lg px-3.5 py-2.5 outline-none"
                >
                  <option value={3}>3 Years (Short Archive)</option>
                  <option value={5}>5 Years (Statutory Standard - Section 14)</option>
                  <option value={7}>7 Years (Extended Audit Safety)</option>
                  <option value={10}>10 Years (Historical Record limit)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1.5">In South Africa, the POPIA general standards establish a default 5-year limit for student medical files before mandatory digital shredding.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-150 flex justify-end">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-3 rounded-lg shadow-sm transition-all"
            >
              Lock Configuration Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
