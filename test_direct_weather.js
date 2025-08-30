// Direct test of weather API without framework complications
const fetch = require('node-fetch'); // You might need to install this or use a different fetch

async function testDirectWeatherAPI() {
    console.log('🌤️ Testing OpenWeatherMap API directly...');
    
    // Test with a sample API key (replace with real one)
    const API_KEY = 'demo_key'; // REPLACE WITH REAL API KEY
    
    if (API_KEY === 'demo_key') {
        console.log('⚠️ Please set a real API key to test!');
        return;
    }
    
    const lat = 52.3676; // Amsterdam
    const lon = 4.9041;
    
    // Test dates - including May for temperature check
    const testDates = [
        new Date('2024-05-15'), // Should be ~15-20°C
        new Date('2024-04-27'), // Koningsdag
        new Date('2024-06-15'), // Should be ~18-25°C
        new Date('2024-07-15')  // Should be ~20-27°C
    ];
    
    console.log(`Testing ${testDates.length} dates for Amsterdam (${lat}, ${lon})`);
    
    for (const date of testDates) {
        const timestamp = Math.floor(date.getTime() / 1000);
        
        console.log(`\n📅 Testing date: ${date.toISOString().split('T')[0]}`);
        console.log(`⏰ Timestamp: ${timestamp}`);
        
        // Historical weather API (One Call API 3.0)
        const historicalUrl = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${timestamp}&appid=${API_KEY}&units=metric`;
        
        try {
            console.log('🔗 URL:', historicalUrl.replace(API_KEY, 'API_KEY_HIDDEN'));
            
            const response = await fetch(historicalUrl);
            console.log(`📊 Response: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.data && data.data[0]) {
                    const weather = data.data[0];
                    const temp = weather.temp;
                    const desc = weather.weather[0].description;
                    const humidity = weather.humidity;
                    
                    console.log(`✅ Temperature: ${temp}°C`);
                    console.log(`🌤️ Weather: ${desc}`);
                    console.log(`💧 Humidity: ${humidity}%`);
                    
                    // Check if temperature is logical for the season
                    const month = date.getMonth() + 1;
                    const expectedRange = getExpectedTempRange(month);
                    
                    if (temp >= expectedRange.min && temp <= expectedRange.max) {
                        console.log(`✅ Temperature ${temp}°C is within expected range (${expectedRange.min}-${expectedRange.max}°C) for month ${month}`);
                    } else {
                        console.log(`⚠️ Temperature ${temp}°C seems unusual for month ${month} (expected ${expectedRange.min}-${expectedRange.max}°C)`);
                    }
                    
                } else {
                    console.log('❌ Unexpected response format:', JSON.stringify(data, null, 2));
                }
            } else {
                const errorText = await response.text();
                console.log(`❌ API Error: ${response.status} ${response.statusText}`);
                console.log(`📄 Error details:`, errorText);
                
                // Test current weather API as fallback
                if (Math.abs(Date.now() - date.getTime()) < 7 * 24 * 60 * 60 * 1000) {
                    console.log('🔄 Trying current weather API...');
                    
                    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
                    const currentResponse = await fetch(currentUrl);
                    
                    if (currentResponse.ok) {
                        const currentData = await currentResponse.json();
                        console.log(`✅ Current weather fallback: ${currentData.main.temp}°C, ${currentData.weather[0].description}`);
                    } else {
                        console.log('❌ Current weather API also failed');
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Network error:', error.message);
        }
        
        // Wait between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

function getExpectedTempRange(month) {
    // Expected temperature ranges for Amsterdam by month
    const ranges = {
        1: { min: 0, max: 8 },   // January
        2: { min: 0, max: 9 },   // February
        3: { min: 3, max: 12 },  // March
        4: { min: 6, max: 16 },  // April
        5: { min: 10, max: 20 }, // May
        6: { min: 13, max: 23 }, // June
        7: { min: 15, max: 25 }, // July
        8: { min: 15, max: 25 }, // August
        9: { min: 12, max: 21 }, // September
        10: { min: 8, max: 16 }, // October
        11: { min: 4, max: 11 }, // November
        12: { min: 1, max: 7 }   // December
    };
    
    return ranges[month] || { min: -5, max: 30 };
}

// Only run in Node.js
if (typeof window === 'undefined') {
    testDirectWeatherAPI().catch(console.error);
}

module.exports = { testDirectWeatherAPI };