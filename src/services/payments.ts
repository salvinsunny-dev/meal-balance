import { createClient } from '@/lib/supabase/client';
import type { Payment, PaymentFormData } from '@/types';

/** Fetch all payments for the authenticated user, newest first */
export async function getPayments(): Promise<Payment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('payment_date', { ascending: false })
    .order('payment_time', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Payment[];
}

/** Fetch payments within a date range */
export async function getPaymentsByRange(from: string, to: string): Promise<Payment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .gte('payment_date', from)
    .lte('payment_date', to)
    .order('payment_date', { ascending: false })
    .order('payment_time', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Payment[];
}

/**
 * Add a new payment record.
 * Validates that payment does not exceed outstanding balance.
 */
export async function addPayment(
  formData: PaymentFormData,
  outstandingBalance: number,
): Promise<Payment> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (outstandingBalance <= 0) {
    throw new Error('No outstanding balance to record a payment against.');
  }

  if (formData.amount <= 0) {
    throw new Error('Payment amount must be greater than ₹0.');
  }

  if (formData.amount > outstandingBalance) {
    throw new Error(
      `Payment amount (₹${formData.amount}) cannot exceed the current outstanding balance (₹${outstandingBalance}).`,
    );
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      amount: formData.amount,
      payment_date: formData.payment_date,
      payment_time: formData.payment_time,
      note: formData.note.trim() || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Payment;
}

/** Update an existing payment */
export async function updatePayment(
  id: string,
  formData: Partial<PaymentFormData>,
  currentPaymentAmount: number,
  outstandingBalance: number,
): Promise<Payment> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (formData.amount !== undefined) {
    const availableBalance = outstandingBalance + currentPaymentAmount;

    if (formData.amount <= 0) {
      throw new Error('Payment amount must be greater than ₹0.');
    }
    if (formData.amount > availableBalance) {
      throw new Error(
        `Payment amount (₹${formData.amount}) cannot exceed the available balance (₹${availableBalance}).`,
      );
    }
  }

  const { data, error } = await supabase
    .from('payments')
    .update({
      ...formData,
      note: formData.note?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Payment;
}

/** Delete a payment record */
export async function deletePayment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
