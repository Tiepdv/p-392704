
import React from "react";
import { Loader2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { getDisplayName } from "@/utils/columnNameMapping";

interface DataTableViewProps {
  isLoading: boolean;
  data: any[];
  filteredData: any[];
}

const DataTableView: React.FC<DataTableViewProps> = ({ 
  isLoading, 
  data, 
  filteredData 
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No data available for this tab</p>
      </div>
    );
  }

  return (
    <>

      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {Object.keys(data[0]).map((header) => (
                <TableHead key={header} className="font-medium">
                  {getDisplayName(header)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row, index) => (
              <TableRow key={index}>
                {Object.values(row).map((cell, cellIndex) => (
                  <TableCell key={`${index}-${cellIndex}`}>
                    {cell !== null && cell !== undefined ? String(cell) : ""}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default DataTableView;
