// Simple test script for Amsterdam Events API
const fs = require('fs');
const path = require('path');

// Read the test CSV data
const csvPath = path.join(__dirname, 'test_50_records.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse first few lines to get dates and locations
const lines = csvContent.split('\n').slice(1, 6); // Skip header, take first 5 records
const testData = [];

for (const line of lines) {
  if (line.trim()) {
    const parts = line.split(',');
    const date = parts[0]?.trim();
    const location = parts[1]?.trim();
    
    if (date && location) {
      testData.push({ date, location });
      console.log(`Will test events for: ${date} at ${location}`);
    }
  }
}

// Test Amsterdam Events API with this data
async function testEventsAPI() {
  try {
    // Import the events service
    const { AmsterdamEventsService } = await import('./src/lib/events.js');
    const eventsService = new AmsterdamEventsService();
    
    console.log('\n🎪 TESTING AMSTERDAM EVENTS API');
    console.log('='.repeat(50));
    
    for (const { date, location } of testData) {
      console.log(`\n📅 Testing: ${date} at ${location}`);
      console.log('-'.repeat(30));
      
      try {
        const dateObj = new Date(date);
        const events = await eventsService.fetchEventsForDate(dateObj, location);
        
        if (events.length > 0) {
          console.log(`✅ Found ${events.length} event(s):`);
          events.forEach(event => {
            console.log(`   🎭 ${event.title}`);
            console.log(`   📍 ${event.location.name}`);
            console.log(`   🏷️ ${event.category} (${event.attendance || 'unknown'} attendance)`);
            if (event.description) {
              console.log(`   📝 ${event.description.substring(0, 100)}...`);
            }
          });
        } else {
          console.log(`❌ No events found for this date/location`);
        }
        
      } catch (error) {
        console.log(`⚠️ Error testing ${date} at ${location}:`, error.message);
      }
    }
    
    console.log('\n✅ Event API test completed!');
    
  } catch (importError) {
    console.error('❌ Failed to import events service:', importError.message);
    console.log('This is expected since we\'re running Node.js and the service uses ES modules/TypeScript');
  }
}

// Run the test
testEventsAPI();

console.log('\n📊 Test data summary:');
console.log(`Found ${testData.length} records to test`);
testData.forEach(({ date, location }) => {
  console.log(`  • ${date} - ${location}`);
});