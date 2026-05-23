import React, { useState } from 'react';
import { StateService } from '../lib/services/StateService';
import { validateLuhn, maskSAId } from '../lib/utils';
import { Parent, Child, Staff, Invoice } from '../lib/types';
import { ShieldCheck, UserPlus, Baby, Users, AlertTriangle, CheckCircle } from 'lucide-react';

interface RegisterTabProps {
  stateService: StateService;
  onChildRegistered: (child: Child, invoice: Invoice) => void;
}

export const RegisterTab: React.FC<RegisterTabProps> = ({ stateService, onChildRegistered }) => {
  const [activeSubTab, setActiveSubTab] = useState<'parent' | 'child' | 'staff'>('child');

  // Database listings from StateService
  const [parents, setParents] = useState<Parent[]>(stateService.parents);
  const [staffList, setStaffList] = useState<Staff[]>(stateService.staff);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(stateService.parents[0]?.id || null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(stateService.staff[0]?.id || null);

  // Parent form state
  const [parentForm, setParentForm] = useState({
    firstName: '',
    lastName: '',
    saIdNumber: '',
    email: '',
    phone: '',
    address: '',
    popiaSigned: false
  });

  // Child form state
  const [childForm, setChildForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    saIdNumber: '',
    parentId: stateService.parents[0]?.id || '',
    allergies: '',
    medicalNotes: ''
  });

  // Staff form state
  const [staffForm, setStaffForm] = useState({
    firstName: '',
    lastName: '',
    saIdNumber: '',
    role: 'Lead Educator',
    qualifications: '',
    firstAidExpiry: ''
  });

  const handleRegisterParent = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // ID Luhn Check
    if (!validateLuhn(parentForm.saIdNumber)) {
      setErrorMsg('Invalid Parent SA ID number. Please enter a valid 13-digit identification sequence.');
      return;
    }

    try {
      const parent = stateService.registerParent({
        firstName: parentForm.firstName.trim(),
        lastName: parentForm.lastName.trim(),
        saIdNumber: parentForm.saIdNumber.trim(),
        email: parentForm.email.trim(),
        phone: parentForm.phone.trim(),
        address: parentForm.address.trim(),
        popiaSigned: parentForm.popiaSigned
      });

      setParents([...stateService.parents]);
      setSelectedParentId(parent.id);
      setSuccessMsg(`Parent ${parent.firstName} ${parent.lastName} registered successfully under Account ID ${parent.id}.`);
      setChildForm(prev => ({ ...prev, parentId: parent.id })); // auto-select parent for child form
      setParentForm({ firstName: '', lastName: '', saIdNumber: '', email: '', phone: '', address: '', popiaSigned: false });
      setActiveSubTab('child');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register parent.');
    }
  };

  const handleRegisterChild = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!childForm.parentId) {
      setErrorMsg('Please select or register a primary Parent Account first.');
      return;
    }

    // SA ID Luhn Check
    if (!validateLuhn(childForm.saIdNumber)) {
      setErrorMsg('Invalid Child SA ID number. Verified 13-digit Luhn sequence mismatch.');
      return;
    }

    // DOB constraint: reject future records and enforce age range under 7 years
    const dob = new Date(childForm.dateOfBirth);
    const today = new Date();
    if (dob > today) {
      setErrorMsg('Date of birth cannot be a future date.');
      return;
    }
    const ageInYears = (today.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (ageInYears > 7) {
      setErrorMsg('Child must be between 0 and 7 years old for Enrollment (Grade R Max threshold).');
      return;
    }

    try {
      const allergiesArray = childForm.allergies
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1)); // Deduplicate & Capitalize as per Point 8

      const dedupedAllergies = Array.from(new Set(allergiesArray)).slice(0, 10); // Max 10 entries as per Point 8

      const { child, invoice } = stateService.registerChild({
        firstName: childForm.firstName.trim(),
        lastName: childForm.lastName.trim(),
        dateOfBirth: childForm.dateOfBirth,
        saIdNumber: childForm.saIdNumber.trim(),
        allergies: dedupedAllergies,
        medicalNotes: childForm.medicalNotes.trim()
      }, childForm.parentId);

      setSuccessMsg(`Child ${child.firstName} ${child.lastName} registered. Auto-assigned to group: ${child.groupId}.`);
      onChildRegistered(child, invoice); // immediately trigger parent to jump to render invoice tab!
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to enroll child.');
    }
  };

  const handleRegisterStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!validateLuhn(staffForm.saIdNumber)) {
      setErrorMsg('Invalid Staff SA ID number. 13-digit Luhn check failed.');
      return;
    }

    try {
      const qualificationsArray = staffForm.qualifications
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const staff = stateService.registerStaff({
        firstName: staffForm.firstName.trim(),
        lastName: staffForm.lastName.trim(),
        saIdNumber: staffForm.saIdNumber.trim(),
        role: staffForm.role,
        qualifications: qualificationsArray,
        certificationsExpiry: staffForm.firstAidExpiry 
          ? { "First Aid Level 1 Certificate": staffForm.firstAidExpiry } 
          : {}
      });

      setSuccessMsg(`Staff member ${staff.firstName} ${staff.lastName} registered successfully as ${staff.role}.`);
      setStaffForm({ firstName: '', lastName: '', saIdNumber: '', role: 'Lead Educator', qualifications: '', firstAidExpiry: '' });
      setStaffList([...stateService.staff]);
      setSelectedStaffId(staff.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register staff.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs selectors */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveSubTab('child'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === 'child'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Baby size={16} /> Child Enrollment
        </button>
        <button
          onClick={() => { setActiveSubTab('parent'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === 'parent'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserPlus size={16} /> Parent Accounts
        </button>
        <button
          onClick={() => { setActiveSubTab('staff'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === 'staff'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users size={16} /> Staff Registrations
        </button>
      </div>

      {/* Shared Feedback Panels */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-lg text-xs flex gap-2 font-medium">
          <AlertTriangle className="text-rose-500 shrink-0" size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-55 text-emerald-800 bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-xs flex gap-2 font-medium">
          <CheckCircle className="text-emerald-600 shrink-0" size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Child Enrollment Sub Tab */}
      {activeSubTab === 'child' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h3 className="font-semibold text-base mb-1">New Child Registration</h3>
          <p className="text-xs text-slate-400 mb-6">Triggers instant tax invoicing and billing schedules with age-cohort logic.</p>
          
          <form onSubmit={handleRegisterChild} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">First Name</label>
                <input
                  required
                  type="text"
                  maxLength={100}
                  value={childForm.firstName}
                  onChange={e => setChildForm({...childForm, firstName: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Sipho"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Last Name</label>
                <input
                  required
                  type="text"
                  maxLength={100}
                  value={childForm.lastName}
                  onChange={e => setChildForm({...childForm, lastName: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Mnguni"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">SA ID Number</label>
                <input
                  required
                  type="text"
                  maxLength={13}
                  value={childForm.saIdNumber}
                  onChange={e => setChildForm({...childForm, saIdNumber: e.target.value})}
                  className="w-full text-sm font-mono px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. 2305155822081"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Date of Birth</label>
                <input
                  required
                  type="date"
                  value={childForm.dateOfBirth}
                  onChange={e => setChildForm({...childForm, dateOfBirth: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Primary Parent Account</label>
                {stateService.parents.length === 0 ? (
                  <div className="bg-amber-100/50 border border-amber-200 text-amber-900 p-3 rounded-md text-xs">
                    No Parent Accounts exist. You must register at least one primary Parent Account before child enrollment can proceed.
                  </div>
                ) : (
                  <select
                    value={childForm.parentId}
                    onChange={e => setChildForm({...childForm, parentId: e.target.value})}
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="">-- Choose Account --</option>
                    {parents.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} | ID: {maskSAId(p.saIdNumber)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Allergies (Comma separated, max 10)</label>
                <input
                  type="text"
                  value={childForm.allergies}
                  onChange={e => setChildForm({...childForm, allergies: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Peanuts, Dairy, Strawberries"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Medical Notes</label>
                <textarea
                  rows={3}
                  value={childForm.medicalNotes}
                  onChange={e => setChildForm({...childForm, medicalNotes: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Emergency medication in diaper bag; lactose sensitive."
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-emerald-500"
              >
                Enroll Child & Generate Statement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Parent Registration Sub Tab */}
      {activeSubTab === 'parent' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Registration Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:col-span-1 h-fit">
            <h3 className="font-semibold text-base mb-1">New Parent Account</h3>
            <p className="text-xs text-slate-400 mb-6 font-sans">Creates primary legal relation entities. Requires POPIA compliance consent validation.</p>

            <form onSubmit={handleRegisterParent} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">First Name</label>
                <input
                  required
                  type="text"
                  maxLength={100}
                  value={parentForm.firstName}
                  onChange={e => setParentForm({...parentForm, firstName: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Thabo"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Last Name</label>
                <input
                  required
                  type="text"
                  maxLength={100}
                  value={parentForm.lastName}
                  onChange={e => setParentForm({...parentForm, lastName: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Mnguni"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">SA ID Number</label>
                <input
                  required
                  type="text"
                  maxLength={13}
                  value={parentForm.saIdNumber}
                  onChange={e => setParentForm({...parentForm, saIdNumber: e.target.value})}
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. 8503155800081"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Number</label>
                <input
                  required
                  type="text"
                  value={parentForm.phone}
                  onChange={e => setParentForm({...parentForm, phone: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. 0825551234"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  required
                  type="email"
                  value={parentForm.email}
                  onChange={e => setParentForm({...parentForm, email: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. thabo.m@example.co.za"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Residential Address</label>
                <input
                  required
                  type="text"
                  value={parentForm.address}
                  onChange={e => setParentForm({...parentForm, address: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. 12 Nelson Mandela Drive, Pretoria"
                />
              </div>

              <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 p-3 rounded-lg mt-2">
                <input
                  type="checkbox"
                  id="popiaSigned"
                  checked={parentForm.popiaSigned}
                  onChange={e => setParentForm({...parentForm, popiaSigned: e.target.checked})}
                  className="mt-0.5 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                />
                <label htmlFor="popiaSigned" className="select-none text-[11px] font-medium text-slate-600 cursor-pointer leading-normal">
                  Parent has signed the latest POPIA consent form
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  Register Parent Account
                </button>
              </div>
            </form>
          </div>

          {/* Col 2-3: Directory of Parents and Active Parent Detail View card */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col space-y-6">
            <div>
              <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
                <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
                Parent Directory & COPI/POPIA Audit
              </h3>
              <p className="text-xs text-slate-400">Track and view compliance and consent form signatures dynamically for parent profiles.</p>
            </div>

            {parents.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-medium">
                No Parent Records currently indexed. Use the form to catalog a family.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Parents Index Sidebar Picker List */}
                <div className="md:col-span-1 border-r border-slate-100 pr-0 md:pr-4 h-96 overflow-y-auto space-y-2">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Index of Owners</span>
                  {parents.map(p => {
                    const isSelected = p.id === selectedParentId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedParentId(p.id)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-250 text-emerald-900 font-semibold shadow-2xs'
                            : 'bg-white border-slate-150 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="truncate">{p.firstName} {p.lastName}</span>
                          <span className="text-[9px] font-mono text-slate-400 font-normal">{p.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${p.popiaSigned ? 'bg-emerald-55 bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="font-medium">{p.popiaSigned ? 'POPIA Signed' : 'POPIA Pending'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Parent Detail View Card with status badge */}
                <div className="md:col-span-2">
                  {(() => {
                    const activeP = parents.find(p => p.id === selectedParentId) || parents[0];
                    if (!activeP) return (
                      <div className="text-xs text-slate-400 py-10 text-center font-medium">Select a parent record to view audit details.</div>
                    );

                    return (
                      <div className="space-y-4">
                        {/* Parent compliance header display */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                          <div>
                            <span className="text-[9px] font-mono font-bold text-slate-400 block tracking-wider uppercase">PARENT ACCOUNT DETAIL</span>
                            <h4 className="font-extrabold text-base text-slate-800">{activeP.firstName} {activeP.lastName}</h4>
                          </div>
                          
                          {/* DYNAMIC COMPLIANCE STATUS BADGE */}
                          <div className="shrink-0 flex items-center">
                            {activeP.popiaSigned ? (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-250 text-emerald-700 text-[10px] font-extrabold px-3 py-1.5 rounded-full select-none shadow-3xs">
                                <ShieldCheck size={14} className="text-emerald-600" />
                                POPIA COMPLIANT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-225 text-rose-700 text-[10px] font-extrabold px-3 py-1.5 rounded-full select-none shadow-3xs">
                                <AlertTriangle size={14} className="text-rose-600" />
                                CONSENT OUTSTANDING
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Demographic Fields */}
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold border border-slate-150 p-4 rounded-xl bg-white">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">South African ID No.</span>
                            <span className="font-mono text-slate-800">{maskSAId(activeP.saIdNumber)}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Global account ID</span>
                            <span className="font-mono text-slate-800 bg-slate-105 px-2 py-0.5 rounded border border-slate-150 inline-block">{activeP.id}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email Address</span>
                            <span className="text-slate-850 truncate bg-slate-50 border border-slate-100 p-2 rounded block font-medium">{activeP.email}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contact Line</span>
                            <span className="text-slate-800 font-mono">{activeP.phone}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Residency</span>
                            <span className="text-slate-850 truncate block" title={activeP.address}>{activeP.address}</span>
                          </div>
                        </div>

                        {/* Associated Child Dependents List */}
                        <div className="p-4 border border-slate-150 rounded-xl space-y-2.5 bg-white">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Enrolled Dependent Children</span>
                          {(() => {
                            const children = stateService.children.filter(ch => ch.parentId === activeP.id);
                            if (children.length === 0) {
                              return <div className="text-xxs text-slate-400 italic py-1">No child beneficiaries registered under this parent profile yet.</div>;
                            }
                            return (
                              <div className="space-y-1.5">
                                {children.map(ch => (
                                  <div key={ch.id} className="text-xs bg-slate-50 border border-slate-150 rounded-xl p-3 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <Baby className="text-emerald-600 shrink-0" size={14} />
                                      <span className="font-bold text-slate-800">{ch.firstName} {ch.lastName}</span>
                                    </div>
                                    <span className="font-mono bg-emerald-50 text-emerald-805 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">Group: {ch.groupId}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Real-time POPIA Signed Toggle Button Card */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                          <div className="space-y-1">
                            <h5 className="font-bold text-xs text-slate-800">Direct Compliance Consent Execution</h5>
                            <p className="text-[10px] text-slate-400 leading-normal">
                              Instruct system to issue or update formal statutory POPIA declarations under Section 18 directives. Updates are applied in real-time.
                            </p>
                          </div>
                          <div className="flex justify-end">
                            {activeP.popiaSigned ? (
                              <button
                                type="button"
                                onClick={() => {
                                  // Update state in service
                                  const updated = { ...activeP, popiaSigned: false };
                                  stateService.updateParent(updated);
                                  // Sync back to local tab parents state
                                  setParents([...stateService.parents]);
                                }}
                                className="text-xxs bg-white text-rose-600 hover:bg-rose-50 border border-rose-225 font-bold px-4 py-2 rounded-lg transition-all cursor-pointer shadow-3xs"
                              >
                                Revoke Consent / Reject Forms
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  // Update state in service
                                  const updated = { ...activeP, popiaSigned: true };
                                  stateService.updateParent(updated);
                                  // Sync back to local tab parents state
                                  setParents([...stateService.parents]);
                                }}
                                className="text-xxs bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-4 py-2 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle size={13} />
                                Sign POPIA Consent Statement
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff Registration Sub Tab */}
      {activeSubTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Registration Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 lg:col-span-1 h-fit">
            <h3 className="font-semibold text-base mb-1">New Daycare Staff Account</h3>
            <p className="text-xs text-slate-400 mb-6 font-sans">Track qualifications, certification expiration dates, and roles securely.</p>

            <form onSubmit={handleRegisterStaff} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">First Name</label>
                <input
                  required
                  type="text"
                  maxLength={100}
                  value={staffForm.firstName}
                  onChange={e => setStaffForm({...staffForm, firstName: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Nomsa"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Last Name</label>
                <input
                  required
                  type="text"
                  maxLength={100}
                  value={staffForm.lastName}
                  onChange={e => setStaffForm({...staffForm, lastName: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Khumalo"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">SA ID Number</label>
                <input
                  required
                  type="text"
                  maxLength={13}
                  value={staffForm.saIdNumber}
                  onChange={e => setStaffForm({...staffForm, saIdNumber: e.target.value})}
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="7811050811082"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assigned Role</label>
                <select
                  value={staffForm.role}
                  onChange={e => setStaffForm({...staffForm, role: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="Lead Educator">Lead Educator</option>
                  <option value="Childcare Assistant">Childcare Assistant</option>
                  <option value="Principal">Principal / Manager</option>
                  <option value="Kitchen Operator">Kitchen Operator</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Qualifications (Commas)</label>
                <input
                  type="text"
                  value={staffForm.qualifications}
                  onChange={e => setStaffForm({...staffForm, qualifications: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Bachelor of Education (ECD), First Aid"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">First Aid / Safety Certificate Expiry</label>
                <input
                  type="date"
                  value={staffForm.firstAidExpiry}
                  onChange={e => setStaffForm({...staffForm, firstAidExpiry: e.target.value})}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  Register Staff Account
                </button>
              </div>
            </form>
          </div>

          {/* Col 2-3: Directory of Staff and Active Staff Detail View card */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col space-y-6">
            <div>
              <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
                <Users className="text-emerald-600 shrink-0" size={18} />
                Staff Directory & Safety Audit
              </h3>
              <p className="text-xs text-slate-400">Track qualifications, roles, and safety certificates. Highlights upcoming expiry within 30 days.</p>
            </div>

            {staffList.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-medium">
                No Staff Records currently indexed. Use the left form to catalog staff.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Staff Index Picker */}
                <div className="md:col-span-1 border-r border-slate-100 pr-0 md:pr-4 h-96 overflow-y-auto space-y-2">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Index of Staff</span>
                  {staffList.map(s => {
                    const isSelected = s.id === selectedStaffId;
                    
                    // Check if certification is expiring within next 30 days
                    const todayVal = new Date('2026-05-23').getTime();
                    let hasExpiringSoon = false;
                    let soonestDaysLeft = Infinity;
                    
                    if (s.certificationsExpiry) {
                      Object.values(s.certificationsExpiry).forEach(rawVal => {
                        const expiryTime = new Date(rawVal as string).getTime();
                        const diffMs = expiryTime - todayVal;
                        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                        if (daysLeft <= 30) {
                          hasExpiringSoon = true;
                          if (daysLeft < soonestDaysLeft) {
                            soonestDaysLeft = daysLeft;
                          }
                        }
                      });
                    }

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStaffId(s.id)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-250 text-emerald-900 font-semibold shadow-2xs'
                            : 'bg-white border-slate-150 text-slate-705 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full gap-2">
                          <span className="truncate flex items-center gap-1.5 font-bold">
                            {s.firstName} {s.lastName}
                            {hasExpiringSoon && (
                              <span className="text-rose-600 inline-block shrink-0 animate-bounce" title="Certification expiring or expired within 30 days!">
                                <AlertTriangle size={13} fill="currentColor" className="text-rose-500 fill-rose-105" />
                              </span>
                            )}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 font-normal shrink-0">{s.id}</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium mt-0.5">
                          <span>{s.role}</span>
                          {hasExpiringSoon && (
                            <span className="text-rose-600 font-extrabold bg-rose-50 px-1 rounded">
                              {soonestDaysLeft <= 0 ? 'EXPIRED' : `${soonestDaysLeft}d`}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Staff Detail Panel */}
                <div className="md:col-span-2">
                  {(() => {
                    const activeS = staffList.find(s => s.id === selectedStaffId) || staffList[0];
                    if (!activeS) return (
                      <div className="text-xs text-slate-400 py-10 text-center font-medium">Select a staff member record to view safety details.</div>
                    );

                    const todayVal = new Date('2026-05-23').getTime();
                    const certStatusItems: { name: string; date: string; daysLeft: number }[] = [];
                    if (activeS.certificationsExpiry) {
                      Object.entries(activeS.certificationsExpiry).forEach(([name, rawVal]) => {
                        const expiryTime = new Date(rawVal as string).getTime();
                        const diffMs = expiryTime - todayVal;
                        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                        certStatusItems.push({ name, date: rawVal as string, daysLeft });
                      });
                    }

                    const hasAnyExps = certStatusItems.some(i => i.daysLeft <= 30);

                    return (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                          <div>
                            <span className="text-[9px] font-mono font-bold text-slate-400 block tracking-wider uppercase">STAFF PERS MEMBER DETAIL</span>
                            <h4 className="font-extrabold text-base text-slate-805 flex items-center gap-2">
                              {activeS.firstName} {activeS.lastName}
                              {hasAnyExps && (
                                <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-225 text-rose-705 text-[10px] font-extrabold px-2 py-0.5 rounded-full select-none shadow-3xs">
                                  <AlertTriangle size={12} className="text-rose-600" /> EXPIRING CERT
                                </span>
                              )}
                            </h4>
                          </div>
                          
                          <div className="shrink-0 flex items-center">
                            <span className="inline-flex bg-emerald-50 border border-emerald-250 text-emerald-700 text-[10px] font-extrabold px-3 py-1.5 rounded-full select-none shadow-3xs">
                              {activeS.role}
                            </span>
                          </div>
                        </div>

                        {/* Demographics */}
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold border border-slate-150 p-4 rounded-xl bg-white">
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">RSA Identity No.</span>
                            <span className="font-mono text-slate-805">{activeS.saIdNumber}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Global account ID</span>
                            <span className="font-mono text-slate-805 bg-slate-105 px-2 py-0.5 rounded border border-slate-150 inline-block">{activeS.id}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Formal Qualifications</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {activeS.qualifications.length === 0 ? (
                                <span className="text-xxs text-slate-400 italic">No credentials cataloged during registration.</span>
                              ) : (
                                activeS.qualifications.map((q, idx) => (
                                  <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 text-[10.5px] font-bold px-2 py-1 rounded-lg">
                                    {q}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Statutory Certifications Ledger */}
                        <div className="p-4 border border-slate-150 rounded-xl space-y-3 bg-white">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Statutory Certifications Audit</span>
                          {certStatusItems.length === 0 ? (
                            <div className="text-xxs text-slate-400 italic py-1">No upcoming certifications configured in personnel file.</div>
                          ) : (
                            <div className="space-y-2">
                              {certStatusItems.map((item, idx) => {
                                const isCritical = item.daysLeft <= 0;
                                const isWarning = item.daysLeft <= 30;
                                return (
                                  <div key={idx} className={`text-xs border rounded-xl p-3 flex justify-between items-center transition-all ${
                                    isCritical 
                                      ? 'bg-rose-50 border-rose-225 text-rose-900 shadow-3xs' 
                                      : isWarning 
                                        ? 'bg-amber-50/50 border-amber-205 text-amber-900' 
                                        : 'bg-emerald-50/20 border-emerald-150 text-slate-707'
                                  }`}>
                                    <div className="flex items-center gap-2">
                                      {isWarning || isCritical ? (
                                        <AlertTriangle className={isCritical ? 'text-rose-600' : 'text-amber-550'} size={14} />
                                      ) : (
                                        <ShieldCheck className="text-emerald-650" size={14} />
                                      )}
                                      <div className="space-y-0.5">
                                        <span className="font-bold block text-slate-805">{item.name}</span>
                                        <span className="text-[10px] text-slate-450 block font-normal">Expires: {item.date}</span>
                                      </div>
                                    </div>
                                    <span className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isCritical 
                                        ? 'bg-rose-100/80 text-rose-800 font-extrabold border border-rose-205' 
                                        : isWarning 
                                          ? 'bg-amber-100 text-amber-805 border border-amber-200 animate-pulse' 
                                          : 'bg-emerald-50 text-emerald-805 border border-emerald-250'
                                    }`}>
                                      {item.daysLeft <= 0 ? 'EXPIRED' : `${item.daysLeft} days left`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
