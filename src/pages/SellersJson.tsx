
import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import SearchToolbar from "@/components/SearchToolbar";
import PaginatedDataTable from "@/components/PaginatedDataTable";
import { supabase } from "@/integrations/supabase/client";

interface Seller {
  seller_id: string;
  name: string;
  domain: string;
  seller_type: string;
  [key: string]: any; // For any additional fields in the data
}

interface SellersJsonData {
  version: string;
  contact_email: string;
  contact_address: string;
  identifiers: Array<{ name: string, value: string }>;
  sellers: Seller[];
}

const SellersJson = () => {
  const [sellersData, setSellersData] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Array<{column: string, operator: string, value: string}>>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const { toast } = useToast();
  
  // URL for the Open Sheet button - linking directly to the sellers.json source
  const openJsonUrl = "https://platform.showheroes.com/app/sellers.json";

  useEffect(() => {
    // Load data when component mounts
    fetchSellersData();
  }, []);

  // Initialize visible columns when data changes
  useEffect(() => {
    if (sellersData.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(Object.keys(sellersData[0]));
    }
  }, [sellersData]);

  const fetchSellersData = async () => {
    try {
      setIsLoading(true);
      
      // Use the Supabase Edge Function to fetch the data
      const { data, error } = await supabase.functions.invoke('fetch-sellers-json');
      
      if (error) {
        throw new Error(`Edge Function error: ${error.message}`);
      }
      
      // Extract sellers array from the response
      if (data && data.sellers && Array.isArray(data.sellers)) {
        setSellersData(data.sellers);
        console.log(`Loaded ${data.sellers.length} sellers from sellers.json`);
      } else {
        setSellersData([]);
        toast({
          title: "Error",
          description: "The data format received was not as expected",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading sellers.json data:", error);
      toast({
        title: "Error",
        description: "Failed to load sellers.json data. Please try again.",
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
      ? sellersData.filter(row => 
          Object.values(row).some(
            value => String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      : sellersData
  );

  const handleRefresh = () => {
    fetchSellersData();
  };

  const handleApplyFilters = (filters: Array<{column: string, operator: string, value: string}>) => {
    setActiveFilters(filters);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1429]">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 flex-grow">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">SH Sellers.json</h1>
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
              data={sellersData}
              columns={sellersData.length > 0 ? Object.keys(sellersData[0]) : []}
              visibleColumns={visibleColumns}
              onColumnVisibilityChange={setVisibleColumns}
              filteredData={filteredData}
              onApplyFilters={handleApplyFilters}
              sheetUrl={openJsonUrl} // Pass URL for the "Open" button
              tab="sellers-json"
              activeFilters={activeFilters}
            />

            {/* Data Table with Pagination and Sorting */}
            {sellersData.length > 0 ? (
              <PaginatedDataTable 
                isLoading={isLoading}
                data={sellersData}
                filteredData={filteredData}
                visibleColumns={visibleColumns}
                tab="sellers-json"
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
        </div>
      </div>
    </div>
  );
};

export default SellersJson;
