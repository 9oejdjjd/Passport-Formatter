import React, { useState, useRef } from 'react';
import { FileImage, Upload, AlertCircle } from 'lucide-react';
import { extractPassportData } from '../services/ocrService';
import type { PassportData } from '../types/passportTypes';

const DataExtractorPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  return (
    <div className="page data-extractor-page">
      <div className="card">
        <h2 className="card-title">
          <FileImage size={24} />
          Passport Data Extractor
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
            <h3>Extracted Data</h3>
            <div className="field-grid">
              <div className="data-field">
                <div className="data-field-label">Surname</div>
                <div className="data-field-value">{passportData.surname || 'Not detected'}</div>
              </div>
              <div className="data-field">
                <div className="data-field-label">Given Names</div>
                <div className="data-field-value">{passportData.givenNames || 'Not detected'}</div>
              </div>
              <div className="data-field">
                <div className="data-field-label">Passport Number</div>
                <div className="data-field-value">{passportData.passportNumber || 'Not detected'}</div>
              </div>
              <div className="data-field">
                <div className="data-field-label">Place of Birth</div>
                <div className="data-field-value">{passportData.placeOfBirth || 'Not detected'}</div>
              </div>
              <div className="data-field">
                <div className="data-field-label">Date of Birth</div>
                <div className="data-field-value">{passportData.dateOfBirth || 'Not detected'}</div>
              </div>
              <div className="data-field">
                <div className="data-field-label">Date of Issue</div>
                <div className="data-field-value">{passportData.dateOfIssue || 'Not detected'}</div>
              </div>
              <div className="data-field">
                <div className="data-field-label">Date of Expiry</div>
                <div className="data-field-value">{passportData.dateOfExpiry || 'Not detected'}</div>
              </div>
              <div className="data-field">
                <div className="data-field-label">Issuing Authority</div>
                <div className="data-field-value">{passportData.issuingAuthority || 'Not detected'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExtractorPage;