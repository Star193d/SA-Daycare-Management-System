import React, { useState, useMemo } from 'react';
import { StateService } from '../lib/services/StateService';
import { Child, AttendanceRecord } from '../lib/types';
import { maskSAId } from '../lib/utils';
import { CalendarCheck, Upload, Download, Check, AlertTriangle, Users, FileSpreadsheet } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface AttendanceTabProps {
  stateService: StateService;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ stateService }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [children, setChildren] = useState<Child[]>(stateService.children);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(stateService.attendance);

  // CSV Import State
  const [importLog, setImportLog] = useState<{ success: number; skipped: number; errors: string[] } | null>(null);

  // Status map of today's attendance
  const dailyAttendanceMap = useMemo(() => {
    const map: Record<string, AttendanceRecord> = {};
    attendance.forEach(rec => {
      if (rec.date === selectedDate) {
        map[rec.childId] = rec;
      }
    });
    return map;
  }, [attendance, selectedDate]);

  // Aggregate attendance rates to show low attendance alerts per child
  const childRatesMap = useMemo(() => {
    const map: Record<string, { present: number; total: number; percentage: number }> = {};
    
    // Check all recorded days for each child
    children.forEach(child => {
      const records = attendance.filter(r => r.childId === child.id);
      const total = records.length;
      const present = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 100;
      map[child.id] = { present, total, percentage };
    });
    return map;
  }, [children, attendance]);

  // Weekly group calculations for the selected month to feed Recharts
  const weeklyChartData = useMemo(() => {
    const yearMonth = selectedDate.substring(0, 7); // e.g., "2026-05"
    const monthRecords = attendance.filter(rec => rec.date.startsWith(yearMonth));
    
    // Create 5 weeks placeholder
    const weeks = Array.from({ length: 5 }, (_, idx) => ({
      name: `Week ${idx + 1}`,
      Present: 0,
      AbsentSick: 0
    }));

    monthRecords.forEach(rec => {
      const dateParts = rec.date.split('-');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[2], 10);
        if (!isNaN(day)) {
          const weekIdx = Math.min(Math.floor((day - 1) / 7), 4); // Max index 4 (Week 5)
          if (rec.status === 'Present' || rec.status === 'Late') {
            weeks[weekIdx].Present += 1;
          } else if (rec.status === 'Absent' || rec.status === 'Sick') {
            weeks[weekIdx].AbsentSick += 1;
          }
        }
      }
    });

    return weeks;
  }, [attendance, selectedDate]);

  const monthStats = useMemo(() => {
    let present = 0;
    let absentSick = 0;
    weeklyChartData.forEach(w => {
      present += w.Present;
      absentSick += w.AbsentSick;
    });
    const total = present + absentSick;
    const avgRate = total > 0 ? Math.round((present / total) * 100) : 100;
    return {
      totalPresent: present,
      totalAbsentSick: absentSick,
      avgRate
    };
  }, [weeklyChartData]);

  const handleMarkStatus = (childId: string, status: 'Present' | 'Absent' | 'Sick' | 'Late', checkIn?: string, checkOut?: string) => {
    const updated = stateService.addAttendance({
      childId,
      date: selectedDate,
      status,
      checkInTime: checkIn || (status === 'Present' || status === 'Late' ? '08:00' : ''),
      checkOutTime: checkOut || (status === 'Present' || status === 'Late' ? '13:00' : '')
    });
    
    setAttendance([...stateService.attendance]);
    stateService.logAction("Admin", "Mark Attendance", `Marked child ${childId} as ${status} on ${selectedDate}`, childId, "Attendance");
  };

  // CSV Bulk Attendance Import Engine (Point 7)
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      if (!csvData) return;

      const lines = csvData.split('\n');
      let successCount = 0;
      let skippedCount = 0;
      const errorsList: string[] = [];

      // Expected columns: [childId, date, status, checkInTime, checkOutTime]
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 3) {
          skippedCount++;
          errorsList.push(`Line ${i + 1}: Insufficient column fields.`);
          continue;
        }

        const [childId, dateStr, statusStr, checkIn, checkOut] = cols;

        // Validation checks
        const childExists = stateService.children.find(c => c.id === childId);
        if (!childExists) {
          skippedCount++;
          errorsList.push(`Line ${i + 1}: Child ID ${childId} does not match any registered database record.`);
          continue;
        }

        const validStatuses = ['Present', 'Absent', 'Late', 'Sick'];
        if (!validStatuses.includes(statusStr)) {
          skippedCount++;
          errorsList.push(`Line ${i + 1}: Invalid attendance status "${statusStr}". Allowed: Present, Absent, Sick, Late.`);
          continue;
        }

        // Apply
        stateService.addAttendance({
          childId,
          date: dateStr,
          status: statusStr as any,
          checkInTime: checkIn || '',
          checkOutTime: checkOut || ''
        });
        successCount++;
      }

      setAttendance([...stateService.attendance]);
      stateService.logAction("Admin", "Bulk CSV Import", `Imported ${successCount} attendance records via CSV file.`, "Attendance", "Attendance");
      setImportLog({ success: successCount, skipped: skippedCount, errors: errorsList });
    };
    reader.readAsText(file);
  };

  // CSV Attendance Exporter Engine (Point 7)
  const handleCSVExport = () => {
    const headers = ['Child ID', 'First Name', 'Last Name', 'Date', 'Status', 'Check In', 'Check Out'];
    const rows = attendance.map(rec => {
      const child = stateService.children.find(c => c.id === rec.childId);
      return [
        rec.childId,
        child?.firstName || 'N/A',
        child?.lastName || 'N/A',
        rec.date,
        rec.status,
        rec.checkInTime || '',
        rec.checkOutTime || ''
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SADaycare_Attendance_Export_${selectedDate.substring(0, 7)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Filters and Utility Buttons */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tariffs Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {/* CSV Import */}
          <label className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-semibold text-xs rounded-lg px-4 py-2.5 cursor-pointer transition-all">
            <Upload size={14} /> Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
          </label>

          {/* Export database CSV */}
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg px-4 py-2.5 shadow-xs transition-all"
          >
            <Download size={14} /> Export CSV Month
          </button>
        </div>
      </div>

      {/* CSV Import Results Feed */}
      {importLog && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
          <h4 className="font-bold text-sm flex items-center gap-1.5 text-slate-800">
            <FileSpreadsheet className="text-emerald-600 animate-bounce" size={18} /> Bulk CSV Import Analytics
          </h4>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono max-w-sm">
            <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded border border-emerald-100">Imports Executed: {importLog.success} rows</div>
            <div className="bg-rose-50 text-rose-800 p-2.5 rounded border border-rose-100">Skipped/Errors: {importLog.skipped} rows</div>
          </div>
          {importLog.errors.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto bg-white p-3 border border-slate-200 rounded-lg text-xxs font-mono text-rose-600">
              {importLog.errors.map((err, i) => <div key={i}>⚠️ {err}</div>)}
            </div>
          )}
          <button onClick={() => setImportLog(null)} className="text-xxs font-semibold text-slate-500 hover:text-slate-800 underline">Close Log Summary</button>
        </div>
      )}

      {/* Attendance Analytics Bar Chart */}
      <div id="attendance-trends-chart" className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-450 mb-3">Weekly Attendance Rate trends</h3>
          <p className="text-xs text-slate-400 mb-4">Comparing active attendance with absence/sick logs per calendar week</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'sans-serif', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} name="Present / Late" />
                <Bar dataKey="AbsentSick" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Absent / Sick" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-1">
              {new Date(selectedDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h4>
            <p className="text-xxs text-slate-450 mb-4">Static calculation based on registered month entries</p>

            <div className="space-y-3.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Avg. Monthly Presence:</span>
                <span className="font-bold font-mono text-emerald-600 text-sm">{monthStats.avgRate}%</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-3">
                <span className="text-slate-500">Total Present Days:</span>
                <span className="font-semibold font-mono text-slate-700">{monthStats.totalPresent}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Absent/Sick Records:</span>
                <span className="font-semibold font-mono text-slate-705">{monthStats.totalAbsentSick}</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-200 pt-3 mt-4">
            Notice: Average attendance target is 80%. Multi-week absence trends for targeted children trigger an automatic POPIA integrity warning flag on the roster below.
          </div>
        </div>
      </div>

      {/* Roster of Registered Kids and status grid selectors */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-800">Enrollment Class Roster - {selectedDate}</h3>
          <span className="text-xxs text-slate-400 font-mono">Total Roster: {stateService.children.length} Class Seats</span>
        </div>

        <table className="w-full text-left font-sans text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-450 font-bold uppercase text-[10px] tracking-wider leading-relaxed bg-slate-50/50">
              <th className="px-6 py-3">Child Name & Class</th>
              <th className="px-6 py-3">Monthly Integrity</th>
              <th className="px-6 py-3">Recorded Status</th>
              <th className="px-6 py-3">Timestamps (In - Out)</th>
              <th className="px-6 py-3 text-right">Rapid Selector Panel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {children.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-450 text-xs">
                  No child beneficiaries registered. Create a Child record to commence roster logs.
                </td>
              </tr>
            ) : (
              children.map(child => {
                const currentRecord = dailyAttendanceMap[child.id];
                const rate = childRatesMap[child.id] || { percentage: 100, total: 0 };
                const isUnderAttendanceThreshold = rate.percentage < 80 && rate.total > 0;

                return (
                  <tr key={child.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{child.firstName} {child.lastName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">ID: {maskSAId(child.saIdNumber)} | Group: {child.groupId}</p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-xs font-bold ${isUnderAttendanceThreshold ? 'text-rose-600' : 'text-slate-700'}`}>
                          {rate.percentage}%
                        </span>
                        {isUnderAttendanceThreshold && (
                          <span className="inline-flex items-center text-rose-500 animate-pulse" title="Critical attendance drop alarm (< 80% default)">
                            <AlertTriangle size={15} />
                          </span>
                        )}
                      </div>
                      <p className="text-xxs text-slate-400 mt-0.5">{rate.total} Logged periods</p>
                    </td>

                    <td className="px-6 py-4">
                      {currentRecord ? (
                        <span className={`inline-flex px-2 px-2.5 py-0.5 rounded-full text-xxs font-semibold uppercase tracking-wider ${
                          currentRecord.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                          currentRecord.status === 'Absent' ? 'bg-rose-100 text-rose-800' :
                          currentRecord.status === 'Sick' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {currentRecord.status}
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xxs font-semibold bg-slate-100 text-slate-400 select-none">
                          Unrecorded
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {currentRecord && currentRecord.checkInTime ? (
                        <span>{currentRecord.checkInTime} - {currentRecord.checkOutTime || 'Pending'}</span>
                      ) : (
                        <span className="text-slate-350">--:--</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                        {(['Present', 'Absent', 'Sick', 'Late'] as const).map(status => (
                          <button
                            key={status}
                            onClick={() => handleMarkStatus(child.id, status)}
                            className={`px-2 py-1 text-xxs font-bold rounded transition-colors ${
                              currentRecord?.status === status
                                ? (status === 'Present' ? 'bg-emerald-600 text-white' :
                                   status === 'Absent' ? 'bg-rose-600 text-white' :
                                   status === 'Sick' ? 'bg-amber-600 text-white' : 'bg-slate-600 text-white')
                                : 'hover:bg-slate-200 text-slate-650'
                            }`}
                          >
                            {status[0]}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
