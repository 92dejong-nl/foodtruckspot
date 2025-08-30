// Test different Meteostat endpoints to see what works
const fetch = require('node-fetch');

async function testMeteostatEndpoints() {
  console.log('🧪 Testing Different Meteostat Endpoints');
  console.log('=======================================');
  
  const apiKey = '8ed6219a09msh464bb61a74a5152p115913jsnb5a8c58df5b1';
  const host = 'meteostat.p.rapidapi.com';
  const headers = {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': host
  };
  
  const testEndpoints = [
    {
      name: 'Point Daily',
      url: 'https://meteostat.p.rapidapi.com/point/daily?lat=52.3676&lon=4.9041&start=2024-01-15&end=2024-01-16'
    },
    {
      name: 'Point Monthly',  
      url: 'https://meteostat.p.rapidapi.com/point/monthly?lat=52.3676&lon=4.9041&alt=0&start=2024-01-01&end=2024-01-31'
    },
    {
      name: 'Point Hourly',
      url: 'https://meteostat.p.rapidapi.com/point/hourly?lat=52.3676&lon=4.9041&start=2024-01-15T00&end=2024-01-15T23'
    },
    {
      name: 'Stations Nearby',
      url: 'https://meteostat.p.rapidapi.com/stations/nearby?lat=52.3676&lon=4.9041&limit=5'
    }
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`\n🔗 Testing: ${endpoint.name}`);
      console.log(`URL: ${endpoint.url}`);
      
      const response = await fetch(endpoint.url, { method: 'GET', headers });
      console.log(`📊 Response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success:`, JSON.stringify(data, null, 2));
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${error}`);
      }
      
      // Small delay to avoid hammering the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Request failed: ${error.message}`);
    }
  }
}

testMeteostatEndpoints();