'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Minus } from 'lucide-react';
import { getPaymentProvider, ROLE_LABELS, ROLE_PERMISSIONS, TRAVO_SUPABASE, USER_ROLES, type Permission, type UserRole } from '@travo/core';
import { isDemo, resetDemo, supabase } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import { Badge, Button, Card, PageHeader } from '@/components/ui';
import { errorMessage, useToast } from '@/components/toast';

const PERMS: { key: Permission; label: string }[] = [
  { key: 'packages:write', label: 'Packages' },
  { key: 'trips:write', label: 'Trips' },
  { key: 'vehicles:write', label: 'Vehicles' },
  { key: 'vehicles:approve', label: 'Approve vehicles' },
  { key: 'operators:write', label: 'Operators' },
  { key: 'destinations:write', label: 'Destinations' },
  { key: 'bookings:write', label: 'Bookings' },
  { key: 'reviews:moderate', label: 'Reviews' },
  { key: 'settings:write', label: 'Settings' },
];

function Team() {
  const { user } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const team = useQuery({
    queryKey: ['team'],
    enabled: !!supabase,
    queryFn: async () => {
      const { data, error } = await supabase!.from('user_profiles').select('id, full_name, role, created_at').order('created_at');
      if (error) throw new Error(error.message);
      return data as { id: string; full_name: string | null; role: UserRole; created_at: string }[];
    },
  });
  const canEdit = user?.role === 'super_admin' || user?.role === 'admin';
  const setRole = async (id: string, role: UserRole) => {
    const { error } = await supabase!.from('user_profiles').update({ role }).eq('id', id);
    if (error) return toast('error', errorMessage(new Error(error.message)));
    toast('success', 'Role updated');
    void qc.invalidateQueries({ queryKey: ['team'] });
  };
  if (!supabase) return <p className="text-sm text-muted">Team accounts are available when connected to Supabase.</p>;
  return (
    <div>
      <p className="mb-3 text-sm text-muted">People sign up on the login screen, then an admin assigns their role here.</p>
      <ul className="divide-y divide-line/70">
        {(team.data ?? []).map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span>
              {m.full_name ?? 'Unnamed'} {m.id === user?.id && <Badge tone="blue">You</Badge>}
            </span>
            <select className="input h-9 w-44 py-0" value={m.role} disabled={!canEdit || m.id === user?.id} onChange={(e) => setRole(m.id, e.target.value as UserRole)}>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Settings() {
  const toast = useToast();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const methods = getPaymentProvider().listMethods();
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Data & live sync">
          {isDemo ? (
            <>
              <p className="text-sm">Running in <strong>demo mode</strong>: data is stored in this browser only.</p>
              <Button
                kind="outline"
                className="mt-4"
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await resetDemo();
                    await qc.invalidateQueries();
                    toast('success', 'Demo data restored');
                  } catch (e) {
                    toast('error', errorMessage(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Reset demo data
              </Button>
            </>
          ) : (
            <div className="space-y-2 text-sm">
              <p>
                Connected to Supabase <code className="rounded bg-sand-soft px-1.5 py-0.5 text-xs">{(process.env.NEXT_PUBLIC_SUPABASE_URL || TRAVO_SUPABASE.url).replace('https://', '')}</code>
              </p>
              <p className="text-muted">Every save here is pushed to the traveller app instantly through Supabase Realtime — open screens refresh automatically.</p>
              <p className="text-muted">Photos upload to the public <code className="text-xs">media</code> storage bucket.</p>
            </div>
          )}
        </Card>
        <Card title="Team & roles">
          <Team />
        </Card>
        <Card title="Payment gateway" className="lg:col-span-2">
          <p className="mb-3 text-sm text-muted">Online payments are not integrated yet. Travellers see these options as “Coming soon”; booking requests work without payment. Razorpay can be added through the payment provider module without changing the app screens.</p>
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <Badge key={m.method} tone={m.enabled ? 'green' : 'grey'}>{m.label}{m.comingSoon ? ' · coming soon' : ' · active'}</Badge>
            ))}
          </div>
        </Card>
        <Card title="Role permissions" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr>
                  <th className="th">Role</th>
                  {PERMS.map((p) => <th key={p.key} className="th text-center">{p.label}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {USER_ROLES.filter((r) => r !== 'traveller').map((r) => (
                  <tr key={r}>
                    <td className="td font-medium">{ROLE_LABELS[r]}</td>
                    {PERMS.map((p) => (
                      <td key={p.key} className="td text-center">
                        {ROLE_PERMISSIONS[r].includes(p.key) ? <Check className="mx-auto h-4 w-4 text-emerald" /> : <Minus className="mx-auto h-4 w-4 text-line" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">Agency and Vehicle Owner logins (scoped to their own listings) are planned; today Admins manage all vendors.</p>
        </Card>
      </div>
    </>
  );
}
