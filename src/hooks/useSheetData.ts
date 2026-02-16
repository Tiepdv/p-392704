
import { useState, useEffect } from "react";
import { fetchPublicSheetData, parseSheetId } from "@/utils/googleApi";
import { transformSheetData } from "@/utils/sheetTransform";
import { applyFiltersWithLogic, FilterItem } from "@/utils/filterUtils";
import { useToast } from "@/components/ui/use-toast";

export const useSheetData = (sheetUrl: string, initialTabName: string = "") => {
  const [sheetData, setSheetData] = useState<any[]>([]);
  const [sheetTabs, setSheetTabs] = useState<string[]>([]);
  const [selectedSheetTab, setSelectedSheetTab] = useState(initialTabName);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterItem[]>([]);
  const { toast } = useToast();
  
  // Load sheet tabs on initial render
  useEffect(() => {
    loadSheetTabs();
  }, []);

  // Load sheet data when tab is selected
  useEffect(() => {
    if (selectedSheetTab) {
      loadSheetData(selectedSheetTab);
    }
  }, [selectedSheetTab]);
  
  const loadSheetTabs = async () => {
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
      
      // Complete list of all tabs in the sheet
      const allSheetTabs = [
        "GLOBAL", 
        "DE", 
        "ES", 
        "IT", 
        "FR", 
        "GB", 
        "US", 
        "NL", 
        "DK",
        "FI",
        "NO",
        "SE",
        "CL", 
        "BR", 
        "AR",
        "MX",
        "CO",
        "PE",
        "LATAM",
        "NORDIC",
        "APAC"
      ];
      setSheetTabs(allSheetTabs);
      
      // Set the first tab as selected by default
      if (allSheetTabs.length > 0 && !selectedSheetTab) {
        setSelectedSheetTab(allSheetTabs[0]);
      }
    } catch (error) {
      console.error("Error loading sheet tabs:", error);
      toast({
        title: "Error",
        description: "Failed to load sheet tabs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadSheetData = async (tabName: string) => {
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
      
      // Load the sheet data for the selected tab
      const data = await fetchPublicSheetData(sheetId, tabName);
      
      if (data && data.length > 0) {
        // Transform raw data to objects with headers as keys
        const transformedData = transformSheetData(data);
        setSheetData(transformedData);
      }
    } catch (error) {
      console.error("Error loading sheet data:", error);
      toast({
        title: "Error",
        description: "Failed to load sheet data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data based on search term and active filters
  const filteredData = applyFiltersWithLogic(
    searchTerm 
      ? sheetData.filter(row => 
          Object.values(row).some(
            value => String(value).toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      : sheetData,
    activeFilters
  );

  // Handle applying new filters
  const handleApplyFilters = (filters: FilterItem[]) => {
    setActiveFilters(filters);
  };

  return {
    sheetData,
    sheetTabs,
    selectedSheetTab,
    isLoading,
    searchTerm,
    filteredData,
    activeFilters,
    setSelectedSheetTab,
    setSearchTerm,
    loadSheetData,
    handleApplyFilters,
  };
};
