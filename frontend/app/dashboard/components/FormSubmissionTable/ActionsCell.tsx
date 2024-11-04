// dashboard/components/FormSubmissionTable/ActionsCell.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { FormSubmission } from '../types';

interface ActionsCellProps {
  submission: FormSubmission;
  onDelete: (id: string) => void;
}

export const ActionsCell: React.FC<ActionsCellProps> = ({
  submission,
  onDelete,
}) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('form_submissions')
        .delete()
        .eq('id', submission.id);

      if (error) {
        throw error;
      }

      onDelete(submission.id);
      toast({
        title: 'Success',
        description: 'Submission deleted successfully.',
      });
    } catch (err) {
      console.error('Error deleting submission:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete the submission.',
      });
    } finally {
      setOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <DotsHorizontalIcon className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>More Info</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              console.log('Show more info for submission', submission.id);
              // Implement your view details logic here
            }}
          >
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to delete this submission?
            </DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
