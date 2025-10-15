
/**
 * Utility functions for transforming and processing Google Sheets data
 */

/**
 * Transforms raw sheet values into an array of objects with column headers as keys
 */
export const transformSheetData = (values: any[]): any[] => {
  if (!values || values.length < 2) return [];
  
  const headers = values[0];
  const rows = values.slice(1);
  
  return rows.map(row => {
    const obj: Record<string, any> = {};
    headers.forEach((header: string, index: number) => {
      // Keep all values as strings to preserve ID and other text fields
      const value = row[index];
      obj[header] = value === null || value === undefined ? '' : String(value);
    });
    return obj;
  });
};

/**
 * Groups data by a specific column
 */
export const groupByColumn = (data: any[], column: string): Record<string, any[]> => {
  return data.reduce((acc, item) => {
    const key = item[column];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
};

/**
 * Creates a summary of numeric columns
 */
export const summarizeNumericData = (data: any[]): Record<string, { sum: number, avg: number, min: number, max: number }> => {
  if (!data || data.length === 0) return {};
  
  // Get all numeric columns
  const numericColumns = Object.keys(data[0]).filter(key => 
    typeof data[0][key] === 'number'
  );
  
  const summary: Record<string, { sum: number, avg: number, min: number, max: number }> = {};
  
  numericColumns.forEach(column => {
    const values = data.map(item => item[column]).filter(val => typeof val === 'number');
    
    if (values.length === 0) return;
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    summary[column] = { sum, avg, min, max };
  });
  
  return summary;
};

/**
 * Formats data for visualization
 */
export const formatForVisualization = (
  data: any[], 
  categoryField: string, 
  valueField: string
): { name: string, value: number }[] => {
  // Group by category field and sum up the values
  const grouped = data.reduce((acc, item) => {
    const key = item[categoryField];
    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key] += Number(item[valueField]) || 0;
    return acc;
  }, {});
  
  // Convert to array format for recharts
  return Object.entries(grouped).map(([name, value]) => ({
    name,
    value: value as number
  }));
};
