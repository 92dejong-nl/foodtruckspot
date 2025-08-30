// Test with EXACT parameters from RapidAPI snippet
const fetch = require('node-fetch');

async function testExactRapidAPIRequest() {
  console.log('🧪 Testing EXACT RapidAPI Request from snippet');
  console.log('==============================================');
  
  try {
    // Use EXACT same parameters as in the RapidAPI snippet
    const exactUrl = 'https://meteostat.p.rapidapi.com/point/monthly?lat=52.5244&lon=13.4105&alt=43&start=2020-01-01&end=2020-12-31';
    
    console.log(`🔗 URL: ${exactUrl}`);
    console.log(`📍 Location: Berlin (52.5244, 13.4105)`);
    console.log(`📅 Period: 2020-01-01 to 2020-12-31`);
    
    const response = await fetch(exactUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '8ed6219a09msh464bb61a74a5152p115913jsnb5a8c58df5b1',
        'x-rapidapi-host': 'meteostat.p.rapidapi.com'
      }
    });
    
    console.log(`📊 Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Data received:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.data && data.data.length > 0) {
        console.log(`\n📈 Data summary:`);
        console.log(`- Records: ${data.data.length}`);
        console.log(`- First month: ${data.data[0].date} - ${data.data[0].tavg}°C avg`);
        console.log(`- Last month: ${data.data[data.data.length-1].date} - ${data.data[data.data.length-1].tavg}°C avg`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
    }
    
    // Also test with Amsterdam coordinates but same date range
    console.log(`\n🔄 Testing with Amsterdam coordinates (same date range):`);
    const amsterdamUrl = 'https://meteostat.p.rapidapi.com/point/monthly?lat=52.3676&lon=4.9041&alt=0&start=2020-01-01&end=2020-12-31';
    
    const amsterdamResponse = await fetch(amsterdamUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '8ed6219a09msh464bb61a74a5152p115913jsnb5a8c58df5b1',
        'x-rapidapi-host': 'meteostat.p.rapidapi.com'
      }
    });
    
    console.log(`📊 Amsterdam Response: ${amsterdamResponse.status} ${amsterdamResponse.statusText}`);
    
    if (amsterdamResponse.ok) {
      const amsterdamData = await amsterdamResponse.json();
      console.log('✅ Amsterdam data SUCCESS!');
      console.log(`Records: ${amsterdamData.data ? amsterdamData.data.length : 0}`);
    } else {
      const amsterdamError = await amsterdamResponse.text();
      console.log(`❌ Amsterdam Error: ${amsterdamError}`);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testExactRapidAPIRequest();