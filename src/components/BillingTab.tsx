import React, { useState, useMemo } from 'react';
import { StateService } from '../lib/services/StateService';
import { Invoice, InvoiceItem, Parent, Child } from '../lib/types';
import { formatZAR, maskSAId, formatSADate } from '../lib/utils';
import { jsPDF } from 'jspdf';
import { 
  CreditCard, Search, Edit2, Play, Download, Send, 
  Plus, Trash2, ArrowLeft, Lock, ShieldCheck, Check, Info 
} from 'lucide-react';

interface BillingTabProps {
  stateService: StateService;
}

export const BillingTab: React.FC<BillingTabProps> = ({ stateService }) => {
  const [invoices, setInvoices] = useState<Invoice[]>(stateService.invoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Navigation states inside Billing
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Consent dialog state
  const [consentDialog, setConsentDialog] = useState<{
    show: boolean;
    channel: 'WhatsApp' | 'Email';
    invoice: Invoice;
  } | null>(null);

  // Filter invoice computed list
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const parent = stateService.parents.find(p => p.id === inv.parentId);
      const child = stateService.children.find(c => c.id === inv.childId);
      const searchStr = `${inv.id} ${parent?.lastName || ''} ${child?.firstName || ''}`.toLowerCase();
      
      const queryMatch = searchStr.includes(searchQuery.toLowerCase());
      const filterMatch = statusFilter === 'all' || inv.status === statusFilter;
      
      return queryMatch && filterMatch;
    });
  }, [invoices, searchQuery, statusFilter, stateService]);

  // Handle invoice state mutation safely
  const handleSaveInvoiceEdit = (e: React.FormEvent, editedItems: InvoiceItem[]) => {
    e.preventDefault();
    if (!editingInvoice) return;

    // Calculate subtotal from cents
    let subtotal = 0;
    editedItems.forEach(item => {
      subtotal += item.amount;
    });

    const vatAmount = Math.round(subtotal * 0.15);
    const total = subtotal + vatAmount;

    const previousStatus = editingInvoice.status;
    const nextVersion = editingInvoice.version + 1;

    const updated: Invoice = {
      ...editingInvoice,
      items: editedItems,
      subtotal,
      vatAmount,
      total,
      version: nextVersion,
      history: [
        ...editingInvoice.history,
        {
          id: `H-${Math.floor(Math.random() * 1000000)}`,
          invoiceId: editingInvoice.id,
          action: 'Edited',
          timestamp: new Date().toISOString(),
          actor: 'Admin',
          notes: `Invoice line items edited. Subtotal: ${formatZAR(subtotal)}, VAT: ${formatZAR(vatAmount)}, Version bumped to V${nextVersion}.`
        }
      ]
    };

    stateService.updateInvoice(updated, 'Admin');
    setInvoices([...stateService.invoices]);
    setEditingInvoice(null);
    setSelectedInvoice(updated);
  };

  const handleChangeStatus = (invoice: Invoice, newStatus: 'Paid' | 'Voided' | 'Sent') => {
    const nextVersion = invoice.version + 1;
    const updated: Invoice = {
      ...invoice,
      status: newStatus,
      version: nextVersion,
      history: [
        ...invoice.history,
        {
          id: `H-${Math.floor(Math.random() * 1000000)}`,
          invoiceId: invoice.id,
          action: newStatus === 'Paid' ? 'Paid' : (newStatus === 'Voided' ? 'Voided' : 'Sent'),
          timestamp: new Date().toISOString(),
          actor: 'Admin',
          notes: `Invoice status changed from ${invoice.status} to ${newStatus}.`
        }
      ]
    };

    stateService.updateInvoice(updated, 'Admin');
    setInvoices([...stateService.invoices]);
    if (selectedInvoice?.id === invoice.id) {
      setSelectedInvoice(updated);
    }
  };

  // POPIA Consent Gate confirmed sender
  const handleProceedSend = () => {
    if (!consentDialog) return;
    const { channel, invoice } = consentDialog;
    setConsentDialog(null);

    const parent = stateService.parents.find(p => p.id === invoice.parentId);
    if (!parent) return;

    // Log the send action in history
    const nextVersion = invoice.version + 1;
    const updated: Invoice = {
      ...invoice,
      status: 'Sent',
      version: nextVersion,
      history: [
        ...invoice.history,
        {
          id: `H-${Math.floor(Math.random() * 1000000)}`,
          invoiceId: invoice.id,
          action: 'Sent',
          timestamp: new Date().toISOString(),
          actor: 'Admin',
          notes: `Invoice sent to parent ${parent.firstName} ${parent.lastName} via ${channel}.`
        }
      ]
    };

    stateService.updateInvoice(updated, 'Admin');
    setInvoices([...stateService.invoices]);
    setSelectedInvoice(updated);

    // Deep link assembly
    const textAndAmount = `Invoice ${invoice.id} for R ${ (invoice.total / 100).toFixed(2) } from SA Daycare is available. Please click here to view and pay.`;
    
    if (channel === 'WhatsApp') {
      // Normalise phone number to WhatsApp wa.me format (e.g., +27825551234 -> 27825551234)
      let cleanedPhone = parent.phone.replace(/\D/g, '');
      if (cleanedPhone.startsWith('0')) {
        cleanedPhone = '27' + cleanedPhone.slice(1);
      }
      const waUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(textAndAmount)}`;
      window.open(waUrl, '_blank');
    } else {
      const emailUrl = `mailto:${parent.email}?subject=${encodeURIComponent(`TAX INVOICE - ${invoice.id}`)}&body=${encodeURIComponent(textAndAmount)}`;
      window.open(emailUrl, '_blank');
    }
  };

  // Client-side PDF creation using jsPDF and standard drawing APIs
  const handleDownloadPDF = (invoice: Invoice) => {
    const parent = stateService.parents.find(p => p.id === invoice.parentId);
    const child = stateService.children.find(c => c.id === invoice.childId);
    
    const doc = new jsPDF();
    
    // Header Colors & Style
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("S.A. TAX INVOICE", 15, 25);
    
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`VAT Number: ${stateService.settings.vatNumber}`, 140, 25);
    doc.text(`Doc Ref: ${invoice.id}`, 140, 20);

    // Daycare Details
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text("ISSUED BY:", 15, 55);
    doc.setFont("Helvetica", "normal");
    doc.text(stateService.settings.name, 15, 62);
    doc.text(stateService.settings.address, 15, 68);
    doc.text(`Phone: ${stateService.settings.phone} | ${stateService.settings.email}`, 15, 74);

    // Bill To parent details with maskSAId
    doc.setFont("Helvetica", "bold");
    doc.text("BILL TO (PARENT/GUARDIAN):", 120, 55);
    doc.setFont("Helvetica", "normal");
    doc.text(parent ? `${parent.firstName} ${parent.lastName}` : 'N/A', 120, 62);
    doc.text(`SA ID: ${parent ? maskSAId(parent.saIdNumber) : 'N/A'} (POPIA Masked)`, 120, 68);
    doc.text(parent ? parent.email : '', 120, 74);
    doc.text(parent ? parent.phone : '', 120, 80);

    // Child Details
    doc.setFont("Helvetica", "bold");
    doc.text("CHILD BENEFICIARY DETAILS:", 15, 92);
    doc.setFont("Helvetica", "normal");
    doc.text(child ? `${child.firstName} ${child.lastName} (${child.groupId})` : 'N/A', 15, 98);
    doc.text(`Enrollment Date: ${child ? formatSADate(child.enrollmentDate) : 'N/A'}`, 15, 104);

    // Double lines for items
    doc.setDrawColor(226, 232, 240);
    doc.line(15, 112, 195, 112);

    // Table Columns
    doc.setFont("Helvetica", "bold");
    doc.text("Line Description", 15, 118);
    doc.text("Amount (ZAR)", 175, 118, { align: 'right' });
    doc.line(15, 122, 195, 122);

    let startY = 130;
    doc.setFont("Helvetica", "normal");

    invoice.items.forEach(item => {
      doc.text(item.description, 15, startY);
      doc.text((item.amount / 100).toFixed(2), 175, startY, { align: 'right' });
      startY += 10;
    });

    doc.line(15, startY, 195, startY);
    startY += 10;

    // Totals Panel
    doc.setFont("Helvetica", "bold");
    doc.text("Subtotal:", 135, startY);
    doc.text((invoice.subtotal / 100).toFixed(2), 175, startY, { align: 'right' });
    startY += 8;

    doc.text("VAT at 15%:", 135, startY);
    doc.text((invoice.vatAmount / 100).toFixed(2), 175, startY, { align: 'right' });
    startY += 10;

    doc.setFillColor(248, 250, 252); // light slate background for total due
    doc.rect(130, startY - 6, 65, 12, 'F');
    doc.setFontSize(12);
    doc.text("TOTAL DUE:", 135, startY + 2);
    doc.text(`R ${(invoice.total / 100).toFixed(2)}`, 175, startY + 2, { align: 'right' });

    // Banking details
    startY += 25;
    doc.setFontSize(10);
    doc.setFont("Helvetica", "bold");
    doc.text("BANKING PAYMENT DETAILS:", 15, startY);
    doc.setFont("Helvetica", "normal");
    doc.text(`Bank: ${stateService.settings.bankName}`, 15, startY + 6);
    doc.text(`Account No: ${stateService.settings.accountNumber}`, 15, startY + 12);
    doc.text(`Branch Code: ${stateService.settings.branchCode}`, 15, startY + 18);
    doc.text(`Reference: ${invoice.id}`, 15, startY + 24);

    // Footer notice
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("This Tax Invoice was automatically generated in adherence to POPIA (Act 4 of 2013) safety parameters.", 15, 280);
    
    doc.save(`SADaycare_Invoice_${invoice.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      {!selectedInvoice && !editingInvoice && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by Invoice ID, Child, Parent..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full md:w-44 text-sm border border-slate-300 rounded-lg px-3 py-2.5 outline-none bg-white font-sans"
            >
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Voided">Voided</option>
            </select>
          </div>
        </div>
      )}

      {/* Main invoices browser */}
      {!selectedInvoice && !editingInvoice && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                <th className="px-6 py-3.5">Invoice ID</th>
                <th className="px-6 py-3.5">Child / Parent Beneficiary</th>
                <th className="px-6 py-3.5">Issue Date</th>
                <th className="px-6 py-3.5 text-right">Total Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-xs font-sans">
                    No matching billing records identified in workspace.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const parent = stateService.parents.find(p => p.id === inv.parentId);
                  const child = stateService.children.find(c => c.id === inv.childId);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4.5 font-semibold text-emerald-600 font-mono">
                        {inv.id}
                      </td>
                      <td className="px-6 py-4.5">
                        <p className="font-semibold text-slate-800">{child ? `${child.firstName} ${child.lastName}` : 'N/A'}</p>
                        <p className="text-xxs text-slate-400 mt-0.5">Parent: {parent ? `${parent.firstName} ${parent.lastName}` : 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4.5 text-xs text-slate-500 font-mono">
                        {formatSADate(inv.issueDate)}
                      </td>
                      <td className="px-6 py-4.5 text-right font-bold text-slate-850 font-mono">
                        {formatZAR(inv.total)}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xxs font-semibold uppercase tracking-wider ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'Sent' ? 'bg-indigo-100 text-indigo-800' :
                          inv.status === 'Voided' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="text-emerald-600 hover:text-emerald-700 font-semibold text-xs border border-emerald-200 hover:border-emerald-300 rounded-md px-3 py-1.5 transition-colors"
                        >
                          View Detail & Send
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Detail Sheet view */}
      {selectedInvoice && !editingInvoice && (
        <InvoiceDetailCard 
          invoice={selectedInvoice}
          stateService={stateService}
          onBack={() => { setSelectedInvoice(null); setInvoices([...stateService.invoices]); }}
          onEdit={() => setEditingInvoice(selectedInvoice)}
          onMarkStatus={(status) => handleChangeStatus(selectedInvoice, status)}
          onDownload={() => handleDownloadPDF(selectedInvoice)}
          onTriggerSend={(channel) => setConsentDialog({ show: true, channel, invoice: selectedInvoice })}
        />
      )}

      {/* Real-time Invoice Line Editor panel */}
      {editingInvoice && (
        <InvoiceEditorForm 
          invoice={editingInvoice}
          stateService={stateService}
          onCancel={() => setEditingInvoice(null)}
          onSave={handleSaveInvoiceEdit}
        />
      )}

      {/* POPIA Consent confirmation Dialog block */}
      {consentDialog && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-emerald-600 animate-pulse" /> Confirm POPIA Consent Authorization
            </h4>
            <div className="text-xs text-slate-500 leading-relaxed space-y-2">
              <p>
                You are about to transmit a tax document containing personally identifiable information (PII) including parent name, encrypted national identifiers, and medical/enrolment statuses.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 font-mono text-xxs text-slate-600 space-y-1">
                <div>Channel: <span className="font-bold text-slate-800">{consentDialog.channel} Connection</span></div>
                <div>Recipient Name: <span className="font-bold text-slate-800">
                  {stateService.parents.find(p => p.id === consentDialog.invoice.parentId)?.firstName} {stateService.parents.find(p => p.id === consentDialog.invoice.parentId)?.lastName}
                </span></div>
                <div>Identifier Address: <span className="font-bold text-slate-800">
                  {consentDialog.channel === 'WhatsApp' ? stateService.parents.find(p => p.id === consentDialog.invoice.parentId)?.phone : stateService.parents.find(p => p.id === consentDialog.invoice.parentId)?.email}
                </span></div>
              </div>
              <p className="font-semibold text-slate-700">
                Do you confirm that this communication has been explicitly authorized under the Daycare Protection Guidelines and POPIA section 18 mandates?
              </p>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button 
                onClick={() => setConsentDialog(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-4 py-2 text-xs rounded-md"
              >
                No, Abort Send
              </button>
              <button 
                onClick={handleProceedSend}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 text-xs rounded-md shadow-sm"
              >
                Yes, Consent Confirmed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Invoice Detail Card Inner Component
interface DetailProps {
  invoice: Invoice;
  stateService: StateService;
  onBack: () => void;
  onEdit: () => void;
  onMarkStatus: (status: 'Paid' | 'Voided' | 'Sent') => void;
  onDownload: () => void;
  onTriggerSend: (channel: 'WhatsApp' | 'Email') => void;
}

const InvoiceDetailCard: React.FC<DetailProps> = ({
  invoice, stateService, onBack, onEdit, onMarkStatus, onDownload, onTriggerSend
}) => {
  const parent = stateService.parents.find(p => p.id === invoice.parentId);
  const child = stateService.children.find(c => c.id === invoice.childId);
  const isLocked = invoice.status === 'Paid' || invoice.status === 'Voided';

  return (
    <div className="space-y-6">
      {/* Detail bar */}
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors">
          <ArrowLeft size={16} /> Back to Listings
        </button>
        <div className="flex items-center gap-2">
          {!isLocked ? (
            <button 
              onClick={onEdit}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 rounded-md px-3.5 py-1.5 flex items-center gap-1 transition-all"
            >
              <Edit2 size={13} /> Edit Invoice Lines
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
              <Lock size={12} /> Invoice Locked (Non-Editable)
            </span>
          )}
          <button 
            onClick={onDownload}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md px-3.5 py-1.5 flex items-center gap-1 shadow-xs transition-all"
          >
            <Download size={13} /> Download Tax PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Invoice Detail view */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden font-sans">
          {/* Header block */}
          <div className="bg-slate-900 text-white p-7 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">TAX INVOICE</h2>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{stateService.settings.name}</p>
              <p className="text-xs text-slate-400">VAT Reg: {stateService.settings.vatNumber}</p>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 font-mono text-base font-bold">{invoice.id}</span>
              <p className="text-xxs text-slate-400 font-mono mt-1">Issue: {formatSADate(invoice.issueDate)}</p>
              <p className="text-xxs text-slate-400 font-mono">Due: {formatSADate(invoice.dueDate)}</p>
            </div>
          </div>

          {/* SAs POPIA client cards */}
          <div className="p-7 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs select-none">
            <div>
              <h4 className="text-xxs uppercase tracking-wider text-slate-400 font-bold mb-1.5">Primary Accountholder</h4>
              <p className="font-semibold text-slate-800 text-sm">{parent ? `${parent.firstName} ${parent.lastName}` : 'N/A'}</p>
              <p className="text-slate-500 mt-0.5">ID: {parent ? maskSAId(parent.saIdNumber) : 'N/A'}</p>
              <p className="text-slate-500">{parent ? parent.email : ''}</p>
              <p className="text-slate-500">{parent ? parent.phone : ''}</p>
            </div>
            <div>
              <h4 className="text-xxs uppercase tracking-wider text-slate-400 font-bold mb-1.5">Child Beneficiary</h4>
              <p className="font-semibold text-slate-800 text-sm">{child ? `${child.firstName} ${child.lastName}` : 'N/A'}</p>
              <p className="text-slate-500 mt-0.5">Group: <span className="font-medium text-emerald-700">{child ? child.groupId : ''}</span></p>
              {child && child.allergies.length > 0 && (
                <div className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 inline-flex mt-1 border border-amber-200">
                  ⚠️ Allergies flagged: {child.allergies.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Line items table */}
          <div className="p-7">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-right">Amount (ZAR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 text-slate-700 font-medium">{item.description}</td>
                    <td className="py-3 text-right font-mono font-semibold text-slate-800">{formatZAR(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total panels */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <div className="w-64 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Exclusive Subtotal</span>
                  <span className="font-mono">{formatZAR(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>VAT at 15%</span>
                  <span className="font-mono">{formatZAR(invoice.vatAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                  <span>TOTAL BALANCE DUE</span>
                  <span className="font-mono text-emerald-600">{formatZAR(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Trial, Status & quick Actions */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Statement Control Console</h3>
            
            <div className="space-y-2">
              <div className="text-xs text-slate-400">State: <span className="font-bold text-slate-700">{invoice.status}</span></div>
              <div className="flex gap-1.5 flex-wrap">
                {invoice.status !== 'Paid' && (
                  <button 
                    onClick={() => onMarkStatus('Paid')}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xxs font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1"
                  >
                    <Check size={12} /> Paid
                  </button>
                )}
                {invoice.status !== 'Voided' && (
                  <button 
                    onClick={() => onMarkStatus('Voided')}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-800 text-xxs font-semibold px-2.5 py-1.5 rounded-lg border border-rose-200"
                  >
                    Void Invoice
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Secure Dispatch Channels</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onTriggerSend('WhatsApp')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-semibold p-2 rounded-lg flex items-center justify-center gap-1 shadow-sm"
                >
                  <Send size={11} /> WhatsApp
                </button>
                <button
                  onClick={() => onTriggerSend('Email')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xxs font-semibold p-2 rounded-lg flex items-center justify-center gap-1 shadow-sm"
                >
                  <Send size={11} /> Email Client
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Info size={13} className="text-slate-400" /> Version History Log
            </h3>
            <div className="space-y-3 text-[11px] leading-relaxed max-h-48 overflow-y-auto pr-1">
              {invoice.history.map((hist, idx) => (
                <div key={idx} className="border-l-2 border-emerald-500 pl-2.5 space-y-0.5">
                  <p className="font-bold text-slate-800">{hist.action} <span className="font-normal text-slate-400">by {hist.actor}</span></p>
                  <p className="text-slate-500">{hist.notes}</p>
                  <p className="text-[10px] text-slate-450 font-mono">{new Date(hist.timestamp).toLocaleDateString('en-ZA')} {new Date(hist.timestamp).toLocaleTimeString('en-ZA', {hour:'2-digit', minute:'2-digit'})}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Invoice Edit form sub component supporting cents adjustments
interface EditProps {
  invoice: Invoice;
  stateService: StateService;
  onCancel: () => void;
  onSave: (e: React.FormEvent, items: InvoiceItem[]) => void;
}

const InvoiceEditorForm: React.FC<EditProps> = ({ invoice, stateService, onCancel, onSave }) => {
  const [items, setItems] = useState<InvoiceItem[]>([...invoice.items]);

  const handleItemTextChange = (idx: number, text: string) => {
    const updated = [...items];
    updated[idx].description = text;
    setItems(updated);
  };

  // Enforces float to integer cents conversion cleanly on inputs
  const handleItemAmountChange = (idx: number, val: string) => {
    const updated = [...items];
    const numeric = parseFloat(val) || 0;
    updated[idx].amount = Math.round(numeric * 100); // Saved in cents!
    setItems(updated);
  };

  const handleAddNewRow = () => {
    setItems([...items, { description: 'Extra Service Item', amount: 0 }]);
  };

  const handleRemoveRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const calculations = useMemo(() => {
    let subtotal = 0;
    items.forEach(i => {
      subtotal += i.amount;
    });
    const vat = Math.round(subtotal * 0.15);
    const total = subtotal + vat;
    return { subtotal, vat, total };
  }, [items]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-base text-slate-800">Edit Invoice Specifications: {invoice.id}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Editing snapshot version V{invoice.version}. Values entered are in ZAR.</p>
        </div>
        <button onClick={onCancel} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
          Cancel
        </button>
      </div>

      <form onSubmit={(e) => onSave(e, items)} className="space-y-6">
        <table className="w-full text-left font-sans text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="pb-3 w-3/5">Item Line Description</th>
              <th className="pb-3 text-right">Unit Price (ZAR)</th>
              <th className="pb-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-3">
                  <input
                    required
                    type="text"
                    value={item.description}
                    onChange={e => handleItemTextChange(idx, e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </td>
                <td className="py-3 text-right font-mono">
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={(item.amount / 100).toFixed(2)}
                    onChange={e => handleItemAmountChange(idx, e.target.value)}
                    className="w-28 text-right px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </td>
                <td className="py-3 text-right">
                  <button 
                    type="button" 
                    onClick={() => handleRemoveRow(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1 rounded-md"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handleAddNewRow}
            className="text-emerald-600 hover:text-emerald-700 font-semibold text-xs flex items-center gap-1 border border-emerald-200 hover:border-emerald-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} /> Add Line Item
          </button>
          
          <div className="w-72 bg-slate-50 border border-slate-250 border-slate-100 rounded-lg p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Exclusive Subtotal:</span>
              <span className="font-mono">{formatZAR(calculations.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>VAT at 15%:</span>
              <span className="font-mono">{formatZAR(calculations.vat)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1.5 mt-1">
              <span>Next Statement Total:</span>
              <span className="font-mono text-emerald-600">{formatZAR(calculations.total)}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-xs px-4 py-2.5 rounded-lg"
          >
            Discard Changes
          </button>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm"
          >
            Save V{invoice.version + 1} Snapshot
          </button>
        </div>
      </form>
    </div>
  );
};
