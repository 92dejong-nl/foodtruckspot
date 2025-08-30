import { NextRequest, NextResponse } from 'next/server';
import { WeatherService } from '@/lib/weather';

export async function GET(request: NextRequest) {
  try {
    console.log('🌤️ Testing Weather API using new WeatherService...');
    
    // Get API key from request params or use session storage
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apikey') || '';
    
    console.log(`🔑 API key provided: ${apiKey ? 'Yes' : 'No'} (${apiKey.length} chars)`);
    
    // Initialize weather service
    const weatherService = new WeatherService(apiKey);
    
    // Test Amsterdam coordinates
    const lat = 52.3676;
    const lon = 4.9041;
    
    // Test specific dates with expected temperatures (using realistic Amsterdam climate data)
    const testDates = [
      { date: new Date('2024-05-15'), expected: '11-19°C', season: 'Spring (May)', expectedAvg: 15.0 },
      { date: new Date('2024-04-27'), expected: '7-15°C', season: 'Koningsdag (April)', expectedAvg: 11.0 },
      { date: new Date('2024-06-15'), expected: '14-22°C', season: 'Early Summer (June)', expectedAvg: 17.9 },
      { date: new Date('2024-07-15'), expected: '16-23°C', season: 'Mid Summer (July)', expectedAvg: 19.8 }
    ];
    
    const results = [];
    
    for (const testCase of testDates) {
      const dateStr = testCase.date.toISOString().split('T')[0];
      
      console.log(`📅 Testing ${dateStr} (${testCase.season}) - Expected: ${testCase.expected}`);
      
      try {
        // Use new WeatherService to fetch weather data
        const weatherData = await weatherService.fetchHistoricalWeather(testCase.date);
        
        console.log(`✅ SUCCESS - ${dateStr}: ${weatherData.temperature}°C, ${weatherData.weatherDescription}`);
        
        const tempLogical = checkTemperatureLogical(weatherData.temperature, testCase.date.getMonth() + 1);
        const tempNearExpected = Math.abs(weatherData.temperature - testCase.expectedAvg) <= 8; // Within 8°C of expected
        
        results.push({
          date: dateStr,
          source: 'weather_service',
          success: true,
          temperature: weatherData.temperature,
          description: weatherData.weatherDescription,
          humidity: weatherData.humidity,
          precipitation: weatherData.precipitation,
          weather_main: weatherData.weatherMain,
          expected: testCase.expected,
          season: testCase.season,
          expected_avg: testCase.expectedAvg,
          temperature_logical: tempLogical,
          temperature_near_expected: tempNearExpected,
          wind_speed: weatherData.windSpeed,
          pressure: weatherData.pressure
        });
        
      } catch (error) {
        console.error(`❌ WeatherService error for ${dateStr}:`, error);
        results.push({
          date: dateStr,
          source: 'weather_service_error',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          expected: testCase.expected,
          season: testCase.season,
          expected_avg: testCase.expectedAvg
        });
      }
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const summary = {
      total_tests: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      logical_temperatures: results.filter(r => r.temperature_logical === true).length,
      illogical_temperatures: results.filter(r => r.temperature_logical === false).length
    };
    
    console.log('📊 Test Summary:', summary);
    
    return NextResponse.json({
      success: true,
      message: 'Weather API test completed',
      test_config: {
        api_key_provided: true,
        api_key_length: apiKey.length,
        coordinates: { lat, lon },
        location: 'Amsterdam'
      },
      results: results,
      summary: summary
    });
    
  } catch (error) {
    console.error('❌ Weather test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Weather API test failed'
    }, { status: 500 });
  }
}

function checkTemperatureLogical(temp: number, month: number): boolean {
  // Updated ranges based on actual Amsterdam climate data
  const expectedRanges: { [key: number]: [number, number] } = {
    1: [-2, 10],  // January (4.2°C avg ± 6°C range)
    2: [-2, 11],  // February (4.8°C avg ± 6°C range)
    3: [1, 15],   // March (7.8°C avg ± 7°C range)
    4: [3, 19],   // April (11.0°C avg ± 8°C range) - Koningsdag
    5: [7, 23],   // May (15.0°C avg ± 8°C range) - Key test case!
    6: [11, 25],  // June (17.9°C avg ± 7°C range)
    7: [14, 26],  // July (19.8°C avg ± 6°C range)
    8: [14, 26],  // August (19.6°C avg ± 6°C range)
    9: [10, 24],  // September (16.5°C avg ± 7°C range)
    10: [6, 18],  // October (12.3°C avg ± 6°C range)
    11: [3, 13],  // November (7.6°C avg ± 5°C range)
    12: [0, 10]   // December (4.9°C avg ± 5°C range)
  };
  
  const [min, max] = expectedRanges[month] || [-10, 40];
  const withinRange = temp >= min && temp <= max;
  
  if (!withinRange) {
    console.log(`⚠️ Temperature ${temp}°C is outside expected range [${min}, ${max}] for month ${month}`);
  } else {
    console.log(`✅ Temperature ${temp}°C is within expected range [${min}, ${max}] for month ${month}`);
  }
  
  return withinRange;
}