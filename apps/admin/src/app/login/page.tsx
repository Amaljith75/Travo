'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { isDemo } from '@/lib/data';
import { Button, Field } from '@/components/ui';
import { errorMessage } from '@/components/toast';

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    setBusy(true);
    try {
      if (mode === 'in') await signIn(email, password);
      else {
        const r = await signUp(email, password, name);
        if (r.needsConfirmation) setInfo('Check your inbox to confirm your email, then sign in.');
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-6">
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-forest text-lg font-bold text-white">T</div>
        <h1 className="text-xl font-bold">{mode === 'in' ? 'Sign in to Travo admin' : 'Create admin account'}</h1>
        <p className="mt-1 text-sm text-muted">
          {isDemo ? 'Demo mode is active — no sign-in needed.' : mode === 'up' ? 'The first account created becomes Super Admin. Later accounts need a role from a Super Admin.' : 'Use your Travo team account.'}
        </p>
        <div className="mt-6 space-y-4">
          {mode === 'up' && (
            <Field label="Full name">
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
          )}
          <Field label="Email">
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Password">
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
          </Field>
        </div>
        {error && <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        {info && <p className="mt-4 rounded-lg bg-emerald-soft px-3 py-2 text-sm text-forest">{info}</p>}
        <Button type="submit" loading={busy} className="mt-6 w-full">
          {mode === 'in' ? 'Sign in' : 'Create account'}
        </Button>
        <button type="button" className="mt-4 w-full text-center text-sm font-semibold text-emerald" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
          {mode === 'in' ? 'First time? Create the admin account' : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
