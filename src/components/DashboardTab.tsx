import React, { useMemo } from 'react';
import { StateService } from '../lib/services/StateService';
import { formatZAR } from '../lib/utils';
import { Users, Baby, CreditCard, Clock, Activity, AlertTriangle, ShieldCheck, ChefHat, Calendar, Award } from 'lucide-react';

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

  const huddleData = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // 1. Child Absences
    let activeAbsences = stateService.attendance.filter(r => r.date === todayStr && (r.status === 'Absent' || r.status === 'Sick'));
    let isFallbackAbsence = false;
    
    if (activeAbsences.length === 0) {
      const allAbsencesAndSicks = stateService.attendance.filter(r => r.status === 'Absent' || r.status === 'Sick');
      if (allAbsencesAndSicks.length > 0) {
        const sortedDates = [...new Set(allAbsencesAndSicks.map(r => r.date))].sort().reverse();
        const mostRecentAbsenceDate = sortedDates[0];
        activeAbsences = stateService.attendance.filter(r => r.date === mostRecentAbsenceDate && (r.status === 'Absent' || r.status === 'Sick'));
        isFallbackAbsence = true;
      }
    }

    const absencesList = activeAbsences.map(rec => {
      const child = stateService.children.find(c => c.id === rec.childId);
      return {
        childName: child ? `${child.firstName} ${child.lastName}` : 'Unknown Child',
        groupId: child?.groupId || 'N/A',
        status: rec.status,
        date: rec.date
      };
    });

    // 2. Meal Allergens
    let todayMeals = stateService.meals.filter(m => m.date === todayStr);
    let isFallbackMeal = false;
    if (todayMeals.length === 0) {
      if (stateService.meals.length > 0) {
        const sortedMealDates = [...new Set(stateService.meals.map(m => m.date))].sort().reverse();
        const mostRecentMealDate = sortedMealDates[0];
        todayMeals = stateService.meals.filter(m => m.date === mostRecentMealDate);
        isFallbackMeal = true;
      }
    }

    const allergenAlerts: { mealType: string; description: string; allergen: string; affectedChildren: string[] }[] = [];
    todayMeals.forEach(meal => {
      meal.allergens.forEach(allergen => {
        const affected = stateService.children
          .filter(c => c.allergies && c.allergies.some(alg => alg.toLowerCase() === allergen.toLowerCase()))
          .map(c => `${c.firstName} ${c.lastName}`);
        
        if (affected.length > 0) {
          allergenAlerts.push({
            mealType: meal.mealType,
            description: meal.description,
            allergen,
            affectedChildren: affected
          });
        }
      });
    });

    const mealSummaryText = todayMeals.length > 0 
      ? todayMeals.map(m => `${m.mealType}: ${m.description}`).join(' | ')
      : 'No meal plans logged.';

    const mealDateToShow = todayMeals.length > 0 ? todayMeals[0].date : todayStr;

    // 3. Expiring Staff Certificates
    const expiringCerts: { staffName: string; certName: string; expiryDate: string; daysLeft: number; status: 'critical' | 'warning' | 'fine' }[] = [];
    const todayVal = new Date(todayStr).getTime();

    stateService.staff.forEach(s => {
      if (s.certificationsExpiry) {
        Object.entries(s.certificationsExpiry).forEach(([cert, rawVal]) => {
          const dateStr = rawVal as string;
          const expiryTime = new Date(dateStr).getTime();
          const diffMs = expiryTime - todayVal;
          const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          
          if (daysLeft <= 365) { // Track everything expiring in less than a year
            let status: 'critical' | 'warning' | 'fine' = 'fine';
            if (daysLeft <= 0) {
              status = 'critical';
            } else if (daysLeft <= 90) {
              status = 'warning';
            }
            expiringCerts.push({
              staffName: `${s.firstName} ${s.lastName}`,
              certName: cert,
              expiryDate: dateStr,
              daysLeft,
              status
            });
          }
        });
      }
    });

    expiringCerts.sort((a, b) => a.daysLeft - b.daysLeft);

    return {
      absencesList,
      isFallbackAbsence,
      absenceDate: absencesList.length > 0 ? absencesList[0].date : todayStr,
      allergenAlerts,
      isFallbackMeal,
      mealDate: mealDateToShow,
      mealSummaryText,
      expiringCerts,
      todayStr
    };
  }, [stateService.attendance, stateService.meals, stateService.children, stateService.staff]);

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

        {/* Outstanding Balance card - styles adjusted dynamically based on money amount */}
        <div 
          style={{ lineHeight: '25px', width: '248.667px' }}
          className={`p-5 rounded-xl border flex items-center gap-4 shadow-xs transition-all duration-300 ${
            stats.totalOutstanding <= 0 
              ? 'bg-emerald-50 border-emerald-200 text-slate-900' 
              : stats.totalOutstanding > 300000 
                ? 'bg-rose-50 border-rose-200 text-rose-950' 
                : 'bg-amber-50/50 border-amber-205 text-amber-950'
          }`}
        >
          <div className={`p-3 rounded-lg ${
            stats.totalOutstanding <= 0 
              ? 'bg-emerald-100 text-emerald-600' 
              : stats.totalOutstanding > 300000 
                ? 'bg-rose-100 text-rose-600' 
                : 'bg-amber-100 text-amber-600'
          }`}>
            <Clock size={24} />
          </div>
          <div>
            <p className={`text-sm font-medium font-sans ${
              stats.totalOutstanding <= 0 
                ? 'text-emerald-800' 
                : stats.totalOutstanding > 300000 
                  ? 'text-rose-850' 
                  : 'text-slate-500'
            }`}>
              Outstanding Balance
            </p>
            <h4 className={`text-2xl font-bold font-mono mt-0.5 ${
              stats.totalOutstanding <= 0 
                ? 'text-emerald-600' 
                : stats.totalOutstanding > 300000 
                  ? 'text-rose-600 font-extrabold' 
                  : 'text-amber-600'
            }`}>
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

      {/* Today's Staff Huddle Bulletin (Absences, Allergies & Staff Expirations) */}
      <div id="staff-huddle-bulletin" className="bg-gradient-to-br from-indigo-50/70 to-white p-5 rounded-2xl border border-indigo-150/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg animate-pulse">
              <Activity size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Today's Staff Huddle Bulletin</h3>
              <p className="text-[10px] text-slate-400">Essential operations check-list for care educators</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xxs bg-indigo-50 border border-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-mono">
            <Calendar size={12} className="text-indigo-500" />
            <span>Huddle Date: {new Date(huddleData.todayStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Absences Panel */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Baby size={14} className="text-amber-500" /> Attendance Drops
                </h4>
                {huddleData.isFallbackAbsence && (
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                    Latest ({huddleData.absenceDate})
                  </span>
                )}
              </div>
              
              <div className="mt-2.5 space-y-2">
                {huddleData.absencesList.length === 0 ? (
                  <p className="text-xxs text-slate-400 py-2">All child beneficiaries registered as active present or late for this session.</p>
                ) : (
                  huddleData.absencesList.map((abs, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xxs p-1.5 bg-rose-50/35 border border-rose-100/35 rounded">
                      <div>
                        <span className="font-semibold text-slate-800">{abs.childName}</span>
                        <span className="text-slate-400 block text-[9px]">{abs.groupId}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                        abs.status === 'Sick' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {abs.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="text-[10px] text-slate-450 pt-1.5 border-t border-slate-100 leading-normal">
              Absence and sick statuses affect daily nutrition preparation requirements.
            </div>
          </div>

          {/* Allergy Panel */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-750 uppercase tracking-wide flex items-center gap-1.5">
                  <ChefHat size={14} className="text-rose-500" /> Kitchen Allergy Alerts
                </h4>
                {huddleData.isFallbackMeal && (
                  <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                    Active Menu ({huddleData.mealDate})
                  </span>
                )}
              </div>

              <p className="text-[10px] text-slate-500 mt-1 truncate border-b border-dashed border-slate-100 pb-1.5" title={huddleData.mealSummaryText}>
                Menu: <span className="font-medium text-slate-700">{huddleData.mealSummaryText}</span>
              </p>
              
              <div className="mt-2 space-y-2 max-h-36 overflow-y-auto w-full">
                {huddleData.allergenAlerts.length === 0 ? (
                  <p className="text-xxs text-emerald-600 font-medium py-2">✓ No cross-allergen threats detected for today's menu.</p>
                ) : (
                  huddleData.allergenAlerts.map((alert, idx) => (
                    <div key={idx} className="p-2 bg-amber-50/70 border border-amber-100 rounded text-xxs space-y-1">
                      <div className="flex justify-between font-bold text-amber-900">
                        <span>{alert.mealType} ({alert.allergen})</span>
                      </div>
                      <p className="text-[10px] text-amber-805 leading-normal italic text-slate-600">
                        {alert.description}
                      </p>
                      <div className="pt-1 text-[9px] text-slate-500">
                        Affected: <span className="font-semibold text-rose-600 font-mono">{alert.affectedChildren.join(', ')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="text-[10px] text-slate-450 pt-1.5 border-t border-slate-100 leading-normal">
              Confirm substitution portions with Lead Chef for listed children.
            </div>
          </div>

          {/* Compliance Panel */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
            <div>
              <h4 className="text-xs font-bold text-slate-750 uppercase tracking-wide flex items-center gap-1.5">
                <Award size={14} className="text-indigo-500" /> Staff Certificates
              </h4>
              
              <div className="mt-2.5 space-y-2">
                {huddleData.expiringCerts.length === 0 ? (
                  <p className="text-xxs text-slate-400 py-2">All educator certificates are fully up-to-date.</p>
                ) : (
                  huddleData.expiringCerts.map((cert, idx) => {
                    const isOverdue = cert.daysLeft <= 0;
                    return (
                      <div key={idx} className={`p-2 rounded text-xxs flex justify-between items-start gap-1.5 ${
                        cert.status === 'critical' ? 'bg-rose-50 border border-rose-200 text-rose-900' :
                        cert.status === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-900' :
                        'bg-slate-50 border border-slate-100 text-slate-800'
                      }`}>
                        <div className="space-y-0.5">
                          <span className="font-bold block leading-tight">{cert.staffName}</span>
                          <span className="text-[10px] text-slate-500 block">{cert.certName}</span>
                          <span className="text-[9px] text-slate-400 block font-mono">Expires: {cert.expiryDate}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                          isOverdue ? 'bg-rose-600 text-white' :
                          cert.status === 'warning' ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-750'
                        }`}>
                          {isOverdue ? 'EXPIRED' : `${cert.daysLeft}d left`}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="text-[10px] text-slate-450 pt-1.5 border-t border-slate-100 leading-normal">
              SACE registrations & first aid must be renewed under DSD requirements.
            </div>
          </div>
        </div>
      </div>

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
