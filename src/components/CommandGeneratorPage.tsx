import React, { useState, useRef } from 'react';
import { Terminal, Upload, Copy, AlertCircle, Check, FileImage } from 'lucide-react';
import { extractPassportData } from '../services/ocrService';
import type { PassportData } from '../types/passportTypes';
import { MONTH_ABBREVIATIONS } from '../types/passportTypes';

const CommandGeneratorPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nationality, setNationality] = useState('');
  const [gender, setGender] = useState('');
  const [airlineCode, setAirlineCode] = useState('');
  const [issuingLocation, setIssuingLocation] = useState('');
  const [commands, setCommands] = useState<{ nm1: string; srDocs: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState({ nm1: false, srDocs: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview the image
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Process the file
    processImageFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    // Preview the image
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Process the file
    processImageFile(file);
  };

  const processImageFile = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      setCommands(null);
      
      const data = await extractPassportData(file);
      setPassportData(data);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to extract passport data. Please try again with a clearer image.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const formatDateForAmadeus = (dateStr: string): string => {
    // Expected input format: DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length !== 3) return '';
    
    const day = parts[0].padStart(2, '0');
    const month = MONTH_ABBREVIATIONS[parts[1] as keyof typeof MONTH_ABBREVIATIONS];
    const year = parts[2].slice(-2);
    
    return `${day}${month}${year}`;
  };

  const generateCommands = () => {
    if (!passportData) return;
    
    // Validate required fields
    if (!nationality || !gender || !airlineCode || !issuingLocation ||
        !passportData.surname || !passportData.givenNames || 
        !passportData.passportNumber || !passportData.dateOfBirth || 
        !passportData.dateOfExpiry) {
      setError('Please fill all required fields to generate commands');
      return;
    }
    
    // Format dates for Amadeus (DDMMMYY)
    const formattedDob = formatDateForAmadeus(passportData.dateOfBirth);
    const formattedExpiry = formatDateForAmadeus(passportData.dateOfExpiry);
    
    if (!formattedDob || !formattedExpiry) {
      setError('Invalid date format detected. Dates should be in DD/MM/YYYY format.');
      return;
    }
    
    // Generate the commands
    const nm1Command = `NM1${passportData.surname}/${passportData.givenNames}`;
    
    const srDocsCommand = `SR DOCS ${airlineCode} HK1-P-${nationality}-${passportData.passportNumber}-${issuingLocation}-${formattedDob}-${gender}-${formattedExpiry}-${passportData.surname}-${passportData.givenNames}`;
    
    setCommands({ nm1: nm1Command, srDocs: srDocsCommand });
    setError(null);
  };

  const copyToClipboard = (text: string, type: 'nm1' | 'srDocs') => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess({ ...copySuccess, [type]: true });
        setTimeout(() => {
          setCopySuccess({ ...copySuccess, [type]: false });
        }, 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  return (
    <div className="page command-generator-page">
      <div className="card">
        <h2 className="card-title">
          <Terminal size={24} />
          Amadeus Command Generator
        </h2>
        
        <div 
          className="upload-area" 
          onClick={handleUploadClick}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload size={48} color="#666" />
          <p>Click to upload or drag and drop passport image</p>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
          
          {previewUrl && (
            <img src={previewUrl} alt="Passport preview" className="preview-image" />
          )}
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {isLoading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Extracting passport data...</p>
          </div>
        )}

        {passportData && !isLoading && (
          <div className="result-section">
            <h3>Additional Information</h3>
            <p className="mb-4">Please provide the following information to generate Amadeus commands:</p>
            
            <div className="manual-fields">
              <div className="input-group">
                <label htmlFor="nationality">Nationality (3-letter code)</label>
                <input 
                  type="text" 
                  id="nationality" 
                  value={nationality} 
                  onChange={(e) => setNationality(e.target.value.toUpperCase())}
                  placeholder="e.g. SA"
                  maxLength={3}
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="gender">Gender</label>
                <select 
                  id="gender" 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                </select>
              </div>
              
              <div className="input-group">
                <label htmlFor="airlineCode">Airline Code</label>
                <input 
                  type="text" 
                  id="airlineCode" 
                  value={airlineCode} 
                  onChange={(e) => setAirlineCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SV"
                  maxLength={3}
                />
              </div>

              <div className="input-group">
                <label htmlFor="issuingLocation">Issuing Location</label>
                <input 
                  type="text" 
                  id="issuingLocation" 
                  value={issuingLocation} 
                  onChange={(e) => setIssuingLocation(e.target.value.toUpperCase())}
                  placeholder="e.g. RUH"
                  maxLength={3}
                />
              </div>
            </div>
            
            <button className="button" onClick={generateCommands}>
              <Terminal size={18} />
              Generate Commands
            </button>
          </div>
        )}

        {commands && (
          <div className="result-section">
            <h3>Generated Amadeus Commands</h3>
            
            <div className="command-result">
              <code>{commands.nm1}</code>
              <button 
                className="copy-button" 
                onClick={() => copyToClipboard(commands.nm1, 'nm1')}
              >
                {copySuccess.nm1 ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            
            <div className="command-result">
              <code>{commands.srDocs}</code>
              <button 
                className="copy-button" 
                onClick={() => copyToClipboard(commands.srDocs, 'srDocs')}
              >
                {copySuccess.srDocs ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            
            {(copySuccess.nm1 || copySuccess.srDocs) && (
              <div className="success-message">
                <Check size={18} />
                Command copied to clipboard
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandGeneratorPage;