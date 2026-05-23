import React, { useMemo } from 'react';
import { StateService } from '../lib/services/StateService';
import { formatZAR } from '../lib/utils';
import { Users, Baby, CreditCard, Clock, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DashboardTabProps {
  stateService: StateService;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ stateService }) => {
  const stats = useMemo(() => {
    const childrenCount = stateService.children.length;
    const staffCount = stateService.staff.length;
    
    // Total invoiced and paid (stored in cents, divide correctly in display)
    let totalInvoiced = 0;
    let totalPaid = 0;
    stateService.invoices.forEach(inv => {
      if (inv.status !== 'Voided') {
        totalInvoiced += inv.total;
        if (inv.status === 'Paid') {
          totalPaid += inv.total;
        }
      }
    });

    // Attendance Rate (for the month)
    const totalPossibleRecords = stateService.children.length * 5; // Simulating 5 days of school
    const presentRecords = stateService.attendance.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const attendancePercentage = totalPossibleRecords > 0 
      ? Math.round((presentRecords / Math.max(stateService.attendance.length, 1)) * 100) 
      : 0;

    // Group Distributions
    const groupCounts: Record<string, number> = {
      'Infant': 0,
      'Toddler': 0,
      'Pre-School': 0,
      'Grade R': 0
    };
    stateService.children.forEach(c => {
      if (groupCounts[c.groupId] !== undefined) {
        groupCounts[c.groupId]++;
      }
    });

    // Low Attendance alerts (< 80% check)
    // We calculate per child attendance
    const childAttendance = stateService.children.map(child => {
      const records = stateService.attendance.filter(r => r.childId === child.id);
      const totalDays = records.length;
      const presentDays = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
      const pct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100; // default 100 if no record
      return {
        id: child.id,
        name: `${child.firstName} ${child.lastName}`,
        groupId: child.groupId,
        percentage: pct,
        recordsCount: totalDays
      };
    });

    const lowAttendanceList = childAttendance.filter(c => c.percentage < 80 && c.recordsCount > 0);

    return {
      childrenCount,
      staffCount,
      totalInvoiced,
      totalPaid,
      totalOutstanding: totalInvoiced - totalPaid,
      attendancePercentage,
      groupCounts,
      lowAttendanceList,
      recentLogs: stateService.auditLogs.slice(0, 5)
    };
  }, [stateService.children, stateService.staff, stateService.invoices, stateService.attendance, stateService.auditLogs]);

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Baby size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Enrolled Children</p>
            <h4 className="text-2xl font-bold font-mono mt-0.5">{stats.childrenCount}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Staff</p>
            <h4 className="text-2xl font-bold font-mono mt-0.5">{stats.staffCount}</h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Paid (ZAR)</p>
            <h4 className="text-2xl font-bold font-mono text-emerald-600 mt-0.5">
              {formatZAR(stats.totalPaid)}
            </h4>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 font-sans">Outstanding Balance</p>
            <h4 className="text-2xl font-bold font-mono text-amber-600 mt-0.5">
              {formatZAR(stats.totalOutstanding)}
            </h4>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner for Low Attendance */}
      {stats.lowAttendanceList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Low Attendance Warning (&lt; 80%)</h4>
            <p className="text-xs text-amber-700 mt-1">
              The following children have missed more than 20% of required days this month. Immediate parent contact recommended under institutional safety protocols:
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {stats.lowAttendanceList.map(item => (
                <span key={item.id} className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-xs px-2.5 py-1 rounded-md border border-amber-200 font-mono">
                  {item.name} ({item.percentage}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Children Group Distribution Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Enrollment Distribution by Group</h3>
          <div className="h-64 flex flex-col justify-between">
            {Object.entries(stats.groupCounts).map(([group, val]) => {
              const count = val as number;
              const maxVal = Math.max(...(Object.values(stats.groupCounts) as number[]), 1);
              const percentage = (count / maxVal) * 100;
              return (
                <div key={group} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-700">{group}</span>
                    <span className="font-mono text-slate-400 font-semibold">{count} Children</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="text-xxs text-slate-400 border-t border-slate-100 pt-3 text-right">
              Groups are auto-assigned based on birth dates according to SA Early Care benchmarks.
            </div>
          </div>
        </div>

        {/* POPIA Guard Panel / Quick Metrics */}
        <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <span className="inline-flex items-center gap-1 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xxs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider mb-4">
              <ShieldCheck size={12} /> Compliance Guaranteed
            </span>
            <h3 className="text-lg font-bold mb-2">POPIA Privacy Safeguard</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We enforce full obfuscation of South African National ID sequences to prevent unauthorized profiling under Act No. 4 of 2013 (Section 18 principles).
            </p>
            <div className="mt-5 space-y-3.5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <span className="text-xs text-slate-400">Standard Pattern</span>
                <span className="text-xs font-mono text-emerald-400">***-***-XXXX-X</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                <span className="text-xs text-slate-450">Consent Protocol</span>
                <span className="text-xs text-emerald-400 font-semibold">Active (Double confirmation)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-450">Retention Limit</span>
                <span className="text-xs text-emerald-400 font-semibold">{stateService.settings.dataRetentionYears} Years</span>
              </div>
            </div>
          </div>
          <div className="text-xxs text-slate-500 uppercase font-mono mt-4 pt-3 border-t border-slate-800">
            Registered VAT No. {stateService.settings.vatNumber}
          </div>
        </div>
      </div>

      {/* Staff Actions Audit Log Feed */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Activity size={16} className="text-slate-400" /> Recent Institutional Activity Trail
        </h3>
        {stats.recentLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No action logs captured yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.recentLogs.map(log => (
              <div key={log.id} className="py-3.5 flex justify-between items-start text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono text-[10px] border border-slate-200">
                      {log.entityType}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{log.notes}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-slate-700">{log.actor}</p>
                  <p className="text-slate-400 font-mono text-[10px] mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
