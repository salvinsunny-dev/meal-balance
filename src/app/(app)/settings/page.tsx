'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ConnectedHelpers from '@/components/helpers/ConnectedHelpers';
import { createClient } from '@/lib/supabase/client';
import { getProfile, upsertProfile } from '@/services/profile';
import { DEFAULT_SETTINGS, APP_NAME } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

export default function SettingsPage() {
  const router = useRouter();

  const [userEmail, setUserEmail]         = useState('');
  const [userSince, setUserSince]         = useState('');
  const [displayName, setDisplayName]     = useState('');
  const [nameInput, setNameInput]         = useState('');
  const [editingName, setEditingName]     = useState(false);

  const [oldPassword, setOldPassword]         = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [savingName, setSavingName]   = useState(false);
  const [nameError, setNameError]     = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [pwError, setPwError]         = useState('');
  const [pwSuccess, setPwSuccess]     = useState('');
  const [logoutOpen, setLogoutOpen]   = useState(false);
  const [activeSection, setActiveSection] = useState<'profile'|'security'|'helpers'|'app'>('profile');

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email ?? '');
      setUserSince(new Date(user.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      }));
      const profile = await getProfile();
      const name = profile?.display_name ?? user.email?.split('@')[0] ?? '';
      setDisplayName(name);
      setNameInput(name);
    }
    load();
  }, []);

  const handleSaveName = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');
    setSavingName(true);
    try {
      const p = await upsertProfile(nameInput);
      setDisplayName(p.display_name ?? nameInput);
      setNameSuccess('Name updated successfully.');
      setEditingName(false);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  }, [nameInput]);

  const handleChangePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match.'); return; }

    setChangingPassword(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setChangingPassword(false); return; }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });
    if (signInError) {
      setPwError('Current password is incorrect.');
      setChangingPassword(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (updateError) {
      if (updateError.message.toLowerCase().includes('email')) {
        setPwSuccess('A confirmation email has been sent. Click the link in that email to complete the password change.');
      } else {
        setPwError(updateError.message);
      }
      return;
    }

    setPwSuccess('Password changed successfully.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);
  }, [oldPassword, newPassword, confirmPassword]);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }, [router]);

  const sections = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'helpers', label: 'Helpers', icon: '🤝' },
    { id: 'app', label: 'App', icon: '⚙️' },
  ] as const;

  return (
    <>
      <AppHeader title="Settings" showBack />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-4">

        {/* Section tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${
                activeSection === s.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Profile ──────────────────────────────────────────────────────── */}
        {activeSection === 'profile' && (
          <Card>
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-5">
              <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-3xl shrink-0">
                {displayName ? displayName[0].toUpperCase() : '?'}
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">{displayName || '—'}</p>
                <p className="text-sm text-gray-400">{userEmail}</p>
                <p className="text-xs text-gray-300 mt-0.5">Member since {userSince}</p>
              </div>
            </div>

            {nameSuccess && <Alert variant="success" message={nameSuccess} className="mb-4" />}

            {!editingName ? (
              <Button variant="secondary" fullWidth onClick={() => { setEditingName(true); setNameError(''); setNameSuccess(''); }}>
                Edit Display Name
              </Button>
            ) : (
              <form onSubmit={handleSaveName} className="space-y-3">
                {nameError && <Alert variant="error" message={nameError} />}
                <Input
                  label="Display Name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your name"
                  required
                />
                <div className="flex gap-2">
                  <Button variant="secondary" fullWidth onClick={() => setEditingName(false)} disabled={savingName}>Cancel</Button>
                  <Button type="submit" fullWidth loading={savingName}>Save</Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* ── Security ─────────────────────────────────────────────────────── */}
        {activeSection === 'security' && (
          <Card>
            <h2 className="text-sm font-bold text-gray-900 mb-4">Security</h2>

            {pwSuccess && <Alert variant="success" message={pwSuccess} className="mb-4" />}

            {!showPasswordForm ? (
              <Button variant="secondary" fullWidth onClick={() => { setShowPasswordForm(true); setPwError(''); setPwSuccess(''); }}>
                🔑 Change Password
              </Button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                {pwError && <Alert variant="error" message={pwError} />}
                <Input label="Current password" type="password" autoComplete="current-password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                <Input label="New password" type="password" autoComplete="new-password" placeholder="At least 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                <Input label="Confirm new password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                <div className="flex gap-2">
                  <Button variant="secondary" fullWidth onClick={() => setShowPasswordForm(false)} disabled={changingPassword}>Cancel</Button>
                  <Button type="submit" fullWidth loading={changingPassword}>Update</Button>
                </div>
              </form>
            )}

            <div className="mt-5 pt-4 border-t border-gray-100">
              <Button variant="danger" fullWidth onClick={() => setLogoutOpen(true)}>
                Sign Out
              </Button>
            </div>
          </Card>
        )}

        {/* ── Helpers ──────────────────────────────────────────────────────── */}
        {activeSection === 'helpers' && <ConnectedHelpers />}

        {/* ── App settings ─────────────────────────────────────────────────── */}
        {activeSection === 'app' && (
          <Card>
            <h2 className="text-sm font-bold text-gray-900 mb-4">App Settings</h2>
            <ul className="divide-y divide-gray-100">
              {[
                { label: 'App Name',   value: APP_NAME },
                { label: 'Meal Price', value: formatCurrency(DEFAULT_SETTINGS.meal_price, DEFAULT_SETTINGS.currency), sub: 'Fixed per meal' },
                { label: 'Currency',   value: `INR (${DEFAULT_SETTINGS.currency})` },
              ].map(({ label, value, sub }) => (
                <li key={label} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    {sub && <p className="text-xs text-gray-400">{sub}</p>}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{value}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Sign out?"
        message="You'll be redirected to the login page."
        confirmLabel="Sign out"
      />
    </>
  );
}
