interface CSVRow {
  datum: string;
  locatie: string;
  omzet: string;
}

interface LocationStats {
  name: string;
  totalRevenue: number;
  averageRevenue: number;
  transactionCount: number;
  bestDay: string;
  worstDay: string;
}

interface DayStats {
  day: string;
  dayName: string;
  totalRevenue: number;
  averageRevenue: number;
  transactionCount: number;
}

interface MonthStats {
  month: string;
  monthName: string;
  totalRevenue: number;
  averageRevenue: number;
  transactionCount: number;
}

interface AnalysisResult {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averageRevenue: number;
    bestLocation: string;
    worstLocation: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
  locations: LocationStats[];
  dayOfWeekStats: DayStats[];
  monthlyStats: MonthStats[];
  insights: string[];
  weather?: {
    correlation: import('./weather').WeatherCorrelation;
    hasWeatherData: boolean;
    weatherInsights: string[];
    locationAnalysis?: import('./weather').LocationWeatherAnalysis;
  };
  aiAnalysis?: {
    deepInsights: string[];
    strategicRecommendations: string[];
    actionableAdvice: string[];
    opportunityAnalysis: string[];
    riskAssessment: string[];
    businessRecommendations: {
      locationStrategy: string[];
      timingOptimization: string[];
      weatherBasedActions: string[];
      revenueOptimization: string[];
      operationalAdvice: string[];
    };
    hasAiAnalysis: boolean;
  };
}

export function analyzeData(data: CSVRow[]): AnalysisResult {
  if (!data || data.length === 0) {
    throw new Error('Geen data om te analyseren');
  }

  // Parse and validate data
  const parsedData = data.map((row, index) => {
    const revenue = parseFloat(row.omzet.replace(',', '.'));
    if (isNaN(revenue)) {
      console.warn(`Invalid revenue at row ${index + 1}: ${row.omzet}`);
      return null;
    }

    const date = parseDate(row.datum);
    if (!date) {
      console.warn(`Invalid date at row ${index + 1}: ${row.datum}`);
      return null;
    }

    return {
      date,
      location: row.locatie.trim(),
      revenue,
      originalRow: row
    };
  }).filter(Boolean) as Array<{
    date: Date;
    location: string;
    revenue: number;
    originalRow: CSVRow;
  }>;

  if (parsedData.length === 0) {
    throw new Error('Geen geldige data gevonden om te analyseren');
  }

  // Calculate summary
  const totalRevenue = parsedData.reduce((sum, row) => sum + row.revenue, 0);
  const totalTransactions = parsedData.length;
  const averageRevenue = totalRevenue / totalTransactions;

  // Date range
  const dates = parsedData.map(row => row.date).sort((a, b) => a.getTime() - b.getTime());
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  // Location analysis
  const locationMap = new Map<string, Array<{date: Date, revenue: number}>>();
  parsedData.forEach(row => {
    if (!locationMap.has(row.location)) {
      locationMap.set(row.location, []);
    }
    locationMap.get(row.location)!.push({date: row.date, revenue: row.revenue});
  });

  const locations: LocationStats[] = Array.from(locationMap.entries()).map(([name, transactions]) => {
    const totalRev = transactions.reduce((sum, t) => sum + t.revenue, 0);
    const avgRev = totalRev / transactions.length;
    
    // Find best and worst days
    const sortedByRevenue = [...transactions].sort((a, b) => b.revenue - a.revenue);
    const bestDay = formatDate(sortedByRevenue[0].date);
    const worstDay = formatDate(sortedByRevenue[sortedByRevenue.length - 1].date);

    return {
      name,
      totalRevenue: totalRev,
      averageRevenue: avgRev,
      transactionCount: transactions.length,
      bestDay,
      worstDay
    };
  }).sort((a, b) => b.averageRevenue - a.averageRevenue);


  // Day of week analysis
  const dayOfWeekMap = new Map<number, Array<{revenue: number}>>();
  parsedData.forEach(row => {
    const dayOfWeek = row.date.getDay();
    if (!dayOfWeekMap.has(dayOfWeek)) {
      dayOfWeekMap.set(dayOfWeek, []);
    }
    dayOfWeekMap.get(dayOfWeek)!.push({revenue: row.revenue});
  });

  const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  const dayOfWeekStats: DayStats[] = Array.from(dayOfWeekMap.entries()).map(([dayNum, transactions]) => {
    const totalRev = transactions.reduce((sum, t) => sum + t.revenue, 0);
    const avgRev = totalRev / transactions.length;

    return {
      day: dayNum.toString(),
      dayName: dayNames[dayNum],
      totalRevenue: totalRev,
      averageRevenue: avgRev,
      transactionCount: transactions.length
    };
  }).sort((a, b) => b.averageRevenue - a.averageRevenue);

  // Monthly analysis
  const monthMap = new Map<string, Array<{revenue: number}>>();
  parsedData.forEach(row => {
    const monthKey = `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }
    monthMap.get(monthKey)!.push({revenue: row.revenue});
  });

  const monthNames = [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
  ];

  const monthlyStats: MonthStats[] = Array.from(monthMap.entries()).map(([monthKey, transactions]) => {
    const [year, month] = monthKey.split('-');
    const monthIndex = parseInt(month) - 1;
    const totalRev = transactions.reduce((sum, t) => sum + t.revenue, 0);
    const avgRev = totalRev / transactions.length;

    return {
      month: monthKey,
      monthName: `${monthNames[monthIndex]} ${year}`,
      totalRevenue: totalRev,
      averageRevenue: avgRev,
      transactionCount: transactions.length
    };
  }).sort((a, b) => a.month.localeCompare(b.month));

  // Generate insights
  const insights = generateInsights(locations, dayOfWeekStats, monthlyStats, totalRevenue, totalTransactions);

  return {
    summary: {
      totalRevenue,
      totalTransactions,
      averageRevenue,
      bestLocation: locations[0]?.name || 'Onbekend',
      worstLocation: locations[locations.length - 1]?.name || 'Onbekend',
      dateRange: {
        start: formatDate(startDate),
        end: formatDate(endDate)
      }
    },
    locations,
    dayOfWeekStats,
    monthlyStats,
    insights
  };
}

function parseDate(dateString: string): Date | null {
  // Try different date formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
  ];

  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      if (format === formats[0]) { // YYYY-MM-DD
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      } else { // DD-MM-YYYY or DD/MM/YYYY
        return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      }
    }
  }

  return null;
}

function formatDate(date: Date): string {
  // Use manual formatting to avoid timezone issues
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

function generateInsights(
  locations: LocationStats[], 
  dayStats: DayStats[], 
  monthlyStats: MonthStats[], 
  totalRevenue: number, 
  totalTransactions: number
): string[] {
  const insights: string[] = [];

  // Location insights
  if (locations.length >= 2) {
    const best = locations[0];
    const worst = locations[locations.length - 1];
    
    if (best.averageRevenue > 0 && worst.averageRevenue > 0) {
      const difference = ((best.averageRevenue - worst.averageRevenue) / worst.averageRevenue * 100);
      if (difference > 10) {
        insights.push(`${best.name} presteert ${Math.round(difference)}% beter dan ${worst.name} (€${Math.round(best.averageRevenue)} vs €${Math.round(worst.averageRevenue)} gemiddeld).`);
      }
    }

    // Find consistent performers
    const consistentLocation = locations.find(loc => 
      loc.transactionCount >= 3 && 
      loc.averageRevenue > totalRevenue / totalTransactions * 1.1
    );
    
    if (consistentLocation) {
      insights.push(`${consistentLocation.name} is een constante topper met ${consistentLocation.transactionCount} verkoopdagen en een bovengemiddelde omzet.`);
    }
  }

  // Day of week insights
  if (dayStats.length >= 2) {
    const bestDay = dayStats[0];
    const worstDay = dayStats[dayStats.length - 1];
    
    if (bestDay.averageRevenue > worstDay.averageRevenue * 1.15) {
      insights.push(`${bestDay.dayName} is je beste dag (€${Math.round(bestDay.averageRevenue)} gemiddeld), terwijl ${worstDay.dayName} het minst oplevert (€${Math.round(worstDay.averageRevenue)} gemiddeld).`);
    }

    // Weekend vs weekday analysis
    const weekendDays = dayStats.filter(d => d.day === '0' || d.day === '6'); // Sunday = 0, Saturday = 6
    const weekDays = dayStats.filter(d => d.day !== '0' && d.day !== '6');
    
    if (weekendDays.length > 0 && weekDays.length > 0) {
      const weekendAvg = weekendDays.reduce((sum, d) => sum + d.averageRevenue, 0) / weekendDays.length;
      const weekdayAvg = weekDays.reduce((sum, d) => sum + d.averageRevenue, 0) / weekDays.length;
      
      if (weekendAvg > weekdayAvg * 1.1) {
        insights.push(`Weekenden zijn ${Math.round(((weekendAvg - weekdayAvg) / weekdayAvg) * 100)}% winstgevender dan doordeweekse dagen.`);
      } else if (weekdayAvg > weekendAvg * 1.1) {
        insights.push(`Doordeweekse dagen zijn ${Math.round(((weekdayAvg - weekendAvg) / weekendAvg) * 100)}% winstgevender dan weekenden.`);
      }
    }
  }

  // Monthly trends
  if (monthlyStats.length >= 2) {
    const sortedByRevenue = [...monthlyStats].sort((a, b) => b.averageRevenue - a.averageRevenue);
    const bestMonth = sortedByRevenue[0];
    const worstMonth = sortedByRevenue[sortedByRevenue.length - 1];
    
    if (bestMonth.averageRevenue > worstMonth.averageRevenue * 1.2) {
      insights.push(`${bestMonth.monthName} was je beste maand (€${Math.round(bestMonth.totalRevenue)} totaal), terwijl ${worstMonth.monthName} het laagst scoorde.`);
    }
  }

  // General performance insights
  const avgTransactionValue = totalRevenue / totalTransactions;
  if (avgTransactionValue > 400) {
    insights.push(`Je gemiddelde transactiewaarde van €${Math.round(avgTransactionValue)} ligt bovengemiddeld voor foodtrucks.`);
  } else if (avgTransactionValue < 250) {
    insights.push(`Er is ruimte voor verbetering: je gemiddelde transactiewaarde is €${Math.round(avgTransactionValue)}. Overweeg je menu of prijzen te optimaliseren.`);
  }

  return insights.length > 0 ? insights : ['Je data laat interessante patronen zien. Meer data zal meer specifieke inzichten opleveren.'];
}

// Enhanced analysis function with weather and events
export async function analyzeDataWithWeather(data: CSVRow[], weatherApiKey: string, claudeApiKey?: string, includeEvents: boolean = false): Promise<AnalysisResult> {
  // Parse data first
  const parsedData = data.map((row, index) => {
    const revenue = parseFloat(row.omzet.replace(',', '.'));
    if (isNaN(revenue)) return null;

    const date = parseDate(row.datum);
    if (!date) return null;

    return {
      date,
      location: row.locatie.trim(),
      revenue,
      originalRow: row
    };
  }).filter(Boolean) as Array<{
    date: Date;
    location: string;
    revenue: number;
    originalRow: CSVRow;
  }>;

  try {
    console.log(`🌤️ STARTING ENHANCED ANALYSIS`);
    console.log(`📊 Processing ${parsedData.length} sales records...`);
    console.log(`🔑 Weather API: ${weatherApiKey ? weatherApiKey.substring(0, 10) + '...' : 'none provided'}`);
    
    const { WeatherService } = await import('./weather');
    console.log(`📦 WeatherService imported successfully`);
    
    const weatherService = new WeatherService(weatherApiKey);
    console.log(`🔧 WeatherService instance created`);

    // Fetch weather data for each sales record with its specific location
    console.log(`🚀 Calling fetchWeatherForSalesData with ${parsedData.length} records...`);
    const weatherData = await weatherService.fetchWeatherForSalesData(parsedData);
    console.log(`✅ Weather data fetch completed. Got ${weatherData.length} weather records.`);
    console.log(`🔍 First weather record:`, weatherData[0]);

    // Create basic analysis
    const enhancedBasicAnalysis = analyzeData(data);

    // Calculate weather correlation
    const weatherCorrelation = weatherService.calculateWeatherImpact(parsedData, weatherData);

    // Calculate location-specific weather analysis
    const locationWeatherAnalysis = weatherService.calculateLocationWeatherImpact(parsedData, weatherData);

    // Generate weather insights
    const weatherInsights = generateWeatherInsights(weatherCorrelation);

    // Add AI analysis if Claude API key is provided
    let aiAnalysis = undefined;
    if (claudeApiKey) {
      try {
        console.log('🤖 Starting AI-powered analysis...');
        const { ClaudeAIService } = await import('./claude');
        const claudeService = new ClaudeAIService(claudeApiKey);

        // Prepare data for Claude analysis
        const claudeAnalysisData = {
          salesData: parsedData.map(item => ({
            datum: item.originalRow.datum,
            locatie: item.location,
            omzet: item.revenue
          })),
          weatherData: weatherData.map(w => ({
            date: w.date,
            temperature: w.temperature,
            precipitation: w.precipitation,
            weatherDescription: w.weatherDescription
          })),
          basicAnalysis: {
            totalRevenue: enhancedBasicAnalysis.summary.totalRevenue,
            averageRevenue: enhancedBasicAnalysis.summary.averageRevenue,
            bestLocation: enhancedBasicAnalysis.summary.bestLocation,
            bestRegularLocation: enhancedBasicAnalysis.summary.bestLocation, // Same as best location since no event separation
            worstLocation: enhancedBasicAnalysis.summary.worstLocation,
            locations: enhancedBasicAnalysis.locations.map(loc => ({
              name: loc.name,
              averageRevenue: loc.averageRevenue,
              regularDayAverage: loc.averageRevenue, // For now, same as average since no event separation
              eventDayAverage: 0, // No event data available yet
              eventUplift: 0, // No event data available yet
              transactionCount: loc.transactionCount
            })),
            dayOfWeekStats: enhancedBasicAnalysis.dayOfWeekStats.map(day => ({
              dayName: day.dayName,
              averageRevenue: day.averageRevenue
            })),
            monthlyStats: enhancedBasicAnalysis.monthlyStats.map(month => ({
              monthName: month.monthName,
              averageRevenue: month.averageRevenue
            }))
          }
        };

        // Get AI insights and recommendations
        const [insights, recommendations] = await Promise.all([
          claudeService.generateDeepInsights(claudeAnalysisData),
          claudeService.generateBusinessRecommendations(claudeAnalysisData)
        ]);

        aiAnalysis = {
          deepInsights: insights.deepInsights,
          strategicRecommendations: insights.strategicRecommendations,
          actionableAdvice: insights.actionableAdvice,
          opportunityAnalysis: insights.opportunityAnalysis,
          riskAssessment: insights.riskAssessment,
          businessRecommendations: recommendations,
          hasAiAnalysis: true
        };

        console.log('✅ AI analysis completed successfully');
      } catch (aiError) {
        console.warn('⚠️ AI analysis skipped:', aiError instanceof Error ? aiError.message : 'Unknown error');
        console.log('📊 Continuing with weather and basic analysis only');
      }
    }

    // Return enhanced analysis with weather and AI data
    return {
      ...enhancedBasicAnalysis,
      weather: {
        correlation: weatherCorrelation,
        hasWeatherData: true,
        weatherInsights,
        locationAnalysis: locationWeatherAnalysis
      },
      aiAnalysis
    };

  } catch (error) {
    console.error('❌ Weather analysis failed:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Onbekende fout');
    console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack');
    
    // Return basic analysis with weather error info
    const basicAnalysis = analyzeData(data);
    return {
      ...basicAnalysis,
      weather: {
        correlation: {
          temperature: { correlation: 0, optimalRange: [0, 0], impact: 'unavailable' },
          precipitation: { correlation: 0, averageImpact: 0, impact: 'Weather data unavailable' },
          conditions: []
        },
        hasWeatherData: false,
        weatherInsights: [`Weer data kon niet worden opgehaald: ${error instanceof Error ? error.message : 'Onbekende fout'}`]
      }
    };
  }
}

function generateWeatherInsights(correlation: import('./weather').WeatherCorrelation): string[] {
  const insights: string[] = [];

  // Temperature insights
  if (correlation.temperature.impact === 'positive') {
    insights.push(`Warmer weer heeft een positieve impact op je omzet (correlatie: ${correlation.temperature.correlation})`);
    insights.push(`Optimale temperatuur voor verkoop: ${correlation.temperature.optimalRange[0]}°C - ${correlation.temperature.optimalRange[1]}°C`);
  } else if (correlation.temperature.impact === 'negative') {
    insights.push(`Warmer weer heeft een negatieve impact op je omzet (correlatie: ${correlation.temperature.correlation})`);
  }

  // Precipitation insights
  if (Math.abs(correlation.precipitation.averageImpact) > 25) {
    insights.push(correlation.precipitation.impact);
  }

  // Condition insights (top 3 most impactful)
  const topConditions = correlation.conditions.slice(0, 3);
  topConditions.forEach(condition => {
    if (Math.abs(condition.revenueImpact) > 25) {
      insights.push(condition.description);
    }
  });

  // General weather strategy
  if (correlation.conditions.length > 0) {
    const bestCondition = correlation.conditions[0];
    const worstCondition = correlation.conditions[correlation.conditions.length - 1];
    
    if (Math.abs(bestCondition.revenueImpact - worstCondition.revenueImpact) > 50) {
      insights.push(`Weersomstandigheden hebben significante impact: verschil van €${Math.abs(bestCondition.revenueImpact - worstCondition.revenueImpact)} tussen beste en slechtste weer`);
    }
  }

  return insights.length > 0 ? insights : ['Geen significante weersinvloeden gevonden in je data.'];
}


export type { AnalysisResult, LocationStats, DayStats, MonthStats };