/**
 * Formats a number as Euro currency with European formatting
 */
export const formatEuroValue = (value: any): string => {
  // Convert to number, handle null/undefined/empty values
  const numValue = Number(value);
  
  if (isNaN(numValue) || value === null || value === undefined || value === '') {
    return String(value || '');
  }
  
  // For values less than 10, use dot with 1 decimal place
  if (numValue < 10) {
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }) + ' €';
  }
  
  // For values 10 and above, round to whole number
  const roundedValue = Math.round(numValue);
  
  // Use formatting with comma for thousands separator
  return roundedValue.toLocaleString('en-US') + ' €';
};

/**
 * Formats numeric values with the same logic as Euro values but without the € symbol
 */
export const formatNumericValue = (value: any): string => {
  // Convert to number, handle null/undefined/empty values
  const numValue = Number(value);
  
  if (isNaN(numValue) || value === null || value === undefined || value === '') {
    return String(value || '');
  }
  
  // For values less than 10, use dot with 1 decimal place
  if (numValue < 10) {
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  }
  
  // For values 10 and above, round to whole number
  const roundedValue = Math.round(numValue);
  
  // Use formatting with comma for thousands separator
  return roundedValue.toLocaleString('en-US');
};

/**
 * Formats RPMO values with 4 decimal places
 */
export const formatRpmoValue = (value: any): string => {
  // Convert to number, handle null/undefined/empty values
  const numValue = Number(value);
  
  if (isNaN(numValue) || value === null || value === undefined || value === '') {
    return String(value || '');
  }
  
  // Format with 4 decimal places
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  });
};

/**
 * Formats rank values as integers (1, 2, 3, etc.)
 */
export const formatRankValue = (value: any): string => {
  // Convert to number, handle null/undefined/empty values
  const numValue = Number(value);
  
  if (isNaN(numValue) || value === null || value === undefined || value === '') {
    return String(value || '');
  }
  
  // Return as integer without decimal places
  return Math.round(numValue).toString();
};

/**
 * Formats percentage values (0.3 -> 30%, 0.8 -> 80%)
 */
export const formatPercentageValue = (value: any): string => {
  // Convert to number, handle null/undefined/empty values
  const numValue = Number(value);
  
  if (isNaN(numValue) || value === null || value === undefined || value === '') {
    return String(value || '');
  }
  
  // Multiply by 100 and round to avoid floating point issues
  const percentValue = Math.round(numValue * 100);
  return percentValue + '%';
};

/**
 * Checks if a column name contains 'rev' (case insensitive) indicating it's a revenue column
 */
export const isRevenueColumn = (columnName: string): boolean => {
  return columnName.toLowerCase().includes('rev');
};

/**
 * Checks if a column name contains 'rpmo' (case insensitive) indicating it's an RPMO column
 */
export const isRpmoColumn = (columnName: string): boolean => {
  return columnName.toLowerCase().includes('rpmo');
};

/**
 * Checks if a column name contains 'rank' (case insensitive) indicating it's a rank column
 */
export const isRankColumn = (columnName: string): boolean => {
  return columnName.toLowerCase().includes('rank');
};

/**
 * Checks if a column name is '%' (percentage column)
 */
export const isPercentageColumn = (columnName: string): boolean => {
  return columnName === '%' || columnName.toLowerCase() === 'percentage';
};

/**
 * Check if a column should be treated as an ID field (string formatting)
 */
export const isIdColumn = (columnName: string): boolean => {
  const lowerColumnName = columnName.toLowerCase();
  return lowerColumnName.includes('id') || 
         lowerColumnName === 'seller id' ||
         lowerColumnName === 'seller_id';
};

/**
 * Checks if a column contains numeric values (excluding revenue, RPMO, and rank columns)
 */
export const isNumericColumn = (columnName: string, value: any): boolean => {
  // Don't format ID columns as numeric even if they contain numbers
  if (isIdColumn(columnName)) {
    return false;
  }
  
  // Don't format if it's already a revenue, RPMO, or rank column
  if (isRevenueColumn(columnName) || isRpmoColumn(columnName) || isRankColumn(columnName)) {
    return false;
  }
  
  // Check if the value is numeric
  const numValue = Number(value);
  return !isNaN(numValue) && value !== null && value !== undefined && value !== '';
};
