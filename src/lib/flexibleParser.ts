interface ParsedRow {
  date: Date;
  location: string;
  amount: number;
  originalRow: string;
  rowIndex: number;
}

interface ParseResult {
  data: ParsedRow[];
  errors: string[];
  detectedFormat: {
    separator: string;
    dateFormat: string;
    columnOrder: string[];
    hasHeaders: boolean;
  };
  summary: {
    totalRows: number;
    successfulRows: number;
    errorRows: number;
  };
}

interface ColumnMapping {
  dateIndex: number;
  locationIndex: number;
  amountIndex: number;
}

// Date format patterns to test - using UTC to avoid timezone issues
const DATE_FORMATS = [
  { pattern: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, format: 'YYYY-MM-DD', parser: (match: RegExpMatchArray) => new Date(Date.UTC(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), 12, 0, 0)) },
  { pattern: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, format: 'DD-MM-YYYY', parser: (match: RegExpMatchArray) => new Date(Date.UTC(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]), 12, 0, 0)) },
  { pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, format: 'DD/MM/YYYY', parser: (match: RegExpMatchArray) => new Date(Date.UTC(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]), 12, 0, 0)) },
  { pattern: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, format: 'YYYY/MM/DD', parser: (match: RegExpMatchArray) => new Date(Date.UTC(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), 12, 0, 0)) },
  { pattern: /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, format: 'DD.MM.YYYY', parser: (match: RegExpMatchArray) => new Date(Date.UTC(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]), 12, 0, 0)) },
];

// Column header patterns
const COLUMN_PATTERNS = {
  date: ['datum', 'date', 'dag', 'day', 'tijd', 'time'],
  location: ['locatie', 'location', 'plaats', 'place', 'spot', 'adres', 'address'],
  amount: ['omzet', 'revenue', 'amount', 'bedrag', 'waarde', 'value', 'euro', 'eur', '€']
};

export class FlexibleParser {
  /**
   * Main parsing function - automatically detects format and parses data
   */
  static parseData(input: string): ParseResult {
    console.log('🔄 Starting flexible parsing...');
    
    // Clean input and split into lines
    const lines = input.trim().split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      return {
        data: [],
        errors: ['Het bestand is leeg'],
        detectedFormat: { separator: '', dateFormat: '', columnOrder: [], hasHeaders: false },
        summary: { totalRows: 0, successfulRows: 0, errorRows: 1 }
      };
    }

    // 1. Detect separator
    const separator = this.detectSeparator(lines);
    console.log(`🔍 Detected separator: "${separator}"`);

    // 2. Check for headers
    const hasHeaders = this.detectHeaders(lines[0], separator);
    console.log(`📋 Has headers: ${hasHeaders}`);

    // 3. Determine column mapping
    const columnMapping = this.detectColumnMapping(lines, separator, hasHeaders);
    console.log('🗂️ Column mapping:', columnMapping);

    // 4. Detect date format from sample data
    const sampleData = hasHeaders ? lines.slice(1, 6) : lines.slice(0, 5);
    const dateFormat = this.detectDateFormat(sampleData, separator, columnMapping.dateIndex);
    console.log(`📅 Detected date format: ${dateFormat}`);

    // 5. Parse all data rows
    const dataRows = hasHeaders ? lines.slice(1) : lines;
    const parseResults = this.parseRows(dataRows, separator, columnMapping, dateFormat);
    
    // Update separator display for single-column
    const separatorDisplay = separator === 'single-column' ? 'single-column' : 
      separator === '\t' ? 'tab' : separator === ' ' ? 'space' : separator;

    return {
      data: parseResults.data,
      errors: parseResults.errors,
      detectedFormat: {
        separator: separatorDisplay,
        dateFormat,
        columnOrder: hasHeaders ? this.parseRow(lines[0], separator) : 
          separator === 'single-column' ? ['alle data in één kolom'] : ['datum', 'locatie', 'omzet'],
        hasHeaders
      },
      summary: {
        totalRows: dataRows.length,
        successfulRows: parseResults.data.length,
        errorRows: parseResults.errors.length
      }
    };
  }

  /**
   * Detect the separator used in the data
   */
  private static detectSeparator(lines: string[]): string {
    const separators = [',', ';', '\t', '|'];
    const sampleLines = lines.slice(0, Math.min(5, lines.length));
    
    // Check if this might be single-column format first
    const avgWordsPerLine = sampleLines.reduce((sum, line) => sum + line.trim().split(/\s+/).length, 0) / sampleLines.length;
    const hasNoCommonSeparators = separators.every(sep => 
      sampleLines.every(line => !line.includes(sep))
    );
    
    if (hasNoCommonSeparators && avgWordsPerLine >= 3) {
      console.log('🎯 Detected single-column format with space-separated values');
      return 'single-column';
    }
    
    // Count occurrences of each separator
    const separatorCounts = separators.map(sep => ({
      separator: sep,
      avgCount: sampleLines.reduce((sum, line) => sum + (line.split(sep).length - 1), 0) / sampleLines.length,
      consistency: this.calculateConsistency(sampleLines, sep)
    }));

    // If no clear separator found, try space-separated
    const bestSeparator = separatorCounts
      .filter(s => s.avgCount >= 2) // At least 2 columns
      .sort((a, b) => b.consistency - a.consistency)[0];

    if (bestSeparator) {
      return bestSeparator.separator;
    }

    // Fallback to space if multiple consecutive spaces found
    if (sampleLines.some(line => /\s{2,}/.test(line))) {
      return ' ';
    }

    // If still no clear separator but we have multiple words, assume single-column
    if (avgWordsPerLine >= 3) {
      return 'single-column';
    }

    // Default to comma
    return ',';
  }

  /**
   * Calculate consistency of separator usage across lines
   */
  private static calculateConsistency(lines: string[], separator: string): number {
    const columnCounts = lines.map(line => line.split(separator).length);
    const mostCommonCount = this.mode(columnCounts);
    const consistentLines = columnCounts.filter(count => count === mostCommonCount).length;
    return consistentLines / lines.length;
  }

  /**
   * Find the most common value in an array
   */
  private static mode(array: number[]): number {
    const counts = array.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return parseInt(Object.entries(counts).reduce((a, b) => counts[parseInt(a[0])] > counts[parseInt(b[0])] ? a : b)[0]);
  }

  /**
   * Detect if the first line contains headers
   */
  private static detectHeaders(firstLine: string, separator: string): boolean {
    const columns = this.parseRow(firstLine, separator);
    
    // Check if any column matches known header patterns
    return columns.some(col => {
      const colLower = col.toLowerCase().trim();
      return Object.values(COLUMN_PATTERNS).some(patterns => 
        patterns.some(pattern => colLower.includes(pattern))
      );
    });
  }

  /**
   * Parse a single row into columns, handling quoted fields and spaces
   */
  private static parseRow(line: string, separator: string): string[] {
    if (separator === 'single-column') {
      // For single-column format, return the entire line as one column
      return [line.trim()];
    } else if (separator === ' ') {
      // For space-separated, split on multiple spaces and filter empty
      return line.split(/\s+/).filter(col => col.trim());
    } else {
      // For other separators, split normally and clean
      return line.split(separator).map(col => col.trim().replace(/^["']|["']$/g, ''));
    }
  }

  /**
   * Try to parse a single column that might contain all data
   * Handles formats like: "2024-01-15 Museumplein €450,50" or "15-01-2024 Dam €320"
   */
  private static parseSingleColumn(value: string): { date: Date | null, location: string, amount: number } | null {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    
    // Split on whitespace but keep quoted strings together
    const parts = trimmed.match(/\S+/g) || [];
    if (parts.length < 3) return null;

    console.log(`🔍 Parsing single column: "${trimmed}" -> parts:`, parts);

    // Strategy 1: Date at start, amount at end (most common)
    // Format: "2024-01-15 Museumplein Amsterdam €450,50"
    let date = parts[0] ? this.tryParseDate(parts[0]) : null;
    if (date) {
      // Look for amount starting from the end
      for (let i = parts.length - 1; i >= 2; i--) {
        const amount = this.parseAmount(parts[i]);
        if (!isNaN(amount) && amount > 0) {
          const locationParts = parts.slice(1, i);
          if (locationParts.length > 0) {
            console.log(`✅ Strategy 1 success: date=${parts[0]}, location=${locationParts.join(' ')}, amount=${parts[i]}`);
            return {
              date,
              location: locationParts.join(' '),
              amount
            };
          }
        }
      }
    }

    // Strategy 2: Try middle parts as date (European format common)
    // Format: "Museumplein 15-01-2024 €450,50"
    for (let dateIndex = 1; dateIndex < parts.length - 1; dateIndex++) {
      date = parts[dateIndex] ? this.tryParseDate(parts[dateIndex]) : null;
      if (date) {
        // Look for amount after date
        for (let amountIndex = dateIndex + 1; amountIndex < parts.length; amountIndex++) {
          const amount = this.parseAmount(parts[amountIndex]);
          if (!isNaN(amount) && amount > 0) {
            const locationBefore = parts.slice(0, dateIndex);
            const locationAfter = parts.slice(dateIndex + 1, amountIndex);
            const location = [...locationBefore, ...locationAfter].join(' ');
            if (location.length > 0) {
              console.log(`✅ Strategy 2 success: location=${location}, date=${parts[dateIndex]}, amount=${parts[amountIndex]}`);
              return {
                date,
                location,
                amount
              };
            }
          }
        }
      }
    }

    // Strategy 3: Try to find patterns with regex
    // Look for date patterns anywhere in the string
    const datePatterns = [
      /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,
      /\b(\d{1,2})-(\d{1,2})-(\d{4})\b/,
      /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,
      /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/
    ];

    for (const pattern of datePatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const dateStr = match[0];
        date = this.tryParseDate(dateStr);
        if (date) {
          // Remove date from string and look for amount
          const withoutDate = trimmed.replace(dateStr, ' ').trim();
          const amountMatch = withoutDate.match(/€?\d+[.,]?\d*/g);
          if (amountMatch) {
            const amountStr = amountMatch[amountMatch.length - 1]; // Take last number as amount
            const amount = this.parseAmount(amountStr);
            if (!isNaN(amount) && amount > 0) {
              // Remove amount from string to get location
              const location = withoutDate.replace(amountStr, '').replace(/[€\s]+/g, ' ').trim();
              if (location.length > 0) {
                console.log(`✅ Strategy 3 success: date=${dateStr}, location=${location}, amount=${amountStr}`);
                return {
                  date,
                  location,
                  amount
                };
              }
            }
          }
        }
      }
    }

    console.log(`❌ All strategies failed for: "${trimmed}"`);
    return null;
  }

  /**
   * Try to parse a date string with any format
   */
  private static tryParseDate(dateStr: string): Date | null {
    const cleaned = dateStr.trim();
    
    for (const format of DATE_FORMATS) {
      const match = cleaned.match(format.pattern);
      if (match) {
        const date = format.parser(match);
        // Validate the date is reasonable
        if (date.getFullYear() > 1900 && date.getFullYear() < 2100) {
          return date;
        }
      }
    }

    return null;
  }

  /**
   * Detect which columns contain date, location, and amount
   */
  private static detectColumnMapping(lines: string[], separator: string, hasHeaders: boolean): ColumnMapping {
    const firstLine = lines[0];
    const columns = this.parseRow(firstLine, separator);

    if (hasHeaders) {
      // Use header names to map columns
      const dateIndex = this.findColumnByPattern(columns, COLUMN_PATTERNS.date);
      const locationIndex = this.findColumnByPattern(columns, COLUMN_PATTERNS.location);
      const amountIndex = this.findColumnByPattern(columns, COLUMN_PATTERNS.amount);

      if (dateIndex !== -1 && locationIndex !== -1 && amountIndex !== -1) {
        return { dateIndex, locationIndex, amountIndex };
      }
    }

    // Fallback: analyze data patterns to guess columns
    const sampleRows = hasHeaders ? lines.slice(1, 6) : lines.slice(0, 5);
    return this.guessColumnMapping(sampleRows, separator);
  }

  /**
   * Find column index by matching header patterns
   */
  private static findColumnByPattern(columns: string[], patterns: string[]): number {
    return columns.findIndex(col => {
      const colLower = col.toLowerCase().trim();
      return patterns.some(pattern => colLower.includes(pattern));
    });
  }

  /**
   * Guess column mapping by analyzing data patterns
   */
  private static guessColumnMapping(sampleRows: string[], separator: string): ColumnMapping {
    if (sampleRows.length === 0) {
      return { dateIndex: 0, locationIndex: 1, amountIndex: 2 };
    }

    const columns = this.parseRow(sampleRows[0], separator);
    const columnAnalysis = columns.map((_, index) => ({
      index,
      dateScore: this.calculateDateScore(sampleRows, separator, index),
      amountScore: this.calculateAmountScore(sampleRows, separator, index),
      textScore: this.calculateTextScore(sampleRows, separator, index)
    }));

    const dateIndex = columnAnalysis.reduce((best, current) => 
      current.dateScore > best.dateScore ? current : best
    ).index;

    const amountIndex = columnAnalysis.reduce((best, current) => 
      current.amountScore > best.amountScore ? current : best
    ).index;

    const locationIndex = columnAnalysis.findIndex((col, index) => 
      index !== dateIndex && index !== amountIndex
    );

    return {
      dateIndex: dateIndex,
      locationIndex: locationIndex !== -1 ? locationIndex : 1,
      amountIndex: amountIndex
    };
  }

  /**
   * Calculate how likely a column contains dates
   */
  private static calculateDateScore(rows: string[], separator: string, columnIndex: number): number {
    let dateMatches = 0;
    for (const row of rows) {
      const columns = this.parseRow(row, separator);
      if (columns[columnIndex] && this.isDateLike(columns[columnIndex])) {
        dateMatches++;
      }
    }
    return dateMatches / rows.length;
  }

  /**
   * Calculate how likely a column contains amounts
   */
  private static calculateAmountScore(rows: string[], separator: string, columnIndex: number): number {
    let amountMatches = 0;
    for (const row of rows) {
      const columns = this.parseRow(row, separator);
      if (columns[columnIndex] && this.isAmountLike(columns[columnIndex])) {
        amountMatches++;
      }
    }
    return amountMatches / rows.length;
  }

  /**
   * Calculate how likely a column contains text (location names)
   */
  private static calculateTextScore(rows: string[], separator: string, columnIndex: number): number {
    let textMatches = 0;
    for (const row of rows) {
      const columns = this.parseRow(row, separator);
      const value = columns[columnIndex];
      if (value && !this.isDateLike(value) && !this.isAmountLike(value) && value.length > 2) {
        textMatches++;
      }
    }
    return textMatches / rows.length;
  }

  /**
   * Check if a value looks like a date
   */
  private static isDateLike(value: string): boolean {
    return DATE_FORMATS.some(format => format.pattern.test(value.trim()));
  }

  /**
   * Check if a value looks like an amount
   */
  private static isAmountLike(value: string): boolean {
    const cleaned = value.replace(/[€$£¥,.\s]/g, '');
    return /^\d+$/.test(cleaned) && cleaned.length > 0;
  }

  /**
   * Detect the date format used in the data
   */
  private static detectDateFormat(sampleRows: string[], separator: string, dateColumnIndex: number): string {
    const sampleDates = sampleRows
      .map(row => this.parseRow(row, separator)[dateColumnIndex])
      .filter(Boolean)
      .slice(0, 3);

    for (const date of sampleDates) {
      for (const format of DATE_FORMATS) {
        if (format.pattern.test(date.trim())) {
          return format.format;
        }
      }
    }

    return 'YYYY-MM-DD'; // Default fallback
  }

  /**
   * Parse all data rows
   */
  private static parseRows(rows: string[], separator: string, columnMapping: ColumnMapping, dateFormat: string): { data: ParsedRow[], errors: string[] } {
    const data: ParsedRow[] = [];
    const errors: string[] = [];

    rows.forEach((row, index) => {
      try {
        const columns = this.parseRow(row, separator);
        
        // Try single column parsing first if we have only 1 column
        if (columns.length === 1) {
          const singleColumnResult = this.parseSingleColumn(columns[0]);
          if (singleColumnResult && singleColumnResult.date) {
            data.push({
              date: singleColumnResult.date,
              location: singleColumnResult.location,
              amount: singleColumnResult.amount,
              originalRow: row,
              rowIndex: index + 1
            });
            return;
          } else {
            errors.push(`Rij ${index + 1}: Kon data niet splitsen uit single column "${columns[0]}"`);
            return;
          }
        }
        
        // Standard multi-column parsing
        if (columns.length < 3) {
          errors.push(`Rij ${index + 1}: Onvoldoende kolommen (${columns.length} gevonden, 3 verwacht)`);
          return;
        }

        const dateStr = columns[columnMapping.dateIndex]?.trim();
        const location = columns[columnMapping.locationIndex]?.trim();
        const amountStr = columns[columnMapping.amountIndex]?.trim();

        if (!dateStr || !location || !amountStr) {
          errors.push(`Rij ${index + 1}: Lege waarden gevonden`);
          return;
        }

        // Parse date
        const parsedDate = this.parseDate(dateStr, dateFormat);
        if (!parsedDate) {
          errors.push(`Rij ${index + 1}: Ongeldige datum "${dateStr}"`);
          return;
        }

        // Parse amount
        const parsedAmount = this.parseAmount(amountStr);
        if (isNaN(parsedAmount)) {
          errors.push(`Rij ${index + 1}: Ongeldig bedrag "${amountStr}"`);
          return;
        }

        data.push({
          date: parsedDate,
          location,
          amount: parsedAmount,
          originalRow: row,
          rowIndex: index + 1
        });

      } catch (error) {
        errors.push(`Rij ${index + 1}: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
      }
    });

    return { data, errors };
  }

  /**
   * Parse date string according to detected format
   */
  private static parseDate(dateStr: string, detectedFormat: string): Date | null {
    const cleaned = dateStr.trim();
    
    for (const format of DATE_FORMATS) {
      if (format.format === detectedFormat) {
        const match = cleaned.match(format.pattern);
        if (match) {
          const date = format.parser(match);
          // Validate the date is reasonable
          if (date.getFullYear() > 1900 && date.getFullYear() < 2100) {
            return date;
          }
        }
      }
    }

    return null;
  }

  /**
   * Parse amount string, handling various formats
   */
  private static parseAmount(amountStr: string): number {
    // Remove currency symbols and spaces
    let cleaned = amountStr.replace(/[€$£¥\s]/g, '');
    
    // Handle European format (comma as decimal separator)
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Assume comma is thousands separator if both are present
      // e.g., "1,234.50" or "1.234,50"
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      
      if (lastComma > lastDot) {
        // European format: 1.234,50
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // US format: 1,234.50
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (cleaned.includes(',')) {
      // Only comma present - could be thousands or decimal
      const commaIndex = cleaned.indexOf(',');
      const afterComma = cleaned.substring(commaIndex + 1);
      
      if (afterComma.length <= 2 && /^\d+$/.test(afterComma)) {
        // Likely decimal separator: 450,50
        cleaned = cleaned.replace(',', '.');
      } else {
        // Likely thousands separator: 1,234
        cleaned = cleaned.replace(/,/g, '');
      }
    }

    return parseFloat(cleaned);
  }
}