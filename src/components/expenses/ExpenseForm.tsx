'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import { addExpense, updateExpense } from '@/services/expenses';
import { todayString } from '@/lib/utils';
import type { ExpenseCategory, ExpenseFormData, ExpenseWithCategory } from '@/types';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: ExpenseCategory[];
  editExpense?: ExpenseWithCategory | null;
}

export default function ExpenseForm({
  open,
  onClose,
  onSuccess,
  categories,
  editExpense,
}: ExpenseFormProps) {
  const isEdit = !!editExpense;

  const [categoryId, setCategoryId] = useState(editExpense?.category_id ?? '');
  const [amount, setAmount]         = useState(editExpense ? String(editExpense.amount) : '');
  const [date, setDate]             = useState(editExpense?.expense_date ?? todayString());
  const [note, setNote]             = useState(editExpense?.note ?? '');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (open) {
      setCategoryId(editExpense?.category_id ?? categories[0]?.id ?? '');
      setAmount(editExpense ? String(editExpense.amount) : '');
      setDate(editExpense?.expense_date ?? todayString());
      setNote(editExpense?.note ?? '');
      setError('');
    }
  }, [open, editExpense, categories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Enter a valid amount greater than ₹0.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    const formData: ExpenseFormData = {
      category_id:  categoryId,
      amount:       numericAmount,
      expense_date: date,
      note,
    };

    setLoading(true);
    try {
      if (isEdit && editExpense) {
        await updateExpense(editExpense.id, formData);
      } else {
        await addExpense(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Expense' : 'Add Expense'}>
      {error && <Alert message={error} className="mb-4" />}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              className="block w-full rounded-xl border border-gray-300 bg-white pl-8 pr-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Category selector */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Category</p>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-xs font-medium transition-colors ${
                  categoryId === cat.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="truncate w-full text-center leading-tight">{cat.name}</span>
              </button>
            ))}
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
          label="Note (optional)"
          type="text"
          placeholder="e.g. Monthly rent payment"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
        />

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={loading}>
            {isEdit ? 'Save changes' : 'Add expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
