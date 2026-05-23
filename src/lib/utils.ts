export function formatZAR(amountInCents: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInCents / 100);
}

export function validateLuhn(idString: string): boolean {
  if (!idString || idString.length !== 13 || !/^\d+$/.test(idString)) {
    return false;
  }
  let sum = 0;
  let shouldDouble = false;
  for (let i = idString.length - 1; i >= 0; i--) {
    let digit = parseInt(idString.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function formatSADate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function maskSAId(idNumber: string): string {
  if (!idNumber || idNumber.length !== 13) {
    return idNumber; // Fallback if invalid
  }
  // Format: ***-***-XXXX-X
  // We'll mask the first 6 digits, then dash, 3 digits, dash, 4 digits, etc.
  // Wait, the requirement was exactly: "***-***-XXXX-X".
  // Assuming XXXX is digits 9-12 and X is digit 13.
  const lastFive = idNumber.slice(-5);
  return `***-***-${lastFive.slice(0, 4)}-${lastFive.slice(-1)}`;
}

export function determineGroup(dateOfBirth: string): 'Infant' | 'Toddler' | 'Pre-School' | 'Grade R' {
  const dob = new Date(dateOfBirth);
  const ageInMonths = (new Date().getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  
  if (ageInMonths < 18) return 'Infant';
  if (ageInMonths < 36) return 'Toddler';
  if (ageInMonths < 60) return 'Pre-School';
  return 'Grade R';
}

export function generateInvoiceId(sequenceNumber: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(4, '0');
  return `INV-${year}-${month}-${seq}`;
}
