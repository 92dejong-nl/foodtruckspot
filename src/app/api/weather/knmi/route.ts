import { NextRequest, NextResponse } from 'next/server';

const KNMI_BASE_URL = 'https://api.dataplatform.knmi.nl/edr/v1';
const KNMI_COLLECTION = '10-minute-in-situ-meteorological-observations';
const KNMI_LOCATION_ID = '0-20000-0-06240'; // Amsterdam area (De Bilt)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, date } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    // Format datetime for EDR API (ISO 8601)
    const targetDate = new Date(date);
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);
    
    const datetime = `${startDate.toISOString()}/${endDate.toISOString()}`;
    
    // KNMI EDR API parameters
    const params = new URLSearchParams({
      'datetime': datetime,
      'parameter-name': 'ta,rh,pr,ff,pp', // temp, humidity, precipitation, wind speed, pressure
      'f': 'CoverageJSON'
    });
    
    const knmiUrl = `${KNMI_BASE_URL}/collections/${KNMI_COLLECTION}/locations/${KNMI_LOCATION_ID}?${params.toString()}`;
    
    console.log(`🌤️ Proxying KNMI EDR API request for ${date}`);
    console.log(`🔗 URL: ${knmiUrl}`);
    
    const response = await fetch(knmiUrl, {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'FoodTruckSpot/1.0'
      }
    });

    console.log(`📊 KNMI API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ KNMI API Error: ${errorText}`);
      return NextResponse.json({ 
        error: 'KNMI API request failed', 
        status: response.status,
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ KNMI API Success - Data type: ${data.type}`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ KNMI API Proxy Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}