// dashboard/components/FormSubmissionTable/FormSubmissionTable.tsx

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender, // Import flexRender
} from '@tanstack/react-table';
import { useFormSubmissions } from '../hooks/useFormSubmissions';
import { useColumns } from '../hooks/useColumns';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { FormSubmission } from '../types';
import { Checkbox } from '@/components/ui/checkbox';

export const FormSubmissionTable: React.FC = () => {
  const { data, loading, error, setData } = useFormSubmissions();
  const [rowSelection, setRowSelection] = useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [spamFilter, setSpamFilter] = useState<string>('all');

  // Extract unique keys from form_data
  const formDataKeys = useMemo(() => {
    const keys = new Set<string>();
    data.forEach((item) => {
      Object.keys(item.form_data || {}).forEach((key) => keys.add(key));
    });
    return Array.from(keys);
  }, [data]);

  // Handle row deletion
  const handleDelete = (id: string) => {
    setData((prevData) => prevData.filter((item) => item.id !== id));
  };

  const columns = useColumns(formDataKeys, handleDelete);

  // Initialize the table
  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: false,
    initialState: { pagination: { pageSize: 25 } },
  });

  // Update column filters when spamFilter changes
  useEffect(() => {
    if (spamFilter === 'all') {
      table.getColumn('is_llm_detected_spam')?.setFilterValue(undefined);
    } else if (spamFilter === 'spam') {
      table.getColumn('is_llm_detected_spam')?.setFilterValue('spam');
    } else if (spamFilter === 'not_spam') {
      table.getColumn('is_llm_detected_spam')?.setFilterValue('not_spam');
    }
  }, [spamFilter, table]);

  const handleDeleteSelectedRows = useCallback(async () => {
    const selectedRowIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);

    if (selectedRowIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('form_submissions')
        .delete()
        .in('id', selectedRowIds);

      if (error) {
        throw error;
      }

      setData((prevData) =>
        prevData.filter((item) => !selectedRowIds.includes(item.id))
      );

      table.resetRowSelection();

      toast({
        title: 'Success',
        description: 'Submission(s) deleted successfully.',
      });
    } catch (err) {
      console.error('Unexpected error deleting submissions:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  }, [table, setData, toast]);

  const handleDeleteButtonClick = () => {
    const selectedRowIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);

    if (selectedRowIds.length === 0) return;

    setIsDeleteDialogOpen(true);
  };

  return (
    <div className='w-full'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-4 py-4'>
        <Select value={spamFilter} onValueChange={(value) => setSpamFilter(value)}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Filter Spam' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Submissions</SelectItem>
            <SelectItem value='spam'>Spam Submissions</SelectItem>
            <SelectItem value='not_spam'>Not Spam Submissions</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant='outline'
          size='icon'
          onClick={handleDeleteButtonClick}
          disabled={Object.keys(rowSelection).length === 0}
        >
          <Trash className='h-4 w-4' />
        </Button>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Are you sure you want to delete{' '}
                {Object.keys(rowSelection).length} submission(s)?
              </DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='outline' onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant='destructive' onClick={handleDeleteSelectedRows}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className='rounded-md border'>
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, idx) => (
                  <TableHead key={idx}>
                    <Skeleton className='h-4 w-full' />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className='h-4 w-full' />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className='text-center'>
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-between space-x-2 py-4'>
        <div className='flex-1 text-sm text-muted-foreground'>
          {table.getFilteredRowModel().rows.length} total rows.
        </div>
        <div className='space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
