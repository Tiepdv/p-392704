import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import SearchToolbar from "@/components/SearchToolbar";
import PaginatedDataTable from "@/components/PaginatedDataTable";
import SheetTabsList from "@/components/SheetTabsList";

interface PublishersData {
  [key: string]: any;
}

interface PublishersDataResponse {
  status: string;
  message: string;
  data: {
    [region: string]: PublishersData[];
  };
}

const ACCOUNT_OPTIONS = [
 'Adform-DE',
 'Adform-ES',
 'Adform-IT',
 'Adipolo-DE',
 'Amazon-DE',
 'Amazon-IT',
 'Criteo-IT',
 'Dorvan-DE',
 'E-Planning-IT',
 'Emetriq-DE',
 'Freewheel-DE',
 'GPS-NL',
 'Goldbach CH-DE',
 'Goldbach-DE',
 'Google-DE',
 'Google-IT',
 'GreedyGame-DE',
 'GumGum-IT',
 'Hoopla Digital-IT',
 'Improve-DE',
 'Improve-IT',
 'Improve-UK',
 'InMobi-Un',
 'IndexExchange--',
 'IndexExchange-DE',
 'IndexExchange-IT',
 'Instreamatic-IT',
 'Madvertise-DE',
 'Magnite-DE',
 'Magnite-IT',
 'Magnite-OB',
 'Magnite-SE',
 'Magnite-SG',
 'Magnite Streaming-DE',
 'Magnite Streaming-SG',
 'Matterkind-DK',
 'Media.Net--',
 'Mobkoi-DE',
 'Netpoint-DE',
 'Nexxen-DE',
 'Nexxen-SG',
 'OneFootball-DE',
 'OneTag-IT',
 'OpenX--',
 'OpenX-IT',
 'Opera-DE',
 'Pubmatic--',
 'Pubmatic-DE',
 'Pubmatic-IT',
 'Pubmatic-OB',
 'Pubmatic-SG',
 'Pubmatic-UK',
 'Publicis-IT',
 'Pulsepoint-Un',
 'Radiant Fusion-Un',
 'Red Pineapple Media-DE',
 'Relict-SG',
 'RichAudience-IT',
 'ScreenOnDemand-DE',
 'SelectMedia-Un',
 'ShareThrough-DE',
 'SHE Media-DE',
 'SilverPush-SG',
 'Smart-DE',
 'Smart-IT',
 'Smart-OB',
 'Smart-SG',
 'Smart-UK',
 'SmartStream-DE',
 'Smartclip-DE',
 'Smilewanted-DE',
 'Sovrn-IT',
 'Stailamedia-DE',
 'Targetspot-DE',
 'TripleLift-DE',
 'TripleLift-IT',
 'VoiseTech-Un',
 'Xandr-DE',
 'Xandr-ES',
 'Xandr-IT',
 'Xandr-MX',
 'Xandr-SG',
 'Xandr-UK',
 'Xaxis-DK',
 'Xaxis-IT',
 'Xaxis-SE',
 'Yieldlab-DE',
 'YOC-DE'
];
const BU_OPTIONS = ['OMP', 'PMP', 'RESELLER'];

const Publishers = () => {
  const [publishersData, setPublishersData] = useState<{[region: string]: PublishersData[]}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("GLOBAL");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<Array<{column: string, operator: string, value: string}>>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [topLines, setTopLines] = useState<string>("none");
  const [customTopLines, setCustomTopLines] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("all");
  const [bu, setBu] = useState<string>("all");
  const [showLines, setShowLines] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const currentTabData = publishersData[activeTab];
  
    if (currentTabData && currentTabData.length > 0) {
      setVisibleColumns(Object.keys(currentTabData[0]));
    }
  }, [publishersData, activeTab]);

  

  useEffect(() => {
    if (topLines === "custom") {
      // Custom input is handled by onBlur, not here
      return;
    } else if (topLines !== "none") {
      fetchPublishersData();
    } else {
      setPublishersData({});
    }
  }, [topLines, accountName, bu, showLines]);

  const handleCustomBlur = () => {
    if (customTopLines && customTopLines.trim() !== "") {
      fetchPublishersData();
    }
  };

  const fetchPublishersData = async () => {
    try {
      setIsLoading(true);

      const topLinesValue = getTopLinesValue();
  
      
      const params = new URLSearchParams({
        top_lines: topLinesValue
      });
      
      params.set("account_name", accountName);
      params.set("bu", bu);
      params.set("show_lines", showLines.toString());
      
      const apiUrl = `https://europe-west3-showheroes-bi.cloudfunctions.net/test-2?${params.toString()}`;

      console.log(`Fetching Publishers data from: ${apiUrl}`);

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PublishersDataResponse = await response.json();

      if (data && data.status === 'success' && data.data && typeof data.data === 'object') {
        setPublishersData(data.data);

        const availableTabs = Object.keys(data.data);
        if (availableTabs.length > 0) {
          setActiveTab(availableTabs[0]);
        }

        const totalRecords = Object.values(data.data).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`Loaded ${totalRecords} records from Publishers API across ${availableTabs.length} regions`);
      } else {
        setPublishersData({});
        toast({
          title: "Error",
          description: "The data format received was not as expected",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading Publishers data:", error);
      toast({
        title: "Error",
        description: "Failed to load Publishers data. Please try again.",
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

  const currentTabData = publishersData[activeTab] || [];

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
    if (topLines !== "none") {
      fetchPublishersData();
    }
  };

  const handleApplyFilters = (filters: Array<{column: string, operator: string, value: string}>) => {
    setActiveFilters(filters);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchTerm("");
    setActiveFilters([]);

    const newTabData = publishersData[value];
    if (newTabData && newTabData.length > 0) {
      setVisibleColumns(Object.keys(newTabData[0]));
    }
  };

  const handleTopLinesChange = (value: string) => {
    setTopLines(value);
    setSearchTerm("");
    setActiveFilters([]);
    setVisibleColumns([]);
  };

  const availableTabs = Object.keys(publishersData);

  const getTopLinesValue = () => {
    if (topLines === "custom") {
      return customTopLines;
    }
    return topLines;
  };

  const shouldShowData = topLines !== "none" && Object.keys(publishersData).length > 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1429]">
      <div className="container mx-auto px-4 py-6 flex-grow">
        <div className="mb-4 mt-4 flex items-start justify-between">
          <h1 className="text-4xl font-bold text-white mb-2">Publishers</h1>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Label className="text-white text-sm">Account:</Label>
                <Select value={accountName} onValueChange={setAccountName}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {ACCOUNT_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-white text-sm">BU:</Label>
                <Select value={bu} onValueChange={setBu}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {BU_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-white text-sm">Top lines:</Label>
                <Select value={topLines} onValueChange={handleTopLinesChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="150">150</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {topLines === "custom" && (
                  <Input
                    type="number"
                    placeholder="Enter value"
                    value={customTopLines}
                    onChange={(e) => setCustomTopLines(e.target.value)}
                    onBlur={handleCustomBlur}
                    className="w-24"
                    min="1"
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Switch
                id="show-lines"
                checked={showLines}
                onCheckedChange={setShowLines}
                className="scale-[0.6]"
              />
              <Label htmlFor="show-lines" className="text-white text-[9px] cursor-pointer opacity-70 uppercase tracking-wider">SHOW LINES</Label>
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
            {topLines === "none" ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-2">
                  Please select inputs to load data
                </p>
                <p className="text-gray-400 text-sm">
                  Choose an option from the dropdown above to get started
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
                  tab="publishers"
                  activeFilters={activeFilters}
                />

                {currentTabData.length > 0 ? (
                  <PaginatedDataTable 
                    isLoading={isLoading}
                    data={currentTabData}
                    filteredData={filteredData}
                    visibleColumns={visibleColumns}
                    tab="publishers"
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

export default Publishers;
