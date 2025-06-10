
/**
 * This file contains utilities for mapping column names to more user-friendly display names
 */

// Column name mapping to display friendly names
export const columnDisplayNames: Record<string, string> = {
  // Original column name -> Display name
  "Primary_Line": "Primary",
  "Priority_Weight": "Weight",
  "demand_partner": "SSP",
  "demand_market_division": "Division",
  // SH Sellers.json specific mappings
  "seller_id": "Seller ID",
  "name": "Name",
  "domain": "Domain",
  "seller_type": "Seller Type",
  // Add more mappings as needed
};


// Define column types for proper sorting
export const columnTypes: Record<string, 'string' | 'number' | 'percentage'> = {
  "Priority_Weight": "percentage",
  // Add more type definitions as needed
};

/**
 * Gets the display name for a column, or returns the original name if no mapping exists
 */
export const getDisplayName = (columnName: string): string => {
  return columnDisplayNames[columnName] || columnName;
};

/**
 * Gets the original column name from a display name, or returns the display name if no mapping exists
 */
export const getOriginalName = (displayName: string): string => {
  const entry = Object.entries(columnDisplayNames).find(([_, value]) => value === displayName);
  return entry ? entry[0] : displayName;
};

/**
 * Maps an array of column names to their display names
 */
export const mapColumnsToDisplayNames = (columns: string[]): string[] => {
  return columns.map(col => getDisplayName(col));
};

/**
 * Parse percentage strings to numbers for sorting
 * Converts strings like "80%" to 80 as a number
 */
export const parsePercentage = (value: string | number): number => {
  if (typeof value === 'number') return value;
  
  if (typeof value === 'string' && value.endsWith('%')) {
    const numericValue = parseFloat(value.replace('%', ''));
    return isNaN(numericValue) ? 0 : numericValue;
  }
  
  const numericValue = parseFloat(String(value));
  return isNaN(numericValue) ? 0 : numericValue;
};

/**
 * Gets the column type
 */
export const getColumnType = (columnName: string): 'string' | 'number' | 'percentage' => {
  return columnTypes[columnName] || 'string';
};

/**
 * Convert data to CSV format and trigger download
 */
export const downloadAsCSV = (data: any[], filename: string = 'table-data.csv', visibleColumns?: string[]): void => {
  if (!data || data.length === 0) return;
  
  // Determine which columns to include in the CSV
  const headers = visibleColumns && visibleColumns.length > 0 
    ? visibleColumns 
    : Object.keys(data[0]);
  
  // Create CSV header row with display names
  const headerRow = headers.map(header => getDisplayName(header)).join(',');
  
  // Create CSV data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      // Handle values that need quotes (contain commas, quotes, or newlines)
      const value = row[header] !== null && row[header] !== undefined ? String(row[header]) : '';
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  // Combine headers and rows into final CSV
  const csvContent = [headerRow, ...csvRows].join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
