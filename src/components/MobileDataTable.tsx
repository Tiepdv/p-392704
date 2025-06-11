import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { 
  formatEuroValue, 
  formatNumericValue, 
  formatRpmoValue, 
  formatRankValue,
  isRevenueColumn, 
  isRpmoColumn, 
  isRankColumn,
  isNumericColumn,
  isIdColumn 
} from "@/utils/euroFormatter";
import { getDisplayName } from "@/utils/columnNameMapping";

interface MobileDataTableProps {
  isLoading: boolean;
  data: any[];
  filteredData: any[];
  visibleColumns: string[];
  tab: string;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

// Column name mapping for SH Sellers.json tab
const getSellersJsonColumnName = (column: string) => {
  const mapping: { [key: string]: string } = {
    'seller_id': 'Seller ID',
    'name': 'Name',
    'domain': 'Domain',
    'seller_type': 'Seller Type'
  };
  return mapping[column] || column;
};

// Get the appropriate display name based on the tab
const getColumnDisplayName = (column: string, tab: string) => {
  if (tab === 'sellers-json') {
    return getSellersJsonColumnName(column);
  }
  return getDisplayName(column);
};

// Get the appropriate button text based on the tab
const getOpenButtonText = (tab: string) => {
  if (tab === 'sellers-json') {
    return 'Open Web';
  }
  return 'Open Sheet';
};

const MobileDataTable: React.FC<MobileDataTableProps> = ({
  isLoading,
  data,
  filteredData,
  visibleColumns,
  tab
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const { isColumnVisible } = useColumnVisibility(tab);

  // Filter visible columns based on role permissions
  const displayColumns = useMemo(() => {
    return visibleColumns.filter(column => isColumnVisible(column));
  }, [visibleColumns, isColumnVisible]);

  // Sort the filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.column];
      const bValue = b[sortConfig.column];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const aNum = Number(aValue);
      const bNum = Number(bValue);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        const result = aNum - bNum;
        return sortConfig.direction === 'asc' ? result : -result;
      } else {
        const result = String(aValue).localeCompare(String(bValue));
        return sortConfig.direction === 'asc' ? result : -result;
      }
    });
  }, [filteredData, sortConfig]);

  // Calculate pagination data
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentData = sortedData.slice(startIndex, endIndex);

  // Handle column sorting
  const handleSort = (column: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.column === column) {
        return {
          column,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        return {
          column,
          direction: 'asc'
        };
      }
    });
  };

  const formatCellValue = (value: any, columnName: string) => {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    // Check if it's an ID column first - treat as string
    if (isIdColumn(columnName)) {
      return String(value);
    }

    if (isRevenueColumn(columnName)) {
      return formatEuroValue(value);
    }
    
    if (isRpmoColumn(columnName)) {
      return formatRpmoValue(value);
    }
    
    if (isRankColumn(columnName)) {
      return formatRankValue(value);
    }
    
    if (isNumericColumn(columnName, value)) {
      return formatNumericValue(value);
    }
    
    return String(value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data matches your current filters.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {/* Mobile Pagination Controls */}
        <div className="p-3 border-b flex flex-col gap-3">
          <div className="text-xs text-muted-foreground text-center">
            Page {currentPage} of {totalPages} • {startIndex + 1}-{endIndex} of {totalItems}
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="text-xs px-2"
            >
              <ChevronLeft className="h-3 w-3" />
              Prev
            </Button>
            
            <div className="flex items-center gap-1 text-xs">
              <span>Rows:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-16 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="text-xs px-2"
            >
              Next
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="space-y-2 p-3">
          {currentData.map((row, index) => (
            <Card key={`${startIndex + index}`} className="border border-gray-200">
              <CardContent className="p-3 space-y-2">
                {displayColumns.map((column) => (
                  <div key={column} className="flex justify-between items-start gap-2">
                    <div className="text-xs font-medium text-gray-600 min-w-0 flex-shrink-0">
                      <button
                        onClick={() => handleSort(column)}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <span className="truncate">{getColumnDisplayName(column, tab)}</span>
                        {sortConfig?.column === column && (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-right min-w-0 flex-1">
                      <span className="break-words">
                        {formatCellValue(row[column], column)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Mobile Pagination */}
        <div className="p-3 border-t">
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="text-xs px-2"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            
            <span className="text-xs px-2">
              {currentPage} / {totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="text-xs px-2"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileDataTable;
