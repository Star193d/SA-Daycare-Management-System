import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Baby, 
  CreditCard, 
  CalendarCheck, 
  Utensils, 
  FileText, 
  MessageSquare, 
  LayoutDashboard,
  ShieldCheck,
  Settings,
  HelpCircle,
  Printer
} from 'lucide-react';

// POPIA aliased service and tab imports - Point 2 compliance check
import { StateService } from './lib/services/StateService';
import { Child, Invoice, DaycareSettings } from './lib/types';
import { DashboardTab } from './components/DashboardTab';
import { RegisterTab } from './components/RegisterTab';
import { BillingTab } from './components/BillingTab';
import { AttendanceTab } from './components/AttendanceTab';
import { MealsTab } from './components/MealsTab';
import { CommsTab } from './components/CommsTab';
import { ReportsTab } from './components/ReportsTab';
import { SettingsTab } from './components/SettingsTab';
import { HelpSupportTab } from './components/HelpSupportTab';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Guard the Service Instantiation in UseRef to assure HMR stability - Point 3 Fixes
  const stateServiceRef = useRef<StateService | null>(null);
  if (!stateServiceRef.current) {
    stateServiceRef.current = StateService.getInstance();
  }
  const state = stateServiceRef.current;

  // Track daycare settings name for header synchronization
  const [daycareName, setDaycareName] = useState<string>(state.settings.name);

  // Success Notification state after automatic billing generation
  const [notification, setNotification] = useState<{
    show: boolean;
    child: Child;
    invoice: Invoice;
  } | null>(null);

  // Attach global Alt + Key hotkeys for quick module switches - Point 7 requirement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9) {
          const tabIds = ['dashboard', 'register', 'billing', 'attendance', 'meals', 'communication', 'reports', 'help', 'settings'];
          const target = tabIds[num - 1];
          if (target) {
            setActiveTab(target);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChildEnrollmentSuccess = (child: Child, invoice: Invoice) => {
    setNotification({ show: true, child, invoice });
    setActiveTab('billing'); // Automatically route to billings (Point 6 success criteria)
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'register', label: 'Registration (Core)', icon: Baby },
    { id: 'billing', label: 'Billing & Invoices', icon: CreditCard },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'meals', label: 'Meal Scheduling', icon: Utensils },
    { id: 'communication', label: 'Comms (Notifications)', icon: MessageSquare },
    { id: 'reports', label: 'POPIA Reports', icon: FileText },
    { id: 'settings', label: 'Institution Settings', icon: Settings },
    { id: 'help', label: 'Help & FAQs', icon: HelpCircle },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans select-none antialiased">
      {/* Sidebar - Hidden on print queries through index.css rule */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 no-print">
        <div className="p-6">
          <h1 className="text-lg font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="text-emerald-500 shrink-0" size={20} /> 
            SA Daycare Suite
          </h1>
          <p className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">POPIA Act Comply (V4.0)</p>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setNotification(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  activeTab === item.id 
                    ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={15} />
                  {item.label}
                </span>
                <span className="text-[10px] opacity-30 font-mono hidden md:inline">Alt+{index + 1}</span>
              </button>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800 text-xxs text-slate-500 font-mono">
          <div>Client: SA Daycare Ltd</div>
          <div className="mt-1">Locale: Pretoria (ZAR)</div>
        </div>
      </aside>

      {/* Main Container Viewport */}
      <main className="flex-1 overflow-auto bg-slate-50 relative flex flex-col">
        {/* Navigation Top Header - Hidden in Print */}
        <header className="bg-white border-b border-slate-200 px-8 py-4.5 flex items-center justify-between sticky top-0 z-10 shrink-0 no-print">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-800 capitalize tracking-tight">
              {navItems.find(i => i.id === activeTab)?.label || 'System Admin'}
            </h2>
            <p className="text-xxs text-slate-400 font-medium">Institution: {daycareName}</p>
          </div>
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => window.print()}
              className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg p-2 transition-all"
              title="Print Current Sheet View"
            >
              <Printer size={16} />
            </button>
            <div className="text-xs font-bold text-slate-500 font-mono bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200 select-none">
              ZAR Rands Engine
            </div>
          </div>
        </header>

        {/* Dynamic Pages Area */}
        <div className="p-8 max-w-5xl w-full mx-auto flex-1 pb-16">
          {/* Sibling creation success notify widget */}
          {activeTab === 'billing' && notification?.show && (
            <div className="bg-emerald-50 border border-emerald-250 text-emerald-900 p-5 rounded-xl text-xs flex gap-3.5 items-start mb-6">
              <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={20} />
              <div className="flex-1 space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">Valid Tax Invoice Generated: {notification.invoice.id}</h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Enrolment for child **{notification.child.firstName} {notification.child.lastName}** is successfully cataloged. Tax invoice created with sibling thresholds automatically audited.
                </p>
                <div className="flex gap-2 pt-1 font-bold">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase font-mono tracking-wider text-[10px]">
                    Invoice Status: {notification.invoice.status}
                  </span>
                  <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono text-[10px]">
                    Total: ZAR {(notification.invoice.total / 100).toFixed(2)}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && <DashboardTab stateService={state} />}
          
          {activeTab === 'register' && (
            <RegisterTab 
              stateService={state} 
              onChildRegistered={handleChildEnrollmentSuccess} 
            />
          )}
          
          {activeTab === 'billing' && <BillingTab stateService={state} />}
          
          {activeTab === 'attendance' && <AttendanceTab stateService={state} />}
          
          {activeTab === 'meals' && <MealsTab stateService={state} />}
          
          {activeTab === 'communication' && <CommsTab stateService={state} />}
          
          {activeTab === 'reports' && <ReportsTab stateService={state} />}
          
          {activeTab === 'settings' && (
            <SettingsTab 
              stateService={state} 
              onSettingsUpdated={(settings) => setDaycareName(settings.name)} 
            />
          )}
          
          {activeTab === 'help' && <HelpSupportTab />}
        </div>
      </main>
    </div>
  );
}
