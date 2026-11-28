'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from './ui';

/** Edit a list of short strings (inclusions, pickup points, amenities…). */
export function ListEditor({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setDraft('');
  };
  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {value.map((v) => (
            <li key={v} className="inline-flex items-center gap-1 rounded-lg bg-emerald-soft px-2.5 py-1 text-sm text-forest">
              {v}
              <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(value.filter((x) => x !== v))} className="rounded p-0.5 hover:bg-white/60">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input className="input" value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} />
        <Button kind="outline" icon={<Plus className="h-4 w-4" />} onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}

/** Toggle chips for multi-select enums. */
export function ChipSelect<T extends string>({ options, value, onChange, labels }: { options: readonly T[]; value: T[]; onChange: (v: T[]) => void; labels: Record<T, string> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`rounded-full border px-3 py-1 text-sm transition ${on ? 'border-forest bg-forest text-white' : 'border-line bg-white text-ink-soft hover:border-emerald'}`}
          >
            {labels[o]}
          </button>
        );
      })}
    </div>
  );
}
