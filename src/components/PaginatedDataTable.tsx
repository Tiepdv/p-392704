
import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { useIsMobile } from "@/hooks/use-mobile";
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
import MobileDataTable from "./MobileDataTable";

interface PaginatedDataTableProps {
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

const PaginatedDataTable: React.FC<PaginatedDataTableProps> = ({
  isLoading,
  data,
  filteredData,
  visibleColumns,
  tab
}) => {
  const isMobile = useIsMobile();
  
  // Use mobile version on mobile devices
  if (isMobile) {
    return (
      <MobileDataTable
        isLoading={isLoading}
        data={data}
        filteredData={filteredData}
        visibleColumns={visibleColumns}
        tab={tab}
      />
    );
  }

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
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

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Check if values are numeric
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        // Numeric comparison
        const result = aNum - bNum;
        return sortConfig.direction === 'asc' ? result : -result;
      } else {
        // String comparison
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
        // Same column, toggle direction
        return {
          column,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // New column, start with ascending
        return {
          column,
          direction: 'asc'
        };
      }
    });
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
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

  const PaginationControls = () => (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1}-{endIndex} of {totalItems} records • Page {currentPage} of {totalPages}
      </div>
      
      <div className="flex items-center justify-center gap-1 flex-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        {getPageNumbers().map((pageNum) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(pageNum)}
            className="min-w-8"
          >
            {pageNum}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Rows per page:</span>
        <Select value={pageSize.toString()} onValueChange={(value) => {
          setPageSize(Number(value));
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
            <SelectItem value="200">200</SelectItem>
            <SelectItem value="500">500</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

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
        {/* Top Pagination */}
        <div className="p-4 border-b">
          <PaginationControls />
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {displayColumns.map((column) => (
                  <TableHead 
                    key={column} 
                    className="whitespace-nowrap cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{getColumnDisplayName(column, tab)}</span>
                      {sortConfig?.column === column && (
                        sortConfig.direction === 'asc' ? (
                          <ArrowUp className="h-4 w-4 text-primary" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-primary" />
                        )
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((row, index) => (
                <TableRow key={`${startIndex + index}`}>
                  {displayColumns.map((column) => (
                    <TableCell key={column} className="whitespace-nowrap">
                      {formatCellValue(row[column], column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Bottom Pagination */}
        <div className="p-4 border-t">
          <PaginationControls />
        </div>
      </CardContent>
    </Card>
  );
};

export default PaginatedDataTable;
