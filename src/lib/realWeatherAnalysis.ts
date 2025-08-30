interface SalesWithWeather {
  date: Date;
  location: string;
  revenue: number;
  weather?: {
    temperature: number;
    precipitation: number;
    weatherMain: string;
    weatherDescription: string;
    windSpeed: number;
  };
}

interface TopPerformanceDay {
  date: string;
  location: string;
  revenue: number;
  weather: {
    temperature: number;
    precipitation: number;
    condition: string;
    description: string;
  };
  rank: number;
}

interface WeatherPerformanceAnalysis {
  topDays: TopPerformanceDay[];
  worstDays: TopPerformanceDay[];
  temperatureCorrelation: {
    correlation: number;
    optimalRange: [number, number];
    impact: string;
  };
  precipitationImpact: {
    averageImpact: number;
    description: string;
  };
  conditionPerformance: Array<{
    condition: string;
    averageRevenue: number;
    count: number;
    impact: number;
  }>;
  dataSource: 'real' | 'fallback';
}

export class RealWeatherAnalysisService {
  
  /**
   * Analyze sales data with real weather information to find top/worst performing days
   */
  static async analyzeSalesWithRealWeather(
    salesData: Array<{ date: Date; location: string; revenue: number }>,
    weatherApiKey: string
  ): Promise<WeatherPerformanceAnalysis> {
    console.log('🌤️ Starting real weather analysis...');
    console.log(`📊 Processing ${salesData.length} sales records with real weather data`);

    try {
      const { WeatherService } = await import('./weather');
      const weatherService = new WeatherService(weatherApiKey);

      // Fetch real weather data for all sales records
      console.log('🚀 Fetching real weather data for all sales...');
      const weatherData = await weatherService.fetchWeatherForSalesData(salesData);
      console.log(`✅ Received ${weatherData.length} weather records`);
      
      // Detect if we're using real or fallback data by checking if weather patterns are too regular
      const isRealData = this.detectRealWeatherData(weatherData);
      console.log(`🔍 Data source detected: ${isRealData ? 'real Meteostat data' : 'fallback climate patterns'}`);

      // Combine sales data with weather data
      const combinedData: SalesWithWeather[] = salesData.map((sale) => {
        const dateStr = sale.date.toISOString().split('T')[0];
        const weather = weatherData.find(w => w.date === dateStr);
        
        return {
          ...sale,
          weather: weather ? {
            temperature: weather.temperature,
            precipitation: weather.precipitation,
            weatherMain: weather.weatherMain,
            weatherDescription: weather.weatherDescription,
            windSpeed: weather.windSpeed
          } : undefined
        };
      }).filter(item => item.weather); // Only include items with weather data

      if (combinedData.length === 0) {
        throw new Error('No weather data available for analysis');
      }

      console.log(`📈 Analyzing ${combinedData.length} records with complete weather data`);

      // Sort by revenue to find top and worst performing days
      const sortedByRevenue = [...combinedData].sort((a, b) => b.revenue - a.revenue);
      
      // Get top 5 best days
      const topDays: TopPerformanceDay[] = sortedByRevenue.slice(0, 5).map((day, index) => ({
        date: `${day.date.getDate()}-${day.date.getMonth() + 1}-${day.date.getFullYear()}`,
        location: day.location,
        revenue: day.revenue,
        weather: {
          temperature: day.weather!.temperature,
          precipitation: day.weather!.precipitation,
          condition: day.weather!.weatherMain,
          description: day.weather!.weatherDescription
        },
        rank: index + 1
      }));

      // Get worst 5 days
      const worstDays: TopPerformanceDay[] = sortedByRevenue.slice(-5).reverse().map((day, index) => ({
        date: `${day.date.getDate()}-${day.date.getMonth() + 1}-${day.date.getFullYear()}`,
        location: day.location,
        revenue: day.revenue,
        weather: {
          temperature: day.weather!.temperature,
          precipitation: day.weather!.precipitation,
          condition: day.weather!.weatherMain,
          description: day.weather!.weatherDescription
        },
        rank: index + 1
      }));

      // Calculate temperature correlation
      const temperatureCorrelation = this.calculateTemperatureCorrelation(combinedData);
      
      // Calculate precipitation impact
      const precipitationImpact = this.calculatePrecipitationImpact(combinedData);
      
      // Calculate performance by weather condition
      const conditionPerformance = this.calculateConditionPerformance(combinedData);

      console.log('✅ Real weather analysis completed successfully');
      
      return {
        topDays,
        worstDays,
        temperatureCorrelation,
        precipitationImpact,
        conditionPerformance,
        dataSource: isRealData ? 'real' : 'fallback'
      };

    } catch (error) {
      console.error('❌ Real weather analysis failed:', error);
      throw error;
    }
  }

  /**
   * Calculate temperature correlation with revenue
   */
  private static calculateTemperatureCorrelation(data: SalesWithWeather[]) {
    const temperatures = data.map(d => d.weather!.temperature);
    const revenues = data.map(d => d.revenue);
    
    const correlation = this.calculateCorrelationCoefficient(temperatures, revenues);
    
    // Find optimal temperature range by grouping into 5°C buckets
    const tempBuckets = new Map<string, number[]>();
    
    data.forEach(item => {
      const temp = item.weather!.temperature;
      const bucket = `${Math.floor(temp / 5) * 5}-${Math.floor(temp / 5) * 5 + 5}`;
      if (!tempBuckets.has(bucket)) {
        tempBuckets.set(bucket, []);
      }
      tempBuckets.get(bucket)!.push(item.revenue);
    });

    let bestRange: [number, number] = [15, 20];
    let bestAverage = 0;

    tempBuckets.forEach((revenues, range) => {
      const average = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;
      if (average > bestAverage) {
        bestAverage = average;
        const [min] = range.split('-').map(n => parseInt(n));
        bestRange = [min, min + 5];
      }
    });

    return {
      correlation: Math.round(correlation * 100) / 100,
      optimalRange: bestRange,
      impact: correlation > 0.3 ? 'positive' : correlation < -0.3 ? 'negative' : 'neutral'
    };
  }

  /**
   * Calculate precipitation impact on revenue
   */
  private static calculatePrecipitationImpact(data: SalesWithWeather[]) {
    const rainyDays = data.filter(d => d.weather!.precipitation > 0);
    const dryDays = data.filter(d => d.weather!.precipitation === 0);

    if (rainyDays.length === 0) {
      return {
        averageImpact: 0,
        description: 'Geen regendata beschikbaar voor analyse'
      };
    }

    const rainyAverage = rainyDays.reduce((sum, d) => sum + d.revenue, 0) / rainyDays.length;
    const dryAverage = dryDays.length > 0 ? 
      dryDays.reduce((sum, d) => sum + d.revenue, 0) / dryDays.length : rainyAverage;

    const impact = Math.round(rainyAverage - dryAverage);
    
    return {
      averageImpact: impact,
      description: impact < -25 ? `Regen verlaagt omzet met €${Math.abs(impact)} gemiddeld` :
                  impact > 25 ? `Regen verhoogt omzet met €${impact} gemiddeld` :
                  'Regen heeft minimale impact op omzet'
    };
  }

  /**
   * Calculate performance by weather condition
   */
  private static calculateConditionPerformance(data: SalesWithWeather[]) {
    const conditionMap = new Map<string, number[]>();
    
    data.forEach(item => {
      const condition = item.weather!.weatherMain;
      if (!conditionMap.has(condition)) {
        conditionMap.set(condition, []);
      }
      conditionMap.get(condition)!.push(item.revenue);
    });

    const baselineRevenue = data.reduce((sum, d) => sum + d.revenue, 0) / data.length;

    return Array.from(conditionMap.entries())
      .filter(([_, revenues]) => revenues.length >= 2) // At least 2 data points
      .map(([condition, revenues]) => {
        const averageRevenue = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;
        const impact = averageRevenue - baselineRevenue;
        
        return {
          condition,
          averageRevenue: Math.round(averageRevenue),
          count: revenues.length,
          impact: Math.round(impact)
        };
      })
      .sort((a, b) => b.impact - a.impact);
  }

  /**
   * Calculate correlation coefficient between two arrays
   */
  private static calculateCorrelationCoefficient(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Detect if weather data is real or generated fallback data
   * Real data has more variation and less predictable patterns
   */
  private static detectRealWeatherData(weatherData: any[]): boolean {
    if (weatherData.length < 5) return false;
    
    // Check for temperature variation patterns
    const temperatures = weatherData.map(w => w.temperature);
    const precipitations = weatherData.map(w => w.precipitation);
    
    // Real data has more irregular patterns and decimal precision
    const hasDecimalTemps = temperatures.some(t => t % 1 !== 0);
    const hasDecimalPrecip = precipitations.some(p => p % 1 !== 0);
    
    // Calculate coefficient of variation for temperature (real data is more variable)
    const tempMean = temperatures.reduce((sum, t) => sum + t, 0) / temperatures.length;
    const tempStdDev = Math.sqrt(temperatures.reduce((sum, t) => sum + Math.pow(t - tempMean, 2), 0) / temperatures.length);
    const tempCV = tempStdDev / tempMean;
    
    // Real weather data typically has:
    // - Decimal precision in measurements
    // - Higher coefficient of variation (>0.15 for temperature)
    // - Less predictable precipitation patterns
    const isLikelyReal = (hasDecimalTemps || hasDecimalPrecip) && tempCV > 0.15;
    
    console.log(`🔍 Weather data analysis: temp CV=${tempCV.toFixed(3)}, decimals=${hasDecimalTemps || hasDecimalPrecip}, likely real=${isLikelyReal}`);
    
    return isLikelyReal;
  }

  /**
   * Generate formatted insights from the analysis
   */
  static generateWeatherInsights(analysis: WeatherPerformanceAnalysis): string[] {
    const insights: string[] = [];

    // Top day insights
    if (analysis.topDays.length > 0) {
      const topDay = analysis.topDays[0];
      insights.push(
        `Beste dag: ${topDay.date} bij ${topDay.location} - €${topDay.revenue} bij ${topDay.weather.temperature}°C, ${topDay.weather.description}`
      );
    }

    // Worst day insights
    if (analysis.worstDays.length > 0) {
      const worstDay = analysis.worstDays[0];
      insights.push(
        `Slechtste dag: ${worstDay.date} bij ${worstDay.location} - €${worstDay.revenue} bij ${worstDay.weather.temperature}°C, ${worstDay.weather.description}`
      );
    }

    // Temperature insights
    if (analysis.temperatureCorrelation.correlation > 0.3) {
      insights.push(
        `Warmer weer = meer omzet! Optimale temperatuur: ${analysis.temperatureCorrelation.optimalRange[0]}-${analysis.temperatureCorrelation.optimalRange[1]}°C`
      );
    } else if (analysis.temperatureCorrelation.correlation < -0.3) {
      insights.push(
        `Te warm schaadt verkoop. Ideaal: ${analysis.temperatureCorrelation.optimalRange[0]}-${analysis.temperatureCorrelation.optimalRange[1]}°C`
      );
    }

    // Precipitation insights
    if (Math.abs(analysis.precipitationImpact.averageImpact) > 25) {
      insights.push(analysis.precipitationImpact.description);
    }

    // Best weather condition
    if (analysis.conditionPerformance.length > 0) {
      const bestCondition = analysis.conditionPerformance[0];
      if (bestCondition.impact > 25) {
        insights.push(
          `${bestCondition.condition} weer is ideaal: €${bestCondition.averageRevenue} gemiddeld (${bestCondition.count} dagen)`
        );
      }
    }

    return insights.length > 0 ? insights : ['Analyseren van weerdata voor betere inzichten...'];
  }
}

export type { WeatherPerformanceAnalysis, TopPerformanceDay, SalesWithWeather };