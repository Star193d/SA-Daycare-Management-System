import React, { useState } from 'react';
import { HelpCircle, Key, BookOpen, ShieldCheck, Mail } from 'lucide-react';

export const HelpSupportTab: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');
    
    // Safety Log to dev terminal
    console.log("[DEV PROTO SUPPORT SUBMIT]:", form);
    
    setFeedback("Thank you! Your helpdesk ticket has been simulated and logged successfully. Our team will contact you soon.");
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Help topics columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Usage Guides */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <BookOpen size={16} /> Daycare Modules Quick Start Guides
            </h3>
            
            <div className="space-y-4 text-xs text-slate-650 leading-relaxed font-sans">
              <div>
                <h4 className="font-bold text-slate-900 border-l-2 border-emerald-600 pl-2">1. Admission & Registrations</h4>
                <p className="mt-1">
                  Always start by registering the **Parent Account** first. Once the parent profile exists, enroll the Child which links parents, calculates **automated sibling discounts**, and generates a 15% VAT itemized Tax Statement immediately.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 border-l-2 border-emerald-600 pl-2">2. Secure Cents Billing</h4>
                <p className="mt-1">
                  Financial calculations use underlying integer centers to prevent floats. You can edit line items, add custom rows, record payments, and download complete PDFs immediately via custom browsers.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 border-l-2 border-emerald-600 pl-2">3. Medical Allergen Guard</h4>
                <p className="mt-1">
                  The Meal module scans allergy columns on roster files. Schedules carrying matching allergen ingredients will automatically display prominent yellow hazards outlining specific children affected.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 border-l-2 border-emerald-600 pl-2">4. Attendance Imports</h4>
                <p className="mt-1">
                  You can record daily statuses or upload CSV sheets carrying columns: `childId, date, status, checkInTime, checkOutTime` to batch import logs in 1 click.
                </p>
              </div>
            </div>
          </div>

          {/* POPIA regulatory FAQs */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <ShieldCheck size={16} className="text-emerald-600" /> S.A. POPIA Statutory FAQ (Act No. 4 of 2013)
            </h3>
            
            <div className="space-y-4 text-xs text-slate-655 leading-relaxed font-sans">
              <div>
                <h4 className="font-bold text-slate-900">Q: What specific PII data metrics are archived?</h4>
                <p className="mt-0.5 text-slate-550 text-slate-600">
                  National Identifiers, emails, phone contacts, billing invoices, and nutritional dietary allergy vectors are stored to fulfill child-care safety and corporate ledger auditing requirements.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">Q: How do we respond to data subject inquiries (Section 23 right to access)?</h4>
                <p className="mt-0.5 text-slate-550 text-slate-600">
                  Parents can request full profile history. Under POPIA Section 23 rules, navigate to POPIA Reports, export their profile CSV to fully portable sheets and hand over safely.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900">Q: Why are National ID sequences masked?</h4>
                <p className="mt-0.5 text-slate-550 text-slate-600">
                  Minors' ID numbers trigger critical protection triggers under POPIA Section 34. Displaying full national IDs on standard displays increases vulnerability. We mask sequences with `***-***-XXXX-X` across output boundaries.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shortcuts & helpdesk form */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <Key size={16} /> Keyboard Shortcuts
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800">Switch tabs</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-xxs font-mono border border-slate-250 border-slate-200 text-slate-500 font-semibold shadow-xs">Alt + [1-7]</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800">Print Table/Page</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-xxs font-mono border border-slate-250 border-slate-200 text-slate-500 font-semibold shadow-xs">Ctrl + P</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="font-bold text-slate-800">Dismiss Modal</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-xxs font-mono border border-slate-250 border-slate-200 text-slate-500 font-semibold shadow-xs">Esc Key</span>
              </div>
            </div>
          </div>

          {/* Helpdesk form */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
              <Mail size={16} /> Helpdesk support ticket
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              {feedback && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xxs font-semibold">
                  {feedback}
                </div>
              )}

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Your Name</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Elaine Smit"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Support Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none"
                  placeholder="e.g. elaine@care.co.za"
                />
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Inquiry Details</label>
                <textarea
                  required
                  rows={3}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="How can our IT team help you today?"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-lg transition-all"
              >
                Simulate Ticket Dispatch
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
