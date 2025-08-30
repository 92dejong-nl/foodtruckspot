// Test RapidAPI Meteostat with the exact format from RapidAPI
const fetch = require('node-fetch');

async function testRapidAPIMeteostat() {
  console.log('🧪 Testing RapidAPI Meteostat with exact format');
  console.log('==============================================');
  
  try {
    // Test monthly endpoint first (as per RapidAPI snippet)
    const monthlyUrl = 'https://meteostat.p.rapidapi.com/point/monthly?lat=52.3676&lon=4.9041&alt=0&start=2024-01-01&end=2024-01-31';
    
    console.log(`🔗 Testing monthly endpoint: ${monthlyUrl}`);
    
    const monthlyResponse = await fetch(monthlyUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '8ed6219a09msh464bb61a74a5152p115913jsnb5a8c58df5b1',
        'x-rapidapi-host': 'meteostat.p.rapidapi.com'
      }
    });
    
    console.log(`📊 Monthly Response: ${monthlyResponse.status} ${monthlyResponse.statusText}`);
    
    if (monthlyResponse.ok) {
      const monthlyData = await monthlyResponse.json();
      console.log('✅ Monthly data:', JSON.stringify(monthlyData, null, 2));
    } else {
      const monthlyError = await monthlyResponse.text();
      console.log('❌ Monthly error:', monthlyError);
    }
    
    // Now test daily endpoint 
    const dailyUrl = 'https://meteostat.p.rapidapi.com/point/daily?lat=52.3676&lon=4.9041&start=2024-01-15&end=2024-01-17';
    
    console.log(`\n🔗 Testing daily endpoint: ${dailyUrl}`);
    
    const dailyResponse = await fetch(dailyUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '8ed6219a09msh464bb61a74a5152p115913jsnb5a8c58df5b1',
        'x-rapidapi-host': 'meteostat.p.rapidapi.com'
      }
    });
    
    console.log(`📊 Daily Response: ${dailyResponse.status} ${dailyResponse.statusText}`);
    
    if (dailyResponse.ok) {
      const dailyData = await dailyResponse.json();
      console.log('✅ Daily data:', JSON.stringify(dailyData, null, 2));
    } else {
      const dailyError = await dailyResponse.text();
      console.log('❌ Daily error:', dailyError);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRapidAPIMeteostat();