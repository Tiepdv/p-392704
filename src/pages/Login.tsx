
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import SignIn from "@/components/SignIn";
import { useSheetData } from "@/hooks/useSheetData";
import SheetTabsList from "@/components/SheetTabsList";
import SearchToolbar from "@/components/SearchToolbar";
import PaginatedDataTable from "@/components/PaginatedDataTable";

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

  // Google Sheet URL from the user's request
  const sheetUrl = "https://docs.google.com/spreadsheets/d/1z2NQ13FS_eVrgRd-b49_tsGKtemXpi1v/edit?gid=916740284#gid=916740284";
  // Google Sheet URL for the Open Sheet button
  const openSheetUrl = "https://docs.google.com/spreadsheets/d/1z2NQ13FS_eVrgRd-b49_tsGKtemXpi1v/";
  
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Ads.txt Lines per Market</h1>

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
