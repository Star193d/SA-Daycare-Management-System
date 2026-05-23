export type GroupType = 'Infant' | 'Toddler' | 'Pre-School' | 'Grade R';

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // ISO date string YYYY-MM-DD
  saIdNumber: string; // 13 digit SA ID
  allergies: string[];
  medicalNotes: string;
  parentId: string;
  groupId: GroupType;
  enrollmentDate: string; // ISO date string YYYY-MM-DD
}

export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  saIdNumber: string;
  email: string;
  phone: string;
  address: string;
  childrenIds: string[]; // Missing children tracking linked to auto-billing discounts
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  saIdNumber: string;
  role: string;
  qualifications: string[];
  certificationsExpiry: Record<string, string>; // name -> YYYY-MM-DD
}

export interface InvoiceItem {
  description: string;
  amount: number; // Stored in cents (e.g., R 2500.00 is stored as 250000)
}

export interface InvoiceHistory {
  id: string;
  invoiceId: string;
  action: 'Created' | 'Edited' | 'Sent' | 'Paid' | 'Voided';
  timestamp: string;
  actor: string;
  notes: string;
  previousValues?: string;
}

export interface DaycareSettings {
  name: string;
  vatNumber: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  dataRetentionYears: number;
}

export interface Invoice {
  id: string; // INV-YYYY-MM-NNNN
  parentId: string;
  childId: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number; // Stored in cents
  vatAmount: number; // Stored in cents
  total: number; // Stored in cents
  status: 'Draft' | 'Sent' | 'Paid' | 'Voided' | 'Overdue';
  version: number;
  history: InvoiceHistory[];
  templateId: string;
}

export interface AttendanceRecord {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late' | 'Sick';
  checkInTime?: string;
  checkOutTime?: string;
}

export interface MealPlan {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: 'Breakfast' | 'Lunch' | 'Snack';
  description: string;
  allergens: string[];
}

export interface CommunicationMessage {
  id: string;
  parentId: string;
  title: string;
  body: string;
  dateSent: string;
  type: 'Email' | 'PushNotification' | 'SMS';
}
