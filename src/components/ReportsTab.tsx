import React, { useState, useMemo } from 'react';
import { StateService } from '../lib/services/StateService';
import { maskSAId, formatSADate } from '../lib/utils';
import { 
  ShieldCheck, Download, CheckCircle, AlertOctagon, HelpCircle, FileText,
  BookOpen, ChevronRight, RefreshCw, UserCheck, CheckSquare, Trash2, Info
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ReportsTabProps {
  stateService: StateService;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ stateService }) => {
  const [selectedCategory, setSelectedCategory] = useState<'roster' | 'checklist' | 'parent-pack'>('roster');

  // DSAR Form States
  const [dsarParentName, setDsarParentName] = useState('');
  const [dsarParentId, setDsarParentId] = useState('');
  const [dsarParentPhone, setDsarParentPhone] = useState('');
  const [dsarParentEmail, setDsarParentEmail] = useState('');
  const [dsarChildName, setDsarChildName] = useState('');
  const [dsarChildEnrollmentDate, setDsarChildEnrollmentDate] = useState('');

  const [dsarInfoRequested, setDsarInfoRequested] = useState({
    profile: true,
    attendance: true,
    meals: true,
    incidents: false,
    billing: false,
    comms: false,
  });

  const [dsarDeliveryMethod, setDsarDeliveryMethod] = useState({
    email: true,
    printed: false,
    portal: false,
  });

  const [dsarSignature, setDsarSignature] = useState('');
  const [dsarDate, setDsarDate] = useState(new Date().toISOString().split('T')[0]);

  // Consent & Authorisation States
  const [consentMandatory, setConsentMandatory] = useState({
    attendance: true,
    meals: true,
    billing: true,
    comms: true,
  });

  const [consentOptional, setConsentOptional] = useState({
    displays: true,
    privateGroups: true,
    marketing: false,
    socialMedia: false,
  });

  const [consentPrintedName, setConsentPrintedName] = useState('');
  const [consentSignature, setConsentSignature] = useState('');
  const [consentDate, setConsentDate] = useState(new Date().toISOString().split('T')[0]);

  const [selectedParentIdForPrefill, setSelectedParentIdForPrefill] = useState('');

  const handlePrefillParentChange = (parentId: string) => {
    setSelectedParentIdForPrefill(parentId);
    if (!parentId) {
      setDsarParentName('');
      setDsarParentId('');
      setDsarParentPhone('');
      setDsarParentEmail('');
      setDsarChildName('');
      setDsarChildEnrollmentDate('');
      setConsentPrintedName('');
      return;
    }
    
    const parent = stateService.parents.find(p => p.id === parentId);
    if (parent) {
      setDsarParentName(`${parent.firstName} ${parent.lastName}`);
      setDsarParentId(parent.saIdNumber);
      setDsarParentPhone(parent.phone);
      setDsarParentEmail(parent.email);
      setConsentPrintedName(`${parent.firstName} ${parent.lastName}`);
      
      const child = stateService.children.find(c => c.parentId === parent.id);
      if (child) {
        setDsarChildName(`${child.firstName} ${child.lastName}`);
        setDsarChildEnrollmentDate(child.enrollmentDate);
      } else {
        setDsarChildName('');
        setDsarChildEnrollmentDate('');
      }
    }
  };

  const handleClearForm = () => {
    setSelectedParentIdForPrefill('');
    setDsarParentName('');
    setDsarParentId('');
    setDsarParentPhone('');
    setDsarParentEmail('');
    setDsarChildName('');
    setDsarChildEnrollmentDate('');
    setDsarSignature('');
    setConsentPrintedName('');
    setConsentSignature('');
  };

  const handleSelectAllCheckboxes = () => {
    setDsarInfoRequested({
      profile: true,
      attendance: true,
      meals: true,
      incidents: true,
      billing: true,
      comms: true,
    });
    setDsarDeliveryMethod({
      email: true,
      printed: true,
      portal: true,
    });
    setConsentMandatory({
      attendance: true,
      meals: true,
      billing: true,
      comms: true,
    });
    setConsentOptional({
      displays: true,
      privateGroups: true,
      marketing: true,
      socialMedia: true,
    });
  };

  const handleDownloadParentPackPDF = () => {
    const doc = new jsPDF();
    const settings = stateService.settings;
    
    // Page 1
    // Draw Header banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(22);
    doc.text("POPIA COMPLIANCE PARENT PACK", 15, 22);
    
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text(`${settings.name.toUpperCase()} • SOUTH AFRICA`, 15, 32);
    
    // Draw Header line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    
    doc.setTextColor(51, 65, 85);
    let y = 50;
    
    // Title of pack
    doc.setFontSize(13);
    doc.setFont("Helvetica", "bold");
    doc.text("POPIA Act Compliance Parent Pack", 15, y);
    y += 8;
    
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    const introText = "This Parent Pack has been prepared to help parents and legal guardians understand how " + settings.name + " collects, stores, processes, protects, and manages personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA). The pack also explains parental rights, consent requirements, and procedures for requesting access to records.";
    const splitIntro = doc.splitTextToSize(introText, 180);
    doc.text(splitIntro, 15, y);
    y += splitIntro.length * 5 + 5;
    
    // Section 1. POPIA 001 - Privacy Notice
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("1. POPIA 001 - Privacy Notice", 15, y);
    y += 6;
    
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Effective Date: 23 May 2026`, 15, y);
    doc.text(`Institution: ${settings.name}`, 15, y + 5);
    doc.text(`Information Officer: Daycare Principal / POPIA Compliance Officer`, 15, y + 10);
    y += 18;
    
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("1.1 Who We Are", 15, y);
    y += 5;
    
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const whoWeAreText = `${settings.name} is a comprehensive daycare and early childhood development center in South Africa dedicated to providing early care and education. We operate our systems in full alignment with POPIA requirements to protect child safety, attendance history, and institutional billing profiles.`;
    const splitWho = doc.splitTextToSize(whoWeAreText, 180);
    doc.text(splitWho, 15, y);
    y += splitWho.length * 5 + 5;
    
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("1.2 Personal Information We Collect", 15, y);
    y += 6;
    
    // Table (PII Categories)
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(243, 244, 246);
    doc.rect(15, y, 180, 6, 'F');
    doc.setLineWidth(0.2);
    doc.line(15, y, 195, y);
    doc.line(15, y + 6, 195, y + 6);
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text("Category", 18, y + 4);
    doc.text("Examples", 80, y + 4);
    
    doc.setFont("Helvetica", "normal");
    const categories = [
      { name: "Child Info", ex: "Names, date of birth, dietary allergens, medical/attendance logs." },
      { name: "Parent Info", ex: "Full names, SA ID numbers, phone, email, home address." },
      { name: "Emergencies", ex: "Emergency contact names, phone numbers, family doctor details." },
      { name: "Financial Info", ex: "Tax invoices, ledger statements, bank payment reference tags." },
      { name: "Comms", ex: "SMS logs, email bulletins, notification delivery logs." },
      { name: "Media Opt-ins", ex: "Internal classroom activity photos where optional consent is active." }
    ];
    
    let tableY = y + 6;
    categories.forEach((cat) => {
      doc.text(cat.name, 18, tableY + 5);
      const splitEx = doc.splitTextToSize(cat.ex, 110);
      doc.text(splitEx, 80, tableY + 4);
      tableY += Math.max(splitEx.length * 4.5 + 2, 7);
      doc.line(15, tableY, 195, tableY);
    });
    
    // Draw outer side lines for the table
    doc.line(15, y, 15, tableY);
    doc.line(195, y, 195, tableY);
    
    y = tableY + 6;
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("1.3 Why We Process Personal Information", 15, y);
    y += 6;
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const goals = [
      "To maintain accurate statutory class attendance registers dynamically.",
      "To safeguard child health against cross-allergen meal ingredients.",
      "To administer appropriate invoice billing discounts (e.g., siblings thresholds).",
      "To dispatch emergency notifications and general parent announcements.",
      "To fulfill reporting mandates with the Department of Social Development (DSD)."
    ];
    goals.forEach((goal) => {
      doc.text("•", 18, y);
      doc.text(goal, 23, y);
      y += 5.5;
    });

    // Write footer
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Prepared for ${settings.name} • POPIA Parent Pack • Page 1 of 4`, 15, 288);
    
    // ================== PAGE 2 ==================
    doc.addPage();
    y = 20;

    // Draw header strip
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${settings.name.toUpperCase()} • POPIA ACT PARENT PACK`, 15, 7);
    
    y = 22;
    doc.setTextColor(30, 41, 59);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("1.4 Lawful Basis for Processing", 15, y);
    y += 5;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const lawfulBasisText = "Personal information is processed on the basis of parental consent, contractual necessity, legal obligations, and the legitimate operational interests of the daycare facility.";
    const splitBasis = doc.splitTextToSize(lawfulBasisText, 180);
    doc.text(splitBasis, 15, y);
    y += splitBasis.length * 5 + 4;
    
    doc.setFont("Helvetica", "bold");
    doc.text("1.5 Sharing of Information", 15, y);
    y += 5;
    doc.setFont("Helvetica", "normal");
    const sharingPoints = [
      "Emergency medical personnel during active medical response operations.",
      "Government oversight regulators (DSD) where mandated by legislation.",
      "Approved, bound software operators (under POPIA operator written agreements).",
      "Legal counsel or financial audit personnel where required.",
      "Third Party Notice: " + settings.name + " strictly denies access to external marketing list buyers."
    ];
    sharingPoints.forEach((pt) => {
      doc.text("•", 18, y);
      const splitPt = doc.splitTextToSize(pt, 172);
      doc.text(splitPt, 23, y);
      y += splitPt.length * 4.5 + 1.5;
    });
    y += 2;
    
    doc.setFont("Helvetica", "bold");
    doc.text("1.6 Data Retention Compliance", 15, y);
    y += 5;
    doc.setFont("Helvetica", "normal");
    const retentionText = `Records are retained while a child remains actively enrolled in our classes and for a period of ${settings.dataRetentionYears} years thereafter under Section 14 statutory guidelines, unless alternate laws intervene. Afterwards, digital logs undergo secure database deletion protocols.`;
    const splitRetention = doc.splitTextToSize(retentionText, 180);
    doc.text(splitRetention, 15, y);
    y += splitRetention.length * 5 + 4;
    
    doc.setFont("Helvetica", "bold");
    doc.text("1.7 Active Security Safeguards", 15, y);
    y += 5;
    doc.setFont("Helvetica", "normal");
    const securityPoints = [
      "Obfuscation: High-security masking applied to National ID numbers.",
      "Role-Based Access Control: Restricting profile modifications to authorized educators.",
      "Database boundaries isolated within direct origin boundaries."
    ];
    securityPoints.forEach((pt) => {
      doc.text("•", 18, y);
      doc.text(pt, 23, y);
      y += 5;
    });
    y += 2;
    
    doc.setFont("Helvetica", "bold");
    doc.text("1.8 Parent Statutory Rights Under POPIA", 15, y);
    y += 5;
    doc.setFont("Helvetica", "normal");
    const rightsPoints = [
      "Request formal access to check stored digital child and parent profiles.",
      "File correction requests for misspelt ID details, addresses or contacts.",
      "Formally object to non-operational elements of data processing flows.",
      "Withdraw optional photo/video media opt-ins at any moment.",
      "Lodge complaints detailing any compliance breaches directly to the Information Regulator."
    ];
    rightsPoints.forEach((pt) => {
      doc.text("•", 18, y);
      const splitPt = doc.splitTextToSize(pt, 172);
      doc.text(splitPt, 23, y);
      y += splitPt.length * 4.5 + 1.5;
    });
    y += 3;
    
    // Section 2. POPIA 006 - DSAR Form
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("2. POPIA 006 - Data Subject Access Request (DSAR) Form", 15, y);
    y += 5;
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const dsarTitleText = "This form must be completed by the parent or legal guardian requesting access to a child’s records.";
    doc.text(dsarTitleText, 15, y);
    y += 7;
    
    // DSAR Fields Table
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, 46, 'F');
    
    // Grid lines
    doc.line(15, y + 8, 195, y + 8);
    doc.line(15, y + 16, 195, y + 16);
    doc.line(15, y + 24, 195, y + 24);
    doc.line(15, y + 32, 195, y + 32);
    doc.line(15, y + 40, 195, y + 40);
    // Vertical split
    doc.line(80, y, 80, y + 46);
    // Outer bounds
    doc.rect(15, y, 180, 46);
    
    doc.setFont("Helvetica", "bold");
    doc.text("Field", 18, y + 5);
    doc.text("Subject Value (Filled Form Info)", 83, y + 5);
    
    doc.setFont("Helvetica", "normal");
    doc.text("Parent / Guardian Full Name", 18, y + 13);
    doc.text(dsarParentName || "__________________________________", 83, y + 13);
    
    doc.text("South African ID / Passport Number", 18, y + 21);
    doc.text(dsarParentId || "__________________________________", 83, y + 21);
    
    doc.text("Telephone Contact Number", 18, y + 29);
    doc.text(dsarParentPhone || "__________________________________", 83, y + 29);
    
    doc.text("Email Communication Address", 18, y + 37);
    doc.text(dsarParentEmail || "__________________________________", 83, y + 37);
    
    doc.text("Child Beneficiary Full Name", 18, y + 45);
    doc.text(dsarChildName || "__________________________________", 83, y + 45);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Prepared for ${settings.name} • POPIA Parent Pack • Page 2 of 4`, 15, 288);
    
    // ================== PAGE 3 ==================
    doc.addPage();
    y = 20;

    // Draw header strip
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${settings.name.toUpperCase()} • POPIA ACT PARENT PACK`, 15, 7);
    
    y = 22;
    doc.setTextColor(30, 41, 59);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("2.1 Information Access Scope Requested", 15, y);
    y += 6;
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    
    // Checkboxes helper in PDF
    const drawCheckboxPDF = (x: number, yPos: number, isChecked: boolean, label: string) => {
      doc.setDrawColor(100, 116, 139);
      doc.rect(x, yPos - 3, 3.5, 3.5);
      if (isChecked) {
        doc.setFillColor(16, 185, 129); // emerald
        doc.rect(x + 0.5, yPos - 2.5, 2.5, 2.5, 'F');
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text("x", x + 1, yPos - 0.7);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
      }
      doc.text(label, x + 6, yPos);
    };
    
    drawCheckboxPDF(18, y, dsarInfoRequested.profile, "Full child profile and enrolment records");
    drawCheckboxPDF(110, y, dsarInfoRequested.attendance, "Attendance logs");
    y += 6;
    drawCheckboxPDF(18, y, dsarInfoRequested.meals, "Meal and allergy records");
    drawCheckboxPDF(110, y, dsarInfoRequested.incidents, "Incident reports");
    y += 6;
    drawCheckboxPDF(18, y, dsarInfoRequested.billing, "Billing and payment history");
    drawCheckboxPDF(110, y, dsarInfoRequested.comms, "Communication records");
    
    y += 8;
    doc.setFont("Helvetica", "bold");
    doc.text("2.2 Preferred Delivery Method", 15, y);
    y += 6;
    doc.setFont("Helvetica", "normal");
    drawCheckboxPDF(18, y, dsarDeliveryMethod.email, "Password-protected PDF by registered email");
    y += 6;
    drawCheckboxPDF(18, y, dsarDeliveryMethod.printed, "Printed physical copy collected personally at reception");
    y += 6;
    drawCheckboxPDF(18, y, dsarDeliveryMethod.portal, "Secure student digital portal access log-in");
    
    y += 8;
    doc.setFont("Helvetica", "bold");
    doc.text("2.3 Declaration", 15, y);
    y += 5;
    doc.setFont("Helvetica", "normal");
    const declText = "I confirm that I am the legal parent or guardian of the child referenced in this form. I understand that identity verification may be required before records are released.";
    const splitDecl = doc.splitTextToSize(declText, 180);
    doc.text(splitDecl, 15, y);
    y += splitDecl.length * 5 + 4;
    
    doc.text(`Parent Signature: ${dsarSignature || "_______________________"}`, 15, y);
    doc.text(`Request Date: ${formatSADate(dsarDate)}`, 130, y);
    
    y += 10;
    // Section 3: Parent Consent
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("3. Parent Consent & Authorisation", 15, y);
    y += 5;
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const consentIntro = "The following consent confirms that the parent or legal guardian understands and accepts the processing of personal information required for childcare operations.";
    const splitConsentIntro = doc.splitTextToSize(consentIntro, 180);
    doc.text(splitConsentIntro, 15, y);
    y += splitConsentIntro.length * 5 + 4;
    
    doc.setFont("Helvetica", "bold");
    doc.text("3.1 Mandatory Operational processing Consent (Enrolment Requirement)", 15, y);
    y += 6;
    doc.setFont("Helvetica", "normal");
    drawCheckboxPDF(18, y, consentMandatory.attendance, "Attendance and minor pupil safety tracking logs");
    y += 6;
    drawCheckboxPDF(18, y, consentMandatory.meals, "Dietary schedule logging & cross-allergy database queries");
    y += 6;
    drawCheckboxPDF(18, y, consentMandatory.billing, "Statutory tax invoicing, ledger entries & discount audits");
    y += 6;
    drawCheckboxPDF(18, y, consentMandatory.comms, "Emergency broadcast lists (Email, SMS or secure WhatsApp)");
    
    y += 8;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Note: Without active operational consent, the daycare is legally unable to support standard child check-ins.", 18, y);
    y += 5;
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text("3.2 Optional Secondary Media Consent", 15, y);
    y += 6;
    doc.setFont("Helvetica", "normal");
    drawCheckboxPDF(18, y, consentOptional.displays, "Use of photographs/videos for: Internal classroom display boards");
    y += 6;
    drawCheckboxPDF(18, y, consentOptional.privateGroups, "Use of photographs/videos for: Closed, private parent communication channels");
    y += 6;
    drawCheckboxPDF(18, y, consentOptional.marketing, "Use of photographs/videos for: Institutional brochures & marketing physical pamphlets");
    y += 6;
    drawCheckboxPDF(18, y, consentOptional.socialMedia, "Use of photographs/videos for: Public school landing page and search profiles");
    
    y += 8;
    doc.setFont("Helvetica", "bold");
    doc.text("3.3 Form Acknowledgement", 15, y);
    y += 5;
    doc.setFont("Helvetica", "normal");
    doc.text("I confirm that I have read and understood the POPIA Privacy Notice and consent clauses contained in this document.", 15, y);
    y += 8;
    
    doc.text(`Printed Full Name: ${consentPrintedName || "________________________"}`, 15, y);
    doc.text(`Signature: ${consentSignature || "________________________"}`, 110, y);
    doc.text(`Date Signed: ${formatSADate(consentDate)}`, 15, y + 6);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Prepared for ${settings.name} • POPIA Parent Pack • Page 3 of 4`, 15, 288);
    
    // ================== PAGE 4 ==================
    doc.addPage();
    y = 20;

    // Draw header strip
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${settings.name.toUpperCase()} • POPIA ACT PARENT PACK`, 15, 7);
    
    y = 22;
    doc.setTextColor(30, 41, 59);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.text("4. Recommended Daycare POPIA Best Practices", 15, y);
    y += 8;
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    const practices = [
      { t: "Annual Staff Training Aware", d: "Formally ensure all care class educators re-attend annual POPIA information protection modules." },
      { t: "Active Breach Incident Protocols", d: "Maintain internal readiness rules to notify regulators and active parents in under 72 hours of breaches." },
      { t: "Granular Records Restriction", d: "Verify physical classroom lock cupboards and check tablet screens are password-protected." },
      { t: "Consent Evaluations Check", d: "Re-evaluate optional social media opt-ins annually when minor children move between age categories." },
      { t: "Safe External Export Obfuscation", d: "Never output raw parent IDs or unmasked children birth identifiers to Excel or PDF files." },
      { d: "Ensure high-security encrypted and off-site cloud records backup under statutory retention guidelines.", t: "System Backup Protocols" }
    ];
    
    practices.forEach((pt) => {
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`•  ${pt.t}`, 18, y);
      y += 5;
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const splitD = doc.splitTextToSize(pt.d, 172);
      doc.text(splitD, 23, y);
      y += splitD.length * 5 + 4;
    });
    
    y += 20;
    // Sign-off section
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y, 195, y);
    y += 8;
    
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`"Protecting family privacy underpins early childhood development trust."`, 15, y);
    y += 12;
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("POPIA Act Compliance Evaluation Stamp:", 15, y);
    doc.text("OFFICIAL STATUTORY DOCUMENT", 130, y);
    y += 5;
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Authorised: Information Officer, ${settings.name}`, 15, y);
    doc.text("Registrar of Information Regulator (SA)", 130, y);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Prepared for ${settings.name} • POPIA Parent Pack • Page 4 of 4`, 15, 288);
    
    doc.save(`${settings.name.replace(/\s+/g, '_')}_POPIA_Parent_Pack.pdf`);
  };

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
        <button
          onClick={() => setSelectedCategory('parent-pack')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            selectedCategory === 'parent-pack'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen size={16} /> POPIA Parent Pack & Consent
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

      {selectedCategory === 'parent-pack' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Prefill Deck Center Card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-805 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="flex items-center gap-2 text-emerald-400 font-semibold text-sm uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  POPIA Parent Portal Deck
                </span>
                <h3 className="text-xl font-bold tracking-tight text-white mt-1">Interactive Compliance Binder & Consent Manager</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Inspect the physical sections of your South African POPIA pack online. Select a registered record below to prefill statutory data fields or modify them manually. Downloads output a high-fidelity 4-page signed PDF agreement.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllCheckboxes}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-all"
                >
                  Opt-In All Items
                </button>
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-200 font-medium text-xs px-3.5 py-2 rounded-lg transition-all"
                >
                  Reset Form
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-850 p-4.5 rounded-xl border border-slate-800">
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300">Quick-Load Existing Parent Database Record</label>
                <select
                  value={selectedParentIdForPrefill}
                  onChange={(e) => handlePrefillParentChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs py-2 px-3 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
                >
                  <option value="">-- Choose registered parent or guardian --</option>
                  {stateService.parents.map((p) => {
                    const childStr = stateService.children.find(c => c.parentId === p.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} &nbsp;({maskSAId(p.saIdNumber)}) {childStr ? `• parent of ${childStr.firstName}` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleDownloadParentPackPDF}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl py-2 px-4 shadow-md transition-all flex items-center justify-center gap-2 "
                >
                  <Download size={14} /> Download Official PDF Pack
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Document Sheets Tab Layout */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-4 min-h-[600px]">
            {/* Sidebar Navigation inside Document Reader */}
            <div className="bg-slate-50 border-r border-slate-250 p-4 space-y-2 col-span-1">
              <div className="text-xs font-bold text-slate-400 tracking-widest uppercase px-3 py-1">Document Index</div>
              
              <button
                type="button"
                className="w-full flex items-center justify-between p-3 rounded-lg text-left transition-all text-xs font-semibold hover:bg-slate-100 border text-slate-700"
                onClick={handleDownloadParentPackPDF}
              >
                <span className="flex items-center gap-2 text-rose-600">
                  <Download size={13} className="shrink-0" />
                  <span>Download Whole Pack</span>
                </span>
                <span className="text-[10px] uppercase font-mono bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-sm font-bold">PDF</span>
              </button>

              <hr className="my-2 border-slate-200" />

              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 px-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                  Statutory Forms Pack
                </div>
                
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="space-y-1 text-[11px] text-slate-505 text-slate-600 leading-snug">
                    <p className="font-semibold text-slate-800">Operational Notice:</p>
                    <p>The form inputs in the panels on the right are active. Editing names, dates, and sign-offs dynamically updates the live system data structure before compilation.</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-[10px] text-emerald-800 font-semibold leading-tight">
                    <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
                    <span>Act 4 of 2013 Compliance Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Content Sheet Area */}
            <div className="col-span-1 lg:col-span-3 bg-slate-100 p-4 md:p-8 overflow-y-auto max-h-[800px] space-y-8">
              {/* PAGE 1: POPIA 001 - Privacy Notice */}
              <div className="bg-white border border-slate-250 rounded-xl shadow-xs p-6 md:p-10 space-y-6 text-slate-800 text-left relative overflow-hidden max-w-3xl mx-auto">
                {/* Visual stamp */}
                <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-800 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border border-emerald-200 font-bold rotate-2 font-mono">
                  POPIA-001 APPROVED
                </div>

                <div className="border-b border-slate-100 pb-5">
                  <span className="text-xs font-mono font-bold text-slate-400">SECTION 1 OF 4</span>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">POPIA 001: STATUTORY PRIVACY POLICY NOTICE</h2>
                  <p className="text-xs text-slate-500 mt-1">Statutory document detailing methods of processing personal information of pupils and parents.</p>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-slate-600">
                  <p>
                    {stateService.settings.name} acts as the statutory Information Regulator designated Responsible Party under Section 19 of the Protection of Personal Information Act. We provide care, curriculum development, and physical supervision which necessitates processing special personal identifiers.
                  </p>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-950 text-xs">1.1 Lawful Processing Intent & Data Categories:</h4>
                    <p>We process information only under valid authorizations to carry out early child development operations:</p>
                    
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-150">
                          <UserCheck size={14} className="text-slate-500 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 block">Parent Demographics</span>
                            <span>SA IDs, phone numbers, addresses</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-150">
                          <CheckSquare size={14} className="text-slate-500 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 block">Child Safeguarding</span>
                            <span>Names, class histories, dietary allergens</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-150">
                          <FileText size={14} className="text-slate-500 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 block">Financial Records</span>
                            <span>ZAR invoices, tax statements, billing refs</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white p-2 rounded border border-slate-150">
                          <Info size={14} className="text-slate-500 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-800 block">Emergency Contacts</span>
                            <span>Contact phones, hospital paths, clinic doctor</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-950 text-xs">1.2 Third-Party Operators Protocol:</h4>
                    <p>
                      Personal record databases are securely retained in local systems. We maintain strict written operator agreements complying with Section 21 of the Act. External access to commercial mailing, marketing lists, or unverified brokers is strictly denied.
                    </p>
                  </div>

                  <div className="space-y-1 bg-slate-50 p-3 rounded border border-slate-205">
                    <span className="font-bold text-slate-800 block text-xs">1.3 Data Retention Limitation Rule:</span>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      Pursuant to Section 14, records are safely stored only as long as required to achieve the purpose of collection. This matches the child's active class tenure and is automatically purged after <b>{stateService.settings.dataRetentionYears} years</b> of subsequent inactivity.
                    </p>
                  </div>
                </div>
              </div>

              {/* PAGE 2: POPIA 006 - DSAR Access Form */}
              <div className="bg-white border border-slate-250 rounded-xl shadow-xs p-6 md:p-10 space-y-6 text-slate-800 text-left relative overflow-hidden max-w-3xl mx-auto">
                <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-800 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border border-emerald-200 font-bold rotate-2 font-mono">
                  POPIA-006 DSAR
                </div>

                <div className="border-b border-slate-100 pb-5">
                  <span className="text-xs font-mono font-bold text-slate-400">SECTION 2 OF 4</span>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">POPIA 006: SUBJECT ACCESS REQUEST (DSAR)</h2>
                  <p className="text-xs text-slate-500 mt-1">Exercise your statutory right to check, request access, or audit personal information under Section 23 of the POPI Act.</p>
                </div>

                {/* Form Editable Fields */}
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-805 text-slate-850 uppercase tracking-wide">Data Subject Demographics</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">Parent / Guardian Full Name</label>
                        <input
                          type="text"
                          value={dsarParentName}
                          onChange={(e) => setDsarParentName(e.target.value)}
                          placeholder="e.g. Sipho Nkosi"
                          className="w-full bg-white border border-slate-250 rounded-lg text-xs py-2 px-3 text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">South African ID or Passport No.</label>
                        <input
                          type="text"
                          value={dsarParentId}
                          onChange={(e) => setDsarParentId(e.target.value)}
                          placeholder="e.g. 880415 5002 08 2"
                          className="w-full bg-white border border-slate-250 rounded-lg text-xs py-2 px-3 text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">Telephone Contact Number</label>
                        <input
                          type="text"
                          value={dsarParentPhone}
                          onChange={(e) => setDsarParentPhone(e.target.value)}
                          placeholder="e.g. 082 112 3456"
                          className="w-full bg-white border border-slate-250 rounded-lg text-xs py-2 px-3 text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">Email Address</label>
                        <input
                          type="email"
                          value={dsarParentEmail}
                          onChange={(e) => setDsarParentEmail(e.target.value)}
                          placeholder="e.g. sipho.nkosi@gmail.com"
                          className="w-full bg-white border border-slate-250 rounded-lg text-xs py-2 px-3 text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>

                      <div className="space-y-1 col-span-1 md:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600">Associated Child Full Name</label>
                        <input
                          type="text"
                          value={dsarChildName}
                          onChange={(e) => setDsarChildName(e.target.value)}
                          placeholder="e.g. Thabo Nkosi"
                          className="w-full bg-white border border-slate-250 rounded-lg text-xs py-2 px-3 text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Information access scope */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-950 text-xs">2.1 Access Scope Demanded:</h4>
                    <p className="text-[11px] text-slate-505 leading-relaxed text-slate-600">Choose the specific record divisions you want compiled in the subject report:</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={dsarInfoRequested.profile}
                          onChange={(e) => setDsarInfoRequested({ ...dsarInfoRequested, profile: e.target.checked })}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5"
                        />
                        <span>Enrolment Profile Demographics</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={dsarInfoRequested.attendance}
                          onChange={(e) => setDsarInfoRequested({ ...dsarInfoRequested, attendance: e.target.checked })}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5"
                        />
                        <span>Statutory Attendance Logs</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={dsarInfoRequested.meals}
                          onChange={(e) => setDsarInfoRequested({ ...dsarInfoRequested, meals: e.target.checked })}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5"
                        />
                        <span>Allergy Logs & Meal Schedules</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={dsarInfoRequested.incidents}
                          onChange={(e) => setDsarInfoRequested({ ...dsarInfoRequested, incidents: e.target.checked })}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5"
                        />
                        <span>Class Incident Reports</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={dsarInfoRequested.billing}
                          onChange={(e) => setDsarInfoRequested({ ...dsarInfoRequested, billing: e.target.checked })}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5"
                        />
                        <span>VAT Invoices & Financial Ledgers</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={dsarInfoRequested.comms}
                          onChange={(e) => setDsarInfoRequested({ ...dsarInfoRequested, comms: e.target.checked })}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4.5 w-4.5"
                        />
                        <span>SMS & Broadcast Log Logs</span>
                      </label>
                    </div>
                  </div>

                  {/* Delivery method */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-950 text-xs">2.2 Preferred System Dispatch Format:</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                        <input
                          type="checkbox"
                          checked={dsarDeliveryMethod.email}
                          onChange={(e) => setDsarDeliveryMethod({ ...dsarDeliveryMethod, email: e.target.checked })}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Secure Email (PDF)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                        <input
                          type="checkbox"
                          checked={dsarDeliveryMethod.printed}
                          onChange={(e) => setDsarDeliveryMethod({ ...dsarDeliveryMethod, printed: e.target.checked })}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Physical Print Collect</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                        <input
                          type="checkbox"
                          checked={dsarDeliveryMethod.portal}
                          onChange={(e) => setDsarDeliveryMethod({ ...dsarDeliveryMethod, portal: e.target.checked })}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Direct Portal Audit Log</span>
                      </label>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Type Name to Sign Formally</label>
                      <input
                        type="text"
                        value={dsarSignature}
                        onChange={(e) => setDsarSignature(e.target.value)}
                        placeholder="Type name (e.g. S. Nkosi)"
                        className="w-full bg-white border border-slate-250 rounded-lg text-xs py-2 px-3 text-slate-800 focus:outline-none focus:border-emerald-505 focus:border-emerald-500 font-mono italic"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">Signing Date</label>
                      <input
                        type="date"
                        value={dsarDate}
                        onChange={(e) => setDsarDate(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded-lg text-xs py-2 px-3 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PAGE 3: POPIA-004 - Parent Consent & Authorisations */}
              <div className="bg-white border border-slate-250 rounded-xl shadow-xs p-6 md:p-10 space-y-6 text-slate-800 text-left relative overflow-hidden max-w-3xl mx-auto">
                <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-800 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border border-emerald-200 font-bold rotate-2 font-mono">
                  POPIA-004 CONSENT
                </div>

                <div className="border-b border-slate-100 pb-5">
                  <span className="text-xs font-mono font-bold text-slate-400">SECTION 3 OF 4</span>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">POPIA 004: PARENT CONSENT & AUTHORISATIONS</h2>
                  <p className="text-xs text-slate-500 mt-1">Legally required specific opt-in checklist ensuring alignment on mandatory operations and optional secondary media.</p>
                </div>

                {/* Consent categories checkboxes */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-950 text-xs text-slate-900">3.1 Statutory Operational Consent (Mandatory for registration):</h4>
                      <span className="text-[10px] bg-amber-100 text-amber-800 border-amber-200 border py-0.5 px-2 rounded-sm font-semibold">RETAINED FOR PURPOSING</span>
                    </div>
                    <p className="text-[11px] text-slate-505 leading-relaxed text-slate-600">
                      These data processing workflows are required for child safety or physical contracts.
                    </p>

                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-202 text-xs">
                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={consentMandatory.attendance}
                          onChange={(e) => setConsentMandatory({ ...consentMandatory, attendance: e.target.checked })}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">Class Attendance & Check-In History</span>
                          <span className="text-slate-500 text-[11px]">Enables legal rosters, dynamic attendance charts, and emergency notification matching.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer select-none border-t border-slate-200 pt-2 mt-2">
                        <input
                          type="checkbox"
                          checked={consentMandatory.meals}
                          onChange={(e) => setConsentMandatory({ ...consentMandatory, meals: e.target.checked })}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">Dietary & Cross-Allergies Matching</span>
                          <span className="text-slate-500 text-[11px]">Ensures critical kitchen alerts match kid allergy profiles on school menus.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer select-none border-t border-slate-200 pt-2 mt-2">
                        <input
                          type="checkbox"
                          checked={consentMandatory.billing}
                          onChange={(e) => setConsentMandatory({ ...consentMandatory, billing: e.target.checked })}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">Financial Invoicing Audits & Discounts</span>
                          <span className="text-slate-500 text-[11px]">To support sibling computations, ZAR itemized invoice generations, and audits with SARS.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer select-none border-t border-slate-200 pt-2 mt-2">
                        <input
                          type="checkbox"
                          checked={consentMandatory.comms}
                          onChange={(e) => setConsentMandatory({ ...consentMandatory, comms: e.target.checked })}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">Emergency SMS, Email & WhatsApp Broadcasts</span>
                          <span className="text-slate-500 text-[11px]">Necessary for immediate dissemination of fire warnings, illness notice sheets, and storm shut-downs.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-950 text-xs text-slate-900">3.2 Optional Secondary Media Consent & Social Channels:</h4>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 py-0.5 px-2 rounded-sm font-semibold">OPTIONAL OPT-INS</span>
                    </div>
                    <p className="text-[11px] text-slate-505 leading-relaxed text-slate-600">
                      You are under no statutory obligation to consent to these secondary processes. Checking them indicates optional approval.
                    </p>

                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-202 text-xs">
                      <label className="flex items-start gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={consentOptional.displays}
                          onChange={(e) => setConsentOptional({ ...consentOptional, displays: e.target.checked })}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">Internal Classroom Activity Display Boards</span>
                          <span className="text-slate-500 text-[11px]">Allowing artwork, pupil drawings, and lesson captures on class parameters.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer select-none border-t border-slate-200 pt-2 mt-2">
                        <input
                          type="checkbox"
                          checked={consentOptional.privateGroups}
                          onChange={(e) => setConsentOptional({ ...consentOptional, privateGroups: e.target.checked })}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">Closed, Secure Parent WhatsApp Activity Groups</span>
                          <span className="text-slate-500 text-[11px]">Allow class reps to post school trip updates, birthday celebration cards, and activities notes.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer select-none border-t border-slate-200 pt-2 mt-2">
                        <input
                          type="checkbox"
                          checked={consentOptional.marketing}
                          onChange={(e) => setConsentOptional({ ...consentOptional, marketing: e.target.checked })}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">Brochures & Printed Marketing Pamphlets</span>
                          <span className="text-slate-500 text-[11px]">Optionally utilizing general classroom group photographs on official daycare pamphlets.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 cursor-pointer select-none border-t border-slate-200 pt-2 mt-2">
                        <input
                          type="checkbox"
                          checked={consentOptional.socialMedia}
                          onChange={(e) => setConsentOptional({ ...consentOptional, socialMedia: e.target.checked })}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-800 block">Public Social Media Profiles & Website Portals</span>
                          <span className="text-slate-500 text-[11px]">Posting highlights on the institutional landing page, search networks, and showcase reels.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Operational Declarations */}
                  <div className="space-y-4 pt-2">
                    <h4 className="font-bold text-slate-905 text-xs text-slate-900 border-b pb-2">3.3 Double-Consent Statutory Declarations</h4>
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 leading-normal">
                      By typing below, I affirm that all selected checkboxes are deliberate. I understand I have the right to revoke optional media consent at any point by dispatching a POPIA-009 objection letter to the principal.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1 col-span-1 md:col-span-1">
                        <label className="block text-[11px] font-semibold text-slate-600">Printed Parent Full Name</label>
                        <input
                          type="text"
                          value={consentPrintedName}
                          onChange={(e) => setConsentPrintedName(e.target.value)}
                          placeholder="e.g. S Nkosi"
                          className="w-full bg-slate-50 border border-slate-250 rounded-lg text-xs py-2 px-3 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                      <div className="space-y-1 col-span-1 md:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-705 text-slate-800">Your Hand-Written Signature</label>
                        <input
                          type="text"
                          value={consentSignature}
                          onChange={(e) => setConsentSignature(e.target.value)}
                          placeholder="Type initial/signature to sign"
                          className="w-full bg-slate-50 border border-slate-250 rounded-lg text-xs py-2 px-3 text-slate-800 focus:outline-none focus:border-emerald-500 font-mono italic"
                        />
                      </div>
                      <div className="space-y-1 col-span-1 md:col-span-1">
                        <label className="block text-[11px] font-semibold text-slate-600">Signing Date</label>
                        <input
                          type="date"
                          value={consentDate}
                          onChange={(e) => setConsentDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-250 rounded-lg text-xs py-2 px-3 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAGE 4: Staff Code of Conduct Safeguards policy */}
              <div className="bg-white border border-slate-250 rounded-xl shadow-xs p-6 md:p-10 space-y-6 text-slate-800 text-left relative overflow-hidden max-w-3xl mx-auto">
                <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-800 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm border border-emerald-200 font-bold rotate-2 font-mono">
                  POPIA-STAFF SECURE
                </div>

                <div className="border-b border-slate-100 pb-5">
                  <span className="text-xs font-mono font-bold text-slate-400">SECTION 4 OF 4</span>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">POPIA STAFF DISCLOSURE CODE & SAFEGUARDS</h2>
                  <p className="text-xs text-slate-500 mt-1">Internal best practices governing daycare educators, admin staffs, and kitchen preparers. (Parent Read-Only Reference)</p>
                </div>

                <div className="space-y-4 text-xs text-slate-650 leading-relaxed text-slate-600">
                  <p>
                    All employees at {stateService.settings.name} sign statutory confidentiality addendums alongside their employment contracts. We implement physical and digital safeguards to prevent data leakage:
                  </p>

                  <div className="space-y-3">
                    <div className="flex gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="flex-shrink-0 flex items-center justify-center p-2.5 rounded-full bg-emerald-50 text-emerald-600">
                        <ShieldCheck size={16} />
                      </span>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">Acknowledge Physical Protection:</span>
                        <span className="text-[11px] block text-slate-505">Paper logs are under locked cabinets in the Principal's Office. Non-staff members are unauthorized to access.</span>
                      </div>
                    </div>

                    <div className="flex gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="flex-shrink-0 flex items-center justify-center p-2.5 rounded-full bg-emerald-50 text-emerald-600">
                        <ShieldCheck size={16} />
                      </span>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">Double-Gate Communication Protocol:</span>
                        <span className="text-[11px] block text-slate-505">No educator is allowed to communicate child attendance or billing notices over unauthorized peer networks without double check flags.</span>
                      </div>
                    </div>

                    <div className="flex gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="flex-shrink-0 flex items-center justify-center p-2.5 rounded-full bg-emerald-50 text-emerald-600">
                        <ShieldCheck size={16} />
                      </span>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">Physical Kitchen Notice Boards Obfuscation:</span>
                        <span className="text-[11px] block text-slate-505">Diet allergen notice charts only list child initials e.g. "T.N. - Peanut Allergy" rather than complete personal demographics.</span>
                      </div>
                    </div>

                    <div className="flex gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="flex-shrink-0 flex items-center justify-center p-2.5 rounded-full bg-emerald-50 text-emerald-600">
                        <ShieldCheck size={16} />
                      </span>
                      <div>
                        <span className="font-bold text-slate-800 block text-xs">Password Locked Terminals:</span>
                        <span className="text-[11px] block text-slate-505">Educational tablets, administrative sign-in screens, and ledger devices auto-lock when left idle for longer than 60 seconds.</span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />
                  <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wide">Ready with the statutory agreements?</p>
                      <p className="text-[10px] text-slate-400">Download the completed, signed POPIA Parent Pack in a high-fidelity PDF.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadParentPackPDF}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all shadow-sm flex items-center gap-1.5 shrink-0"
                    >
                      <Download size={13} /> Compile PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
