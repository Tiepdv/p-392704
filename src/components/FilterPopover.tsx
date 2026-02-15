
import React, { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getDisplayName } from "@/utils/columnNameMapping";
import { 
  EqualIcon,
  Ban, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  Trash2,
} from "lucide-react";

interface FilterPopoverProps {
  data: any[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onApplyFilters?: (filters: Array<{column: string, operator: string, value: string}>) => void;
  currentFilters?: Array<{column: string, operator: string, value: string}>;
  availableColumns?: string[];
  filterLogic?: 'AND' | 'OR';
  onFilterLogicChange?: (logic: 'AND' | 'OR') => void;
}

// Define operators with their display values and icons
const filterOperators = [
  { value: "equals", label: "Equals", icon: <EqualIcon className="h-4 w-4" /> },
  { value: "not-equals", label: "Not equals", icon: <Ban className="h-4 w-4" /> },
  { value: "contains", label: "Contains", icon: <Search className="h-4 w-4" /> },
  { value: "greater-than", label: "Greater than", icon: <ChevronRight className="h-4 w-4" /> },
  { value: "less-than", label: "Less than", icon: <ChevronLeft className="h-4 w-4" /> },
];

const FilterPopover: React.FC<FilterPopoverProps> = ({ 
  data, 
  isOpen, 
  setIsOpen,
  onApplyFilters,
  currentFilters = [],
  availableColumns,
  filterLogic = 'AND',
  onFilterLogicChange
}) => {
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [selectedOperator, setSelectedOperator] = useState<string>("equals");
  const [filterValue, setFilterValue] = useState<string>("");

  // Get unique column names from the data or use provided availableColumns
  const columns = availableColumns || (data.length > 0 ? Object.keys(data[0]) : []);
  
  // Set first column as default when data loads and no column is selected
  useEffect(() => {
    if (columns.length > 0 && !selectedColumn) {
      setSelectedColumn(columns[0]);
    }
  }, [columns, selectedColumn]);

  const handleAddFilter = () => {
    if (selectedColumn && filterValue) {
      const newFilters = [...currentFilters, { 
        column: selectedColumn, 
        operator: selectedOperator, 
        value: filterValue 
      }];
      // Apply the new filters immediately
      if (onApplyFilters) {
        onApplyFilters(newFilters);
      }
      setFilterValue("");
    }
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = [...currentFilters];
    newFilters.splice(index, 1);
    // Apply the updated filters immediately
    if (onApplyFilters) {
      onApplyFilters(newFilters);
    }
  };

  const handleClearAllFilters = () => {
    // Apply empty filters to reset the table
    if (onApplyFilters) {
      onApplyFilters([]);
    }
  };

  const handleApplyFilters = () => {
    // Close the popover after applying
    setIsOpen(false);
  };

  const getOperatorIcon = (operator: string) => {
    const found = filterOperators.find(op => op.value === operator);
    return found ? found.icon : null;
  };

  const getOperatorLabel = (operator: string) => {
    const found = filterOperators.find(op => op.value === operator);
    return found ? found.label : operator;
  };

  // Handle Enter key press in the filter value input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedColumn && filterValue) {
      handleAddFilter();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Filter Data</h3>
      
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="column-select" className="text-sm font-medium block mb-1">
              Select Column
            </label>
            <Select
              value={selectedColumn}
              onValueChange={setSelectedColumn}
            >
              <SelectTrigger id="column-select" className="w-full">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {getDisplayName(column)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="operator-select" className="text-sm font-medium block mb-1">
              Operator
            </label>
            <Select
              value={selectedOperator}
              onValueChange={setSelectedOperator}
            >
              <SelectTrigger id="operator-select" className="w-full">
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                {filterOperators.map((operator) => (
                  <SelectItem key={operator.value} value={operator.value}>
                    <div className="flex items-center gap-2">
                      {operator.icon}
                      <span>{operator.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label htmlFor="filter-value" className="text-sm font-medium block mb-1">
            Filter Value
          </label>
          <div className="flex gap-2">
            <Input
              id="filter-value"
              placeholder="Enter value"
              className="flex-grow"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button variant="outline" onClick={handleAddFilter} type="button">
              Add
            </Button>
          </div>
        </div>
      </div>

      {currentFilters.length > 0 && onFilterLogicChange && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Logic:</span>
          <div className="flex rounded-md border overflow-hidden">
            <button
              type="button"
              onClick={() => onFilterLogicChange('AND')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                filterLogic === 'AND'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              AND
            </button>
            <button
              type="button"
              onClick={() => onFilterLogicChange('OR')}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                filterLogic === 'OR'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              OR
            </button>
          </div>
        </div>
      )}


      {currentFilters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Current Active Filters</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearAllFilters}
              className="text-destructive hover:text-destructive h-6 px-2"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {currentFilters.map((filter, index) => (
              <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded">
                <div className="flex-1 text-sm">
                  <span className="font-medium">{getDisplayName(filter.column)}</span>
                  <span className="mx-1 flex items-center gap-1 inline-flex">
                    {getOperatorIcon(filter.operator)}
                    <span className="text-xs">{getOperatorLabel(filter.operator)}</span>
                  </span>
                  <span className="font-medium">"{filter.value}"</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleRemoveFilter(index)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
          <Button className="w-full" onClick={handleApplyFilters}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default FilterPopover;
