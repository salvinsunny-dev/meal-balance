'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { todayString, timeToString, formatCurrency } from '@/lib/utils';
import { addPayment, updatePayment } from '@/services/payments';
import type { Payment, PaymentFormData } from '@/types';

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  outstandingBalance: number;
  editPayment?: Payment | null;
}

export default function PaymentForm({
  open,
  onClose,
  onSuccess,
  outstandingBalance,
  editPayment,
}: PaymentFormProps) {
  const isEdit = !!editPayment;
  const { currency } = DEFAULT_SETTINGS;

  const [amount, setAmount]         = useState(
    editPayment ? String(editPayment.amount) : '',
  );
  const [date, setDate]             = useState(editPayment?.payment_date ?? todayString());
  const [time, setTime]             = useState(
    editPayment?.payment_time ?? timeToString(new Date()),
  );
  const [note, setNote]             = useState(editPayment?.note ?? '');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  // Maximum the user can enter:
  // new payment → outstanding balance
  // edit payment → outstanding balance + the old payment being replaced
  const maxAmount = isEdit
    ? outstandingBalance + (editPayment?.amount ?? 0)
    : outstandingBalance;

  useEffect(() => {
    if (open) {
      setAmount(editPayment ? String(editPayment.amount) : '');
      setDate(editPayment?.payment_date ?? todayString());
      setTime(editPayment?.payment_time ?? timeToString(new Date()));
      setNote(editPayment?.note ?? '');
      setError('');
    }
  }, [open, editPayment]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid payment amount.');
      return;
    }

    const formData: PaymentFormData = {
      amount: numericAmount,
      payment_date: date,
      payment_time: time,
      note,
    };

    setLoading(true);
    try {
      if (isEdit && editPayment) {
        await updatePayment(
          editPayment.id,
          formData,
          editPayment.amount,
          outstandingBalance,
        );
      } else {
        await addPayment(formData, outstandingBalance);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment');
    } finally {
      setLoading(false);
    }
  }

  const isBalanceZero = outstandingBalance <= 0 && !isEdit;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Payment' : 'Record Payment'}
    >
      {isBalanceZero ? (
        <div className="text-center py-4 space-y-2">
          <p className="text-3xl">🎉</p>
          <p className="text-sm font-medium text-gray-700">No outstanding balance.</p>
          <p className="text-xs text-gray-500">Nothing to pay right now.</p>
          <Button variant="secondary" fullWidth onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      ) : (
        <>
          {error && <Alert message={error} className="mb-4" />}

          {/* Balance info banner */}
          <div className="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 mb-4">
            <span className="text-sm text-indigo-700 font-medium">Outstanding</span>
            <span className="text-lg font-bold text-indigo-700">
              {formatCurrency(maxAmount, currency)}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Amount {isEdit ? '' : `(max ${formatCurrency(maxAmount, currency)})`}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  {currency}
                </span>
                <input
                  type="number"
                  min={1}
                  max={maxAmount}
                  step={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  required
                  className="block w-full rounded-xl border border-gray-300 bg-white pl-8 pr-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayString()}
              required
            />

            <Input
              label="Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />

            <Input
              label="Note (optional)"
              type="text"
              placeholder="e.g. Cash payment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
            />

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" fullWidth loading={loading}>
                {isEdit ? 'Save changes' : 'Record payment'}
              </Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}
