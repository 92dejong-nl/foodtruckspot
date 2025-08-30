// Debug the exact weather data being generated for specific dates
const dates = [
  '2024-09-06', // Albert_Cuyp_Markt €810 bij 13.7°C, lichte motregen
  '2024-07-12', // Jordaan_Noordermarkt €795 bij 19°C, lichte motregen  
  '2024-06-21', // Leidseplein €720 bij 19.6°C, verspreide bewolking
  '2024-08-23', // Bloemenmarkt €720 bij 21.3°C, verspreide bewolking
  '2024-07-05'  // Rembrandtplein €690 bij 17.3°C, lichte motregen
];

// Copy the generateRealisticWeatherData logic to check what it produces
function generateRealisticWeatherData(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  
  // Use date as seed for consistent results
  const dateSeed = year * 10000 + month * 100 + day;
  const random = (seed) => ((seed * 9301 + 49297) % 233280) / 233280;
  
  // Historical Amsterdam climate data (30-year averages)
  const climateData = {
    1:  { avgTemp: 4.2,  tempRange: 6, rainDays: 17, avgRain: 62 },  // January
    2:  { avgTemp: 4.8,  tempRange: 6, rainDays: 13, avgRain: 43 },  // February  
    3:  { avgTemp: 7.8,  tempRange: 7, rainDays: 14, avgRain: 59 },  // March
    4:  { avgTemp: 11.0, tempRange: 8, rainDays: 13, avgRain: 41 },  // April
    5:  { avgTemp: 15.0, tempRange: 8, rainDays: 13, avgRain: 48 },  // May
    6:  { avgTemp: 17.9, tempRange: 7, rainDays: 14, avgRain: 68 },  // June
    7:  { avgTemp: 19.8, tempRange: 6, rainDays: 14, avgRain: 75 },  // July
    8:  { avgTemp: 19.6, tempRange: 6, rainDays: 14, avgRain: 71 },  // August
    9:  { avgTemp: 16.5, tempRange: 7, rainDays: 15, avgRain: 67 },  // September
    10: { avgTemp: 12.3, tempRange: 6, rainDays: 17, avgRain: 72 },  // October
    11: { avgTemp: 7.6,  tempRange: 5, rainDays: 18, avgRain: 81 },  // November
    12: { avgTemp: 4.9,  tempRange: 5, rainDays: 17, avgRain: 74 }   // December
  };
  
  const climate = climateData[month];
  
  // Generate temperature with realistic daily variation
  const tempVariation = (random(dateSeed) - 0.5) * climate.tempRange;
  const temperature = Math.round((climate.avgTemp + tempVariation) * 10) / 10;
  
  // Generate precipitation
  const rainProbability = climate.rainDays / 30; // Convert days to probability
  const isRainy = random(dateSeed + 1) < rainProbability;
  const precipitation = isRainy ? Math.round(random(dateSeed + 2) * climate.avgRain / 10) / 10 : 0;
  
  // Weather conditions based on temperature and rain
  let weatherMain;
  let weatherDescription;
  
  if (precipitation > 0) {
    if (precipitation < 0.5) {
      weatherMain = 'Drizzle';
      weatherDescription = 'lichte motregen';
    } else if (precipitation < 2.5) {
      weatherMain = 'Rain';
      weatherDescription = 'lichte regen';
    } else {
      weatherMain = 'Rain';
      weatherDescription = 'matige regen';
    }
  } else if (temperature < 0) {
    weatherMain = 'Clouds';
    weatherDescription = 'zwaar bewolkt';
  } else if (temperature > 25) {
    weatherMain = 'Clear';
    weatherDescription = 'heldere hemel';
  } else if (random(dateSeed + 3) < 0.3) {
    weatherMain = 'Clear';
    weatherDescription = 'heldere hemel';
  } else if (random(dateSeed + 3) < 0.6) {
    weatherMain = 'Clouds';
    weatherDescription = 'lichte bewolking';
  } else {
    weatherMain = 'Clouds';
    weatherDescription = 'verspreide bewolking';
  }
  
  return {
    date: date.toISOString().split('T')[0],
    temperature,
    precipitation,
    weatherMain,
    weatherDescription
  };
}

console.log('🧪 Debug Weather Data Generation:');
console.log('================================');

dates.forEach(dateStr => {
  const date = new Date(dateStr);
  const weather = generateRealisticWeatherData(date);
  console.log(`${dateStr}: ${weather.temperature}°C, ${weather.weatherDescription}, ${weather.precipitation}mm precipitation`);
});