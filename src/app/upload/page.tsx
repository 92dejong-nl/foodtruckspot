'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { analyzeData, analyzeDataWithWeather, AnalysisResult } from '@/lib/analysis';
import { FlexibleParser } from '@/lib/flexibleParser';

interface CSVData {
  datum: string;
  locatie: string;
  omzet: string;
}

interface ParsedData {
  data: CSVData[];
  totalRows: number;
  errors: string[];
  detectedFormat?: {
    separator: string;
    dateFormat: string;
    columnOrder: string[];
    hasHeaders: boolean;
  };
}

export default function UploadPage() {
  const router = useRouter();
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error' | 'analyzing'>('idle');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [includeWeather, setIncludeWeather] = useState<boolean>(true);
  const [weatherApiKey, setWeatherApiKey] = useState<string>('');
  const [includeAI, setIncludeAI] = useState<boolean>(true);
  const [claudeApiKey, setClaudeApiKey] = useState<string>('');
  
  // Load saved API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('weatherApiKey');
    const savedWeatherPreference = localStorage.getItem('includeWeather');
    const savedClaudeApiKey = localStorage.getItem('claudeApiKey');
    const savedAIPreference = localStorage.getItem('includeAI');
    
    if (savedApiKey) {
      setWeatherApiKey(savedApiKey);
    }
    if (savedWeatherPreference === 'true') {
      setIncludeWeather(true);
    }
    if (savedClaudeApiKey) {
      setClaudeApiKey(savedClaudeApiKey);
    }
    if (savedAIPreference === 'true') {
      setIncludeAI(true);
    }
  }, []);
  
  // Save API key to localStorage when it changes
  const handleApiKeyChange = (value: string) => {
    setWeatherApiKey(value);
    if (value.trim()) {
      localStorage.setItem('weatherApiKey', value.trim());
    } else {
      localStorage.removeItem('weatherApiKey');
    }
  };
  
  // Save weather preference when it changes
  const handleWeatherToggle = (enabled: boolean) => {
    setIncludeWeather(enabled);
    localStorage.setItem('includeWeather', enabled.toString());
  };
  
  // Save Claude API key to localStorage when it changes
  const handleClaudeApiKeyChange = (value: string) => {
    setClaudeApiKey(value);
    if (value.trim()) {
      localStorage.setItem('claudeApiKey', value.trim());
    } else {
      localStorage.removeItem('claudeApiKey');
    }
  };
  
  // Save AI preference when it changes
  const handleAIToggle = (enabled: boolean) => {
    setIncludeAI(enabled);
    localStorage.setItem('includeAI', enabled.toString());
  };
  

  const handleAnalyzeData = async () => {
    if (!parsedData) return;

    setUploadState('analyzing');
    
    try {
      // Convert parsed data to the format expected by analyzeData
      const analysisInput = parsedData.data.map(row => ({
        datum: row.datum,
        locatie: row.locatie,
        omzet: row.omzet
      }));

      let result: AnalysisResult;

      if (includeWeather) {
        console.log('🌤️ ATTEMPTING WEATHER-ENHANCED ANALYSIS');
        console.log('📊 Input data length:', analysisInput.length);
        console.log('🔑 Using server-side API key');
        
        if (includeAI && claudeApiKey.trim()) {
          console.log('🤖 ATTEMPTING AI + WEATHER ANALYSIS');
          console.log('🔑 Claude API key (first 10 chars):', claudeApiKey.substring(0, 10));
        }
        
        try {
          result = await analyzeDataWithWeather(
            analysisInput, 
            'server-api-key', // Server will use environment API key instead
            includeAI ? 'server-claude-key' : undefined, // Server will use environment Claude key
            false // No events
          );
          console.log('✅ Enhanced analysis completed successfully');
        } catch (weatherError) {
          console.error('❌ Enhanced analysis FAILED:', weatherError);
          console.error('Stack trace:', weatherError instanceof Error ? weatherError.stack : 'No stack available');
          // Fall back to basic analysis
          console.log('🔄 Falling back to basic analysis...');
          result = analyzeData(analysisInput);
        }
      } else {
        console.log('📊 Using basic analysis (no weather)');
        result = analyzeData(analysisInput);
      }
      
      // Store analysis data in sessionStorage to avoid URL length limits
      sessionStorage.setItem('analysisResult', JSON.stringify(result));
      // Store raw CSV data for weather analysis
      sessionStorage.setItem('rawCsvData', JSON.stringify(analysisInput));
      // Store Weather analysis flag for results page
      if (includeWeather) {
        sessionStorage.setItem('weatherAnalysis', 'true');
      }
      router.push('/results');
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Er ging iets mis bij het analyseren van de data: ${err}`);
      setUploadState('error');
    }
  };

  const validateFile = (file: File): string | null => {
    console.log('Validating file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: file.name.split('.').pop()?.toLowerCase()
    });

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return 'Alleen CSV bestanden zijn toegestaan. Zorg ervoor dat je bestand eindigt op .csv';
    }
    
    // Check if it's empty
    if (file.size === 0) {
      return 'Het bestand is leeg.';
    }
    
    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return 'Het bestand is te groot. Maximaal 5MB toegestaan.';
    }
    
    // Check MIME type if available
    if (file.type && !file.type.includes('text') && !file.type.includes('csv')) {
      console.warn('Suspicious MIME type:', file.type);
      return 'Dit lijkt geen tekstbestand te zijn. Zorg ervoor dat je een CSV bestand uploadt, geen Excel bestand (.xlsx) of ZIP bestand.';
    }
    
    return null;
  };

  const parseCSV = async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      console.log('=== Starting Flexible CSV Parse ===');
      console.log('File info:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });

      const reader = new FileReader();
      
      // Add error handler
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
        reject('Er ging iets mis bij het lezen van het bestand.');
      };
      
      reader.onload = (e) => {
        try {
          console.log('FileReader onload triggered');
          console.log('Result type:', typeof e.target?.result);
          
          const result = e.target?.result;
          if (!result) {
            reject('Geen data gevonden in het bestand.');
            return;
          }

          // Check if we got a string (not ArrayBuffer)
          if (typeof result !== 'string') {
            console.error('Expected string, got:', typeof result);
            reject('Bestand wordt niet correct gelezen als tekst.');
            return;
          }

          console.log('Raw file content (first 200 chars):', result.substring(0, 200));
          console.log('File content length:', result.length);

          // Check for binary data indicators
          if (result.startsWith('PK') || result.includes('\x00') || result.includes('Content_Types')) {
            reject('Dit lijkt geen CSV bestand te zijn. Zorg ervoor dat je een tekstbestand uploadt, geen ZIP of Excel bestand.');
            return;
          }

          // Use flexible parser
          console.log('🚀 Using FlexibleParser...');
          const parseResult = FlexibleParser.parseData(result);
          
          console.log('✅ Flexible parsing completed:', parseResult);

          if (parseResult.data.length === 0 && parseResult.errors.length > 0) {
            reject(parseResult.errors.join('\n'));
            return;
          }

          // Convert to expected format
          const data: CSVData[] = parseResult.data.map(row => ({
            datum: row.date.toISOString().split('T')[0], // Convert Date to string
            locatie: row.location,
            omzet: row.amount.toString()
          }));

          // Set debug info
          const formatInfo = parseResult.detectedFormat;
          setDebugInfo(`
Flexible Parser Results:
- Bestandsnaam: ${file.name}
- Bestandsgrootte: ${file.size} bytes
- Gedetecteerd formaat: ${formatInfo.separator} gescheiden
- Datum formaat: ${formatInfo.dateFormat}
- Headers: ${formatInfo.hasHeaders ? 'Ja' : 'Nee'}
- Kolom volgorde: ${formatInfo.columnOrder.join(', ')}
- Verwerkte rijen: ${parseResult.summary.successfulRows}/${parseResult.summary.totalRows}
- Fouten: ${parseResult.summary.errorRows}
          `.trim());

          resolve({
            data,
            totalRows: parseResult.summary.totalRows,
            errors: parseResult.errors,
            detectedFormat: parseResult.detectedFormat
          });
          
        } catch (error) {
          console.error('Flexible parsing error:', error);
          reject(`Er ging iets mis bij het verwerken van het bestand: ${error}`);
        }
      };
      
      // Important: Use readAsText, not readAsArrayBuffer or readAsBinaryString
      console.log('Starting to read file as text with UTF-8 encoding...');
      reader.readAsText(file, 'UTF-8');
    });
  };

  const handleFileUpload = async (file: File) => {
    setError('');
    setDebugInfo('');
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
              <span className="text-2xl font-bold text-slate-800">🚚 TruckSpot</span>
            </Link>
            <Link href="/" className="text-slate-600 hover:text-slate-800 transition-colors">
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
                  <label className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold cursor-pointer transition-colors">
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

            {/* Example Formats */}
            <div className="mt-8 bg-stone-100 p-6 rounded-xl border border-stone-200">
              <h3 className="font-semibold text-slate-900 mb-3">✨ Ondersteunde formaten (automatisch gedetecteerd):</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-stone-200">
                  <h4 className="font-medium text-slate-900 mb-2">Met headers (aanbevolen):</h4>
                  <div className="font-mono text-sm space-y-1">
                    <div className="font-semibold text-green-700">Datum,Locatie,Omzet</div>
                    <div className="text-slate-600">2024-01-15,Museumplein,€450,50</div>
                    <div className="text-slate-600">15-01-2024,Vondelpark,320.00</div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-stone-200">
                  <h4 className="font-medium text-slate-900 mb-2">Zonder headers (automatisch detectie):</h4>
                  <div className="font-mono text-sm space-y-1">
                    <div className="text-slate-600">15/1/2024    Dam Square    445</div>
                    <div className="text-slate-600">2024-01-16;Leidseplein;€680,00</div>
                    <div className="text-slate-600">17-01-2024 | Vondelpark | 320</div>
                  </div>
                </div>
                <div className="text-sm text-slate-600 mt-3">
                  <p><span className="font-medium">Ondersteunt:</span> Verschillende scheidingstekens (comma, puntkomma, tab, spatie), datum formaten (DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY), bedrag formaten (€450,50, 450.00, 450)</p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <span className="text-red-600 mr-3 mt-1">⚠️</span>
                  <div className="flex-1">
                    <p className="text-red-700 whitespace-pre-line">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {uploadState === 'uploading' && (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-600 border-t-transparent rounded-full mb-4"></div>
            <p className="text-lg text-slate-600">Bestand wordt verwerkt...</p>
          </div>
        )}
        
        {uploadState === 'analyzing' && (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-600 border-t-transparent rounded-full mb-4"></div>
            <p className="text-lg text-slate-600">Data wordt geanalyseerd...</p>
            <p className="text-sm text-slate-500 mt-2">Dit kan even duren</p>
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
                <strong>{parsedData.totalRows} verkooprecords gevonden</strong>
              </p>
            </div>

            {/* Format Detection Summary */}
            {parsedData.detectedFormat && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3">📊 Automatisch gedetecteerd formaat:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><span className="font-medium">Scheidingsteken:</span> {parsedData.detectedFormat.separator === 'comma' ? 'Komma (,)' : parsedData.detectedFormat.separator === 'tab' ? 'Tab' : parsedData.detectedFormat.separator === 'space' ? 'Spatie' : parsedData.detectedFormat.separator}</p>
                    <p><span className="font-medium">Datum formaat:</span> {parsedData.detectedFormat.dateFormat}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Headers:</span> {parsedData.detectedFormat.hasHeaders ? 'Ja' : 'Nee'}</p>
                    <p><span className="font-medium">Kolommen:</span> {parsedData.detectedFormat.columnOrder.join(', ')}</p>
                  </div>
                </div>
                {parsedData.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                    <p className="text-sm font-medium text-amber-800 mb-2">⚠️ Waarschuwingen bij verwerking:</p>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {parsedData.errors.slice(0, 3).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {parsedData.errors.length > 3 && (
                        <li>• ... en nog {parsedData.errors.length - 3} waarschuwingen</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Data Preview */}
            <div className="bg-stone-100 p-6 rounded-xl border border-stone-200">
              <h3 className="font-semibold text-slate-900 mb-4">✅ Verwerkte data preview:</h3>
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
                    {parsedData.data.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-t border-stone-200">
                        <td className="px-4 py-3 text-slate-700">{row.datum}</td>
                        <td className="px-4 py-3 text-slate-700">{row.locatie}</td>
                        <td className="px-4 py-3 text-slate-700">€{row.omzet}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.data.length > 5 && (
                <p className="text-sm text-slate-600 mt-3">
                  ... en nog {parsedData.data.length - 5} rijen meer (totaal {parsedData.totalRows} verkooprecords)
                </p>
              )}
            </div>

            {/* Weather Analysis Options */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="includeWeather"
                  checked={includeWeather}
                  onChange={(e) => handleWeatherToggle(e.target.checked)}
                  className="w-4 h-4 text-slate-600 bg-gray-100 border-gray-300 rounded focus:ring-slate-500"
                />
                <label htmlFor="includeWeather" className="ml-3 text-lg font-semibold text-slate-900">
                  🌤️ Weer-analyse toevoegen
                </label>
              </div>
              
              {includeWeather && (
                <div className="space-y-4">
                  <div className="bg-green-100 p-4 rounded-lg">
                    <p className="text-sm text-green-800 mb-2">
                      ✅ <strong>Automatische weerdata</strong> - Gebruikt real-time Meteostat API voor nauwkeurige historische weergegevens
                    </p>
                    <p className="text-xs text-green-700">
                      Geen API key nodig - het systeem gebruikt automatisch onze geïntegreerde Meteostat API voor Amsterdam weerdata
                    </p>
                  </div>
                  
                  <div className="bg-blue-100 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Weer-analyse geeft je:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Correlatie tussen weer en omzet</li>
                      <li>• Impact van regen/zon op verkoop</li>
                      <li>• Optimale temperatuur voor verkoop</li>
                      <li>• Weer-specifieke strategieën</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>


            {/* AI Analysis Options */}
            <div className="bg-purple-50 p-6 rounded-xl border border-purple-200 mb-8">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="includeAI"
                  checked={includeAI}
                  onChange={(e) => handleAIToggle(e.target.checked)}
                  className="w-4 h-4 text-slate-600 bg-gray-100 border-gray-300 rounded focus:ring-slate-500"
                />
                <label htmlFor="includeAI" className="ml-3 text-lg font-semibold text-slate-900">
                  🤖 AI-gestuurde inzichten toevoegen
                </label>
              </div>
              
              {includeAI && (
                <div className="space-y-4">
                  <div className="bg-green-100 p-4 rounded-lg">
                    <p className="text-sm text-green-800 mb-2">
                      ✅ <strong>Automatische AI-analyse</strong> - Gebruikt ingebouwde Claude AI voor geavanceerde inzichten
                    </p>
                    <p className="text-xs text-green-700">
                      Geen API key nodig - het systeem gebruikt automatisch onze geïntegreerde Claude AI voor strategische aanbevelingen
                    </p>
                  </div>
                  
                  <div className="bg-purple-100 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">AI-analyse geeft je:</h4>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Diepe inzichten die je zelf misschien mist</li>
                      <li>• Strategische aanbevelingen op maat</li>
                      <li>• Concrete acties voor omzetverbetering</li>
                      <li>• Kansen en risico-analyse</li>
                      <li>• Locatie- en timing-optimalisatie</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            <div className="text-center">
              <button 
                className="bg-slate-700 hover:bg-slate-800 text-white px-12 py-4 rounded-lg text-xl font-semibold transition-colors disabled:bg-slate-400"
                onClick={handleAnalyzeData}
                disabled={(uploadState as any) === 'analyzing'}
              >
                {(uploadState as any) === 'analyzing' ? 'Analyseren...' : 
                 includeAI && includeWeather ? 'Analyseer met AI + Weer' : 
                 includeAI ? 'Analyseer met AI' :
                 includeWeather ? 'Analyseer met weer-data' : 
                 'Analyseer mijn data'}
              </button>
              <p className="text-sm text-slate-600 mt-3">
                Je data wordt veilig verwerkt en niet opgeslagen
                {includeWeather && <br />}
                {includeWeather && 'Echte historische weerdata via Meteostat API'}
                {includeAI && <br />}
                {includeAI && 'AI-analyse wordt gegenereerd door Claude'}
              </p>
            </div>

            {/* Upload Another File */}
            <div className="text-center pt-8 border-t border-stone-200">
              <button 
                onClick={() => {
                  setUploadState('idle');
                  setParsedData(null);
                  setError('');
                  // Keep weather settings and API key saved
                }}
                className="text-slate-700 hover:text-slate-800 font-medium"
              >
                ↻ Upload een ander bestand
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Je analyse-instellingen (weer en AI) blijven bewaard
              </p>
            </div>
          </div>
        )}
        
        {/* Debug Info - Only show in development */}
        {debugInfo && process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-100 border border-gray-300 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Debug Informatie:</h3>
            <pre className="text-sm text-gray-700 whitespace-pre-line">{debugInfo}</pre>
          </div>
        )}
      </div>
    </div>
  );
}