// dashboard/hooks/useColumns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { FormSubmission } from "../types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ActionsCell } from "../FormSubmissionTable/ActionsCell";
import { DateCell } from "../FormSubmissionTable/DateCell";

export const useColumns = (
  formDataKeys: string[],
  onDelete: (id: string) => void
): ColumnDef<FormSubmission, unknown>[] => {
  const columns: ColumnDef<FormSubmission, unknown>[] = [
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
      cell: ({ row }) => <DateCell dateString={row.getValue("created_at")} />,
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
        if (filterValue === "spam") return cellValue === true;
        if (filterValue === "not_spam") return cellValue === false || cellValue == null;
        return true;
      },
    },
    ...formDataKeys.map((key) => ({
      accessorFn: (row: FormSubmission) => row.form_data[key],
      id: `form_data_${key}`,
      header: key.charAt(0).toUpperCase() + key.slice(1),
      cell: <T,>({ getValue }: { getValue: () => T | undefined }) => (
        <div>{(getValue() ?? "-") as React.ReactNode}</div>
      ),
    })),
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const submission = row.original;
        return <ActionsCell submission={submission} onDelete={onDelete} />;
      },
    },
  ];

  return columns;
};
