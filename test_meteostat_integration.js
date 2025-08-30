// Test Meteostat API Integration
const fetch = require('node-fetch');

async function testMeteostatIntegration() {
  console.log('🧪 Testing Meteostat API Integration');
  console.log('===================================');
  
  try {
    // Test the API proxy directly
    console.log('\n📅 Testing Meteostat API proxy...');
    const response = await fetch('http://localhost:3000/api/weather/meteostat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dates: ['2024-01-15', '2024-01-16', '2024-01-17'],
        location: { lat: 52.3676, lon: 4.9041 }
      })
    });
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Meteostat API Success:', {
        dataCount: data.data?.length || 0,
        firstDate: data.data?.[0]?.date,
        firstTemp: data.data?.[0]?.tavg,
        stations: data.meta?.stations?.length || 0
      });
    } else {
      const errorData = await response.json();
      console.log('❌ API Error:', errorData);
    }
    
    console.log('\n🎉 Meteostat integration test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testMeteostatIntegration();