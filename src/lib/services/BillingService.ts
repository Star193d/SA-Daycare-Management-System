import { Child, Invoice, InvoiceItem } from '../types';
import { generateInvoiceId } from '../utils';

export class BillingService {
  private baseTuitionRates: Record<string, number> = {
    'Infant': 320000,     // R3,200.00 in cents
    'Toddler': 250000,    // R2,500.00 in cents
    'Pre-School': 220000, // R2,200.00 in cents
    'Grade R': 200000     // R2,000.00 in cents
  };

  private vatRate = 0.15; // 15% VAT in South Africa

  /**
   * Generates a tax invoice upon child registration.
   * Includes sibling discounts and correctly calculates VAT. All ZAR values in cents.
   */
  public generateRegistrationInvoice(
    child: Child,
    siblingCount: number,
    invoiceSequenceOffset: number
  ): Invoice {
    const items: InvoiceItem[] = [];
    const baseRate = this.baseTuitionRates[child.groupId] || 250000;
    
    items.push({
      description: `Monthly Tuition - ${child.groupId} (${child.firstName} ${child.lastName})`,
      amount: baseRate
    });

    let subtotal = baseRate;

    // Automated Sibling Discount Logic (10% off for 2nd child, 15% for 3rd+)
    if (siblingCount === 1) {
      const discount = Math.round(baseRate * 0.10);
      items.push({
        description: 'Sibling Discount (10%)',
        amount: -discount
      });
      subtotal -= discount;
    } else if (siblingCount > 1) {
      const discount = Math.round(baseRate * 0.15);
      items.push({
        description: 'Sibling Discount (15%)',
        amount: -discount
      });
      subtotal -= discount;
    }

    // Add registration fee (R500.00 in cents)
    const registrationFee = 50000;
    items.push({
      description: 'Once-off Registration Fee',
      amount: registrationFee
    });
    subtotal += registrationFee;

    const vatAmount = Math.round(subtotal * this.vatRate);
    const total = subtotal + vatAmount;

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    const invoiceId = generateInvoiceId(invoiceSequenceOffset);

    return {
      id: invoiceId,
      parentId: child.parentId,
      childId: child.id,
      issueDate: today.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      items,
      subtotal,
      vatAmount,
      total,
      status: 'Sent', // Immediately "Sent" to simulate batch generation
      version: 1,
      history: [
        {
          id: `H-${Math.floor(Math.random() * 1000000)}`,
          invoiceId,
          action: 'Created',
          timestamp: new Date().toISOString(),
          actor: 'System (Auto-Registration)',
          notes: 'Tax Invoice automatically generated following child registration.'
        }
      ],
      templateId: 'default'
    };
  }
}
