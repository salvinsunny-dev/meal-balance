'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  getMyInvitations,
  getMyHelperAccess,
  getOwnerName,
  inviteHelper,
  revokeHelper,
  reinstateHelper,
  deleteInvitation,
} from '@/services/helpers';
import type { HelperInvitation } from '@/types';
import { formatDate } from '@/lib/utils';

interface OwnerAccess extends HelperInvitation {
  ownerName: string;
}

export default function ConnectedHelpers() {
  // ── Sent invitations (you are the owner) ─────────────────────────────────
  const [sentInvitations, setSentInvitations] = useState<HelperInvitation[]>([]);
  // ── Received accepted (you are the helper) ───────────────────────────────
  const [helperAccess, setHelperAccess]       = useState<OwnerAccess[]>([]);

  const [loading, setLoading]   = useState(true);
  const [email, setEmail]       = useState('');
  const [inviting, setInviting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const [confirmRevoke, setConfirmRevoke] = useState<HelperInvitation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<HelperInvitation | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Load both in parallel
      const [sent, access] = await Promise.all([
        getMyInvitations(),
        getMyHelperAccess(),
      ]);
      setSentInvitations(sent);

      // Enrich helper access with owner names
      const enriched = await Promise.all(
        access.map(async (inv) => ({
          ...inv,
          ownerName: await getOwnerName(inv.owner_id),
        })),
      );
      setHelperAccess(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load helpers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInviting(true);
    try {
      await inviteHelper(email.trim());
      setSuccess(`Invitation sent to ${email.trim()}. They'll see it when they log in.`);
      setEmail('');
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  }

  async function handleRevoke() {
    if (!confirmRevoke) return;
    setActionLoading(true);
    try {
      await revokeHelper(confirmRevoke.id);
      setConfirmRevoke(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await deleteInvitation(confirmDelete.id);
      setConfirmDelete(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReinstate(inv: HelperInvitation) {
    setActionLoading(true);
    try {
      await reinstateHelper(inv.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reinstate');
    } finally {
      setActionLoading(false);
    }
  }

  const statusBadge = (status: HelperInvitation['status']) =>
    ({ pending: 'bg-amber-100 text-amber-700', accepted: 'bg-emerald-100 text-emerald-700', revoked: 'bg-red-100 text-red-600' })[status];

  return (
    <div className="space-y-4">
      {error   && <Alert variant="error"   message={error}   />}
      {success && <Alert variant="success" message={success} />}

      {/* ── SECTION 1: Accounts you help (you are the helper) ──────────── */}
      {(loading || helperAccess.length > 0) && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-100 flex items-center justify-center text-base">🤲</div>
            <div>
              <p className="text-sm font-bold text-gray-900">You Help</p>
              <p className="text-xs text-gray-400">Accounts you can add meals for</p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-3">Loading…</p>
          ) : helperAccess.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">
              You are not a helper for anyone yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {helperAccess.map((acc) => (
                <li key={acc.id} className="flex items-center gap-3 bg-indigo-50 rounded-xl px-3 py-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-200 flex items-center justify-center text-base shrink-0">
                    {acc.ownerName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-indigo-900">{acc.ownerName}</p>
                    <p className="text-xs text-indigo-400">Can add meals to their account</p>
                  </div>
                  {/* Direct action button */}
                  <Link href="/helper-meal">
                    <Button size="sm" variant="primary">
                      Add Meal
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* ── SECTION 2: People you have invited (you are the owner) ─────── */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center text-base">🔑</div>
            <div>
              <p className="text-sm font-bold text-gray-900">Your Helpers</p>
              <p className="text-xs text-gray-400">Friends who can add meals for you</p>
            </div>
          </div>
          {!showForm && (
            <Button size="sm" onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}>
              + Invite
            </Button>
          )}
        </div>

        {/* Invite form */}
        {showForm && (
          <form onSubmit={handleInvite} className="space-y-3 mb-4 pt-3 border-t border-gray-100">
            <Input
              label="Friend's email address"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              hint="They must already have a ChoreKanakku account with this email."
            />
            <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-500 space-y-0.5">
              <p>✓ They can add Morning / Afternoon / Evening / Night meals for you</p>
              <p>✗ They cannot view your payments, expenses, or settings</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setShowForm(false)} disabled={inviting}>Cancel</Button>
              <Button type="submit" fullWidth loading={inviting}>Send invitation</Button>
            </div>
          </form>
        )}

        {/* Invited list */}
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-3">Loading…</p>
        ) : sentInvitations.length === 0 ? (
          <div className="text-center py-6 space-y-1">
            <p className="text-2xl">👥</p>
            <p className="text-sm text-gray-400">No helpers invited yet</p>
            <p className="text-xs text-gray-300">Tap + Invite to add a friend</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sentInvitations.map((inv) => (
              <li key={inv.id} className="py-3 flex items-start gap-3">
                {/* Avatar */}
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  inv.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                  inv.status === 'pending'  ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-500'
                }`}>
                  {inv.invitee_email[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{inv.invitee_email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(inv.status)}`}>
                      {inv.status}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(inv.created_at.slice(0, 10))}</span>
                  </div>
                  {inv.status === 'pending' && (
                    <p className="text-xs text-amber-600 mt-0.5">⏳ Waiting for them to accept</p>
                  )}
                  {inv.status === 'accepted' && (
                    <p className="text-xs text-emerald-600 mt-0.5">✓ Active — they can add meals for you</p>
                  )}
                  {inv.status === 'revoked' && (
                    <p className="text-xs text-red-400 mt-0.5">✗ Access revoked</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {inv.status === 'accepted' && (
                    <button onClick={() => setConfirmRevoke(inv)} disabled={actionLoading}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                      Revoke
                    </button>
                  )}
                  {inv.status === 'revoked' && (
                    <button onClick={() => handleReinstate(inv)} disabled={actionLoading}
                      className="text-xs text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors">
                      Reinstate
                    </button>
                  )}
                  <button onClick={() => setConfirmDelete(inv)} disabled={actionLoading}
                    className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={!!confirmRevoke}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={handleRevoke}
        title="Revoke access?"
        message={`${confirmRevoke?.invitee_email} will no longer be able to add meals on your behalf.`}
        confirmLabel="Revoke"
        loading={actionLoading}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Remove invitation?"
        message={`Permanently remove ${confirmDelete?.invitee_email} from your helpers list?`}
        confirmLabel="Remove"
        loading={actionLoading}
      />
    </div>
  );
}
