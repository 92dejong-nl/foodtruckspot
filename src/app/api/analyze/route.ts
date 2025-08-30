import { NextRequest, NextResponse } from 'next/server';

interface ClaudeAnalysisRequest {
  salesData: Array<{
    datum: string;
    locatie: string;
    omzet: number;
  }>;
  weatherData?: Array<{
    date: string;
    temperature: number;
    precipitation: number;
    weatherDescription: string;
  }>;
  eventData?: Array<{
    date: string;
    location: string;
    eventCategory: 'regular' | 'event' | 'festival';
    eventImpact: 'none' | 'low' | 'medium' | 'high';
    events: Array<{
      title: string;
      category: string;
      attendance?: 'small' | 'medium' | 'large';
    }>;
  }>;
  basicAnalysis: {
    totalRevenue: number;
    averageRevenue: number;
    bestLocation: string;
    bestRegularLocation?: string;
    worstLocation: string;
    locations: Array<{
      name: string;
      averageRevenue: number;
      regularDayAverage: number;
      eventDayAverage: number;
      eventUplift: number;
      transactionCount: number;
    }>;
    dayOfWeekStats: Array<{
      dayName: string;
      averageRevenue: number;
    }>;
    monthlyStats: Array<{
      monthName: string;
      averageRevenue: number;
    }>;
  };
  apiKey: string;
  analysisType: 'insights' | 'recommendations';
}

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

async function callClaudeAPI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function buildInsightsPrompt(data: ClaudeAnalysisRequest): string {
  const hasWeather = data.weatherData && data.weatherData.length > 0;
  const hasEvents = data.eventData && data.eventData.length > 0;
  const locationCount = data.basicAnalysis.locations.length;
  const dateRange = `${data.salesData.length} verkoopdagen`;
  
  // Calculate key statistics for more specific insights
  const bestLocation = data.basicAnalysis.locations[0];
  const worstLocation = data.basicAnalysis.locations[data.basicAnalysis.locations.length - 1];
  const performanceGap = bestLocation ? Math.round(((bestLocation.averageRevenue - worstLocation.averageRevenue) / worstLocation.averageRevenue) * 100) : 0;
  
  // Calculate revenue consistency and volatility per location
  const locationVariance = data.basicAnalysis.locations.map(loc => ({
    name: loc.name,
    variance: Math.abs(loc.averageRevenue - data.basicAnalysis.averageRevenue) / data.basicAnalysis.averageRevenue * 100
  }));
  
  // Day of week patterns analysis
  const weekdayAvg = data.basicAnalysis.dayOfWeekStats
    .filter(d => !['Zaterdag', 'Zondag'].includes(d.dayName))
    .reduce((sum, d) => sum + d.averageRevenue, 0) / 5;
  const weekendAvg = data.basicAnalysis.dayOfWeekStats
    .filter(d => ['Zaterdag', 'Zondag'].includes(d.dayName))
    .reduce((sum, d) => sum + d.averageRevenue, 0) / 2;
  
  // Weather pattern insights
  const weatherInsights = hasWeather ? `
WEERSPATRONEN:
${data.weatherData!.slice(0, 5).map(w => `- ${w.date}: ${w.temperature}°C, ${w.weatherDescription}`).join('\n')}` : '';

  return `
Analyseer alleen wat je DAADWERKELIJK ziet in deze data. Geen aannames, geen verzinsels.

DATASET: ${locationCount} locaties, ${dateRange}
${data.basicAnalysis.locations.map(loc => 
  `${loc.name}: €${Math.round(loc.averageRevenue)} gemiddeld over ${loc.transactionCount} dagen`
).join('\n')}

DAGPATRONEN:
${data.basicAnalysis.dayOfWeekStats.map(day => `${day.dayName}: €${Math.round(day.averageRevenue)} gemiddeld`).join('\n')}

${weatherInsights}

OPDRACHT: Geef alleen wat je ECHT kunt concluderen uit deze cijfers.

## 📊 Feiten uit de data
Wat zijn de 2-3 meest opvallende verschillen in de cijfers? Bijvoorbeeld: locatie X doet €Y meer dan locatie Z, dag A is €B beter dan dag C.

## 🤔 Mogelijke oorzaken
Welke LOGISCHE verklaringen zijn er voor deze verschillen? Bijvoorbeeld: locatie bij station vs park, werkdag vs weekend. Geen wilde gissingen.

## ✅ Direct uitvoerbaar
2 concrete acties gebaseerd op wat de data toont. Bijvoorbeeld: "Meer dagen naar [beste locatie]" of "Test [beste dag] op andere locaties".

EISEN:
- Alleen cijfers die er daadwerkelijk staan
- Maximum 120 woorden totaal
- Nederlandse taal
- Geen marketing praat
- Geen aannames over klanten/weer/concurrentie tenzij je data hebt

Plain text, geen JSON.`;
}

function buildRecommendationsPrompt(data: ClaudeAnalysisRequest): string {
  const hasWeather = data.weatherData && data.weatherData.length > 0;
  const hasEvents = data.eventData && data.eventData.length > 0;
  const locationCount = data.basicAnalysis.locations.length;
  
  // Find underperforming opportunities
  const locations = data.basicAnalysis.locations;
  const topLocation = locations[0];
  const underperformingLocations = locations.filter(loc => loc.regularDayAverage < data.basicAnalysis.averageRevenue);
  
  // Calculate potential monthly revenue increase
  const currentMonthlyRevenue = data.basicAnalysis.averageRevenue * 25; // Assuming 25 working days
  const maxPotentialDaily = Math.max(...data.basicAnalysis.dayOfWeekStats.map(d => d.averageRevenue));
  
  // Day efficiency analysis  
  const bestDay = data.basicAnalysis.dayOfWeekStats[0];
  const worstDay = data.basicAnalysis.dayOfWeekStats[data.basicAnalysis.dayOfWeekStats.length - 1];
  
  return `
Geef praktische acties gebaseerd op deze data. Geen fantasie, alleen feiten.

DATA:
- Beste locatie: ${topLocation.name} (€${Math.round(topLocation.averageRevenue)} gemiddeld)
- Slechtste: ${locations[locations.length-1].name} (€${Math.round(locations[locations.length-1].averageRevenue)} gemiddeld)
- Verschil: €${Math.round(topLocation.averageRevenue - locations[locations.length-1].averageRevenue)} per dag
- Beste dag: ${bestDay.dayName} (€${Math.round(bestDay.averageRevenue)})
- Slechtste dag: ${worstDay.dayName} (€${Math.round(worstDay.averageRevenue)})

${hasWeather ? `Weerdata: ${data.weatherData!.length} dagen beschikbaar` : ''}

## 🎯 Directe acties (deze week)
Wat kun je direct veranderen gebaseerd op de beste prestaties in je data?

## 📊 Meer data verzamelen
Welke extra informatie heb je nodig om betere beslissingen te maken?

## ⚖️ Tests uitvoeren
Welke simpele test kun je doen om de patronen in je data te bevestigen?

EISEN:
- Alleen gebaseerd op cijfers die je hebt
- Specifieke locaties/dagen uit de data gebruiken
- Maximum 100 woorden totaal
- Nederlandse taal
- Geen percentage beloftes zonder bewijs

Plain text, geen JSON.`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ClaudeAnalysisRequest = await request.json();
    
    // Use environment variable for Claude API key instead of client key
    const claudeApiKey = process.env.CLAUDE_API_KEY || body.apiKey;
    
    if (!claudeApiKey) {
      return NextResponse.json(
        { error: 'Claude API key not configured' },
        { status: 500 }
      );
    }

    console.log(`🤖 Processing ${body.analysisType} request...`);
    console.log(`🔑 Using ${process.env.CLAUDE_API_KEY ? 'server' : 'client'} API key`);
    
    const prompt = body.analysisType === 'insights' 
      ? buildInsightsPrompt(body)
      : buildRecommendationsPrompt(body);

    const response = await callClaudeAPI(prompt, claudeApiKey);
    
    // Since we're now using plain text format, return the response directly
    // The frontend will parse it as raw text and display it appropriately
    if (body.analysisType === 'insights') {
      return NextResponse.json({
        rawAnalysis: response,
        analysisType: 'insights'
      });
    } else {
      return NextResponse.json({
        rawAnalysis: response,
        analysisType: 'recommendations'
      });
    }

  } catch (error) {
    console.error('Claude API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze data with AI',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}