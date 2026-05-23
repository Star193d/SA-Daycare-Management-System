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
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Parent form state
  const [parentForm, setParentForm] = useState({
    firstName: '',
    lastName: '',
    saIdNumber: '',
    email: '',
    phone: '',
    address: ''
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
    role: 'Educator',
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
        address: parentForm.address.trim()
      });

      setParents([...stateService.parents]);
      setSuccessMsg(`Parent ${parent.firstName} ${parent.lastName} registered successfully under Account ID ${parent.id}.`);
      setChildForm(prev => ({ ...prev, parentId: parent.id })); // auto-select parent for child form
      setParentForm({ firstName: '', lastName: '', saIdNumber: '', email: '', phone: '', address: '' });
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
      setStaffForm({ firstName: '', lastName: '', saIdNumber: '', role: 'Educator', qualifications: '', firstAidExpiry: '' });
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h3 className="font-semibold text-base mb-1">New Parent Account</h3>
          <p className="text-xs text-slate-400 mb-6 font-sans">Creates primary legal relation entities. Requires POPIA compliance consent validation.</p>

          <form onSubmit={handleRegisterParent} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">First Name</label>
                <input
                  required
                  type="text"
                  maxLength={100}
                  value={parentForm.firstName}
                  onChange={e => setParentForm({...parentForm, firstName: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Thabo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Last Name</label>
                <input
                  required
                  type="text"
                  maxLength={100}
                  value={parentForm.lastName}
                  onChange={e => setParentForm({...parentForm, lastName: e.target.value})}
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
                  value={parentForm.saIdNumber}
                  onChange={e => setParentForm({...parentForm, saIdNumber: e.target.value})}
                  className="w-full text-sm font-mono px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. 8503155800081"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Contact Number</label>
                <input
                  required
                  type="text"
                  value={parentForm.phone}
                  onChange={e => setParentForm({...parentForm, phone: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. 0825551234"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  required
                  type="email"
                  value={parentForm.email}
                  onChange={e => setParentForm({...parentForm, email: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. thabo.m@example.co.za"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Residential Address</label>
                <input
                  required
                  type="text"
                  value={parentForm.address}
                  onChange={e => setParentForm({...parentForm, address: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. 12 Nelson Mandela Drive, Pretoria"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-emerald-500"
              >
                Register Parent Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Registration Sub Tab */}
      {activeSubTab === 'staff' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h3 className="font-semibold text-base mb-1">New Daycare Staff Account</h3>
          <p className="text-xs text-slate-400 mb-6">Track qualifications, certification expiration dates, and roles securely.</p>

          <form onSubmit={handleRegisterStaff} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">First Name</label>
                <input
                  required
                  type="text"
                  maxLength={100}
                  value={staffForm.firstName}
                  onChange={e => setStaffForm({...staffForm, firstName: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Nomsa"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Last Name</label>
                <input
                  required
                  type="text"
                  maxLength={100}
                  value={staffForm.lastName}
                  onChange={e => setStaffForm({...staffForm, lastName: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Khumalo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">SA ID Number</label>
                <input
                  required
                  type="text"
                  maxLength={13}
                  value={staffForm.saIdNumber}
                  onChange={e => setStaffForm({...staffForm, saIdNumber: e.target.value})}
                  className="w-full text-sm font-mono px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="7811050811082"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assigned Role</label>
                <select
                  value={staffForm.role}
                  onChange={e => setStaffForm({...staffForm, role: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="Lead Educator">Lead Educator</option>
                  <option value="Childcare Assistant">Childcare Assistant</option>
                  <option value="Principal">Principal / Manager</option>
                  <option value="Kitchen Operator">Kitchen Operator</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Qualifications (Comma separated)</label>
                <input
                  type="text"
                  value={staffForm.qualifications}
                  onChange={e => setStaffForm({...staffForm, qualifications: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Bachelor of Education (ECD), First Aid Certification"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">First Aid / Safety Certificate Expiry</label>
                <input
                  type="date"
                  value={staffForm.firstAidExpiry}
                  onChange={e => setStaffForm({...staffForm, firstAidExpiry: e.target.value})}
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-emerald-500"
              >
                Register Staff Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
