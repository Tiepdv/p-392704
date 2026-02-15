
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSheetData } from "@/hooks/useSheetData";
import SearchToolbar from "./SearchToolbar";
import PaginatedDataTable from "./PaginatedDataTable";
import { Loader2 } from "lucide-react";

interface SheetViewerProps {
  onDataLoaded?: (data: any[]) => void;
  tab?: string;
}

const SheetViewer: React.FC<SheetViewerProps> = ({ onDataLoaded, tab = "market-lines" }) => {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  
  // Default sheet URL - this would typically come from configuration
  const sheetUrl = "https://docs.google.com/spreadsheets/d/1VU_6dj0V-AKa7EhYdaQZGFAoNp8xIFw6GfLRBvYDFHM/edit";
  
  const {
    sheetData,
    sheetTabs,
    selectedSheetTab,
    isLoading,
    searchTerm,
    filteredData,
    activeFilters,
    filterLogic,
    setFilterLogic,
    setSelectedSheetTab,
    setSearchTerm,
    loadSheetData,
    handleApplyFilters,
  } = useSheetData(sheetUrl);

  // Initialize visible columns when data changes
  useEffect(() => {
    if (sheetData.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(Object.keys(sheetData[0]));
    }
  }, [sheetData]);

  // Notify parent component when data is loaded
  useEffect(() => {
    if (onDataLoaded && sheetData.length > 0) {
      onDataLoaded(sheetData);
    }
  }, [sheetData, onDataLoaded]);

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm">
        <Tabs value={selectedSheetTab} onValueChange={setSelectedSheetTab} className="w-full">
          <div className="border-b bg-muted/30">
            <TabsList className="h-auto p-1 bg-transparent">
              {sheetTabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {sheetTabs.map((tabName) => (
            <TabsContent key={tabName} value={tabName} className="mt-0">
              <SearchToolbar 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={() => loadSheetData(tabName)}
                isLoading={isLoading}
                data={sheetData}
                columns={sheetData.length > 0 ? Object.keys(sheetData[0]) : []}
                visibleColumns={visibleColumns}
                onColumnVisibilityChange={setVisibleColumns}
                filteredData={filteredData}
                onApplyFilters={handleApplyFilters}
                filterLogic={filterLogic}
                onFilterLogicChange={setFilterLogic}
                sheetUrl={sheetUrl}
              />

              {sheetData.length > 0 ? (
                <PaginatedDataTable 
                  isLoading={isLoading}
                  data={sheetData}
                  filteredData={filteredData}
                  visibleColumns={visibleColumns}
                  tab={tab}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {isLoading ? (
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                    ) : (
                      "No data available. Select a tab to load data."
                    )}
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};

export default SheetViewer;
