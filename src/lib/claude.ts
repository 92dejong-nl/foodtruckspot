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
  basicAnalysis: {
    totalRevenue: number;
    averageRevenue: number;
    bestLocation: string;
    worstLocation: string;
    locations: Array<{
      name: string;
      averageRevenue: number;
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
}

interface ClaudeInsights {
  deepInsights: string[];
  strategicRecommendations: string[];
  actionableAdvice: string[];
  opportunityAnalysis: string[];
  riskAssessment: string[];
}

interface ClaudeRecommendations {
  locationStrategy: string[];
  timingOptimization: string[];
  weatherBasedActions: string[];
  revenueOptimization: string[];
  operationalAdvice: string[];
}

export class ClaudeAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateDeepInsights(data: ClaudeAnalysisRequest): Promise<ClaudeInsights> {
    try {
      console.log('🤖 Generating AI-powered insights...');
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          apiKey: this.apiKey,
          analysisType: 'insights'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle new plain text format
      if (result.rawAnalysis) {
        return {
          deepInsights: [result.rawAnalysis], // Put the entire response in deepInsights
          strategicRecommendations: [],
          actionableAdvice: [],
          opportunityAnalysis: [],
          riskAssessment: []
        };
      }
      
      // Fallback for old format
      return {
        deepInsights: result.deepInsights || [],
        strategicRecommendations: result.strategicRecommendations || [],
        actionableAdvice: result.actionableAdvice || [],
        opportunityAnalysis: result.opportunityAnalysis || [],
        riskAssessment: result.riskAssessment || []
      };
    } catch (error) {
      console.error('Failed to generate AI insights:', error);
      
      // Throw the error to be caught by the calling function
      throw new Error('Failed to analyze data with AI');
    }
  }

  async generateBusinessRecommendations(data: ClaudeAnalysisRequest): Promise<ClaudeRecommendations> {
    try {
      console.log('🎯 Generating AI business recommendations...');
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          apiKey: this.apiKey,
          analysisType: 'recommendations'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Handle new plain text format
      if (result.rawAnalysis) {
        return {
          locationStrategy: [result.rawAnalysis], // Put the entire response in locationStrategy
          timingOptimization: [],
          weatherBasedActions: [],
          revenueOptimization: [],
          operationalAdvice: []
        };
      }
      
      // Fallback for old format
      return {
        locationStrategy: result.locationStrategy || [],
        timingOptimization: result.timingOptimization || [],
        weatherBasedActions: result.weatherBasedActions || [],
        revenueOptimization: result.revenueOptimization || [],
        operationalAdvice: result.operationalAdvice || []
      };
    } catch (error) {
      console.error('Failed to generate AI recommendations:', error);
      return this.getFallbackRecommendations();
    }
  }


  private getFallbackInsights(): ClaudeInsights {
    return {
      deepInsights: [
        'Je verkoopdata toont interessante patronen die dieper geanalyseerd kunnen worden.',
        'Er zijn verborgene trends zichtbaar in je locatie- en timing-keuzes.'
      ],
      strategicRecommendations: [
        'Focus op je beste presterende locaties voor maximale ROI.',
        'Analyseer de timing van je beste verkoopdagen.'
      ],
      actionableAdvice: [
        'Houd gedetailleerde logs bij van externe factoren.',
        'Test nieuwe locaties gedurende verschillende weersomstandigheden.'
      ],
      opportunityAnalysis: [
        'Er zijn kansen voor uitbreiding naar vergelijkbare locaties.',
        'Optimalisatie van je menu voor verschillende doelgroepen.'
      ],
      riskAssessment: [
        'Afhankelijkheid van beperkt aantal locaties.',
        'Weersgevoeligheid van de business.'
      ]
    };
  }

  private getFallbackRecommendations(): ClaudeRecommendations {
    return {
      locationStrategy: [
        'Focus meer tijd op je best presterende locaties.',
        'Test nieuwe locaties in de buurt van succesvolle spots.'
      ],
      timingOptimization: [
        'Analyseer de beste tijdstippen per locatie.',
        'Overweeg langere openingstijden op succesvolle dagen.'
      ],
      weatherBasedActions: [
        'Bereid je voor op verschillende weersomstandigheden.',
        'Pas je menu aan op basis van het weer.'
      ],
      revenueOptimization: [
        'Verhoog je gemiddelde orderwaarde met suggestive selling.',
        'Introduceer seizoensgebonden specialiteiten.'
      ],
      operationalAdvice: [
        'Optimaliseer je voorraadplanning op basis van verwachte omzet.',
        'Investeer in marketing voor je beste locaties.'
      ]
    };
  }
}

export type { ClaudeInsights, ClaudeRecommendations, ClaudeAnalysisRequest };