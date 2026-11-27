'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Modal } from './ui';
import { errorMessage, useToast } from './toast';

/** Delete button with confirmation and honest error reporting. */
export function DeleteButton({ what, onConfirm, size = 'sm' }: { what: string; onConfirm: () => Promise<unknown>; size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <>
      <Button kind="danger" size={size} icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>
        Delete
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Delete ${what}?`}
        footer={
          <>
            <Button kind="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              kind="danger"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                  toast('success', `Deleted ${what}`);
                  setOpen(false);
                } catch (e) {
                  toast('error', errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-soft">This removes it from the app immediately and cannot be undone.</p>
      </Modal>
    </>
  );
}
