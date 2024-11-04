// dashboard/components/FormSubmissionTable/HeaderCheckbox.tsx

import React from "react";

export const HeaderCheckbox = ({ table }: { table: any }) => {
  const isAllSelected = table.getIsAllPageRowsSelected();
  return (
    <input
      type="checkbox"
      checked={isAllSelected}
      onChange={() => table.toggleAllPageRowsSelected(!isAllSelected)}
    />
  );
};
