export interface PassportData {
  surname: string;
  givenNames: string;
  passportNumber: string;
  placeOfBirth: string;
  dateOfBirth: string;
  dateOfIssue: string;
  dateOfExpiry: string;
  issuingAuthority: string;
}

export const MONTH_ABBREVIATIONS = {
  '01': 'JAN',
  '02': 'FEB',
  '03': 'MAR',
  '04': 'APR',
  '05': 'MAY',
  '06': 'JUN',
  '07': 'JUL',
  '08': 'AUG',
  '09': 'SEP',
  '10': 'OCT',
  '11': 'NOV',
  '12': 'DEC'
} as const;