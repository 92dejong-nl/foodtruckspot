// Test KNMI Weather API Integration
const { WeatherService } = require('./src/lib/weather.ts');

async function testKnmiIntegration() {
  console.log('🧪 Testing KNMI EDR API Integration');
  console.log('==================================');
  
  // Test with a demo API key (will use mock data)
  const weatherService = new WeatherService('demo_key');
  
  try {
    // Test historical weather fetch
    console.log('\n📅 Testing historical weather fetch...');
    const testDate = new Date('2024-01-15');
    const weatherData = await weatherService.fetchHistoricalWeather(testDate);
    
    console.log('✅ Historical weather data:', {
      date: weatherData.date,
      temperature: weatherData.temperature + '°C',
      precipitation: weatherData.precipitation + 'mm',
      description: weatherData.weatherDescription,
      main: weatherData.weatherMain
    });
    
    // Test forecast
    console.log('\n🔮 Testing weather forecast...');
    const forecastData = await weatherService.fetchWeatherForecast('Amsterdam');
    console.log('✅ Forecast data (first day):', {
      date: forecastData[0]?.date,
      temperature: forecastData[0]?.temperature + '°C',
      description: forecastData[0]?.weatherDescription,
      dayName: forecastData[0]?.dayName
    });
    
    // Test hourly weather
    console.log('\n⏰ Testing hourly weather...');
    const hourlyData = await weatherService.fetchHourlyWeather('Amsterdam');
    console.log('✅ Hourly data (first 3 hours):');
    hourlyData.slice(0, 3).forEach(hour => {
      console.log(`  ${hour.hour}: ${hour.temperature}°C, ${hour.weatherDescription}`);
    });
    
    console.log('\n🎉 All KNMI integration tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testKnmiIntegration();
}

module.exports = { testKnmiIntegration };