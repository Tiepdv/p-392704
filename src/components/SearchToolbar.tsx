import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  RefreshCw, 
  Filter, 
  Eye, 
  EyeOff, 
  ExternalLink,
  Download,
  X
} from "lucide-react";
import FilterPopover from "./FilterPopover";
import { getDisplayName } from "@/utils/columnNameMapping";
import { useColumnVisibility } from "@/hooks/useColumnVisibility";
import { useAuth } from "@/contexts/AuthContext";

interface SearchToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  data: any[];
  columns: string[];
  visibleColumns: string[];
  onColumnVisibilityChange: (columns: string[]) => void;
  filteredData: any[];
  onApplyFilters: (filters: Array<{column: string, operator: string, value: string}>) => void;
  sheetUrl?: string;
  tab?: string;
  activeFilters?: Array<{column: string, operator: string, value: string}>;
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
const getColumnDisplayName = (column: string, tab?: string) => {
  if (tab === 'sellers-json') {
    return getSellersJsonColumnName(column);
  }
  return getDisplayName(column);
};

const SearchToolbar: React.FC<SearchToolbarProps> = ({
  searchTerm,
  onSearchChange,
  onRefresh,
  isLoading,
  data,
  columns,
  visibleColumns,
  onColumnVisibilityChange,
  filteredData,
  onApplyFilters,
  sheetUrl,
  tab = "",
  activeFilters = []
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const { isColumnVisible, loading } = useColumnVisibility(tab);
  const { isAdmin } = useAuth();

  console.log("SearchToolbar - tab:", tab, "columns:", columns, "loading:", loading);

  // Filter columns based on role permissions - only show columns that are visible to the current user's role
  // Wait for the loading to complete before filtering
  const availableColumns = loading ? columns : columns.filter(column => {
    const visible = isColumnVisible(column);
    console.log(`Column ${column} visibility:`, visible);
    return visible;
  });

  console.log("Available columns after filtering:", availableColumns);

  // Get the actual visible columns for export (intersection of visibleColumns and role-permitted columns)
  const exportColumns = loading ? visibleColumns : visibleColumns.filter(column => isColumnVisible(column));

  const handleColumnToggle = (column: string) => {
    if (visibleColumns.includes(column)) {
      onColumnVisibilityChange(visibleColumns.filter(col => col !== column));
    } else {
      onColumnVisibilityChange([...visibleColumns, column]);
    }
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return;

    // Use only the columns that are visible in the current view
    const headers = exportColumns.map(col => getColumnDisplayName(col, tab)).join(',');
    const csvContent = [
      headers,
      ...filteredData.map(row => 
        exportColumns.map(col => {
          const value = row[col];
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (value && (value.toString().includes(',') || value.toString().includes('"') || value.toString().includes('\n'))) {
            return `"${value.toString().replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `data_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = [...activeFilters];
    newFilters.splice(index, 1);
    onApplyFilters(newFilters);
  };

  const handleClearAllFilters = () => {
    console.log("Clearing all filters");
    onApplyFilters([]);
  };

  const shouldShowOpenSheet = tab !== "explore" && isAdmin;

  return (
    <div className="p-4 border-b bg-gray-50">
      <div className="flex flex-col gap-4">
        {/* Search and Actions Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Filter className="h-4 w-4" />
                  Filter
                  {activeFilters.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                      {activeFilters.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <FilterPopover 
                  data={data}
                  isOpen={isFilterOpen}
                  setIsOpen={setIsFilterOpen}
                  onApplyFilters={onApplyFilters}
                  currentFilters={activeFilters}
                  availableColumns={availableColumns}
                />
              </PopoverContent>
            </Popover>

            <Popover open={isColumnSelectorOpen} onOpenChange={setIsColumnSelectorOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-2">
                  <h3 className="font-medium">Show/Hide Columns</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableColumns.map((column) => (
                      <div key={column} className="flex items-center space-x-2">
                        <button
                          onClick={() => handleColumnToggle(column)}
                          className="flex items-center space-x-2 text-sm hover:bg-gray-100 w-full p-1 rounded"
                        >
                          {visibleColumns.includes(column) ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="truncate">{getColumnDisplayName(column, tab)}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={filteredData.length === 0}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>

            {shouldShowOpenSheet && sheetUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(sheetUrl, '_blank')}
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Row */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 font-medium">Active filters:</span>
            {activeFilters.map((filter, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                <span className="text-xs">
                  {getColumnDisplayName(filter.column, tab)} {filter.operator} "{filter.value}"
                </span>
                <button
                  onClick={() => handleRemoveFilter(index)}
                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onApplyFilters([])}
              className="text-destructive hover:text-destructive h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Results Summary */}
        <div className="text-sm text-gray-600">
          {data.length > 0 && (
            <span>
              Showing {filteredData.length} of {data.length} records
              {searchTerm && ` matching "${searchTerm}"`}
              {activeFilters.length > 0 && ` with ${activeFilters.length} filter${activeFilters.length > 1 ? 's' : ''} applied`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchToolbar;
