import { WeatherService } from '../lib/weather';
import { RealWeatherAnalysisService } from '../lib/realWeatherAnalysis';

// Mock fetch globally
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('WeatherService', () => {
  let weatherService: WeatherService;
  const testApiKey = 'test-api-key-12345';

  beforeEach(() => {
    weatherService = new WeatherService(testApiKey);
    jest.clearAllMocks();
  });

  describe('Geocoding API', () => {
    it('should successfully geocode Amsterdam', async () => {
      const mockGeocodeResponse = [{
        name: 'Amsterdam',
        lat: 52.3676,
        lon: 4.9041,
        country: 'NL'
      }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockGeocodeResponse
      } as Response);

      const result = await weatherService.getLocationCoordinates('Amsterdam');

      expect(result).toEqual({
        lat: 52.3676,
        lon: 4.9041,
        name: 'Amsterdam',
        country: 'NL'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('geo/1.0/direct?q=Amsterdam')
      );
    });

    it('should handle geocoding API error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as Response);

      const result = await weatherService.getLocationCoordinates('InvalidLocation');

      // Should fallback to Amsterdam coordinates
      expect(result).toEqual({
        lat: 52.3676,
        lon: 4.9041,
        name: 'InvalidLocation',
        country: 'NL'
      });
    });

    it('should use location cache on subsequent calls', async () => {
      const mockGeocodeResponse = [{
        name: 'Utrecht',
        lat: 52.0907,
        lon: 5.1214,
        country: 'NL'
      }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockGeocodeResponse
      } as Response);

      // First call
      const result1 = await weatherService.getLocationCoordinates('Utrecht');
      // Second call should use cache
      const result2 = await weatherService.getLocationCoordinates('utrecht'); // case insensitive

      expect(result1).toEqual(result2);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Should only call API once
    });

    it('should handle empty geocoding response with fallback', async () => {
      // Mock empty response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => []
      } as Response);

      // Mock fallback response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => [{
          name: 'Amsterdam',
          lat: 52.3676,
          lon: 4.9041,
          country: 'NL'
        }]
      } as Response);

      const result = await weatherService.getLocationCoordinates('Nowhere');

      expect(result.lat).toBe(52.3676);
      expect(result.lon).toBe(4.9041);
    });
  });

  describe('Historical Weather API', () => {
    it('should fetch historical weather data successfully', async () => {
      const mockWeatherResponse = {
        data: [{
          temp: 18.5,
          humidity: 65,
          pressure: 1013,
          wind_speed: 3.2,
          weather: [{
            main: 'Clear',
            description: 'clear sky'
          }],
          rain: { '1h': 0 },
          snow: undefined
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockWeatherResponse
      } as Response);

      const testDate = new Date('2024-01-15');
      const result = await weatherService.fetchHistoricalWeather(testDate);

      expect(result).toEqual({
        date: '2024-01-15',
        temperature: 18.5,
        humidity: 65,
        precipitation: 0,
        weatherMain: 'Clear',
        weatherDescription: 'clear sky',
        windSpeed: 3.2,
        pressure: 1013
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('onecall/timemachine')
      );
    });

    it('should handle weather API error and fallback to mock data', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const testDate = new Date('2024-01-15');
      const result = await weatherService.fetchHistoricalWeather(testDate);

      // Should return mock data structure
      expect(result.date).toBe('2024-01-15');
      expect(typeof result.temperature).toBe('number');
      expect(typeof result.humidity).toBe('number');
      expect(typeof result.precipitation).toBe('number');
      expect(typeof result.weatherMain).toBe('string');
      expect(typeof result.weatherDescription).toBe('string');
    });

    it('should try current weather API for recent dates when historical fails', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Mock historical API failure
      mockFetch.mockRejectedValueOnce(new Error('Historical API Error'));

      // Mock current weather API success
      const mockCurrentWeatherResponse = {
        main: {
          temp: 20.0,
          humidity: 70,
          pressure: 1015
        },
        weather: [{
          main: 'Clouds',
          description: 'few clouds'
        }],
        wind: {
          speed: 2.5
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockCurrentWeatherResponse
      } as Response);

      const result = await weatherService.fetchHistoricalWeather(yesterday);

      expect(result.temperature).toBe(20.0);
      expect(result.weatherMain).toBe('Clouds');
      expect(mockFetch).toHaveBeenCalledTimes(2); // Historical + current API calls
    });

    it('should handle rain and snow precipitation correctly', async () => {
      const mockWeatherResponse = {
        data: [{
          temp: 5.0,
          humidity: 90,
          pressure: 1005,
          wind_speed: 8.0,
          weather: [{
            main: 'Rain',
            description: 'heavy rain'
          }],
          rain: { '1h': 5.2 },
          snow: { '1h': 2.1 }
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockWeatherResponse
      } as Response);

      const testDate = new Date('2024-01-15');
      const result = await weatherService.fetchHistoricalWeather(testDate);

      // Should combine rain and snow
      expect(result.precipitation).toBeCloseTo(7.3); // 5.2 + 2.1
      expect(result.weatherMain).toBe('Rain');
    });
  });

  describe('Multiple Weather Data Fetching', () => {
    it('should fetch weather data for multiple dates', async () => {
      const mockWeatherResponse = {
        data: [{
          temp: 15.0,
          humidity: 60,
          pressure: 1010,
          wind_speed: 4.0,
          weather: [{
            main: 'Clear',
            description: 'clear sky'
          }],
          rain: undefined,
          snow: undefined
        }]
      };

      // Mock multiple API calls
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockWeatherResponse
      } as Response);

      const dates = [
        new Date('2024-01-15'),
        new Date('2024-01-16'),
        new Date('2024-01-17')
      ];

      const results = await weatherService.fetchMultipleWeatherData(dates);

      expect(results).toHaveLength(3);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      results.forEach((result, index) => {
        expect(result.date).toBe(dates[index].toISOString().split('T')[0]);
        expect(result.temperature).toBe(15.0);
      });
    });

    it('should fetch weather data for sales data with different locations', async () => {
      // Mock geocoding calls
      const mockAmsterdamGeocode = [{
        name: 'Amsterdam',
        lat: 52.3676,
        lon: 4.9041,
        country: 'NL'
      }];

      const mockUtrechtGeocode = [{
        name: 'Utrecht',
        lat: 52.0907,
        lon: 5.1214,
        country: 'NL'
      }];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAmsterdamGeocode
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUtrechtGeocode
        } as Response);

      // Mock weather API calls
      const mockWeatherResponse = {
        data: [{
          temp: 18.0,
          humidity: 65,
          pressure: 1012,
          wind_speed: 3.0,
          weather: [{
            main: 'Clear',
            description: 'clear sky'
          }],
          rain: undefined,
          snow: undefined
        }]
      };

      mockFetch
        .mockResolvedValue({
          ok: true,
          json: async () => mockWeatherResponse
        } as Response);

      const salesData = [
        { date: new Date('2024-01-15'), location: 'Amsterdam', revenue: 500 },
        { date: new Date('2024-01-16'), location: 'Utrecht', revenue: 400 }
      ];

      const results = await weatherService.fetchWeatherForSalesData(salesData);

      expect(results).toHaveLength(2);
      // Should call geocoding twice (2 unique locations) + weather API twice
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Mock Weather Data Generation', () => {
    it('should generate consistent mock data for same date', async () => {
      mockFetch.mockRejectedValue(new Error('API Unavailable'));

      const testDate = new Date('2024-06-15');
      
      const result1 = await weatherService.fetchHistoricalWeather(testDate);
      const result2 = await weatherService.fetchHistoricalWeather(testDate);

      expect(result1).toEqual(result2);
      expect(result1.date).toBe('2024-06-15');
    });

    it('should generate different mock data for different dates', async () => {
      mockFetch.mockRejectedValue(new Error('API Unavailable'));

      const date1 = new Date('2024-06-15');
      const date2 = new Date('2024-12-15');
      
      const result1 = await weatherService.fetchHistoricalWeather(date1);
      const result2 = await weatherService.fetchHistoricalWeather(date2);

      expect(result1.temperature).not.toBe(result2.temperature);
      expect(result1.date).toBe('2024-06-15');
      expect(result2.date).toBe('2024-12-15');
    });

    it('should generate seasonal appropriate mock data', async () => {
      mockFetch.mockRejectedValue(new Error('API Unavailable'));

      const summerDate = new Date('2024-07-15'); // Summer
      const winterDate = new Date('2024-01-15'); // Winter
      
      const summerResult = await weatherService.fetchHistoricalWeather(summerDate);
      const winterResult = await weatherService.fetchHistoricalWeather(winterDate);

      // Summer should be warmer than winter
      expect(summerResult.temperature).toBeGreaterThan(winterResult.temperature);
    });
  });

  describe('Weather Impact Analysis', () => {
    it('should calculate weather impact on revenue correctly', async () => {
      const salesData = [
        { date: new Date('2024-01-15'), revenue: 500, location: 'Amsterdam' },
        { date: new Date('2024-01-16'), revenue: 600, location: 'Amsterdam' },
        { date: new Date('2024-01-17'), revenue: 400, location: 'Amsterdam' }
      ];

      const weatherData = [
        {
          date: '2024-01-15',
          temperature: 20,
          humidity: 60,
          precipitation: 0,
          weatherMain: 'Clear',
          weatherDescription: 'clear sky',
          windSpeed: 3,
          pressure: 1013
        },
        {
          date: '2024-01-16',
          temperature: 25,
          humidity: 55,
          precipitation: 0,
          weatherMain: 'Clear',
          weatherDescription: 'clear sky',
          windSpeed: 2,
          pressure: 1015
        },
        {
          date: '2024-01-17',
          temperature: 15,
          humidity: 80,
          precipitation: 5,
          weatherMain: 'Rain',
          weatherDescription: 'light rain',
          windSpeed: 6,
          pressure: 1008
        }
      ];

      const impact = weatherService.calculateWeatherImpact(salesData, weatherData);

      expect(impact).toHaveProperty('temperature');
      expect(impact).toHaveProperty('precipitation');
      expect(impact).toHaveProperty('conditions');

      expect(typeof impact.temperature.correlation).toBe('number');
      expect(Array.isArray(impact.temperature.optimalRange)).toBe(true);
      expect(typeof impact.precipitation.averageImpact).toBe('number');
      expect(Array.isArray(impact.conditions)).toBe(true);
    });

    it('should handle empty weather data gracefully', () => {
      const salesData = [
        { date: new Date('2024-01-15'), revenue: 500, location: 'Amsterdam' }
      ];
      const weatherData: any[] = [];

      expect(() => {
        weatherService.calculateWeatherImpact(salesData, weatherData);
      }).toThrow('No matching weather data found for sales dates');
    });
  });
});

describe('RealWeatherAnalysisService', () => {
  describe('Weather Performance Analysis', () => {
    it('should analyze sales with real weather data', async () => {
      // Mock WeatherService
      const mockWeatherService = {
        fetchWeatherForSalesData: jest.fn()
      };

      const mockWeatherData = [
        {
          date: '2024-01-15',
          temperature: 20,
          humidity: 60,
          precipitation: 0,
          weatherMain: 'Clear',
          weatherDescription: 'clear sky',
          windSpeed: 3,
          pressure: 1013
        },
        {
          date: '2024-01-16',
          temperature: 25,
          humidity: 55,
          precipitation: 0,
          weatherMain: 'Clear',
          weatherDescription: 'clear sky',
          windSpeed: 2,
          pressure: 1015
        }
      ];

      mockWeatherService.fetchWeatherForSalesData.mockResolvedValue(mockWeatherData);

      // Mock the import
      jest.doMock('../lib/weather', () => ({
        WeatherService: jest.fn().mockImplementation(() => mockWeatherService)
      }));

      const salesData = [
        { date: new Date('2024-01-15'), location: 'Amsterdam', revenue: 500 },
        { date: new Date('2024-01-16'), location: 'Amsterdam', revenue: 600 }
      ];

      const analysis = await RealWeatherAnalysisService.analyzeSalesWithRealWeather(
        salesData,
        'test-api-key'
      );

      expect(analysis).toHaveProperty('topDays');
      expect(analysis).toHaveProperty('worstDays');
      expect(analysis).toHaveProperty('temperatureCorrelation');
      expect(analysis).toHaveProperty('precipitationImpact');
      expect(analysis).toHaveProperty('conditionPerformance');

      expect(analysis.topDays).toHaveLength(2);
      expect(analysis.topDays[0].revenue).toBe(600); // Higher revenue should be first
      expect(analysis.topDays[1].revenue).toBe(500);
    });

    it('should generate meaningful weather insights', () => {
      const mockAnalysis = {
        topDays: [{
          date: '15-1-2024',
          location: 'Amsterdam',
          revenue: 600,
          weather: {
            temperature: 25,
            precipitation: 0,
            condition: 'Clear',
            description: 'clear sky'
          },
          rank: 1
        }],
        worstDays: [{
          date: '16-1-2024',
          location: 'Amsterdam',
          revenue: 300,
          weather: {
            temperature: 10,
            precipitation: 8,
            condition: 'Rain',
            description: 'heavy rain'
          },
          rank: 1
        }],
        temperatureCorrelation: {
          correlation: 0.8,
          optimalRange: [20, 25] as [number, number],
          impact: 'positive'
        },
        precipitationImpact: {
          averageImpact: -100,
          description: 'Regen verlaagt omzet met €100 gemiddeld'
        },
        conditionPerformance: [{
          condition: 'Clear',
          averageRevenue: 550,
          count: 5,
          impact: 50
        }]
      };

      const insights = RealWeatherAnalysisService.generateWeatherInsights(mockAnalysis);

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some(insight => insight.includes('Beste dag'))).toBe(true);
      expect(insights.some(insight => insight.includes('Slechtste dag'))).toBe(true);
    });
  });
});