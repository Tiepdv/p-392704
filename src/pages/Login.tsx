
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import SignIn from "@/components/SignIn";
import { useSheetData } from "@/hooks/useSheetData";
import SheetTabsList from "@/components/SheetTabsList";
import SearchToolbar from "@/components/SearchToolbar";
import PaginatedDataTable from "@/components/PaginatedDataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Login = () => {
  const { user, profile } = useAuth();

  // If not authenticated, show sign-in form
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0f1429]">
        <div className="container mx-auto px-4 py-6 flex-grow flex items-center justify-center">
          <SignIn />
        </div>
      </div>
    );
  }

  // Format filter parameter
  const [format, setFormat] = useState<string>("All");
  const [customFormat, setCustomFormat] = useState<string>("");

  // Map format value to corresponding Google Sheet URL
  const sheetUrlMap: Record<string, string> = {
    All: "https://docs.google.com/spreadsheets/d/1z2NQ13FS_eVrgRd-b49_tsGKtemXpi1v/edit?pli=1&gid=1104687448#gid=1104687448",
    OLV: "https://docs.google.com/spreadsheets/d/1z2NQ13FS_eVrgRd-b49_tsGKtemXpi1v/edit?pli=1&gid=1104687448#gid=1104687448",
    CTV: "https://docs.google.com/spreadsheets/d/1ivqIrtJ4cBe0565W-V3vNKWHx4KXwMrr/edit?gid=1104687448#gid=1104687448",
    Display: "https://docs.google.com/spreadsheets/d/1z2NQ13FS_eVrgRd-b49_tsGKtemXpi1v/edit?pli=1&gid=1104687448#gid=1104687448",
    OLV_CTV: "https://docs.google.com/spreadsheets/d/1z2NQ13FS_eVrgRd-b49_tsGKtemXpi1v/edit?pli=1&gid=1104687448#gid=1104687448",
    OLV_Display: "https://docs.google.com/spreadsheets/d/1z2NQ13FS_eVrgRd-b49_tsGKtemXpi1v/edit?pli=1&gid=1104687448#gid=1104687448",
    CTV_Display: "https://docs.google.com/spreadsheets/d/1z2NQ13FS_eVrgRd-b49_tsGKtemXpi1v/edit?pli=1&gid=1104687448#gid=1104687448",
  };

  const sheetUrl = sheetUrlMap[format] || sheetUrlMap.All;
  const openSheetUrl = sheetUrl;

  const {
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
    handleApplyFilters
  } = useSheetData(sheetUrl);

  // State for column visibility
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Helper similar to Explore: returns the format value for backend usage
  const getFormatValue = () => {
    if (format === "Custom") {
      return customFormat;
    }
    return format;
  };
  // Example usage (mirrors Explore tab):
  // const formatvalue = getFormatValue();
  // const apiUrl = `https://europe-west3-showheroes-bi.cloudfunctions.net/test-2-2?format=${formatvalue}`;

  // Initialize visible columns when data changes
  React.useEffect(() => {
    if (sheetData.length > 0 && visibleColumns.length === 0) {
      setVisibleColumns(Object.keys(sheetData[0]));
    }
  }, [sheetData]);

  const handleRefresh = () => {
    if (selectedSheetTab) {
      loadSheetData(selectedSheetTab);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1429]">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 flex-grow">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-white mb-2">Ads.txt Lines per Market</h1>
          <div className="flex items-center gap-4">
            <Label htmlFor="format-select" className="text-white text-sm">
              Format:
            </Label>
            <div className="flex items-center gap-2">
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-32" id="format-select">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="OLV">OLV</SelectItem>
                  <SelectItem value="CTV">CTV</SelectItem>
                  <SelectItem value="Display">Display</SelectItem>
                  <SelectItem value="OLV_CTV">OLV+CTV</SelectItem>
                  <SelectItem value="OLV_Display">OLV+Display</SelectItem>
                   <SelectItem value="CTV_Display">CTV+Display</SelectItem>
                </SelectContent>
              </Select>
              {format === "Custom" && (
                <Input
                  type="text"
                  placeholder="Enter format"
                  value={customFormat}
                  onChange={(e) => setCustomFormat(e.target.value)}
                  className="w-32"
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Tabs Navigation */}
          <SheetTabsList 
            tabs={sheetTabs}
            selectedTab={selectedSheetTab}
            onSelectTab={setSelectedSheetTab}
          />

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
              sheetUrl={openSheetUrl} // Pass the correct URL for Market Lines
               activeFilters={activeFilters}
              tab="market-lines"
            />

            {/* Data Table with Pagination and Sorting */}
            <PaginatedDataTable 
              isLoading={isLoading}
              data={sheetData}
              filteredData={filteredData}
              visibleColumns={visibleColumns}
              tab="market-lines"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
