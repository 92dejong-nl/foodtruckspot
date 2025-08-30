// Test Weather API forecast with exact format from provided snippet
const fetch = require('node-fetch');

async function testWeatherAPIForecast() {
  console.log('🌤️ Testing Weather API forecast with exact format');
  console.log('=================================================');
  
  try {
    // Test exact URL from snippet but with Amsterdam
    const forecastUrl = 'https://weather-api167.p.rapidapi.com/api/weather/forecast?place=Amsterdam%2CNL&cnt=5&units=standard&type=three_hour&mode=json&lang=en';
    
    console.log(`🔗 Testing forecast endpoint: ${forecastUrl}`);
    
    const response = await fetch(forecastUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '8ed6219a09msh464bb61a74a5152p115913jsnb5a8c58df5b1',
        'x-rapidapi-host': 'weather-api167.p.rapidapi.com',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Forecast Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Forecast data received:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.list && data.list.length > 0) {
        console.log(`\n📈 Forecast summary:`);
        console.log(`- Records: ${data.list.length}`);
        console.log(`- First forecast: ${data.list[0].dt_txt} - ${data.list[0].main.temp}°K`);
        console.log(`- Weather: ${data.list[0].weather[0].main} - ${data.list[0].weather[0].description}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
    }
    
    // Also test current weather
    console.log(`\n🔄 Testing current weather endpoint:`);
    const currentUrl = 'https://weather-api167.p.rapidapi.com/api/weather/current?place=Amsterdam%2CNL&units=standard&mode=json&lang=en';
    
    const currentResponse = await fetch(currentUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '8ed6219a09msh464bb61a74a5152p115913jsnb5a8c58df5b1',
        'x-rapidapi-host': 'weather-api167.p.rapidapi.com',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Current Response: ${currentResponse.status} ${currentResponse.statusText}`);
    
    if (currentResponse.ok) {
      const currentData = await currentResponse.json();
      console.log('✅ Current weather data received:');
      console.log(JSON.stringify(currentData, null, 2));
    } else {
      const currentError = await currentResponse.text();
      console.log(`❌ Current weather error: ${currentError}`);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testWeatherAPIForecast();