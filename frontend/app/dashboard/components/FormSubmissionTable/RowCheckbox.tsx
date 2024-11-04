// dashboard/components/FormSubmissionTable/RowCheckbox.tsx

import React from "react";

export const RowCheckbox = ({ row }: { row: any }) => {
  return <input type="checkbox" checked={row.isSelected} onChange={() => row.toggleSelected()} />;
};
