import { NextRequest, NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'meteostat.p.rapidapi.com';
const METEOSTAT_BASE_URL = process.env.METEOSTAT_BASE_URL || 'https://meteostat.p.rapidapi.com';
const AMSTERDAM_COORDS = { lat: 52.3676, lon: 4.9041 };

// Simple in-memory cache to reduce API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface MeteostatDailyResponse {
  data: Array<{
    date: string;
    tavg: number | null; // Average temperature
    tmin: number | null; // Minimum temperature
    tmax: number | null; // Maximum temperature
    prcp: number | null; // Precipitation
    snow: number | null; // Snow depth
    wdir: number | null; // Wind direction
    wspd: number | null; // Wind speed
    wpgt: number | null; // Wind gust
    pres: number | null; // Pressure
    tsun: number | null; // Sunshine duration
  }>;
  meta: {
    generated: string;
    stations: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!RAPIDAPI_KEY) {
      return NextResponse.json({ 
        error: 'Meteostat API key not configured', 
        details: 'RAPIDAPI_KEY environment variable is missing' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { dates, location } = body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json({ error: 'Dates array required' }, { status: 400 });
    }

    // Use Amsterdam coordinates by default for Dutch food trucks
    const coords = location || AMSTERDAM_COORDS;
    
    // Sort dates and get range
    const sortedDates = dates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
    const startDate = sortedDates[0].toISOString().split('T')[0];
    const endDate = sortedDates[sortedDates.length - 1].toISOString().split('T')[0];
    
    // Create cache key
    const cacheKey = `${coords.lat}_${coords.lon}_${startDate}_${endDate}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`✅ Using cached Meteostat data for ${startDate} to ${endDate}`);
      return NextResponse.json(cached.data);
    }

    // Build Meteostat API URL
    const params = new URLSearchParams({
      lat: coords.lat.toString(),
      lon: coords.lon.toString(),
      start: startDate,
      end: endDate
    });
    
    const meteostateUrl = `${METEOSTAT_BASE_URL}/point/daily?${params.toString()}`;
    
    console.log(`🌤️ Fetching Meteostat data for ${startDate} to ${endDate}`);
    console.log(`📍 Location: ${coords.lat}, ${coords.lon}`);
    console.log(`🔗 URL: ${meteostateUrl}`);
    
    const response = await fetch(meteostateUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    });

    console.log(`📊 Meteostat API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Meteostat API Error: ${errorText}`);
      
      // Handle specific API errors
      if (response.status === 429) {
        return NextResponse.json({ 
          error: 'Rate limit exceeded', 
          details: 'Meteostat API monthly quota (500 requests) exceeded. Using fallback data.',
          status: 429
        }, { status: 429 });
      }
      
      if (response.status === 403) {
        return NextResponse.json({ 
          error: 'API subscription required', 
          details: 'API key needs to be subscribed to Meteostat API on RapidAPI. Using enhanced weather patterns as fallback.',
          status: 403
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: 'Meteostat API request failed', 
        status: response.status,
        details: errorText 
      }, { status: response.status });
    }

    const data: MeteostatDailyResponse = await response.json();
    console.log(`✅ Meteostat API Success - Got ${data.data?.length || 0} daily records`);
    
    // Cache the successful response
    cache.set(cacheKey, { data, timestamp: Date.now() });
    
    // Clean old cache entries (simple cleanup)
    if (cache.size > 100) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Meteostat API Proxy Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}