import { createClient } from '@/lib/supabase/client';
import type {
  Expense,
  ExpenseCategory,
  ExpenseFormData,
  ExpenseWithCategory,
} from '@/types';
import { DEFAULT_EXPENSE_CATEGORIES } from '@/lib/constants';

// ─── Categories ───────────────────────────────────────────────────────────────

/** Get all categories for the current user. Seeds defaults if none exist. */
export async function getCategories(): Promise<ExpenseCategory[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);

  // If no categories yet, seed the defaults for this user
  if (!data || data.length === 0) {
    return seedDefaultCategories(user.id);
  }

  return data as ExpenseCategory[];
}

/** Insert the default category set for a new user */
async function seedDefaultCategories(userId: string): Promise<ExpenseCategory[]> {
  const supabase = createClient();
  const rows = DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
    user_id:    userId,
    name:       c.name,
    icon:       c.icon,
    color:      c.color,
    is_default: true,
  }));

  const { data, error } = await supabase
    .from('expense_categories')
    .insert(rows)
    .select();

  if (error) throw new Error(error.message);
  return data as ExpenseCategory[];
}

/** Add a custom category */
export async function addCategory(
  name: string,
  icon: string,
  color: string,
): Promise<ExpenseCategory> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('expense_categories')
    .insert({ user_id: user.id, name: name.trim(), icon, color, is_default: false })
    .select()
    .single();

  if (error) {
    if (error.message.includes('unique')) throw new Error(`Category "${name}" already exists.`);
    throw new Error(error.message);
  }
  return data as ExpenseCategory;
}

/** Delete a custom (non-default) category */
export async function deleteCategory(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('expense_categories')
    .delete()
    .eq('id', id)
    .eq('is_default', false); // safety: never delete default categories via this fn
  if (error) throw new Error(error.message);
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

/** Fetch all expenses with their category, newest first */
export async function getExpenses(): Promise<ExpenseWithCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      category:expense_categories (
        id, user_id, name, icon, color, is_default, created_at, updated_at
      )
    `)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as ExpenseWithCategory[];
}

/** Fetch expenses for a specific month as 'YYYY-MM' */
export async function getExpensesByMonth(month: string): Promise<ExpenseWithCategory[]> {
  const supabase = createClient();
  const from = `${month}-01`;
  // last day of month
  const [y, m] = month.split('-').map(Number);
  const to = new Date(y, m, 0).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      category:expense_categories (
        id, user_id, name, icon, color, is_default, created_at, updated_at
      )
    `)
    .gte('expense_date', from)
    .lte('expense_date', to)
    .order('expense_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data as ExpenseWithCategory[];
}

/** Add a new expense */
export async function addExpense(formData: ExpenseFormData): Promise<Expense> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (formData.amount <= 0) throw new Error('Amount must be greater than ₹0.');

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id:      user.id,
      category_id:  formData.category_id,
      amount:       formData.amount,
      expense_date: formData.expense_date,
      note:         formData.note.trim() || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Expense;
}

/** Update an existing expense */
export async function updateExpense(
  id: string,
  formData: Partial<ExpenseFormData>,
): Promise<Expense> {
  const supabase = createClient();
  if (formData.amount !== undefined && formData.amount <= 0) {
    throw new Error('Amount must be greater than ₹0.');
  }

  const { data, error } = await supabase
    .from('expenses')
    .update({
      ...formData,
      note: formData.note?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Expense;
}

/** Delete an expense */
export async function deleteExpense(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
