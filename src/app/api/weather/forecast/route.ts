import { NextRequest, NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const WEATHER_API_HOST = 'weather-api167.p.rapidapi.com';
const WEATHER_API_BASE_URL = 'https://weather-api167.p.rapidapi.com';

// Simple in-memory cache to reduce API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

interface WeatherAPIForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: Array<{
    dt: number;
    dt_txt: string;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      humidity: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: {
      all: number;
    };
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    rain?: {
      '3h': number;
    };
    snow?: {
      '3h': number;
    };
  }>;
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    timezone: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!RAPIDAPI_KEY) {
      return NextResponse.json({ 
        error: 'Weather API key not configured', 
        details: 'RAPIDAPI_KEY environment variable is missing' 
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const place = searchParams.get('place') || 'Amsterdam,NL';
    const cnt = searchParams.get('cnt') || '8'; // 8 = 24 hours (3-hour intervals)
    
    // Create cache key
    const cacheKey = `forecast_${place}_${cnt}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`✅ Using cached Weather API forecast for ${place}`);
      return NextResponse.json(cached.data);
    }

    // Build Weather API forecast URL
    const params = new URLSearchParams({
      place: place,
      cnt: cnt,
      units: 'metric', // Use Celsius instead of Kelvin
      type: 'three_hour',
      mode: 'json',
      lang: 'en'
    });
    
    const forecastUrl = `${WEATHER_API_BASE_URL}/api/weather/forecast?${params.toString()}`;
    
    console.log(`🌤️ Fetching Weather API forecast for ${place}`);
    console.log(`🔗 URL: ${forecastUrl}`);
    
    const response = await fetch(forecastUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': WEATHER_API_HOST,
        'Accept': 'application/json'
      }
    });

    console.log(`📊 Weather API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Weather API Error: ${errorText}`);
      
      // Handle specific API errors
      if (response.status === 429) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded', 
          details: 'Weather API monthly quota exceeded. Using fallback forecast.',
          status: 429
        }, { status: 429 });
      }
      
      if (response.status === 403) {
        return NextResponse.json({ 
          error: 'API subscription required', 
          details: 'API key needs to be subscribed to Weather API on RapidAPI. Using enhanced forecast patterns as fallback.',
          status: 403
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: 'Weather API request failed', 
        status: response.status,
        details: errorText 
      }, { status: response.status });
    }

    const data: WeatherAPIForecastResponse = await response.json();
    console.log(`✅ Weather API Success - Got ${data.list?.length || 0} forecast records`);
    
    // Cache the successful response
    cache.set(cacheKey, { data, timestamp: Date.now() });
    
    // Clean old cache entries (simple cleanup)
    if (cache.size > 50) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Weather API Proxy Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}