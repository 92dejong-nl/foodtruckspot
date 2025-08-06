'use client';

import { useState } from 'react';
import Link from 'next/link';

interface CSVData {
  datum: string;
  locatie: string;
  omzet: string;
}

interface ParsedData {
  data: CSVData[];
  totalRows: number;
  errors: string[];
}

export default function UploadPage() {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return 'Alleen CSV bestanden zijn toegestaan.';
    }
    if (file.size === 0) {
      return 'Het bestand is leeg.';
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return 'Het bestand is te groot. Maximaal 5MB toegestaan.';
    }
    return null;
  };

  const parseCSV = async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject('Het CSV bestand moet minimaal een header en een data rij bevatten.');
            return;
          }

          const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
          const requiredHeaders = ['datum', 'locatie', 'omzet'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            reject(`Ontbrekende kolommen: ${missingHeaders.join(', ')}. Verwacht: Datum, Locatie, Omzet`);
            return;
          }

          const data: CSVData[] = [];
          const errors: string[] = [];

          for (let i = 1; i < lines.length && i <= 6; i++) { // Parse first 5 data rows for preview
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 3) {
              data.push({
                datum: values[headers.indexOf('datum')],
                locatie: values[headers.indexOf('locatie')], 
                omzet: values[headers.indexOf('omzet')]
              });
            }
          }

          resolve({
            data,
            totalRows: lines.length - 1,
            errors
          });
        } catch {
          reject('Er ging iets mis bij het lezen van het CSV bestand.');
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    setError('');
    setUploadState('uploading');

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setUploadState('error');
      return;
    }

    try {
      const result = await parseCSV(file);
      setParsedData(result);
      setUploadState('success');
    } catch (err) {
      setError(err as string);
      setUploadState('error');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation */}
      <nav className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-800">🚚 FoodTruckSpot</span>
            </Link>
            <Link href="/" className="text-slate-600 hover:text-blue-800 transition-colors">
              ← Terug naar home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Upload je verkoopdata
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Upload je CSV bestand om je food truck prestaties te analyseren
          </p>
        </div>

        {/* Upload Area */}
        {(uploadState === 'idle' || uploadState === 'error') && (
          <div className="mb-8">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                isDragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : uploadState === 'error' 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-stone-300 bg-stone-100 hover:border-blue-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="text-4xl">📁</div>
                <div>
                  <p className="text-lg font-medium text-slate-900 mb-2">
                    Sleep je CSV bestand hier naartoe
                  </p>
                  <p className="text-slate-600 mb-4">of</p>
                  <label className="bg-blue-800 hover:bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer transition-colors">
                    Kies bestand
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileInput}
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Example Format */}
            <div className="mt-8 bg-stone-100 p-6 rounded-xl border border-stone-200">
              <h3 className="font-semibold text-slate-900 mb-3">Verwacht formaat:</h3>
              <div className="bg-white p-4 rounded-lg border border-stone-200 font-mono text-sm">
                <div className="font-semibold text-slate-900">Datum,Locatie,Omzet</div>
                <div className="text-slate-600">2024-01-15,Museumplein,450</div>
                <div className="text-slate-600">2024-01-16,Vondelpark,320</div>
                <div className="text-slate-600">2024-01-17,Leidseplein,680</div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-600 mr-3">⚠️</span>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {uploadState === 'uploading' && (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
            <p className="text-lg text-slate-600">Bestand wordt verwerkt...</p>
          </div>
        )}
        
        {uploadState === 'success' && parsedData && (
          <div className="space-y-8">
            {/* Success Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <span className="text-green-600 text-2xl mr-3">✅</span>
                <h2 className="text-xl font-semibold text-green-900">
                  Bestand succesvol geüpload
                </h2>
              </div>
              <p className="text-green-700">
                <strong>{parsedData.totalRows} verkoopdagen gevonden</strong>
              </p>
            </div>

            {/* Data Preview */}
            <div className="bg-stone-100 p-6 rounded-xl border border-stone-200">
              <h3 className="font-semibold text-slate-900 mb-4">Voorbeeld van je data:</h3>
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-lg border border-stone-200">
                  <thead className="bg-stone-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Datum</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Locatie</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900">Omzet (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.data.map((row, index) => (
                      <tr key={index} className="border-t border-stone-200">
                        <td className="px-4 py-3 text-slate-700">{row.datum}</td>
                        <td className="px-4 py-3 text-slate-700">{row.locatie}</td>
                        <td className="px-4 py-3 text-slate-700">€{row.omzet}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.totalRows > 5 && (
                <p className="text-sm text-slate-600 mt-3">
                  ... en nog {parsedData.totalRows - 5} rijen meer
                </p>
              )}
            </div>

            {/* Analyze Button */}
            <div className="text-center">
              <button 
                className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 rounded-lg text-xl font-semibold transition-colors"
                onClick={() => {
                  // TODO: Navigate to analysis page
                  alert('Analyse functionaliteit komt binnenkort!');
                }}
              >
                Analyseer mijn data
              </button>
              <p className="text-sm text-slate-600 mt-3">
                Je data wordt veilig verwerkt en niet opgeslagen
              </p>
            </div>

            {/* Upload Another File */}
            <div className="text-center pt-8 border-t border-stone-200">
              <button 
                onClick={() => {
                  setUploadState('idle');
                  setParsedData(null);
                  setError('');
                }}
                className="text-blue-800 hover:text-blue-900 font-medium"
              >
                ↻ Upload een ander bestand
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}