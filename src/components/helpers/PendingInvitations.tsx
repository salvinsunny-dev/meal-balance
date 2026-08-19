'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import {
  getMyPendingInvitations,
  acceptInvitation,
  declineInvitation,
  getOwnerName,
} from '@/services/helpers';
import type { HelperInvitation } from '@/types';

interface InvitationWithOwnerName extends HelperInvitation {
  ownerName: string;
}

export default function PendingInvitations() {
  const [invitations, setInvitations] = useState<InvitationWithOwnerName[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [acting, setActing]     = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await getMyPendingInvitations();
      const enriched = await Promise.all(
        raw.map(async (inv) => ({
          ...inv,
          ownerName: await getOwnerName(inv.owner_id),
        })),
      );
      setInvitations(enriched);
    } catch {
      /* silently ignore — not blocking */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleAccept(inv: InvitationWithOwnerName) {
    setActing(inv.id);
    try {
      await acceptInvitation(inv.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept');
    } finally {
      setActing(null);
    }
  }

  async function handleDecline(inv: InvitationWithOwnerName) {
    setActing(inv.id);
    try {
      await declineInvitation(inv.id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline');
    } finally {
      setActing(null);
    }
  }

  if (loading || invitations.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50">
      <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
        <span>🔔</span> Pending Invitations
      </h3>

      {error && <Alert variant="error" message={error} className="mb-3" />}

      <ul className="space-y-3">
        {invitations.map((inv) => (
          <li key={inv.id} className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-sm font-medium text-gray-800">
              <strong>{inv.ownerName}</strong> has invited you to add meals on their behalf
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Permission: {inv.permissions.join(', ')}
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => handleDecline(inv)}
                disabled={acting === inv.id}
              >
                Decline
              </Button>
              <Button
                size="sm"
                fullWidth
                loading={acting === inv.id}
                onClick={() => handleAccept(inv)}
              >
                Accept
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
