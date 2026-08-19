'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  getMyInvitations,
  inviteHelper,
  revokeHelper,
  reinstateHelper,
  deleteInvitation,
} from '@/services/helpers';
import type { HelperInvitation } from '@/types';
import { formatDate } from '@/lib/utils';

export default function ConnectedHelpers() {
  const [invitations, setInvitations] = useState<HelperInvitation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [email, setEmail]             = useState('');
  const [inviting, setInviting]       = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [confirmRevoke, setConfirmRevoke]   = useState<HelperInvitation | null>(null);
  const [confirmDelete, setConfirmDelete]   = useState<HelperInvitation | null>(null);
  const [actionLoading, setActionLoading]   = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyInvitations();
      setInvitations(data);
    } catch {
      setError('Failed to load helpers.');
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
      setSuccess(`Invitation sent to ${email.trim()}. They can accept it when they log in.`);
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

  async function handleDelete() {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await deleteInvitation(confirmDelete.id);
      setConfirmDelete(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setActionLoading(false);
    }
  }

  const statusBadge = (status: HelperInvitation['status']) => {
    const map = {
      pending:  'bg-amber-100 text-amber-700',
      accepted: 'bg-green-100 text-green-700',
      revoked:  'bg-red-100 text-red-600',
    };
    return map[status];
  };

  return (
    <div className="space-y-4">
      {error   && <Alert variant="error"   message={error}   />}
      {success && <Alert variant="success" message={success} />}

      {/* Invite form */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Connected Helpers</h3>
            <p className="text-xs text-gray-400 mt-0.5">Friends who can add meals on your behalf</p>
          </div>
          {!showForm && (
            <Button size="sm" onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}>
              + Invite
            </Button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleInvite} className="space-y-3 mb-4 pt-3 border-t border-gray-100">
            <Input
              label="Friend's email"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              hint="They must already have a ChoreKanakku account."
            />
            <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
              ✓ Permission granted: <strong>Add Meal</strong><br />
              ✗ Cannot view payments, expenses, or account settings
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setShowForm(false)} disabled={inviting}>
                Cancel
              </Button>
              <Button type="submit" fullWidth loading={inviting}>
                Send invitation
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
        ) : invitations.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No helpers invited yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {invitations.map((inv) => (
              <li key={inv.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{inv.invitee_email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(inv.status)}`}>
                      {inv.status}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(inv.created_at.slice(0,10))}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Permissions: {inv.permissions.join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {inv.status === 'accepted' && (
                    <button
                      onClick={() => setConfirmRevoke(inv)}
                      disabled={actionLoading}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50"
                    >
                      Revoke
                    </button>
                  )}
                  {inv.status === 'revoked' && (
                    <button
                      onClick={() => handleReinstate(inv)}
                      disabled={actionLoading}
                      className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded-lg hover:bg-green-50"
                    >
                      Reinstate
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(inv)}
                    disabled={actionLoading}
                    className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

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
        message={`Remove ${confirmDelete?.invitee_email} from your helpers? This cannot be undone.`}
        confirmLabel="Remove"
        loading={actionLoading}
      />
    </div>
  );
}
