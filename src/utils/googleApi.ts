
import axios from 'axios';

// Mock data for spreadsheets
const mockSpreadsheets = [
  { id: 'sheet1', name: 'Sales Report 2023' },
  { id: 'sheet2', name: 'Inventory Tracking' },
  { id: 'sheet3', name: 'Customer Database' },
  { id: 'sheet4', name: 'Q1 Financial Report' },
];

// Mock data for sheets within a spreadsheet
const mockSheets = {
  'sheet1': [
    { properties: { sheetId: '1a', title: 'Monthly Sales' } },
    { properties: { sheetId: '1b', title: 'Quarterly Summary' } },
  ],
  'sheet2': [
    { properties: { sheetId: '2a', title: 'Current Inventory' } },
    { properties: { sheetId: '2b', title: 'Order History' } },
  ],
  'sheet3': [
    { properties: { sheetId: '3a', title: 'Customer Info' } },
    { properties: { sheetId: '3b', title: 'Support Tickets' } },
  ],
};

// Mock sheet data
const mockSheetData = {
  '1a': [
    { id: 1, product: "Laptop", category: "Electronics", price: 1299, stock: 45, sales: 12 },
    { id: 2, product: "Smartphone", category: "Electronics", price: 899, stock: 120, sales: 28 },
    { id: 3, product: "Desk Chair", category: "Furniture", price: 249, stock: 28, sales: 5 },
    { id: 4, product: "Coffee Maker", category: "Appliances", price: 89, stock: 52, sales: 10 },
    { id: 5, product: "Headphones", category: "Electronics", price: 199, stock: 78, sales: 15 },
  ],
  '2a': [
    { id: 1, item: "Laptop", location: "Warehouse A", quantity: 45, reorderLevel: 10 },
    { id: 2, item: "Smartphone", location: "Warehouse B", quantity: 120, reorderLevel: 20 },
    { id: 3, item: "Desk Chair", location: "Warehouse A", quantity: 28, reorderLevel: 5 },
    { id: 4, item: "Coffee Maker", location: "Warehouse C", quantity: 52, reorderLevel: 8 },
    { id: 5, item: "Headphones", location: "Warehouse B", quantity: 78, reorderLevel: 15 },
  ],
  '3a': [
    { id: 1, name: "John Smith", email: "john@example.com", status: "Active", purchases: 5 },
    { id: 2, name: "Jane Doe", email: "jane@example.com", status: "Active", purchases: 3 },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "Inactive", purchases: 1 },
    { id: 4, name: "Sarah Williams", email: "sarah@example.com", status: "Active", purchases: 8 },
    { id: 5, name: "Mike Brown", email: "mike@example.com", status: "Active", purchases: 4 },
  ],
};

/**
 * Mock function for authenticating with Google
 */
export const authenticateWithGoogle = async (apiKey: string): Promise<boolean> => {
  // Simulate API authentication
  return new Promise((resolve) => {
    setTimeout(() => {
      // For prototype, any non-empty API key will succeed
      resolve(!!apiKey);
    }, 1000);
  });
};

/**
 * Mock function for fetching user's spreadsheets
 */
export const fetchSpreadsheets = async (): Promise<{ files: any[] }> => {
  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ files: mockSpreadsheets });
    }, 800);
  });
};

/**
 * Mock function for fetching sheets in a spreadsheet
 */
export const fetchSheets = async (spreadsheetId: string): Promise<any[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockSheets[spreadsheetId] || []);
    }, 600);
  });
};

/**
 * Fetch data from a public Google Sheet
 * This doesn't require an API key if the sheet is publicly shared for viewing
 */
export const fetchPublicSheetData = async (sheetId: string, sheetName: string = "Sheet1"): Promise<any[]> => {
  try {
    // For public sheets, we can use this URL pattern
    const publicUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    
    const response = await axios.get(publicUrl, {
      // Set responseType to text for CSV parsing
      responseType: 'text'
    });
    
    // Parse CSV data with better handling for quoted fields
    const parseCSV = (csvText: string) => {
      const rows: string[][] = [];
      let currentRow: string[] = [];
      let currentField = '';
      let inQuotes = false;
      
      for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];
        
        if (char === '"' && inQuotes && nextChar === '"') {
          // Handle double quotes inside quoted fields
          currentField += '"';
          i++; // Skip the next quote
        } else if (char === '"') {
          // Toggle quote state
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          // End of field
          currentRow.push(currentField);
          currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
          // End of row
          if (char === '\r' && nextChar === '\n') {
            i++; // Skip the \n in \r\n sequence
          }
          if (currentField || currentRow.length > 0) {
            currentRow.push(currentField);
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
          }
        } else {
          // Regular character
          currentField += char;
        }
      }
      
      // Add the last field and row if there's any
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
      }
      
      return rows;
    };
    
    const rows = parseCSV(response.data);
    
    // Clean and convert numeric values
    const cleanedRows = rows.map(row => 
      row.map(cell => {
        // Try to convert numeric strings to numbers
        if (/^-?\d+(\.\d+)?$/.test(cell)) {
          return parseFloat(cell);
        }
        return cell;
      })
    );
    
    return cleanedRows;
  } catch (error) {
    console.error('Error fetching public sheet:', error);
    throw error;
  }
};

/**
 * Mock function for fetching data from a specific sheet
 */
export const fetchSheetData = async (spreadsheetId: string, sheetId: string): Promise<any[]> => {
  // For mock implementation, keep existing logic
  // In a real app, you'd add logic to handle public sheets
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockSheetData[sheetId] || []);
    }, 700);
  });
};

/**
 * Parse sheet ID from a Google Sheets URL
 */
export const parseSheetId = (url: string): string | null => {
  // Match pattern like: https://docs.google.com/spreadsheets/d/SHEET_ID/edit
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

/**
 * Extract sheet name from URL (gid parameter)
 */
export const parseSheetName = (url: string): string | null => {
  // Default to "Sheet1" if no gid found
  const gidMatch = url.match(/gid=(\d+)/);
  if (!gidMatch) return "Sheet1";
  
  // Convert gid to sheet name (in a real app, you would fetch sheet names)
  // For this prototype, we'll use a simplified mapping
  const gidToName: Record<string, string> = {
    "0": "Sheet1",
    "1": "Sheet2"
  };
  
  return gidToName[gidMatch[1]] || "Sheet1";
};
