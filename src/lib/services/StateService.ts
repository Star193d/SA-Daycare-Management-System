import { Child, Parent, Invoice, Staff, AttendanceRecord, MealPlan, CommunicationMessage, DaycareSettings } from '../types';
import { BillingService } from './BillingService';
import { determineGroup } from '../utils';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityId: string;
  entityType: string;
  notes: string;
  diff?: string;
}

export class StateService {
  private static instance: StateService;
  
  public parents: Parent[] = [];
  public children: Child[] = [];
  public invoices: Invoice[] = [];
  public staff: Staff[] = [];
  public attendance: AttendanceRecord[] = [];
  public meals: MealPlan[] = [];
  public communications: CommunicationMessage[] = [];
  public auditLogs: AuditLogEntry[] = [];
  
  public settings: DaycareSettings = {
    name: "Amanzi Care Daycare",
    vatNumber: "4123456789",
    address: "12 Nelson Mandela Drive, Pretoria, 0002",
    phone: "012 345 6789",
    email: "admin@amanzicare.co.za",
    bankName: "First National Bank",
    accountNumber: "62345678901",
    branchCode: "250655",
    dataRetentionYears: 5
  };

  private billingService: BillingService;
  private currentInvoiceSequence = 1;

  private constructor() {
    this.billingService = new BillingService();
    this.loadFromStorage();
    if (this.parents.length === 0) {
      this.seedData();
    }
  }

  public static getInstance(): StateService {
    if (!this.instance) {
      this.instance = new StateService();
    }
    return this.instance;
  }

  private saveToStorage() {
    localStorage.setItem('daycare_parents', JSON.stringify(this.parents));
    localStorage.setItem('daycare_children', JSON.stringify(this.children));
    localStorage.setItem('daycare_invoices', JSON.stringify(this.invoices));
    localStorage.setItem('daycare_staff', JSON.stringify(this.staff));
    localStorage.setItem('daycare_attendance', JSON.stringify(this.attendance));
    localStorage.setItem('daycare_meals', JSON.stringify(this.meals));
    localStorage.setItem('daycare_communications', JSON.stringify(this.communications));
    localStorage.setItem('daycare_auditLogs', JSON.stringify(this.auditLogs));
    localStorage.setItem('daycare_settings', JSON.stringify(this.settings));
    localStorage.setItem('daycare_invoiceSeq', String(this.currentInvoiceSequence));
  }

  private loadFromStorage() {
    try {
      this.parents = JSON.parse(localStorage.getItem('daycare_parents') || '[]');
      this.children = JSON.parse(localStorage.getItem('daycare_children') || '[]');
      this.invoices = JSON.parse(localStorage.getItem('daycare_invoices') || '[]');
      this.staff = JSON.parse(localStorage.getItem('daycare_staff') || '[]');
      this.attendance = JSON.parse(localStorage.getItem('daycare_attendance') || '[]');
      this.meals = JSON.parse(localStorage.getItem('daycare_meals') || '[]');
      this.communications = JSON.parse(localStorage.getItem('daycare_communications') || '[]');
      this.auditLogs = JSON.parse(localStorage.getItem('daycare_auditLogs') || '[]');
      
      const savedSettings = localStorage.getItem('daycare_settings');
      if (savedSettings) {
        this.settings = JSON.parse(savedSettings);
      }
      
      this.currentInvoiceSequence = parseInt(localStorage.getItem('daycare_invoiceSeq') || '1', 10);
    } catch (e) {
      console.error("Failed to load local storage", e);
    }
  }

  private seedData() {
    // Initial Seed Data matching South African contexts
    const parent1 = this.registerParent({
      firstName: "Thabo",
      lastName: "Mnguni",
      saIdNumber: "8503155800081",
      email: "thabo.m@example.co.za",
      phone: "0825551234",
      address: "12 Nelson Mandela Dr, Pretoria",
      popiaSigned: true
    });

    const parent2 = this.registerParent({
      firstName: "Leandra",
      lastName: "Botha",
      saIdNumber: "9107220188083",
      email: "leandra.botha@mweb.co.za",
      phone: "0713459876",
      address: "44 Lynne Rd, Garsfontein, Pretoria",
      popiaSigned: false
    });

    // Seed Children
    this.registerChild({
      firstName: "Sipho",
      lastName: "Mnguni",
      dateOfBirth: "2023-05-15", // Toddler group
      saIdNumber: "2305155822081",
      allergies: ["Peanuts"],
      medicalNotes: "Sensitive to dairy but not allergic."
    }, parent1.id);

    // Seed Staff
    this.registerStaff({
      firstName: "Nomsa",
      lastName: "Khumalo",
      saIdNumber: "7811050811082",
      role: "Lead Educator",
      qualifications: ["Bachelor of Education (ECD)", "First Aid Level 1"],
      certificationsExpiry: {
        "First Aid Certificate": "2027-02-15",
        "SACE Registration": "2029-06-30"
      }
    });

    this.registerStaff({
      firstName: "Elaine",
      lastName: "Smit",
      saIdNumber: "8804020144085",
      role: "Childcare Assistant",
      qualifications: ["N6 ECD Certificate", "Basic Child Safety Training"],
      certificationsExpiry: {
        "First Aid Certificate": "2026-08-10"
      }
    });

    // Seed Meals
    const mealDates = ['2026-05-18', '2026-05-19', '2026-05-20', '2026-05-21', '2026-05-22'];
    mealDates.forEach((date, i) => {
      this.meals.push({
        id: `M-${100 + i}`,
        date,
        mealType: 'Breakfast',
        description: 'Warm Mabele Porridge with milk',
        allergens: ['Dairy']
      });
      this.meals.push({
        id: `M-${200 + i}`,
        date,
        mealType: 'Lunch',
        description: i % 2 === 0 ? 'Savory Mince with Mashed Butternut' : 'Peanut Butter Sandwiches with apple slices',
        allergens: i % 2 === 0 ? [] : ['Peanuts']
      });
      this.meals.push({
        id: `M-${300 + i}`,
        date,
        mealType: 'Snack',
        description: 'Fresh seasonal fruit skewers',
        allergens: []
      });
    });

    // Seed Attendance Records for Sipho Mnguni for May 2026
    const childId = this.children[0]?.id;
    if (childId) {
      this.attendance.push({ id: "A1", childId, date: "2026-05-18", status: "Present", checkInTime: "07:30", checkOutTime: "13:00" });
      this.attendance.push({ id: "A2", childId, date: "2026-05-19", status: "Present", checkInTime: "07:45", checkOutTime: "13:15" });
      this.attendance.push({ id: "A3", childId, date: "2026-05-20", status: "Late", checkInTime: "08:15", checkOutTime: "13:00" });
      this.attendance.push({ id: "A4", childId, date: "2026-05-21", status: "Absent", checkInTime: "", checkOutTime: "" });
      this.attendance.push({ id: "A5", childId, date: "2026-05-22", status: "Sick", checkInTime: "", checkOutTime: "" });
    }

    // Seed Communications
    this.communications.push({
      id: "C1",
      parentId: parent1.id,
      title: "Welcome to Amanzi Care",
      body: "Good day, Thabo. Thank you for enrolling Sipho at our facility. Your tax invoice is enclosed.",
      dateSent: new Date().toISOString(),
      type: "Email"
    });

    this.logAction("System", "Seed Data", "System setup initiated with initial demo datasets.", "System", "Setup");
    this.saveToStorage();
  }

  public logAction(actor: string, action: string, notes: string, entityId: string, entityType: string, diff?: string) {
    const log: AuditLogEntry = {
      id: `L-${Math.floor(Math.random() * 1000000)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      entityId,
      entityType,
      notes,
      diff
    };
    this.auditLogs.unshift(log); // newest first
    this.saveToStorage();
  }

  public registerParent(parent: Omit<Parent, 'id' | 'childrenIds'>): Parent {
    const newParent: Parent = {
      ...parent,
      id: `P${Math.floor(Math.random() * 9000) + 1000}`,
      childrenIds: []
    };
    this.parents.push(newParent);
    this.logAction("Admin", "Register Parent", `Registered parent: ${parent.firstName} ${parent.lastName}`, newParent.id, "Parent");
    this.saveToStorage();
    return newParent;
  }

  public updateParent(updated: Parent) {
    this.parents = this.parents.map(p => p.id === updated.id ? updated : p);
    this.logAction("Admin", "Update Parent", `Updated parent info: ${updated.firstName} ${updated.lastName}`, updated.id, "Parent");
    this.saveToStorage();
  }

  public registerChild(
    childData: Omit<Child, 'id' | 'groupId' | 'enrollmentDate' | 'parentId'>,
    parentId: string
  ): { child: Child, invoice: Invoice } {
    const assignedGroup = determineGroup(childData.dateOfBirth);
    const newChild: Child = {
      ...childData,
      id: `C${Math.floor(Math.random() * 9000) + 1000}`,
      groupId: assignedGroup,
      enrollmentDate: new Date().toISOString().split('T')[0],
      parentId
    };

    this.children.push(newChild);

    const parent = this.parents.find(p => p.id === parentId);
    let siblingCount = 0;
    if (parent) {
      siblingCount = parent.childrenIds.length;
      parent.childrenIds.push(newChild.id);
      this.updateParentByRef(parent);
    }

    // Auto generate invoice
    const invoice = this.billingService.generateRegistrationInvoice(
      newChild,
      siblingCount,
      this.currentInvoiceSequence++
    );

    this.invoices.push(invoice);
    this.logAction("Admin", "Register Child", `Enrolled child ${newChild.firstName} in group ${newChild.groupId}`, newChild.id, "Child");
    this.logAction("System", "Generate Invoice", `Auto-generated Tax Invoice ${invoice.id} for registration`, invoice.id, "Invoice");
    
    this.saveToStorage();
    return { child: newChild, invoice };
  }

  private updateParentByRef(parent: Parent) {
    this.parents = this.parents.map(p => p.id === parent.id ? parent : p);
  }

  public registerStaff(staffData: Omit<Staff, 'id'>): Staff {
    const newStaff: Staff = {
      ...staffData,
      id: `S${Math.floor(Math.random() * 9000) + 1000}`
    };
    this.staff.push(newStaff);
    this.logAction("Admin", "Register Staff", `Registered staff member: ${newStaff.firstName} ${newStaff.lastName} as ${newStaff.role}`, newStaff.id, "Staff");
    this.saveToStorage();
    return newStaff;
  }

  public addInvoice(invoice: Invoice) {
    this.invoices.push(invoice);
    this.logAction("Admin", "Create Invoice", `Manually created Invoice: ${invoice.id}`, invoice.id, "Invoice");
    this.saveToStorage();
  }

  public updateInvoice(updated: Invoice, actor: string = "Admin") {
    const old = this.invoices.find(i => i.id === updated.id);
    this.invoices = this.invoices.map(i => i.id === updated.id ? updated : i);
    
    const diffText = old ? `Status changed from ${old.status} to ${updated.status}. Version bumped to ${updated.version}.` : 'Updated invoice.';
    this.logAction(actor, "Update Invoice", `Updated Invoice ${updated.id}: ${diffText}`, updated.id, "Invoice");
    this.saveToStorage();
  }

  public addAttendance(record: Omit<AttendanceRecord, 'id'>): AttendanceRecord {
    const newRec: AttendanceRecord = {
      ...record,
      id: `ATT-${Math.floor(Math.random() * 1000000)}`
    };
    
    // Check if record for child + date already exists, if so overwrite
    const existingIdx = this.attendance.findIndex(a => a.childId === record.childId && a.date === record.date);
    if (existingIdx > -1) {
      this.attendance[existingIdx] = newRec;
    } else {
      this.attendance.push(newRec);
    }
    
    this.saveToStorage();
    return newRec;
  }

  public addMeal(meal: Omit<MealPlan, 'id'>): MealPlan {
    const newMeal: MealPlan = {
      ...meal,
      id: `M-${Math.floor(Math.random() * 1000000)}`
    };
    
    // Overwrite same meal type on same date if exits
    const existingIdx = this.meals.findIndex(m => m.date === meal.date && m.mealType === meal.mealType);
    if (existingIdx > -1) {
      this.meals[existingIdx] = newMeal;
    } else {
      this.meals.push(newMeal);
    }
    
    this.saveToStorage();
    return newMeal;
  }

  public logCommunication(msg: Omit<CommunicationMessage, 'id' | 'dateSent'>): CommunicationMessage {
    const newMsg: CommunicationMessage = {
      ...msg,
      id: `C${Math.floor(Math.random() * 1000000)}`,
      dateSent: new Date().toISOString()
    };
    this.communications.unshift(newMsg);
    this.logAction("Admin", "Send Communication", `Sent ${msg.type} notification to parent. Title: ${msg.title}`, newMsg.id, "Communication");
    this.saveToStorage();
    return newMsg;
  }

  public updateSettings(settings: DaycareSettings) {
    this.settings = settings;
    this.logAction("Admin", "Update Settings", "Updated daycare institutional settings.", "Settings", "Settings");
    this.saveToStorage();
  }
}
