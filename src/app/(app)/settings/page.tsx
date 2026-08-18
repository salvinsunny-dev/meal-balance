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
import { createClient } from '@/lib/supabase/client';
import { getProfile, upsertProfile } from '@/services/profile';
import { DEFAULT_SETTINGS } from '@/lib/constants';
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

  // Load user info once on mount — client is created inside the effect so it
  // only runs in the browser, never during static build analysis.
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email ?? '');
      setUserSince(
        new Date(user.created_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        }),
      );
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
      setNameSuccess('Name updated.');
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

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setChangingPassword(false); return; }

    // Re-authenticate to verify current password
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
      setPwError(updateError.message);
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

  return (
    <>
      <AppHeader title="Settings" showBack />

      <main className="max-w-lg mx-auto px-4 pt-4 pb-6 space-y-4">

        {/* Profile section */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Profile</h2>

          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">Display Name</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{displayName || '—'}</p>
              </div>
              <button
                onClick={() => { setEditingName(true); setNameError(''); setNameSuccess(''); }}
                className="text-xs text-indigo-600 font-medium hover:underline"
              >
                Edit
              </button>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{userEmail}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Member since</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{userSince}</p>
            </div>
          </div>

          {editingName && (
            <form onSubmit={handleSaveName} className="space-y-3 pt-3 border-t border-gray-100">
              {nameError   && <Alert variant="error"   message={nameError}   />}
              {nameSuccess && <Alert variant="success" message={nameSuccess} />}
              <Input
                label="New display name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your name"
                required
              />
              <div className="flex gap-2">
                <Button variant="secondary" fullWidth onClick={() => setEditingName(false)} disabled={savingName}>
                  Cancel
                </Button>
                <Button type="submit" fullWidth loading={savingName}>Save</Button>
              </div>
            </form>
          )}
        </Card>

        {/* Password section */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Security</h2>
            {!showPasswordForm && (
              <button
                onClick={() => { setShowPasswordForm(true); setPwError(''); setPwSuccess(''); }}
                className="text-xs text-indigo-600 font-medium hover:underline"
              >
                Change password
              </button>
            )}
          </div>

          {pwSuccess && <Alert variant="success" message={pwSuccess} className="mb-3" />}

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="space-y-3">
              {pwError && <Alert variant="error" message={pwError} />}
              <Input
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <Button variant="secondary" fullWidth onClick={() => setShowPasswordForm(false)} disabled={changingPassword}>
                  Cancel
                </Button>
                <Button type="submit" fullWidth loading={changingPassword}>Update</Button>
              </div>
            </form>
          )}
        </Card>

        {/* App settings */}
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">App Settings</h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-gray-700">Meal Price</p>
              <p className="text-xs text-gray-400">Fixed per meal</p>
            </div>
            <span className="text-sm font-bold text-gray-800">
              {formatCurrency(DEFAULT_SETTINGS.meal_price, DEFAULT_SETTINGS.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-700">Currency</p>
            </div>
            <span className="text-sm font-bold text-gray-800">
              INR ({DEFAULT_SETTINGS.currency})
            </span>
          </div>
        </Card>

        {/* Logout */}
        <Button variant="danger" fullWidth size="lg" onClick={() => setLogoutOpen(true)}>
          Sign out
        </Button>
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
