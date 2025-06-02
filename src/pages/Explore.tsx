
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchToolbar from "@/components/SearchToolbar";
import PaginatedDataTable from "@/components/PaginatedDataTable";
import SheetTabsList from "@/components/SheetTabsList";

interface ExploreData {
  [key: string]: any;
}

interface ExploreDataResponse {
  status: string;
  message: string;
  data: {
    [region: string]: ExploreData[];
  };
}

const Explore = () => {
  const [exploreData, setExploreData] = useState<{[region: string]: ExploreData[]}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("GLOBAL");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Array<{column: string, operator: string, value: string}>>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [numberOfWeeks, setNumberOfWeeks] = useState<string>("none");
  const [customWeeks, setCustomWeeks] = useState<string>("");
  const { toast } = useToast();
  
  useEffect(() => {
    const currentTabData = exploreData[activeTab];
    if (currentTabData && currentTabData.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(Object.keys(currentTabData[0]));
    }
  }, [exploreData, activeTab]);

  // Only fetch data when weeks are selected (not "none")
  useEffect(() => {
    if (numberOfWeeks !== "none") {
      fetchExploreData();
    } else {
      // Clear data when "None" is selected
      setExploreData({});
    }
  }, [numberOfWeeks, customWeeks]);

  const fetchExploreData = async () => {
    try {
      setIsLoading(true);
      
      const weeksValue = getWeeksValue();
      const apiUrl = `https://europe-west3-showheroes-bi.cloudfunctions.net/test-2-2?weeks=${weeksValue}`;
      
      console.log(`Fetching data from: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ExploreDataResponse = await response.json();
      
      if (data && data.status === 'success' && data.data && typeof data.data === 'object') {
        setExploreData(data.data);
        
        const availableTabs = Object.keys(data.data);
        if (availableTabs.length > 0) {
          setActiveTab(availableTabs[0]);
        }
        
        const totalRecords = Object.values(data.data).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`Loaded ${totalRecords} records from Explore API across ${availableTabs.length} regions`);
      } else {
        setExploreData({});
        toast({
          title: "Error",
          description: "The data format received was not as expected",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading Explore data:", error);
      toast({
        title: "Error",
        description: "Failed to load Explore data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const currentTabData = exploreData[activeTab] || [];
  
  const filteredData = applyFilters(
    searchTerm 
      ? currentTabData.filter(row => 
          Object.values(row).some(
            value => String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      : currentTabData
  );

  const handleRefresh = () => {
    if (numberOfWeeks !== "none") {
      fetchExploreData();
    }
  };

  const handleApplyFilters = (filters: Array<{column: string, operator: string, value: string}>) => {
    setActiveFilters(filters);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchTerm("");
    setActiveFilters([]);
    
    const newTabData = exploreData[value];
    if (newTabData && newTabData.length > 0) {
      setVisibleColumns(Object.keys(newTabData[0]));
    }
  };

  const handleWeeksChange = (value: string) => {
    setNumberOfWeeks(value);
    // Reset other states when changing weeks
    setSearchTerm("");
    setActiveFilters([]);
    setVisibleColumns([]);
  };

  const availableTabs = Object.keys(exploreData);

  const getWeeksValue = () => {
    if (numberOfWeeks === "custom") {
      return customWeeks || "8";
    }
    return numberOfWeeks;
  };

  const shouldShowData = numberOfWeeks !== "none" && Object.keys(exploreData).length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1429]">
      <div className="container mx-auto px-4 py-6 flex-grow">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white mb-2">Explore</h1>
          <div className="flex items-center gap-4">
            <Label htmlFor="weeks-select" className="text-white text-sm">
              Number of weeks:
            </Label>
            <div className="flex items-center gap-2">
              <Select value={numberOfWeeks} onValueChange={handleWeeksChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Select weeks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="8">8 weeks</SelectItem>
                  <SelectItem value="12">12 weeks</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {numberOfWeeks === "custom" && (
                <Input
                  type="number"
                  placeholder="Enter weeks"
                  value={customWeeks}
                  onChange={(e) => setCustomWeeks(e.target.value)}
                  className="w-24"
                  min="1"
                  max="52"
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {shouldShowData && availableTabs.length > 0 && (
            <SheetTabsList 
              tabs={availableTabs}
              selectedTab={activeTab}
              onSelectTab={handleTabChange}
            />
          )}

          <div className="bg-white rounded-lg shadow-md">
            {numberOfWeeks === "none" ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-2">
                  Please select the number of weeks to load data
                </p>
                <p className="text-gray-400 text-sm">
                  Choose a weeks option from the dropdown above to get started
                </p>
              </div>
            ) : (
              <>
                <SearchToolbar 
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  onRefresh={handleRefresh}
                  isLoading={isLoading}
                  data={currentTabData}
                  columns={currentTabData.length > 0 ? Object.keys(currentTabData[0]) : []}
                  visibleColumns={visibleColumns}
                  onColumnVisibilityChange={setVisibleColumns}
                  filteredData={filteredData}
                  onApplyFilters={handleApplyFilters}
                  tab="explore"
                />

                {currentTabData.length > 0 ? (
                  <PaginatedDataTable 
                    isLoading={isLoading}
                    data={currentTabData}
                    filteredData={filteredData}
                    visibleColumns={visibleColumns}
                    tab="explore"
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
