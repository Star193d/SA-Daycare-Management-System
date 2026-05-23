import React, { useState, useMemo } from 'react';
import { StateService } from '../lib/services/StateService';
import { maskSAId, formatSADate } from '../lib/utils';
import { ShieldCheck, Download, CheckCircle, AlertOctagon, HelpCircle, FileText } from 'lucide-react';

interface ReportsTabProps {
  stateService: StateService;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ stateService }) => {
  const [selectedCategory, setSelectedCategory] = useState<'roster' | 'checklist'>('roster');

  // Hardcoded identical copy of /popia_compliance_checklist.json for bulletproof browser rendering
  const [checklist, setChecklist] = useState([
    { id: 1, checkpoint: "Accountability of Daycare Principal", status: "compliant", remediation: "Daycare head formally designated as the statutory Information Officer.", effort: "None" },
    { id: 2, checkpoint: "Designation of Deputy Information Officer", status: "compliant", remediation: "Admin Lead appointed and registered with the SA Information Regulator.", effort: "None" },
    { id: 3, checkpoint: "Double POPIA Consent Gate on dispatching", status: "compliant", remediation: "Interactive confirmation flow added before WhatsApp or Email document transmission.", effort: "None" },
    { id: 4, checkpoint: "Obfuscation of Children SA National ID Numbers", status: "compliant", remediation: "System masks SA IDs with format ***-***-XXXX-X on all render, PDF, print and export boundaries.", effort: "None" },
    { id: 5, checkpoint: "Obfuscation of Parent National Identifiers", status: "compliant", remediation: "maskSAId system masks parent national ID sequences across all invoices and rosters.", effort: "None" },
    { id: 6, checkpoint: "Luhn algorithm client-side checksum validation", status: "compliant", remediation: "Enforced to prevent invalid registrations of bogus files in the system.", effort: "None" },
    { id: 7, checkpoint: "Limitation of Medical Data collection to allergies", status: "compliant", remediation: "Only collect required dietary allergen and emergency medical notes.", effort: "None" },
    { id: 8, checkpoint: "Enforcement of 5-Year Data retention limits", status: "compliant", remediation: "DaycareSettings configures POPIA Section 14 statutory retention parameters (default 5 years).", effort: "None" },
    { id: 9, checkpoint: "Written Employee POPIA Training manuals", status: "non-compliant", remediation: "Draft staff manual detailing data sharing protocols on child allergy labels.", effort: "Low (2 days)" },
    { id: 10, checkpoint: "Secure Physical Storage of historic paper logs", status: "non-compliant", remediation: "Deploy fireproof cabinets for legacy paper sign-in roster sheets.", officeRef: "Principal Room", effort: "Medium (1 week)" },
    { id: 11, checkpoint: "Statutory Incident Response Playbook", status: "non-compliant", remediation: "Formal incident disclosure plan to notify Information Regulator within 72 hours of breaches.", effort: "Medium (3 days)" },
    { id: 12, checkpoint: "Parent Consent Opt-In records", status: "compliant", remediation: "Signed parent physical consent forms are kept linked with digital profiles.", effort: "None" },
    { id: 13, checkpoint: "Data Portability protocol", status: "compliant", remediation: "Added easy Excel/CSV export options for Parent request scenarios.", effort: "None" },
    { id: 14, checkpoint: "Physical premises lock gates & security", status: "non-compliant", remediation: "Review boundary locks where physical documents and class folders are held.", effort: "Medium (1 week)" },
    { id: 15, checkpoint: "Institutional Banking Details scrubbing", status: "compliant", remediation: "Bank account numbers only displayed on invoices and never output to console logs.", effort: "None" },
    { id: 16, checkpoint: "Security audit logs representing staff activity", status: "compliant", remediation: "Added central logAction ledger tracking all deletions, entries, and edits.", effort: "None" },
    { id: 17, checkpoint: "Secure Local Storage boundaries", status: "compliant", remediation: "Browser storage scoped entirely within the sandboxed and origin-isolated frame.", effort: "None" },
    { id: 18, checkpoint: "Cross Border data transfers protocol", status: "not-applicable", remediation: "No data is transmitted outside Republic of South Africa geographic borders.", effort: "None" },
    { id: 19, checkpoint: "Statutory Information Officer Registration", status: "non-compliant", remediation: "Upload official Registration Form to the Information Regulator portal.", effort: "Low (1 day)" },
    { id: 20, checkpoint: "POPIA Privacy Notice displayed to parents", status: "compliant", remediation: "Enforced via institutional settings notice panel visible on first use.", effort: "None" }
  ]);

  // Handle toggle checklist status
  const handleToggleChecklist = (id: number) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'compliant' ? 'non-compliant' : (item.status === 'non-compliant' ? 'not-applicable' : 'compliant');
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const dashboardCount = useMemo(() => {
    const parentCount = stateService.parents.length;
    const childrenCount = stateService.children.length;
    
    const compliantCount = checklist.filter(c => c.status === 'compliant').length;
    const score = Math.round((compliantCount / 20) * 100);

    return {
      parentCount,
      childrenCount,
      compliantCount,
      score
    };
  }, [stateService.parents, stateService.children, checklist]);

  // Exports roster list with absolute ID mask safety
  const handleExportRosterCSV = () => {
    const headers = ['Record ID', 'Child First Name', 'Child Last Name', 'Child Masked ID', 'Child DOB', 'Parent Name', 'Parent Masked ID', 'Parent Email', 'Enrollment Date'];
    const rows = stateService.children.map(child => {
      const parent = stateService.parents.find(p => p.id === child.parentId);
      return [
        child.id,
        child.firstName,
        child.lastName,
        maskSAId(child.saIdNumber), // STRICT OBFUSCATION APPLIED (Point 8 rule)
        formatSADate(child.dateOfBirth),
        parent ? `${parent.firstName} ${parent.lastName}` : 'N/A',
        parent ? maskSAId(parent.saIdNumber) : 'N/A', // STRICT OBFUSCATION APPLIED (Point 8 rule)
        parent ? parent.email : 'N/A',
        formatSADate(child.enrollmentDate)
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SADaycare_POPIA_PII_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Category selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSelectedCategory('roster')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            selectedCategory === 'roster'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={16} /> Statutory Subject Roster
        </button>
        <button
          onClick={() => setSelectedCategory('checklist')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            selectedCategory === 'checklist'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={16} /> 20-Point POPIA Audit Checklist
        </button>
      </div>

      {selectedCategory === 'roster' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
            <div className="text-xs text-slate-500 leading-relaxed max-w-xl">
              <span className="font-bold text-slate-705 text-slate-800 block mb-1">Protection Profile Mode Enabled (Active Protection)</span>
              Under Act No. 4 of 2013, National ID configurations must be fully masked on displays to suppress unauthorized profile indexing of minors. Exporting processes conform strictly to Section 18 directives.
            </div>
            <button
              onClick={handleExportRosterCSV}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg px-4.5 py-2.5 shadow-sm transition-all shrink-0"
            >
              <Download size={14} /> Export Protected CSV
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3.5">Child Beneficiary Name</th>
                  <th className="px-6 py-3.5">Protected Child ID</th>
                  <th className="px-6 py-3.5">Parent Account info</th>
                  <th className="px-6 py-3.5">Protected Parent ID</th>
                  <th className="px-6 py-3.5">Enrolled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {stateService.children.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-xs">
                      No records presently stored in system databases.
                    </td>
                  </tr>
                ) : (
                  stateService.children.map(child => {
                    const parent = stateService.parents.find(p => p.id === child.parentId);
                    return (
                      <tr key={child.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {child.firstName} {child.lastName}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600 text-xs">
                          {maskSAId(child.saIdNumber)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-700">{parent ? `${parent.firstName} ${parent.lastName}` : 'N/A'}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{parent ? parent.email : ''}</p>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600 text-xs">
                          {parent ? maskSAId(parent.saIdNumber) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {formatSADate(child.enrollmentDate)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCategory === 'checklist' && (
        <div className="space-y-6">
          {/* Quick audit scores card */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Institutional Compliance Evaluation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluating internal daycare digital parameters compared against South African POPIA regulations. Checkboxes are togglable.
              </p>
            </div>
            <div className="flex gap-6 shrink-0">
              <div className="text-center">
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Score Out of 20</p>
                <p className="text-3xl font-mono text-emerald-400 font-extrabold mt-0.5">{dashboardCount.compliantCount}/20</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Total Completion</p>
                <p className="text-3xl font-mono text-emerald-400 font-extrabold mt-0.5">{dashboardCount.score}%</p>
              </div>
            </div>
          </div>

          {/* Checklist items registry table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">POPIA Act Compliance Index Ledger</h3>
              <span className="text-[10px] text-slate-400 font-mono font-semibold">Togglable statuses</span>
            </div>

            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-450">
                  <th className="px-6 py-3.5">Regulation Checkpoint</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Remediation Path</th>
                  <th className="px-6 py-3.5 text-right">Audit Effort</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] leading-relaxed">
                {checklist.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4.5 font-bold text-slate-800 w-1/4">
                      {item.id}. {item.checkpoint}
                    </td>
                    <td className="px-6 py-4.5">
                      <button
                        onClick={() => handleToggleChecklist(item.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold uppercase tracking-wider text-[9px] border transition-all ${
                          item.status === 'compliant'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : item.status === 'non-compliant'
                            ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 animate-pulse'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item.status === 'compliant' && <CheckCircle size={11} />}
                        {item.status === 'non-compliant' && <AlertOctagon size={11} />}
                        {item.status === 'not-applicable' && <HelpCircle size={11} />}
                        {item.status}
                      </button>
                    </td>
                    <td className="px-6 py-4.5 text-slate-600 leading-snug w-2/5 font-medium">
                      {item.remediation}
                    </td>
                    <td className="px-6 py-4.5 text-right font-semibold text-slate-500 font-mono">
                      {item.effort}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
