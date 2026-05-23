import { Child, Parent, Invoice } from '../types';
import { determineGroup } from '../utils';
import { BillingService } from './BillingService';

export class RegistrationService {
  private billingService: BillingService;
  private currentInvoiceSequence = 1;

  // Mock databases
  public parents: Parent[] = [];
  public children: Child[] = [];
  public invoices: Invoice[] = [];

  constructor() {
    this.billingService = new BillingService();
  }

  public registerParent(parent: Omit<Parent, 'id' | 'childrenIds'>): Parent {
    const newParent: Parent = {
      ...parent,
      id: `P${Math.floor(Math.random() * 10000)}`,
      childrenIds: []
    };
    this.parents.push(newParent);
    return newParent;
  }

  public registerChild(
    childData: Omit<Child, 'id' | 'groupId' | 'enrollmentDate'>,
    parentId: string
  ): { child: Child, invoice: Invoice } {
    
    // Automatically assign group based on DOB
    const assignedGroup = determineGroup(childData.dateOfBirth);
    
    const newChild: Child = {
      ...childData,
      id: `C${Math.floor(Math.random() * 10000)}`,
      groupId: assignedGroup,
      enrollmentDate: new Date().toISOString().split('T')[0],
      parentId
    };

    this.children.push(newChild);

    // Update parent's children list to calculate sibling discount
    const parent = this.parents.find(p => p.id === parentId);
    let siblingCount = 0;
    if (parent) {
      siblingCount = parent.childrenIds.length;
      parent.childrenIds.push(newChild.id);
    }

    // Generate Invoice automatically using BillingService
    const invoice = this.billingService.generateRegistrationInvoice(
      newChild,
      siblingCount,
      this.currentInvoiceSequence++
    );

    this.invoices.push(invoice);

    return { child: newChild, invoice };
  }
}
