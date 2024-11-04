// dashboard/components/FormSubmissionTable/DateCell.tsx

import React, { useEffect, useState } from 'react';

interface DateCellProps {
  dateString: string;
}

export const DateCell: React.FC<DateCellProps> = ({ dateString }) => {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    const date = new Date(dateString);
    setFormattedDate(date.toLocaleDateString());
  }, [dateString]);

  return <div>{formattedDate}</div>;
};
