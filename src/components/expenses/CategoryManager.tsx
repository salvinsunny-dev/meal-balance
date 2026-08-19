'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { addCategory, deleteCategory } from '@/services/expenses';
import type { ExpenseCategory } from '@/types';

const PRESET_ICONS = ['🏠','⚡','💧','📡','🛒','🚌','📱','🏥','📚','🛍️','🍽️','🎬','💊','🎮','✈️','🐾','💇','🔧','🌿','📦'];
const PRESET_COLORS = [
  'bg-blue-500','bg-yellow-500','bg-cyan-500','bg-purple-500','bg-green-500',
  'bg-orange-500','bg-pink-500','bg-red-500','bg-indigo-500','bg-fuchsia-500',
  'bg-teal-500','bg-lime-500','bg-amber-500','bg-rose-500','bg-sky-500','bg-gray-500',
];

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  onRefresh: () => void;
}

export default function CategoryManager({
  open, onClose, categories, onRefresh,
}: CategoryManagerProps) {
  const [name, setName]         = useState('');
  const [icon, setIcon]         = useState('📦');
  const [color, setColor]       = useState('bg-gray-500');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(null);
  const [deleting, setDeleting]         = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await addCategory(name.trim(), icon, color);
      setSuccess(`"${name.trim()}" category added.`);
      setName('');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  const customCategories = categories.filter((c) => !c.is_default);

  return (
    <>
      <Modal open={open} onClose={onClose} title="Manage Categories">
        <div className="space-y-5">
          {error   && <Alert variant="error"   message={error}   />}
          {success && <Alert variant="success" message={success} />}

          {/* Add custom category */}
          <form onSubmit={handleAdd} className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Add Custom Category</p>
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gym"
              required
              maxLength={30}
            />

            {/* Icon picker */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Icon</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`text-xl w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      icon === ic ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full ${c} transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                    }`}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>

            <Button type="submit" fullWidth loading={saving}>
              Add Category
            </Button>
          </form>

          {/* Custom categories list */}
          {customCategories.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Custom Categories</p>
              <ul className="space-y-2">
                {customCategories.map((cat) => (
                  <li key={cat.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-sm font-medium text-gray-800">{cat.name}</span>
                    </div>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete category?"
        message={`Delete "${deleteTarget?.name}"? Expenses using this category cannot be deleted if any exist.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </>
  );
}
