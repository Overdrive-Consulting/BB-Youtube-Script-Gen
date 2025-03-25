import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import DetailsSidebar from './DetailsSidebar';

interface Column {
  header: string;
  accessorKey: string;
  className?: string;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  detailFields: { label: string; key: string }[];
  tableTitle: string;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  detailFields,
  tableTitle,
}) => {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold mb-4">{tableTitle}</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessorKey} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.accessorKey} className={column.className}>
                      {row[column.accessorKey]}
                    </TableCell>
                  ))}
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(row)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DetailsSidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        data={selectedItem}
        fields={detailFields}
        title={`${tableTitle} Details`}
      />
    </div>
  );
};

export default DataTable; 