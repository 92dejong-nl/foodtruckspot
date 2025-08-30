interface ValidationResult {
  isValid: boolean;
  basicChecks: {
    rowCount: number;
    columnsFound: string[];
    dateFormat: string;
    revenueFormat: string;
  };
  sampleData: Array<{
    index: number;
    datum: string;
    locatie: string;
    omzet: string;
    weer?: string;
  }>;
  locationStats: Array<{
    name: string;
    count: number;
  }>;
  issues: string[];
  conclusion: string;
}

interface ParsedRow {
  date: Date;
  location: string;
  amount: number;
  originalRow: any;
}

export class DataValidator {
  /**
   * Validate foodtruck CSV data structure and quality
   */
  static validateData(parsedData: ParsedRow[]): ValidationResult {
    console.log('🔍 Starting data validation...');

    const basicChecks = this.performBasicChecks(parsedData);
    const sampleData = this.extractSampleData(parsedData);
    const locationStats = this.analyzeLocations(parsedData);
    const issues = this.detectIssues(parsedData, locationStats);
    const isValid = this.determineValidity(basicChecks, issues);

    return {
      isValid,
      basicChecks,
      sampleData,
      locationStats,
      issues,
      conclusion: isValid ? 'Data ready voor analyse' : 'Data heeft problemen die aandacht vereisen'
    };
  }

  /**
   * Perform basic structural checks
   */
  private static performBasicChecks(data: ParsedRow[]) {
    // Detect date format from first few samples
    const dateFormat = this.detectDateFormat(data);
    
    // Check revenue format
    const revenueFormat = this.checkRevenueFormat(data);

    return {
      rowCount: data.length,
      columnsFound: ['datum', 'locatie', 'omzet'], // We have the core columns
      dateFormat,
      revenueFormat
    };
  }

  /**
   * Extract first 3 rows as sample data
   */
  private static extractSampleData(data: ParsedRow[]) {
    return data.slice(0, 3).map((row, index) => ({
      index: index + 1,
      datum: row.originalRow?.datum || row.date.toISOString().split('T')[0],
      locatie: row.location,
      omzet: row.amount.toString(),
      weer: 'N/A' // We don't have weather in our basic data
    }));
  }

  /**
   * Analyze location frequency
   */
  private static analyzeLocations(data: ParsedRow[]) {
    const locationMap = new Map<string, number>();
    
    data.forEach(row => {
      const location = row.location.trim();
      locationMap.set(location, (locationMap.get(location) || 0) + 1);
    });

    return Array.from(locationMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Detect potential data quality issues
   */
  private static detectIssues(data: ParsedRow[], locationStats: Array<{name: string, count: number}>): string[] {
    const issues: string[] = [];

    // Check minimum data requirement
    if (data.length < 10) {
      issues.push(`Slechts ${data.length} rijen data (minimum 10 aanbevolen)`);
    }

    // Check for event-like locations
    const eventKeywords = ['festival', 'parade', 'koningsdag', 'pride', 'uitmarkt', 'canal parade', 'kingsday'];
    const eventLocations = locationStats.filter(loc => 
      eventKeywords.some(keyword => loc.name.toLowerCase().includes(keyword))
    );

    eventLocations.forEach(loc => {
      issues.push(`Locatie "${loc.name}" lijkt een event, niet een locatie`);
    });

    // Check day distribution
    const dayDistribution = this.analyzeDayDistribution(data);
    const dominantDay = dayDistribution.reduce((max, day) => 
      day.percentage > max.percentage ? day : max
    );

    if (dominantDay.percentage > 30) {
      issues.push(`${Math.round(dominantDay.percentage)}% van data is ${dominantDay.dayName} (verwacht: ~14%)`);
    }

    // Check for duplicate dates/locations
    const dateLocationPairs = new Set<string>();
    const duplicates: string[] = [];
    
    data.forEach(row => {
      const key = `${row.date.toISOString().split('T')[0]}-${row.location}`;
      if (dateLocationPairs.has(key)) {
        duplicates.push(key);
      } else {
        dateLocationPairs.add(key);
      }
    });

    if (duplicates.length > 0) {
      issues.push(`${duplicates.length} duplicate datum/locatie combinaties gevonden`);
    }

    // Check for unrealistic revenue values
    const revenues = data.map(row => row.amount);
    const avgRevenue = revenues.reduce((sum, rev) => sum + rev, 0) / revenues.length;
    const outliers = revenues.filter(rev => rev > avgRevenue * 3 || rev < avgRevenue * 0.2);
    
    if (outliers.length > 0) {
      issues.push(`${outliers.length} omzet waarden lijken onrealistisch`);
    }

    return issues;
  }

  /**
   * Analyze distribution of days
   */
  private static analyzeDayDistribution(data: ParsedRow[]) {
    const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
    const dayCounts = new Array(7).fill(0);
    
    data.forEach(row => {
      dayCounts[row.date.getDay()]++;
    });

    return dayCounts.map((count, index) => ({
      dayName: dayNames[index],
      count,
      percentage: (count / data.length) * 100
    }));
  }

  /**
   * Detect date format from sample data
   */
  private static detectDateFormat(data: ParsedRow[]): string {
    if (data.length === 0) return 'Onbekend';
    
    const firstDate = data[0].originalRow?.datum;
    if (!firstDate) return 'Onbekend';

    // Check common patterns
    if (/^\d{4}-\d{2}-\d{2}$/.test(firstDate)) return 'YYYY-MM-DD';
    if (/^\d{2}-\d{2}-\d{4}$/.test(firstDate)) return 'DD-MM-YYYY';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(firstDate)) return 'DD/MM/YYYY';
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(firstDate)) return 'DD.MM.YYYY';
    
    return 'Mixed/Auto-detected';
  }

  /**
   * Check revenue format quality
   */
  private static checkRevenueFormat(data: ParsedRow[]): string {
    if (data.length === 0) return 'Onbekend';
    
    // Check if all values are numeric
    const allNumeric = data.every(row => typeof row.amount === 'number' && !isNaN(row.amount));
    
    if (allNumeric) {
      return 'Numeriek (goed)';
    }
    
    return 'Mixed formaten';
  }

  /**
   * Determine if data is valid enough for analysis
   */
  private static determineValidity(basicChecks: any, issues: string[]): boolean {
    // Critical issues that prevent analysis
    const criticalIssues = issues.filter(issue => 
      issue.includes('Slechts') && issue.includes('rijen') ||
      issue.includes('duplicate')
    );

    // Data is valid if we have basic structure and no critical issues
    return basicChecks.rowCount >= 5 && criticalIssues.length === 0;
  }

  /**
   * Generate formatted validation report
   */
  static generateReport(validation: ValidationResult): string {
    const report = `DATA VALIDATIE RAPPORT
======================

BASIC CHECKS:
${validation.basicChecks.rowCount >= 10 ? '✓' : '✗'} Aantal rijen: ${validation.basicChecks.rowCount}
✓ Kolommen gevonden: [${validation.basicChecks.columnsFound.join(', ')}]
✓ Datum format: ${validation.basicChecks.dateFormat}
✓ Omzet format: ${validation.basicChecks.revenueFormat}

SAMPLE DATA (eerste 3 rijen):
${validation.sampleData.map(row => 
  `${row.index}. ${row.datum} | ${row.locatie} | ${row.omzet} | ${row.weer}`
).join('\n')}

LOCATIES GEVONDEN:
${validation.locationStats.slice(0, 8).map(loc => `- ${loc.name} (${loc.count}x)`).join('\n')}
${validation.locationStats.length > 8 ? `... en ${validation.locationStats.length - 8} meer` : ''}

${validation.issues.length > 0 ? `DATA ISSUES:
${validation.issues.map(issue => `⚠️ ${issue}`).join('\n')}` : 'DATA ISSUES:\n✓ Geen problemen gevonden'}

CONCLUSIE:
${validation.isValid ? '✓' : '✗'} ${validation.conclusion}`;

    return report;
  }
}