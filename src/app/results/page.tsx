'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AnalysisResult } from '@/lib/analysis';

// Weather Forecast Component
function WeatherForecastContent({ type }: { type: '5-day' | '24-hour' }) {
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'real' | 'mock' | 'unknown'>('unknown');

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the same API as the forecast page
        const response = await fetch('/api/weather/forecast?place=' + encodeURIComponent('Amsterdam,NL') + '&cnt=40');
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather forecast');
        }

        const data = await response.json();
        
        // Check if this is real API data or fallback
        if (response.status === 403 || response.status === 429) {
          setDataSource('mock');
        } else if (data.list && data.list.length > 0) {
          setDataSource('real');
        } else {
          setDataSource('mock');
        }
        
        if (data.list && data.list.length > 0) {
          if (type === '5-day') {
            // Process 5-day forecast like on forecast page
            const dailyForecasts = new Map<string, any[]>();
            
            data.list.forEach((forecast: any) => {
              const date = forecast.dt_txt.split(' ')[0];
              if (!dailyForecasts.has(date)) {
                dailyForecasts.set(date, []);
              }
              dailyForecasts.get(date)!.push(forecast);
            });

            const result: any[] = [];
            dailyForecasts.forEach((forecasts, dateStr) => {
              if (result.length >= 5) return;
              
              const temps = forecasts.map(f => f.main.temprature || f.main.temp || 20);
              const precipitations = forecasts.map(f => (f.rain?.amount || f.rain?.['3h'] || 0) + (f.snow?.amount || f.snow?.['3h'] || 0));
              const humidities = forecasts.map(f => f.main.humidity);
              const windSpeeds = forecasts.map(f => f.wind.speed);
              
              const weatherCounts = new Map<string, number>();
              forecasts.forEach(f => {
                const main = f.weather[0].main;
                weatherCounts.set(main, (weatherCounts.get(main) || 0) + 1);
              });
              const dominantWeather = Array.from(weatherCounts.entries())
                .sort((a, b) => b[1] - a[1])[0][0];
              
              const weatherDesc = forecasts.find(f => f.weather[0].main === dominantWeather)?.weather[0].description || 'mixed conditions';
              
              const date = new Date(dateStr);
              result.push({
                date: dateStr,
                dayName: date.toLocaleDateString('nl-NL', { weekday: 'long' }),
                temperature: Math.round(temps.reduce((sum, t) => sum + t, 0) / temps.length),
                maxTemperature: Math.round(Math.max(...temps)),
                minTemperature: Math.round(Math.min(...temps)),
                precipitation: Math.round((precipitations.reduce((sum, p) => sum + p, 0) / precipitations.length) * 10) / 10,
                weatherMain: dominantWeather,
                weatherDescription: weatherDesc,
                windSpeed: Math.round((windSpeeds.reduce((sum, w) => sum + w, 0) / windSpeeds.length) * 10) / 10,
                humidity: Math.round(humidities.reduce((sum, h) => sum + h, 0) / humidities.length)
              });
            });
            setForecastData(result);
          } else {
            // Process 24-hour forecast
            const hourlyData = data.list.slice(0, 8).map((item: any) => ({
              time: item.dt_txt,
              hour: new Date(item.dt_txt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
              temperature: Math.round(item.main.temprature || item.main.temp || 20),
              precipitation: Math.round(((item.rain?.amount || item.rain?.['3h'] || 0) + (item.snow?.amount || item.snow?.['3h'] || 0)) * 10) / 10,
              humidity: item.main.humidity,
              windSpeed: Math.round(item.wind.speed * 3.6), // Convert to km/h
              weatherMain: item.weather[0].main,
              weatherDescription: item.weather[0].description
            }));
            setForecastData(hourlyData);
          }
        } else {
          setDataSource('mock');
          throw new Error('No forecast data available');
        }
      } catch (err) {
        setDataSource('mock');
        setError('Weerdata kon niet worden opgehaald');
        console.error('Forecast fetch error:', err);
        // Generate fallback data
        setForecastData(generateFallbackData(type));
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [type]);

  const generateFallbackData = (forecastType: '5-day' | '24-hour') => {
    const now = new Date();
    const data = [];
    
    if (forecastType === '5-day') {
      for (let i = 0; i < 5; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        data.push({
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('nl-NL', { weekday: 'long' }),
          temperature: Math.round(12 + Math.random() * 8), // 12-20°C
          precipitation: Math.round(Math.random() * 3), // 0-3mm
          humidity: Math.round(65 + Math.random() * 20), // 65-85%
          windSpeed: Math.round(10 + Math.random() * 15), // 10-25 km/h
          weatherMain: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
          weatherDescription: ['helder', 'bewolkt', 'lichte regen'][Math.floor(Math.random() * 3)]
        });
      }
    } else {
      for (let i = 0; i < 24; i++) {
        const time = new Date(now);
        time.setHours(now.getHours() + i);
        data.push({
          time: time.toTimeString().slice(0, 5),
          temperature: Math.round(15 + Math.random() * 5), // 15-20°C
          precipitation: Math.round(Math.random() * 2), // 0-2mm
          humidity: Math.round(70 + Math.random() * 15), // 70-85%
          windSpeed: Math.round(12 + Math.random() * 8), // 12-20 km/h
          weatherMain: ['Clear', 'Clouds'][Math.floor(Math.random() * 2)],
          weatherDescription: ['helder', 'bewolkt'][Math.floor(Math.random() * 2)]
        });
      }
    }
    
    return data;
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
        return '☀️';
      case 'clouds':
        return '⛅';
      case 'rain':
        return '🌧️';
      case 'snow':
        return '❄️';
      default:
        return '🌤️';
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 20) return 'text-red-600';
    if (temp > 15) return 'text-orange-600';
    if (temp > 10) return 'text-blue-600';
    return 'text-blue-800';
  };

  const getPrecipitationColor = (precip: number) => {
    if (precip > 3) return 'text-blue-800';
    if (precip > 1) return 'text-blue-600';
    if (precip > 0) return 'text-blue-400';
    return 'text-slate-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin inline-block w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mr-3"></div>
        <span className="text-slate-600">Weerdata laden...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-slate-600 mb-4">{error}</div>
        <div className="text-sm text-slate-500">
          Hieronder zie je voorbeeld data gebaseerd op Nederlandse klimaatgemiddelden
        </div>
      </div>
    );
  }

  if (type === '5-day') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Uw regio - 5 dagen voorspelling</h3>
          <p className="text-sm text-slate-600 mb-4">Interessante extra info voor je planning</p>
          
          {/* Data Source Indicator */}
          <div className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
            dataSource === 'real' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            {dataSource === 'real' ? (
              <>✅ Real-time weerdata</>
            ) : (
              <>⚠️ Voorbeeld weerdata</>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {forecastData.slice(0, 5).map((day, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border border-stone-200 hover:shadow-md transition-shadow text-center">
              <div className="text-sm font-medium text-slate-900 mb-2">
                {index === 0 ? 'Vandaag' : (day.dayName || new Date(day.date).toLocaleDateString('nl-NL', { weekday: 'long' }))}
              </div>
              <div className="text-3xl mb-3">
                {getWeatherIcon(day.weatherMain)}
              </div>
              <div className="mb-3">
                <div className={`text-xl font-bold ${getTemperatureColor(day.temperature)}`}>
                  {day.temperature}°C
                </div>
                {day.maxTemperature && day.minTemperature && (
                  <div className="text-xs text-slate-600">
                    {day.minTemperature}° / {day.maxTemperature}°
                  </div>
                )}
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div className={`${getPrecipitationColor(day.precipitation)}`}>
                  🌧️ {day.precipitation}mm
                </div>
                <div>💨 {Math.round(day.windSpeed * 3.6)} km/h</div>
                <div>💧 {day.humidity}%</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-slate-900 mb-2">💡 Plannings tip</h4>
          <p className="text-sm text-slate-700">
            Vergelijk met je locatiedata om patronen te spotten - soms interessant, altijd handig om te weten.
          </p>
        </div>
      </div>
    );
  }

  // 24-hour forecast
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Uw regio - 24 uur voorspelling</h3>
        <p className="text-sm text-slate-600 mb-4">Uurlijkse weersverwachting voor vandaag</p>
        
        {/* Data Source Indicator */}
        <div className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${
          dataSource === 'real' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }`}>
          {dataSource === 'real' ? (
            <>✅ Real-time weerdata</>
          ) : (
            <>⚠️ Voorbeeld weerdata</>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {forecastData.slice(0, 8).map((hour, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-stone-200 hover:shadow-md transition-shadow text-center">
            <div className="text-sm font-medium text-slate-900 mb-3">
              {index === 0 ? 'Nu' : (hour.hour || `${index * 3}:00`)}
            </div>
            <div className="text-3xl mb-3">
              {getWeatherIcon(hour.weatherMain)}
            </div>
            <div className={`text-lg font-bold mb-3 ${getTemperatureColor(hour.temperature)}`}>
              {hour.temperature}°C
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              {hour.precipitation > 0 && (
                <div className={`${getPrecipitationColor(hour.precipitation)}`}>
                  🌧️ {hour.precipitation}mm
                </div>
              )}
              <div>💨 {hour.windSpeed} km/h</div>
              <div>💧 {hour.humidity}%</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <h4 className="font-medium text-slate-900 mb-2">🎯 Dagplanning</h4>
        <p className="text-sm text-slate-700">
          Uurlijkse voorspelling - handig om in je achterhoofd te houden bij planning.
        </p>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    performance: true,
    historical: true,
    insights: true,
    sensitivity: false,
    forecast: false,
    hourly: false
  });

  useEffect(() => {
    const storedResult = sessionStorage.getItem('analysisResult');
    if (storedResult) {
      setAnalysisResult(JSON.parse(storedResult));
    }
    setLoading(false);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-lg text-slate-600">Resultaten laden...</p>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Geen analyse gevonden</h1>
          <p className="text-slate-600 mb-6">
            Er kon geen analyse data gevonden worden. Upload eerst je data.
          </p>
          <Link href="/upload" className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Upload nieuwe data
          </Link>
        </div>
      </div>
    );
  }

  // Weather and AI analysis variables
  const weatherAnalysis = analysisResult;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation */}
      <nav className="bg-stone-50 border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-slate-800">
                🚚 TruckSpot
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/upload" className="text-slate-600 hover:text-slate-800 transition-colors">
                Nieuwe analyse
              </Link>
              <Link href="/" className="text-slate-600 hover:text-slate-800 transition-colors">
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Header */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Jouw analyse
            </h1>
            <p className="text-slate-600">
              Periode: {analysisResult.summary.dateRange.start} tot {analysisResult.summary.dateRange.end}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {formatCurrency(analysisResult.summary.totalRevenue)}
              </div>
              <div className="text-sm text-slate-600">Totale Omzet</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {analysisResult.summary.totalTransactions}
              </div>
              <div className="text-sm text-slate-600">Datapoints</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {formatCurrency(analysisResult.summary.averageRevenue)}
              </div>
              <div className="text-sm text-slate-600">Gemiddelde Omzet</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {analysisResult.summary.bestLocation}
              </div>
              <div className="text-sm text-slate-600">Beste Locatie</div>
            </div>
          </div>
        </div>

        {/* Analysis Sections */}
        <div className="space-y-6">
          
          {/* Location Performance */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200">
            <button 
              onClick={() => toggleSection('performance')}
              className="w-full text-left hover:bg-stone-50 transition-colors duration-200 -m-8 p-8 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Omzet per locatie</h2>
                    <p className="text-slate-600">Waar draai je het beste?</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${expandedSections.performance ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {expandedSections.performance && (
              <div className="mt-6 pt-6 border-t border-stone-200">
                {/* Interactive Bar Chart */}
                <div className="mb-8">
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-8 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
                      <span className="text-xl mr-2">📊</span>
                      Omzet vergelijking
                    </h3>
                    <div className="space-y-6">
                      {/* Clean vertical bars */}
                      <div className="overflow-x-auto">
                        <div className="flex items-end justify-center space-x-8 px-4 py-4 min-w-max" style={{ height: '280px' }}>
                          {[...analysisResult.locations].sort((a, b) => (b.totalRevenue || b.averageRevenue * b.transactionCount) - (a.totalRevenue || a.averageRevenue * a.transactionCount)).map((location, index) => {
                            const maxRevenue = Math.max(...analysisResult.locations.map(l => l.totalRevenue || l.averageRevenue * l.transactionCount));
                            const barHeight = ((location.totalRevenue || location.averageRevenue * location.transactionCount) / maxRevenue) * 100;
                            const isTop = index === 0;
                            
                            return (
                              <div key={location.name} className="flex flex-col items-center">
                                {/* Clean value above bar */}
                                <div className="mb-3 text-center">
                                  <div className="text-base font-bold text-slate-900">
                                    {formatCurrency(location.totalRevenue || location.averageRevenue * location.transactionCount)}
                                  </div>
                                  {isTop && (
                                    <div className="text-xs bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded mt-1">
                                      👑
                                    </div>
                                  )}
                                </div>
                                
                                {/* Simple clean bar */}
                                <div className="relative w-16 bg-slate-200 rounded-lg overflow-hidden" style={{ height: '200px' }}>
                                  <div 
                                    className="w-full rounded-lg absolute bottom-0 transition-all duration-1000 ease-out"
                                    style={{ 
                                      height: `${barHeight}%`,
                                      backgroundColor: `hsl(210, 75%, ${75 - (barHeight * 0.35)}%)`
                                    }}
                                  />
                                </div>
                                
                                {/* Clean location name below */}
                                <div className="mt-3 text-center flex-shrink-0" style={{ width: '140px', minHeight: '50px' }}>
                                  <div className={`font-medium text-sm leading-tight break-words ${isTop ? 'text-emerald-700' : 'text-slate-700'}`}>
                                    {location.name}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    {formatCurrency(location.totalRevenue || location.averageRevenue * location.transactionCount)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Separate comparison table below */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-3">Vergelijking met beste locatie</h4>
                        <div className="space-y-2">
                          {(() => {
                            // Sort by total revenue and get the best location
                            const sortedLocations = [...analysisResult.locations].sort((a, b) => 
                              (b.totalRevenue || b.averageRevenue * b.transactionCount) - (a.totalRevenue || a.averageRevenue * a.transactionCount)
                            );
                            const maxTotalRevenue = sortedLocations[0].totalRevenue || sortedLocations[0].averageRevenue * sortedLocations[0].transactionCount;
                            
                            return sortedLocations.slice(1).map((location) => {
                              const locationTotalRevenue = location.totalRevenue || location.averageRevenue * location.transactionCount;
                              const difference = Math.round(((maxTotalRevenue - locationTotalRevenue) / maxTotalRevenue) * 100);
                              const eurosDifference = maxTotalRevenue - locationTotalRevenue;
                              
                              return (
                                <div key={location.name} className="flex justify-between items-center text-sm">
                                  <span className="font-medium text-slate-700">{location.name}</span>
                                  <div className="text-right">
                                    <span className="text-red-600 font-medium">-{difference}%</span>
                                    <span className="text-slate-500 ml-2">(-{formatCurrency(eurosDifference)})</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Historical Performance */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200">
            <button 
              onClick={() => toggleSection('historical')}
              className="w-full text-left hover:bg-stone-50 transition-colors duration-200 -m-8 p-8 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Trends en patronen</h2>
                    <p className="text-slate-600">Wat werkt wanneer?</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${expandedSections.historical ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {expandedSections.historical && (
              <div className="mt-6 pt-6 border-t border-stone-200">
                <div className="grid lg:grid-cols-4 gap-6">
                  
                  {/* Day of Week Stats */}
                  <div>
                    <h3 className="font-medium text-slate-900 mb-4">Prestatie per dag</h3>
                    <div className="space-y-3">
                      {analysisResult.dayOfWeekStats.map((day, index) => {
                        // Create gradient based on performance ranking (same blue spectrum)
                        const intensity = Math.max(100 - (index * 80 / analysisResult.dayOfWeekStats.length), 30);
                        const bgIntensity = Math.max(50 - (index * 35 / analysisResult.dayOfWeekStats.length), 15);
                        
                        return (
                          <div key={day.day} className="flex items-center justify-between p-3 rounded-lg border" style={{
                            backgroundColor: `rgb(239 246 255 / ${bgIntensity}%)`,
                            borderColor: `rgb(147 197 253 / ${bgIntensity + 20}%)`
                          }}>
                            <div className="font-medium text-slate-900">{day.dayName}</div>
                            <div className="text-right">
                              <div className="font-semibold text-slate-900">{formatCurrency(day.averageRevenue)}</div>
                              <div className="text-sm text-slate-600">{day.transactionCount} verkopen</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Monthly Stats */}
                  <div>
                    <h3 className="font-medium text-slate-900 mb-4">Maandelijkse prestatie</h3>
                    <div className="space-y-3">
                      {analysisResult.monthlyStats.map((month, index) => {
                        // Sort by average revenue to determine ranking
                        const sortedMonths = [...analysisResult.monthlyStats].sort((a, b) => b.averageRevenue - a.averageRevenue);
                        const monthIndex = sortedMonths.findIndex(m => m.month === month.month);
                        
                        // Create gradient based on performance ranking (same blue spectrum)
                        const intensity = Math.max(100 - (monthIndex * 80 / sortedMonths.length), 30);
                        const bgIntensity = Math.max(50 - (monthIndex * 35 / sortedMonths.length), 15);
                        
                        return (
                          <div key={month.month} className="flex items-center justify-between p-3 rounded-lg border" style={{
                            backgroundColor: `rgb(239 246 255 / ${bgIntensity}%)`,
                            borderColor: `rgb(147 197 253 / ${bgIntensity + 20}%)`
                          }}>
                            <div className="font-medium text-slate-900">{month.monthName}</div>
                            <div className="text-right">
                              <div className="font-semibold text-slate-900">{formatCurrency(month.averageRevenue)}</div>
                              <div className="text-sm text-slate-600">{month.transactionCount} verkopen</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Weather Trends Chart */}
                  <div>
                    <h3 className="font-medium text-slate-900 mb-4">Weer trends</h3>
                    {weatherAnalysis && weatherAnalysis.weather && weatherAnalysis.weather.hasWeatherData ? (
                      <div className="space-y-4">
                        {/* Explanation */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-700">
                            <strong>Uitleg:</strong> Deze grafieken tonen hoe het weer je omzet beïnvloedt. 
                            0% = je gemiddelde omzet. +10% = 10% meer dan gemiddeld. -15% = 15% minder dan gemiddeld.
                          </p>
                        </div>
                        {/* Temperature vs Revenue Chart */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-orange-200">
                          <h4 className="text-sm font-medium text-slate-900 mb-3">🌡️ Temperatuur prestatie</h4>
                          <div className="space-y-2">
                            {(() => {
                              // Calculate relative performance based on temperature correlation
                              const basePerformance = 100;
                              const tempCorr = weatherAnalysis.weather.correlation.temperature.correlation;
                              
                              const tempRanges = [
                                { 
                                  range: '<10°C', 
                                  value: basePerformance + (tempCorr * -25), // Cold generally lower
                                  label: 'Koud weer'
                                },
                                { 
                                  range: '10-18°C', 
                                  value: basePerformance + (tempCorr * 10), // Mild usually good
                                  label: 'Mild weer'
                                },
                                { 
                                  range: '>18°C', 
                                  value: basePerformance + (tempCorr * 20), // Warm depends on correlation
                                  label: 'Warm weer'
                                }
                              ];
                              
                              // Ensure values are positive and reasonable
                              tempRanges.forEach(temp => {
                                temp.value = Math.max(50, Math.min(150, temp.value));
                              });
                              
                              const maxValue = Math.max(...tempRanges.map(r => r.value));
                              
                              return tempRanges.map((temp, index) => (
                                <div key={index} className="flex items-center">
                                  <div className="w-16 text-xs text-slate-700">{temp.range}</div>
                                  <div className="flex-1 mx-2">
                                    <div className="h-4 bg-white rounded-full overflow-hidden border">
                                      <div 
                                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000"
                                        style={{ width: `${(temp.value / maxValue) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="w-16 text-xs text-slate-600 text-right">
                                    {temp.value > 100 ? '+' : ''}{Math.round(temp.value - 100)}%
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                          <p className="text-xs text-slate-600 mt-2">Relatieve prestatie t.o.v. gemiddelde (0%)</p>
                        </div>

                        {/* Precipitation Impact Chart */}
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="text-sm font-medium text-slate-900 mb-3">🌧️ Neerslag prestatie</h4>
                          <div className="space-y-2">
                            {(() => {
                              // Calculate relative performance based on precipitation impact
                              const basePerformance = 100;
                              const precipImpact = weatherAnalysis.weather.correlation.precipitation.averageImpact;
                              
                              const precipRanges = [
                                { 
                                  range: '0mm', 
                                  value: basePerformance, // Dry weather = baseline
                                  label: 'Droog weer'
                                },
                                { 
                                  range: '1-5mm', 
                                  value: basePerformance + (precipImpact * 0.5), // Light rain impact
                                  label: 'Lichte regen'
                                },
                                { 
                                  range: '5+mm', 
                                  value: basePerformance + precipImpact, // Heavy rain full impact
                                  label: 'Zware regen'
                                }
                              ];
                              
                              // Ensure values are positive and reasonable
                              precipRanges.forEach(precip => {
                                precip.value = Math.max(30, Math.min(120, precip.value));
                              });
                              
                              const maxValue = Math.max(...precipRanges.map(r => r.value));
                              
                              return precipRanges.map((precip, index) => (
                                <div key={index} className="flex items-center">
                                  <div className="w-16 text-xs text-slate-700">{precip.range}</div>
                                  <div className="flex-1 mx-2">
                                    <div className="h-4 bg-white rounded-full overflow-hidden border">
                                      <div 
                                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 transition-all duration-1000"
                                        style={{ width: `${(precip.value / maxValue) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="w-16 text-xs text-slate-600 text-right">
                                    {precip.value > 100 ? '+' : ''}{Math.round(precip.value - 100)}%
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                          <p className="text-xs text-slate-600 mt-2">Relatieve prestatie t.o.v. gemiddelde (0%)</p>
                        </div>

                        {/* Weather Conditions Summary */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                          <h4 className="text-sm font-medium text-slate-900 mb-3">☀️ Beste condities</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-700">Optimale temperatuur:</span>
                              <span className="font-medium text-green-700">
                                {weatherAnalysis.weather.correlation.temperature.optimalRange[0]}°C - {weatherAnalysis.weather.correlation.temperature.optimalRange[1]}°C
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-700">Weer correlatie:</span>
                              <span className={`font-medium ${
                                weatherAnalysis.weather.correlation.temperature.impact === 'positive' ? 'text-green-700' :
                                weatherAnalysis.weather.correlation.temperature.impact === 'negative' ? 'text-red-700' :
                                'text-slate-700'
                              }`}>
                                {weatherAnalysis.weather.correlation.temperature.impact === 'positive' ? 'Positief' :
                                 weatherAnalysis.weather.correlation.temperature.impact === 'negative' ? 'Negatief' :
                                 'Neutraal'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <div className="text-2xl mb-2">📊</div>
                        <p className="text-sm">Geen weerdata beschikbaar</p>
                        <p className="text-xs mt-1">Upload data met weeranalyse</p>
                      </div>
                    )}
                  </div>

                  {/* Monthly Revenue Chart */}
                  <div>
                    <h3 className="font-medium text-slate-900 mb-4">Maandelijkse omzet</h3>
                    <div className="space-y-4">
                      {/* Monthly Bar Chart */}
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="text-sm font-medium text-slate-900 mb-3">📊 Omzet per maand</h4>
                        <div className="space-y-2">
                          {(() => {
                            // Sort months chronologically
                            const sortedMonths = [...analysisResult.monthlyStats].sort((a, b) => a.month.localeCompare(b.month));
                            const maxRevenue = Math.max(...sortedMonths.map(m => m.totalRevenue));
                            
                            return sortedMonths.map((month, index) => (
                              <div key={month.month} className="flex items-center">
                                <div className="w-16 text-xs text-slate-700">
                                  {month.monthName.split(' ')[0].slice(0, 3)}
                                </div>
                                <div className="flex-1 mx-2">
                                  <div className="h-5 bg-white rounded-full overflow-hidden border">
                                    <div 
                                      className="h-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-1000"
                                      style={{ width: `${(month.totalRevenue / maxRevenue) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="w-16 text-xs text-slate-600 text-right">
                                  {formatCurrency(month.totalRevenue)}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                        <p className="text-xs text-slate-600 mt-2">Totale omzet per maand</p>
                      </div>

                      {/* Monthly Average Chart */}
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
                        <h4 className="text-sm font-medium text-slate-900 mb-3">📈 Gemiddelde per dag</h4>
                        <div className="space-y-2">
                          {(() => {
                            const sortedMonths = [...analysisResult.monthlyStats].sort((a, b) => a.month.localeCompare(b.month));
                            const maxAvgRevenue = Math.max(...sortedMonths.map(m => m.averageRevenue));
                            
                            return sortedMonths.map((month, index) => (
                              <div key={month.month} className="flex items-center">
                                <div className="w-16 text-xs text-slate-700">
                                  {month.monthName.split(' ')[0].slice(0, 3)}
                                </div>
                                <div className="flex-1 mx-2">
                                  <div className="h-4 bg-white rounded-full overflow-hidden border">
                                    <div 
                                      className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 transition-all duration-1000"
                                      style={{ width: `${(month.averageRevenue / maxAvgRevenue) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="w-16 text-xs text-slate-600 text-right">
                                  {formatCurrency(month.averageRevenue)}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                        <p className="text-xs text-slate-600 mt-2">Gemiddelde omzet per verkoopdag</p>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Location Weather Sensitivity */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200">
            <button 
              onClick={() => toggleSection('sensitivity')}
              className="w-full text-left hover:bg-stone-50 transition-colors duration-200 -m-8 p-8 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Weer impact</h2>
                    <p className="text-slate-600">Hoe het weer je omzet beïnvloedt per locatie</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${expandedSections.sensitivity ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {expandedSections.sensitivity && (
              <div className="mt-6 pt-6 border-t border-stone-200">
                {weatherAnalysis && weatherAnalysis.weather && weatherAnalysis.weather.locationAnalysis ? (
                  <div className="space-y-8">
                    {/* Overall Summary */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">Overzicht weergevoeligheid</h3>
                        <p className="text-sm text-slate-600 mb-4">
                          Het percentage toont het verschil tussen je beste en slechtste weerdag als percentage van je gemiddelde omzet.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900">{weatherAnalysis.weather.locationAnalysis.overallSensitivity.avgSensitivity}%</div>
                            <div className="text-sm text-slate-600">Gemiddelde gevoeligheid</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">{weatherAnalysis.weather.locationAnalysis.overallSensitivity.leastSensitive}</div>
                            <div className="text-sm text-slate-600">Minst gevoelig</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-red-600">{weatherAnalysis.weather.locationAnalysis.overallSensitivity.mostSensitive}</div>
                            <div className="text-sm text-slate-600">Meest gevoelig</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location Analysis */}
                    {weatherAnalysis.weather.locationAnalysis.locations.map((location: any, locationIndex: number) => (
                      <div key={location.locationName} className="bg-stone-50 p-6 rounded-xl border border-stone-200">
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-slate-900">{location.locationName}</h3>
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-slate-900">{formatCurrency(location.baselineRevenue)}</div>
                                <div className="text-xs text-slate-600">Gemiddeld</div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                location.sensitivityLevel === 'hoog' ? 'bg-red-100 text-red-800' :
                                location.sensitivityLevel === 'middel' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {location.sensitivityLevel} gevoelig ({location.sensitivityScore}%)
                              </div>
                            </div>
                          </div>

                          {/* 3x3 Weather Matrix */}
                          <div className="bg-white p-4 rounded-lg border border-stone-200">
                            <h4 className="font-medium text-slate-900 mb-4 text-center">Weermatrix: temperatuur × neerslag</h4>
                            
                            {/* Matrix Headers */}
                            <div className="grid grid-cols-4 gap-2 mb-2">
                              <div></div>
                              <div className="text-center text-sm font-medium text-slate-700 p-2">droog (&lt;1mm)</div>
                              <div className="text-center text-sm font-medium text-slate-700 p-2">licht nat (1-5mm)</div>
                              <div className="text-center text-sm font-medium text-slate-700 p-2">nat (&gt;5mm)</div>
                            </div>

                            {/* Matrix Rows */}
                            {['warm', 'mild', 'koud'].map((tempCategory) => (
                              <div key={tempCategory} className="grid grid-cols-4 gap-2 mb-2">
                                <div className="text-sm font-medium text-slate-700 p-2 flex items-center">
                                  {tempCategory === 'warm' ? 'warm (>18°C)' :
                                   tempCategory === 'mild' ? 'mild (10-18°C)' :
                                   'koud (<10°C)'}
                                </div>
                                
                                {['droog', 'lichtNat', 'nat'].map((rainCategory) => {
                                  const scenarioKey = `${tempCategory}${rainCategory.charAt(0).toUpperCase() + rainCategory.slice(1)}` as keyof typeof location.scenarios;
                                  const scenario = location.scenarios[scenarioKey];
                                  const impactPercentage = scenario.count > 0 ? 
                                    Math.round(((scenario.avgRevenue - location.baselineRevenue) / location.baselineRevenue) * 100) : 0;
                                  
                                  return (
                                    <div key={rainCategory} className={`p-3 rounded-lg border text-center text-sm ${
                                      scenario.count === 0 ? 'bg-gray-100 border-gray-200' :
                                      impactPercentage > 15 ? 'bg-green-100 border-green-300' :
                                      impactPercentage > 5 ? 'bg-blue-100 border-blue-300' :
                                      impactPercentage > -5 ? 'bg-yellow-100 border-yellow-300' :
                                      impactPercentage > -15 ? 'bg-orange-100 border-orange-300' :
                                      'bg-red-100 border-red-300'
                                    }`}>
                                      {scenario.count > 0 ? (
                                        <>
                                          <div className="font-semibold">{formatCurrency(scenario.avgRevenue)}</div>
                                          <div className={`text-xs ${impactPercentage > 0 ? 'text-green-700' : impactPercentage < 0 ? 'text-red-700' : 'text-slate-600'}`}>
                                            {impactPercentage > 0 ? '+' : ''}{impactPercentage}%
                                          </div>
                                          <div className="text-xs text-slate-500">({scenario.count} dagen)</div>
                                        </>
                                      ) : (
                                        <div className="text-gray-500 text-xs">Geen data</div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ))}

                    {/* Legend */}
                    <div className="bg-white p-4 rounded-lg border border-stone-200">
                      <h4 className="font-medium text-slate-900 mb-3">Legenda</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                          <span>zeer goed (+15%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                          <span>goed (+5%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                          <span>gemiddeld (±5%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                          <span>matig (-15%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                          <span>slecht (-15%+)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="font-medium text-slate-900 mb-2">Locatie Weeranalyse Niet Beschikbaar</h3>
                    <p className="text-slate-600">
                      Upload je data met weer-analyse ingeschakeld om locatie-specifieke inzichten te krijgen.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Data Insights */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200">
            <button 
              onClick={() => toggleSection('insights')}
              className="w-full text-left hover:bg-stone-50 transition-colors duration-200 -m-8 p-8 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Wat opvalt in je data</h2>
                    <p className="text-slate-600">Patronen die misschien interessant zijn</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${expandedSections.insights ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {expandedSections.insights && (
              <div className="mt-6 pt-6 border-t border-stone-200">
                <div className="space-y-8">
                  
                  {/* Time Trends */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <span className="text-xl mr-2">📈</span>
                      Trends over tijd
                    </h3>
                    <div className="space-y-3">
                      {(() => {
                        const insights = [];
                        
                        // Week patterns
                        const dayStats = analysisResult.dayOfWeekStats.sort((a, b) => b.averageRevenue - a.averageRevenue);
                        if (dayStats.length > 0) {
                          const bestDay = dayStats[0];
                          const worstDay = dayStats[dayStats.length - 1];
                          const difference = Math.round(bestDay.averageRevenue - worstDay.averageRevenue);
                          if (difference > 50) {
                            insights.push(`${bestDay.dayName} consistent €${difference} beter dan ${worstDay.dayName}`);
                          }
                        }
                        
                        // Monthly patterns
                        const monthStats = analysisResult.monthlyStats.sort((a, b) => b.averageRevenue - a.averageRevenue);
                        if (monthStats.length > 1) {
                          const bestMonth = monthStats[0];
                          const worstMonth = monthStats[monthStats.length - 1];
                          const seasonalDiff = Math.round(((bestMonth.averageRevenue - worstMonth.averageRevenue) / worstMonth.averageRevenue) * 100);
                          if (seasonalDiff > 25) {
                            insights.push(`${bestMonth.monthName} vs ${worstMonth.monthName}: ${seasonalDiff}% seizoensverschil`);
                          }
                        }
                        
                        if (insights.length === 0) {
                          insights.push('Stabiele prestatie over tijd - geen sterke seizoens- of dagpatronen');
                        }
                        
                        return insights;
                      })().map((insight, index) => (
                        <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-slate-700 text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weather Sensitivity per Location */}
                  {weatherAnalysis && weatherAnalysis.weather && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                        <span className="text-xl mr-2">🌦️</span>
                        Weergevoeligheid per locatie
                      </h3>
                      <div className="space-y-3">
                        {(() => {
                          const insights = [];
                          const locations = analysisResult.locations;
                          
                          // Location-specific weather insights
                          if (weatherAnalysis.weather.locationAnalysis && weatherAnalysis.weather.locationAnalysis.locations) {
                            const locationSensitivities = weatherAnalysis.weather.locationAnalysis.locations.map(loc => ({
                              name: loc.locationName,
                              sensitivity: loc.sensitivityScore,
                              level: loc.sensitivityLevel
                            })).sort((a, b) => b.sensitivity - a.sensitivity);
                            
                            // Most weather-resistant location
                            const mostResistant = locationSensitivities[locationSensitivities.length - 1];
                            if (mostResistant && mostResistant.sensitivity < 20) {
                              insights.push(`${mostResistant.name} is zeer weerbestendig (${mostResistant.sensitivity}% variatie)`);
                            }
                            
                            // Most weather-sensitive location
                            const mostSensitive = locationSensitivities[0];
                            if (mostSensitive && mostSensitive.sensitivity > 30) {
                              insights.push(`${mostSensitive.name} zeer weergevoelig (${mostSensitive.sensitivity}% variatie)`);
                            }
                            
                            // Best weather locations comparison
                            const bestWeatherLocations = locationSensitivities.filter(loc => loc.sensitivity < 25).slice(0, 2);
                            if (bestWeatherLocations.length >= 2) {
                              const names = bestWeatherLocations.map(loc => loc.name).join(' en ');
                              insights.push(`${names} presteren het stabielst ongeacht weer`);
                            }
                            
                            // Temperature-specific location advice
                            if (weatherAnalysis.weather.correlation.temperature.correlation > 0.4) {
                              const tempCorr = weatherAnalysis.weather.correlation.temperature;
                              const optimalTemp = tempCorr.optimalRange ? `${tempCorr.optimalRange[0]}-${tempCorr.optimalRange[1]}°C` : '18-25°C';
                              insights.push(`Optimale temperatuur voor omzet: ${optimalTemp}`);
                            }
                          }
                          
                          // Precipitation impact on specific locations
                          const precipCorr = weatherAnalysis.weather.correlation.precipitation;
                          if (Math.abs(precipCorr.averageImpact) > 20 && locations.length >= 3) {
                            const impact = Math.abs(precipCorr.averageImpact);
                            insights.push(`Regen impact: gemiddeld €${impact} omzetverlies per mm neerslag`);
                          }
                          
                          if (insights.length === 0) {
                            insights.push('Weerdata toont geen sterke locatie-specifieke patronen');
                          }
                          
                          return insights;
                        })().map((insight, index) => (
                          <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-slate-700 text-sm">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Surprising Insights */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <span className="text-xl mr-2">💡</span>
                      Verrassende inzichten
                    </h3>
                    <div className="space-y-3">
                      {(() => {
                        const insights = [];
                        const locations = analysisResult.locations.sort((a, b) => b.averageRevenue - a.averageRevenue);
                        const dayStats = analysisResult.dayOfWeekStats.sort((a, b) => b.averageRevenue - a.averageRevenue);
                        
                        // Location performance spread
                        if (locations.length >= 2) {
                          const best = locations[0];
                          const worst = locations[locations.length - 1];
                          const difference = Math.round(((best.averageRevenue - worst.averageRevenue) / worst.averageRevenue) * 100);
                          if (difference > 40) {
                            insights.push(`${best.name} doet het ${difference}% beter dan ${worst.name} - grote locatieverschillen`);
                          }
                        }
                        
                        // Weekend vs weekday surprise
                        const weekendDays = dayStats.filter(d => d.dayName === 'Zaterdag' || d.dayName === 'Zondag');
                        const weekDays = dayStats.filter(d => !['Zaterdag', 'Zondag'].includes(d.dayName));
                        
                        if (weekendDays.length > 0 && weekDays.length > 0) {
                          const weekendAvg = weekendDays.reduce((sum, d) => sum + d.averageRevenue, 0) / weekendDays.length;
                          const weekdayAvg = weekDays.reduce((sum, d) => sum + d.averageRevenue, 0) / weekDays.length;
                          const isWeekendBetter = weekendAvg > weekdayAvg;
                          const difference = Math.round(Math.abs(weekendAvg - weekdayAvg));
                          
                          if (difference > 40) {
                            insights.push(`${isWeekendBetter ? 'Weekend' : 'Doordeweeks'} is €${difference} beter - onverwacht patroon`);
                          }
                        }
                        
                        // Best day insight
                        if (dayStats.length > 0) {
                          const bestDay = dayStats[0];
                          const averageRevenue = analysisResult.summary.averageRevenue;
                          const boost = Math.round(bestDay.averageRevenue - averageRevenue);
                          if (boost > 50) {
                            insights.push(`${bestDay.dayName} geeft consistent €${boost} extra - focus op deze dag`);
                          }
                        }
                        
                        // Add weather-based insights
                        if (weatherAnalysis && weatherAnalysis.weather) {
                          // Temperature correlation insights
                          const tempCorr = weatherAnalysis.weather.correlation.temperature;
                          if (Math.abs(tempCorr.correlation) > 0.4) {
                            const correlation = Math.round(tempCorr.correlation * 100);
                            const direction = tempCorr.correlation > 0 ? 'positieve' : 'negatieve';
                            insights.push(`Sterke ${direction} temperatuurcorrelatie (${Math.abs(correlation)}%) - weer speelt een belangrijke rol`);
                          }
                          
                          // Location weather sensitivity insight
                          if (weatherAnalysis.weather.locationAnalysis && weatherAnalysis.weather.locationAnalysis.locations) {
                            const locationSensitivities = weatherAnalysis.weather.locationAnalysis.locations.map(loc => ({
                              name: loc.locationName,
                              sensitivity: loc.sensitivityScore
                            })).sort((a, b) => b.sensitivity - a.sensitivity);
                            
                            if (locationSensitivities.length >= 2) {
                              const mostSensitive = locationSensitivities[0];
                              const leastSensitive = locationSensitivities[locationSensitivities.length - 1];
                              const sensitivityDiff = mostSensitive.sensitivity - leastSensitive.sensitivity;
                              
                              if (sensitivityDiff > 20) {
                                insights.push(`${mostSensitive.name} is ${sensitivityDiff}% weergevoeliger dan ${leastSensitive.name} - locatiestrategie belangrijk bij slecht weer`);
                              }
                            }
                          }
                          
                          // Best weather condition
                          if (weatherAnalysis.weather.correlation.conditions && weatherAnalysis.weather.correlation.conditions.length > 0) {
                            const bestCondition = weatherAnalysis.weather.correlation.conditions[0];
                            if (bestCondition.revenueImpact > 50) {
                              const impactPercent = Math.round((bestCondition.revenueImpact / analysisResult.summary.averageRevenue) * 100);
                              insights.push(`${bestCondition.condition.toLowerCase()} verhoogt omzet met ${impactPercent}% - optimaal weer heeft grote impact`);
                            }
                          }
                        }
                        
                        if (insights.length === 0) {
                          insights.push('Data toont stabiele patronen - geen grote verrassingen');
                        }
                        
                        return insights;
                      })().map((insight, index) => (
                        <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-slate-700 text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Unsolicited Advice */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                      <span className="text-xl mr-2">💡</span>
                      Ongevraagd advies
                    </h3>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {(() => {
                          const locations = analysisResult.locations.sort((a, b) => b.averageRevenue - a.averageRevenue);
                          const dayStats = analysisResult.dayOfWeekStats.sort((a, b) => b.averageRevenue - a.averageRevenue);
                          const monthStats = analysisResult.monthlyStats.sort((a, b) => b.averageRevenue - a.averageRevenue);
                          
                          let story = "";
                          
                          // Start with location insights
                          if (locations.length >= 2) {
                            const best = locations[0];
                            const worst = locations[locations.length - 1];
                            const difference = Math.round(((best.averageRevenue - worst.averageRevenue) / worst.averageRevenue) * 100);
                            
                            if (difference > 50) {
                              story += `De data toont een duidelijk patroon: ${best.name} presteert ${difference}% beter dan ${worst.name}. `;
                            }
                          }
                          
                          // Add timing insights
                          if (dayStats.length > 0) {
                            const bestDay = dayStats[0];
                            const boost = Math.round(bestDay.averageRevenue - analysisResult.summary.averageRevenue);
                            if (boost > 40) {
                              story += `${bestDay.dayName} genereert consistent €${boost} meer dan de gemiddelde dag. `;
                            }
                            
                            // Weekend pattern
                            const weekendDays = dayStats.filter(d => d.dayName === 'Zaterdag' || d.dayName === 'Zondag');
                            const weekDays = dayStats.filter(d => !['Zaterdag', 'Zondag'].includes(d.dayName));
                            
                            if (weekendDays.length > 0 && weekDays.length > 0) {
                              const weekendAvg = weekendDays.reduce((sum, d) => sum + d.averageRevenue, 0) / weekendDays.length;
                              const weekdayAvg = weekDays.reduce((sum, d) => sum + d.averageRevenue, 0) / weekDays.length;
                              const isWeekendBetter = weekendAvg > weekdayAvg;
                              const difference = Math.round(Math.abs(weekendAvg - weekdayAvg));
                              
                              if (difference > 30) {
                                story += `${isWeekendBetter ? 'Weekend' : 'Doordeweekse'} dagen presteren €${difference} beter. `;
                              }
                            }
                          }
                          
                          // Add detailed weather impact based on correlation results
                          if (weatherAnalysis && weatherAnalysis.weather) {
                            const precipCorr = weatherAnalysis.weather.correlation.precipitation;
                            const tempCorr = weatherAnalysis.weather.correlation.temperature;
                            
                            // Precipitation impact
                            if (Math.abs(precipCorr.averageImpact) > 20) {
                              const impact = Math.abs(precipCorr.averageImpact);
                              story += `Weersinvloed is meetbaar: elke mm neerslag resulteert in €${impact} omzetverschil. `;
                            }
                            
                            // Temperature correlation
                            if (Math.abs(tempCorr.correlation) > 0.3) {
                              const correlation = Math.round(tempCorr.correlation * 100);
                              const direction = tempCorr.correlation > 0 ? 'Warme' : 'Koude';
                              story += `${direction} dagen correleren ${Math.abs(correlation)}% met omzet - weer is een belangrijke factor. `;
                              
                              // Add optimal temperature range
                              if (tempCorr.optimalRange && tempCorr.optimalRange.length === 2) {
                                story += `Optimale temperatuur ligt tussen ${tempCorr.optimalRange[0]}°C en ${tempCorr.optimalRange[1]}°C. `;
                              }
                            }
                            
                            // Location-specific weather advice
                            if (weatherAnalysis.weather.locationAnalysis && weatherAnalysis.weather.locationAnalysis.locations) {
                              const locationSensitivities = weatherAnalysis.weather.locationAnalysis.locations.map(loc => ({
                                name: loc.locationName,
                                sensitivity: loc.sensitivityScore
                              })).sort((a, b) => b.sensitivity - a.sensitivity);
                              
                              if (locationSensitivities.length >= 2) {
                                const mostSensitive = locationSensitivities[0];
                                const leastSensitive = locationSensitivities[locationSensitivities.length - 1];
                                const sensitivityDiff = mostSensitive.sensitivity - leastSensitive.sensitivity;
                                
                                if (sensitivityDiff > 15) {
                                  story += `Bij slecht weer: overweeg ${leastSensitive.name} (${leastSensitive.sensitivity}% gevoelig) boven ${mostSensitive.name} (${mostSensitive.sensitivity}% gevoelig). `;
                                }
                              }
                            }
                            
                            // Worst weather condition
                            if (weatherAnalysis.weather.correlation.conditions.length > 0) {
                              const worstCondition = weatherAnalysis.weather.correlation.conditions[weatherAnalysis.weather.correlation.conditions.length - 1];
                              if (worstCondition.revenueImpact < -50) {
                                const impactPercent = Math.round((worstCondition.revenueImpact / analysisResult.summary.averageRevenue) * 100);
                                story += `${worstCondition.condition.toLowerCase().charAt(0).toUpperCase() + worstCondition.condition.toLowerCase().slice(1)} kost je ${Math.abs(impactPercent)}% omzet - misschien een open deur, maar interessant om de exacte impact te zien. `;
                              }
                            }
                          }
                          
                          // Seasonal insight
                          if (monthStats.length > 1) {
                            const bestMonth = monthStats[0];
                            const worstMonth = monthStats[monthStats.length - 1];
                            const seasonalDiff = Math.round(((bestMonth.averageRevenue - worstMonth.averageRevenue) / worstMonth.averageRevenue) * 100);
                            if (seasonalDiff > 30) {
                              story += `${bestMonth.monthName} doet het ${seasonalDiff}% beter dan ${worstMonth.monthName}. `;
                            }
                          }
                          
                          // Conclusion with weather consideration
                          if (story.length > 50) {
                            if (weatherAnalysis && weatherAnalysis.weather) {
                              story += "Met deze informatie over weer, locatie en timing kun je strategischer kiezen waar en wanneer je gaat staan.";
                            } else {
                              story += "Met deze informatie kun je bewuster kiezen waar en wanneer je gaat staan.";
                            }
                          } else {
                            story = "De data toont stabiele prestaties. Dit betekent dat je processen goed lopen en er ruimte is voor meer gerichte optimalisaties.";
                          }
                          
                          return story;
                        })()}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* 5-Day Weather Forecast */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 mt-8">
            <button 
              onClick={() => toggleSection('forecast')}
              className="w-full text-left hover:bg-stone-50 transition-colors duration-200 -m-8 p-8 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.002 4.002 0 003 15z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Weer komende dagen</h2>
                    <p className="text-slate-600">Extra info, niet per se actionable</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${expandedSections.forecast ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {expandedSections.forecast && (
              <div className="mt-6 pt-6 border-t border-stone-200">
                <WeatherForecastContent type="5-day" />
              </div>
            )}
          </div>

          {/* 24-Hour Weather Forecast */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-stone-200 mt-6">
            <button 
              onClick={() => toggleSection('hourly')}
              className="w-full text-left hover:bg-stone-50 transition-colors duration-200 -m-8 p-8 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Weer vandaag</h2>
                    <p className="text-slate-600">Voor de volledigheid</p>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${expandedSections.hourly ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {expandedSections.hourly && (
              <div className="mt-6 pt-6 border-t border-stone-200">
                <WeatherForecastContent type="24-hour" />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}