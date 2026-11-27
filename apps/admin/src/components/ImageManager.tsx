'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Star, Trash2 } from 'lucide-react';
import { api } from '@/lib/data';
import { errorMessage, useToast } from './toast';
import { Button, cx } from './ui';

/**
 * Manage an ordered list of photo URLs: upload files (Supabase Storage, or the
 * browser in demo mode), paste URLs, reorder and remove. First photo = cover.
 */
export function ImageManager({ value, onChange, folder, max = 12, single }: { value: string[]; onChange: (urls: string[]) => void; folder: string; max?: number; single?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const toast = useToast();

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const added: string[] = [];
    for (const f of Array.from(files).slice(0, single ? 1 : max - value.length)) {
      if (!f.type.startsWith('image/')) {
        toast('error', `${f.name} is not an image`);
        continue;
      }
      try {
        added.push(await api.uploadImage(f, folder, f.name));
      } catch (e) {
        toast('error', errorMessage(e));
      }
    }
    setBusy(false);
    if (added.length) {
      onChange(single ? added.slice(0, 1) : [...value, ...added]);
      toast('success', `${added.length} photo${added.length > 1 ? 's' : ''} uploaded`);
    }
    if (input.current) input.current.value = '';
  };

  const addUrl = () => {
    const u = url.trim();
    if (!/^https?:\/\/\S+$/i.test(u)) return toast('error', 'Enter a full image URL starting with https://');
    onChange(single ? [u] : [...value, u]);
    setUrl('');
  };

  const move = (i: number, d: number) => {
    const next = [...value];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x!);
    onChange(next);
  };

  return (
    <div>
      <div className={cx('grid gap-3', single ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4')}>
        {value.map((src, i) => (
          <figure key={`${src}-${i}`} className="group relative overflow-hidden rounded-xl border border-line bg-sand-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
            {i === 0 && !single && (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-forest">
                <Star className="h-3 w-3" /> Cover
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
              {!single && (
                <div className="flex gap-1">
                  <IconBtn label="Move left" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </IconBtn>
                  <IconBtn label="Move right" disabled={i === value.length - 1} onClick={() => move(i, 1)}>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </IconBtn>
                  {i > 0 && (
                    <IconBtn label="Make cover" onClick={() => onChange([src, ...value.filter((_, j) => j !== i)])}>
                      <Star className="h-3.5 w-3.5" />
                    </IconBtn>
                  )}
                </div>
              )}
              <IconBtn label="Remove photo" onClick={() => onChange(value.filter((_, j) => j !== i))}>
                <Trash2 className="h-3.5 w-3.5" />
              </IconBtn>
            </div>
          </figure>
        ))}
        {(single ? value.length === 0 : value.length < max) && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void upload(e.dataTransfer.files);
            }}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-white text-sm text-muted transition hover:border-emerald hover:text-emerald"
          >
            <ImagePlus className="h-6 w-6" />
            {busy ? 'Uploading…' : single ? 'Upload photo' : 'Upload or drop photos'}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple={!single} hidden onChange={(e) => void upload(e.target.files)} />
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="…or paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())} />
        </div>
        <Button kind="outline" onClick={addUrl}>
          Add
        </Button>
      </div>
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="rounded-md bg-white/95 p-1.5 text-ink shadow disabled:opacity-40">
      {children}
    </button>
  );
}
