// Quick test of OpenWeatherMap API for Amsterdam temperatures
async function testWeatherAPI() {
    const API_KEY = process.env.OPENWEATHER_API_KEY || 'test'; // Replace with actual key
    
    // Test historical weather for Koningsdag 2024
    const lat = 52.3676;
    const lon = 4.9041;
    const koningsdagTimestamp = Math.floor(new Date('2024-04-27').getTime() / 1000);
    
    console.log('🌤️ Testing OpenWeatherMap API for Amsterdam on Koningsdag 2024...');
    console.log(`Timestamp: ${koningsdagTimestamp} (${new Date(koningsdagTimestamp * 1000)})`);
    
    try {
        // Historical weather API
        const historicalUrl = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${koningsdagTimestamp}&appid=${API_KEY}&units=metric`;
        console.log('URL:', historicalUrl);
        
        const response = await fetch(historicalUrl);
        const data = await response.json();
        
        if (response.ok) {
            const current = data.data[0];
            console.log('✅ Historical weather data:');
            console.log(`Temperature: ${current.temp}°C`);
            console.log(`Humidity: ${current.humidity}%`);
            console.log(`Weather: ${current.weather[0].main} - ${current.weather[0].description}`);
            console.log(`Wind: ${current.wind_speed} m/s`);
            console.log(`Pressure: ${current.pressure} hPa`);
        } else {
            console.log('❌ API Error:', data);
            
            // Test current weather as fallback
            console.log('🔄 Testing current weather API...');
            const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
            const currentResponse = await fetch(currentUrl);
            const currentData = await currentResponse.json();
            
            if (currentResponse.ok) {
                console.log('✅ Current weather data (as reference):');
                console.log(`Temperature: ${currentData.main.temp}°C`);
                console.log(`Humidity: ${currentData.main.humidity}%`);
                console.log(`Weather: ${currentData.weather[0].main} - ${currentData.weather[0].description}`);
            } else {
                console.log('❌ Current weather also failed:', currentData);
            }
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

if (typeof window === 'undefined') {
    // Node.js environment
    testWeatherAPI();
}