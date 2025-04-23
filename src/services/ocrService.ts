import axios from 'axios';
import { PassportData } from '../types/passportTypes';

// OCR.space API key
const apiKey = import.meta.env.VITE_OCR_API_KEY;



const apiUrl = 'https://api.ocr.space/parse/image';



export async function extractPassportData(imageFile: File): Promise<PassportData> {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('apikey', apiKey);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // More accurate for printed text

    const response = await axios.post(apiUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.IsErroredOnProcessing) {
      throw new Error(response.data.ErrorMessage || 'Failed to process the image');
    }

    const extractedText = response.data.ParsedResults[0]?.ParsedText || '';
    
    // Parse the extracted text to find passport data
    return parsePassportData(extractedText);
  } catch (error) {
    console.error('OCR Service Error:', error);
    throw new Error('Failed to extract text from image');
  }
}

function parsePassportData(text: string): PassportData {
  const data: PassportData = {
    surname: '',
    givenNames: '',
    passportNumber: '',
    placeOfBirth: '',
    dateOfBirth: '',
    dateOfIssue: '',
    dateOfExpiry: '',
    issuingAuthority: '',
  };

  // Split the text into lines
  const lines = text.split('\n').map(line => line.trim());

  // Attempt to extract passport data using various patterns
  
  // Look for surname and given names (often near "P<" or after "Surname" or similar words)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toUpperCase();
    
    // Try to find surname
    if (line.includes('SURNAME') || line.includes('LAST NAME')) {
      data.surname = extractValueAfterLabel(line);
      // If next line might contain the value
      if (!data.surname && i < lines.length - 1) {
        data.surname = lines[i + 1];
      }
    }
    
    // Try to find given names
    if (line.includes('GIVEN NAME') || line.includes('FIRST NAME') || line.includes('NAMES')) {
      data.givenNames = extractValueAfterLabel(line);
      // If next line might contain the value
      if (!data.givenNames && i < lines.length - 1) {
        data.givenNames = lines[i + 1];
      }
    }
    
    // Look for passport number
    if (line.includes('PASSPORT NO') || line.includes('DOCUMENT NO') || line.includes('NO.')) {
      data.passportNumber = extractValueAfterLabel(line);
      // Clean up common OCR issues with passport numbers
      data.passportNumber = data.passportNumber.replace(/[^A-Z0-9]/g, '');
    }
    
    // Look for place of birth
    if (line.includes('PLACE OF BIRTH') || line.includes('BIRTH PLACE')) {
      data.placeOfBirth = extractValueAfterLabel(line);
      if (!data.placeOfBirth && i < lines.length - 1) {
        data.placeOfBirth = lines[i + 1];
      }
    }
    
    // Look for date of birth
    if (line.includes('DATE OF BIRTH') || line.includes('BIRTH DATE') || line.includes('BIRTH')) {
      data.dateOfBirth = extractDateFromLine(line);
      if (!data.dateOfBirth && i < lines.length - 1) {
        data.dateOfBirth = extractDateFromLine(lines[i + 1]);
      }
    }
    
    // Look for date of issue
    if (line.includes('DATE OF ISSUE') || line.includes('ISSUE DATE') || line.includes('ISSUED')) {
      data.dateOfIssue = extractDateFromLine(line);
      if (!data.dateOfIssue && i < lines.length - 1) {
        data.dateOfIssue = extractDateFromLine(lines[i + 1]);
      }
    }
    
    // Look for date of expiry
    if (line.includes('DATE OF EXPIRY') || line.includes('EXPIRY') || line.includes('EXPIRATION')) {
      data.dateOfExpiry = extractDateFromLine(line);
      if (!data.dateOfExpiry && i < lines.length - 1) {
        data.dateOfExpiry = extractDateFromLine(lines[i + 1]);
      }
    }
    
    // Look for issuing authority
    if (line.includes('AUTHORITY') || line.includes('ISSUED BY') || line.includes('ISSUING')) {
      data.issuingAuthority = extractValueAfterLabel(line);
      if (!data.issuingAuthority && i < lines.length - 1) {
        data.issuingAuthority = lines[i + 1];
      }
    }
  }

  // Try to extract data from MRZ (Machine Readable Zone) if available
  // MRZ lines typically start with P<
  const mrzLines = lines.filter(line => line.includes('P<') || /^[A-Z0-9<]{44}$/.test(line));
  
  if (mrzLines.length >= 2) {
    try {
      extractDataFromMRZ(mrzLines, data);
    } catch (err) {
      console.warn('Failed to parse MRZ:', err);
    }
  }

  // Clean up the data
  Object.keys(data).forEach(key => {
    const value = data[key as keyof PassportData];
    if (typeof value === 'string') {
      // Remove excessive spaces, special chars, etc.
      data[key as keyof PassportData] = value.replace(/\s+/g, ' ').trim();
    }
  });

  return data;
}

function extractValueAfterLabel(line: string): string {
  // Try to find text after a colon or similar separator
  const parts = line.split(/[:\-]/);
  if (parts.length > 1) {
    return parts.slice(1).join('').trim();
  }
  return '';
}

function extractDateFromLine(line: string): string {
  // Look for common date formats: DD/MM/YYYY, DD.MM.YYYY, etc.
  const datePattern = /\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{4}|\d{2})\b/;
  const match = line.match(datePattern);
  
  if (match) {
    // Convert to DD/MM/YYYY format
    return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3].length === 2 ? '20' + match[3] : match[3]}`;
  }
  
  return '';
}

function extractDataFromMRZ(mrzLines: string[], data: PassportData): void {
  // Typical MRZ format for passports (check first line starts with P)
  const firstLine = mrzLines[0].replace(/\s/g, '');
  if (!firstLine.startsWith('P')) return;
  
  const secondLine = mrzLines[1].replace(/\s/g, '');
  
  // Extract passport number from second line (positions 1-9)
  if (secondLine.length >= 9) {
    const passportNumber = secondLine.substring(0, 9).replace(/</g, '');
    if (passportNumber && !data.passportNumber) {
      data.passportNumber = passportNumber;
    }
  }
  
  // Extract date of birth from second line (positions 14-19 in YYMMDD format)
  if (secondLine.length >= 19) {
    const dobPart = secondLine.substring(13, 19);
    if (dobPart) {
      const year = dobPart.substring(0, 2);
      const month = dobPart.substring(2, 4);
      const day = dobPart.substring(4, 6);
      
      // Determine century (19xx or 20xx)
      const fullYear = parseInt(year) > 30 ? `19${year}` : `20${year}`;
      
      if (!data.dateOfBirth) {
        data.dateOfBirth = `${day}/${month}/${fullYear}`;
      }
    }
  }
  
  // Extract date of expiry from second line (positions 22-27 in YYMMDD format)
  if (secondLine.length >= 27) {
    const expiryPart = secondLine.substring(21, 27);
    if (expiryPart) {
      const year = expiryPart.substring(0, 2);
      const month = expiryPart.substring(2, 4);
      const day = expiryPart.substring(4, 6);
      
      // Determine century (always assume 20xx for expiry dates)
      const fullYear = `20${year}`;
      
      if (!data.dateOfExpiry) {
        data.dateOfExpiry = `${day}/${month}/${fullYear}`;
      }
    }
  }
  
  // Try to extract name information from the first line
  // Names in MRZ are in format SURNAME<<GIVEN<NAMES
  const nameParts = firstLine.split('<<');
  if (nameParts.length >= 2) {
    // Extract surname
    const surname = nameParts[0].substring(5).replace(/</g, ' ').trim();
    if (surname && !data.surname) {
      data.surname = surname;
    }
    
    // Extract given names
    const givenNames = nameParts[1].replace(/</g, ' ').trim();
    if (givenNames && !data.givenNames) {
      data.givenNames = givenNames;
    }
  }
}