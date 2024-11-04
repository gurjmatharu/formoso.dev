"use client";

import * as React from "react";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabaseClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Define the FormSubmission type
export type FormSubmission = {
  id: string;
  user_id: string;
  form_data: Record<string, any>;
  is_llm_detected_spam: boolean | null;
  ip_address: string;
  blocked: boolean;
  block_reason: string;
  created_at: string;
  updated_at: string;
  abuse_confidence_score: number;
  total_reports: number;
  country_code: string;
  domain: string;
  isp: string;
  is_public: boolean;
};

// Component to render date and avoid hydration error
function DateCell({ dateString }: { dateString: string }) {
  const [formattedDate, setFormattedDate] = React.useState("");
  React.useEffect(() => {
    const date = new Date(dateString);
    setFormattedDate(date.toLocaleDateString());
  }, [dateString]);
  return <div>{formattedDate}</div>;
}

function sanitizeString(value: any): string {
  return value;
}

// ActionsCell component for per-row actions
function ActionsCell({
  submission,
  onDelete,
}: {
  submission: FormSubmission;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    console.log("HANDLING DELETE>")
    try {
      const { error } = await supabase
        .from("form_submissions")
        .delete()
        .eq("id", submission.id);

      if (error) {
        console.error("Error deleting submission:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete the submission.",
        });
        return;
      }

      onDelete(submission.id);
      console.log("YAAAY: ")
      toast({
        title: "Success",
        description: "Submission deleted successfully.",
      });
    } catch (err) {
      console.error("Unexpected error deleting submission:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>More Info</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              console.log("Show more info for submission", submission.id);
            }}
          >
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to delete this submission?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DataTableDemo() {
  const [data, setData] = React.useState<FormSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [rowSelection, setRowSelection] = React.useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: fetchedData, error } = await supabase
        .from("form_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching data:", error);
      } else {
        const parsedData = (fetchedData || []).map((item) => ({
          ...item,
          form_data: item.form_data ? JSON.parse(item.form_data) : {},
        }));
        setData(parsedData as FormSubmission[]);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Get all unique keys from form_data
  const formDataKeys = React.useMemo(() => {
    const keys = new Set<string>();
    data.forEach((item) => {
      if (item.form_data && typeof item.form_data === "object") {
        Object.keys(item.form_data).forEach((key) => keys.add(key));
      }
    });
    return Array.from(keys);
  }, [data]);

  // Define columns
  const columns = React.useMemo<ColumnDef<FormSubmission>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: "Date",
        cell: ({ row }) => (
          <DateCell dateString={row.getValue("created_at")} />
        ),
      },
      {
        id: "ip_address",
        accessorKey: "ip_address",
        header: "IP Address",
      },
      {
        id: "is_llm_detected_spam",
        accessorKey: "is_llm_detected_spam",
        header: "Spam",
        cell: ({ row }) => (
          <div>
            {row.getValue("is_llm_detected_spam") === true ? (
              <Badge variant="outline">Yes</Badge>
            ) : row.getValue("is_llm_detected_spam") === false ? (
              <Badge variant="outline">No</Badge>
            ) : (
              <span>-</span>
            )}
          </div>
        ),
        filterFn: (row, columnId, filterValue) => {
          const cellValue = row.getValue(columnId);
          if (filterValue === "spam") {
            return cellValue === true;
          }
          if (filterValue === "not_spam") {
            return cellValue === false || cellValue == null;
          }
          return true;
        },
      },
      ...formDataKeys.map((key) => ({
        accessorFn: (row: FormSubmission) => row.form_data[key],
        id: `form_data_${key}`,
        header: key.charAt(0).toUpperCase() + key.slice(1),
        cell: <T,>({ getValue }: { getValue: () => T | undefined }) => (
          <div>{sanitizeString(getValue() ?? "-")}</div>
        ),
      })),
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const submission = row.original;

          return (
            <ActionsCell
              submission={submission}
              onDelete={(id) => {
                setData((prevData) =>
                  prevData.filter((item) => item.id !== id)
                );
              }}
            />
          );
        },
      },
    ],
    [formDataKeys]
  );

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [spamFilter, setSpamFilter] = React.useState<string>("all");

  // Update column filters when spamFilter changes
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

  React.useEffect(() => {
    if (spamFilter === "all") {
      table.getColumn("is_llm_detected_spam")?.setFilterValue(undefined);
    } else if (spamFilter === "spam") {
      table.getColumn("is_llm_detected_spam")?.setFilterValue("spam");
    } else if (spamFilter === "not_spam") {
      table.getColumn("is_llm_detected_spam")?.setFilterValue("not_spam");
    }
  }, [spamFilter, table]);

  const handleDeleteSelectedRows = React.useCallback(async () => {
    const selectedRowIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original.id);

    if (selectedRowIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("form_submissions")
        .delete()
        .in("id", selectedRowIds);

      if (error) {
        console.error("Error deleting submissions:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete the submissions.",
        });
        return;
      }

      setData((prevData) =>
        prevData.filter((item) => !selectedRowIds.includes(item.id))
      );

      table.resetRowSelection();

      toast({
        title: "Success",
        description: "Submission(s) deleted successfully.",
      });
    } catch (err) {
      console.error("Unexpected error deleting submissions:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
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
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-4 py-4">
        <Select
          value={spamFilter}
          onValueChange={(value) => setSpamFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Spam" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Submissions</SelectItem>
            <SelectItem value="spam">Spam Submissions</SelectItem>
            <SelectItem value="not_spam">Not Spam Submissions</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={handleDeleteButtonClick}
          disabled={Object.keys(rowSelection).length === 0}
        >
          <Trash className="h-4 w-4" />
        </Button>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Are you sure you want to delete{" "}
                {Object.keys(rowSelection).length} submission(s)?
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteSelectedRows}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md border">
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(columns.length)].map((_, idx) => (
                  <TableHead key={idx}>
                    <Skeleton className="h-4 w-full" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {[...Array(columns.length)].map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-full" />
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
                      {flexRender(
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
                  <TableCell colSpan={columns.length} className="text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} total rows.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
