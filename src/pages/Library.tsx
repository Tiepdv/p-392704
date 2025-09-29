
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { fetchPublicSheetData, parseSheetId } from "@/utils/googleApi";
import { transformSheetData } from "@/utils/sheetTransform";
import { useToast } from "@/components/ui/use-toast";
import SearchToolbar from "@/components/SearchToolbar";
import PaginatedDataTable from "@/components/PaginatedDataTable";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const Library = () => {
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Array<{column: string, operator: string, value: string}>>([]);
  const { toast } = useToast();
  
  // State for column visibility
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  
  // Predefined Google Sheet URL - hardcoded but not shown to user
  const sheetUrl = "https://docs.google.com/spreadsheets/d/1o14-srgPH-3-_kFfQSXUvse9Yz-PQaHxKTbVdkroxHc/edit";
  //const sheetUrl = "https://docs.google.com/spreadsheets/d/1I-RR47fIOgvgDGvG5r9pGre6eV-ZRGu5Obb6rtcD16c/edit?gid=930120700#gid=930120700";
            
  // URL for the Open Sheet button - explicitly for Library tab
  const openSheetUrl = "https://docs.google.com/spreadsheets/d/1o14-srgPH-3-_kFfQSXUvse9Yz-PQaHxKTbVdkroxHc/";
  //const openSheetUrl = "https://docs.google.com/spreadsheets/d/1I-RR47fIOgvgDGvG5r9pGre6eV-ZRGu5Obb6rtcD16c/edit?gid=930120700#gid=930120700";

            
  useEffect(() => {
    // Load data when component mounts
    loadSheetData();
  }, []);

  // Initialize visible columns when data changes
  useEffect(() => {
    if (sheetData.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(Object.keys(sheetData[0]));
    }
  }, [sheetData]);

  const loadSheetData = async () => {
    try {
      setIsLoading(true);
      
      // Extract sheet ID from URL
      const sheetId = parseSheetId(sheetUrl);
      
      if (!sheetId) {
        toast({
          title: "Error",
          description: "Invalid Google Sheet URL",
          variant: "destructive",
        });
        return;
      }
      
      // Load the main sheet data
      const data = await fetchPublicSheetData(sheetId);
      
      if (data && data.length > 0) {
        // Transform raw data to objects with headers as keys
        const transformedData = transformSheetData(data);
        setSheetData(transformedData);
      }
    } catch (error) {
      console.error("Error loading sheet data:", error);
      toast({
        title: "Error",
        description: "Failed to load library data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters to data
  const applyFilters = (data: any[]) => {
    if (!activeFilters.length) return data;
    
    return data.filter(item => {
      return activeFilters.every(filter => {
        const value = String(item[filter.column] || '').toLowerCase();
        const filterValue = filter.value.toLowerCase();
        
        switch(filter.operator) {
          case 'equals':
            return value === filterValue;
          case 'not-equals':
            return value !== filterValue;
          case 'contains':
            return value.includes(filterValue);
          case 'greater-than':
            return Number(value) > Number(filterValue);
          case 'less-than':
            return Number(value) < Number(filterValue);
          default:
            return true;
        }
      });
    });
  };

  // Filter data based on search term and active filters
  const filteredData = applyFilters(
    searchTerm 
      ? sheetData.filter(row => 
          Object.values(row).some(
            value => String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      : sheetData
  );

  const handleRefresh = () => {
    loadSheetData();
  };

  const handleApplyFilters = (filters: Array<{column: string, operator: string, value: string}>) => {
    setActiveFilters(filters);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1429]">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 flex-grow">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Ads.txt Library</h1>
        </div>

        <div className="space-y-6">
          {/* Card for displaying data */}
          <div className="bg-white rounded-lg shadow-md">
            {/* Search and Refresh Toolbar */}
            <SearchToolbar 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onRefresh={handleRefresh}
              isLoading={isLoading}
              data={sheetData}
              columns={sheetData.length > 0 ? Object.keys(sheetData[0]) : []}
              visibleColumns={visibleColumns}
              onColumnVisibilityChange={setVisibleColumns}
              filteredData={filteredData}
              onApplyFilters={handleApplyFilters}
              sheetUrl={openSheetUrl} // Pass the correct URL for Library
              activeFilters={activeFilters}
              tab="library"
            />

            {/* Data Table with Pagination and Sorting */}
            {sheetData.length > 0 ? (
              <PaginatedDataTable 
                isLoading={isLoading}
                data={sheetData}
                filteredData={filteredData}
                visibleColumns={visibleColumns}
                tab="library"
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                  ) : (
                    "No data available. Click refresh to try loading data again."
                  )}
                </p>
              </div>
            )}
          </div>

          
          {/* Additional library resources */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="https://lookerstudio.google.com/u/0/reporting/0390f2c4-14cd-4c63-97b6-fd305e52b015/page/tEnnC">
              <Card className="bg-white/10 backdrop-blur-md border border-white/10">
                <div className="p-6">
                  <h3 className="text-xl font-medium text-white mb-2">IAB ads.txt dataset</h3>
                  <p className="text-gray-300">
                    Access the IBA datasets for more information.
                  </p>
                </div>
              </Card>
            </Link>
            
            <Card className="bg-white/10 backdrop-blur-md border border-white/10">
              <div className="p-6">
                <h3 className="text-xl font-medium text-white mb-2">Ads.txt distributions</h3>
                <p className="text-gray-300">
                  Click here to see ads.txt distribution for active domains.
                </p>
              </div>
            </Card>
            
            <Link to="https://platform.showheroes.com/app/sellers.json">
              <Card className="bg-white/10 backdrop-blur-md border border-white/10 transition-colors hover:bg-white/20 cursor-pointer">
                <div className="p-6">
                  <h3 className="text-xl font-medium text-white mb-2">SH sellers.json</h3>
                  <p className="text-gray-300">
                    Click here to view ShowHeroes sellers.json data.
                  </p>
                </div>
              </Card>
            </Link>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Library;
