import { createClient } from '@/lib/supabase/client';
import type { Meal, MealFormData, MealType } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/constants';

/** Fetch all meals for the authenticated user, newest first */
export async function getMeals(): Promise<Meal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .order('meal_date', { ascending: false })
    .order('meal_time', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Meal[];
}

/** Fetch meals for a specific date */
export async function getMealsByDate(date: string): Promise<Meal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('meal_date', date)
    .order('meal_time', { ascending: true });

  if (error) throw new Error(error.message);
  return data as Meal[];
}

/** Fetch meals within a date range */
export async function getMealsByRange(from: string, to: string): Promise<Meal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .gte('meal_date', from)
    .lte('meal_date', to)
    .order('meal_date', { ascending: false })
    .order('meal_time', { ascending: false });

  if (error) throw new Error(error.message);
  return data as Meal[];
}

/** Add a new meal — duplicates are also blocked by the DB unique constraint */
export async function addMeal(formData: MealFormData): Promise<Meal> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  // Check for duplicate before inserting (friendly error message)
  const { data: existing } = await supabase
    .from('meals')
    .select('id')
    .eq('meal_date', formData.meal_date)
    .eq('meal_type', formData.meal_type)
    .maybeSingle();

  if (existing) {
    throw new Error(
      `${formData.meal_type} meal has already been recorded for this date.`,
    );
  }

  const { data, error } = await supabase
    .from('meals')
    .insert({
      user_id: user.id,
      meal_type: formData.meal_type,
      meal_date: formData.meal_date,
      meal_time: formData.meal_time,
      amount: DEFAULT_SETTINGS.meal_price,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Meal;
}

/** Update an existing meal */
export async function updateMeal(
  id: string,
  formData: Partial<MealFormData>,
): Promise<Meal> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (formData.meal_date && formData.meal_type) {
    const { data: existing } = await supabase
      .from('meals')
      .select('id')
      .eq('meal_date', formData.meal_date)
      .eq('meal_type', formData.meal_type)
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      throw new Error(
        `${formData.meal_type} meal has already been recorded for this date.`,
      );
    }
  }

  const { data, error } = await supabase
    .from('meals')
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Meal;
}

/** Delete a meal by ID */
export async function deleteMeal(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('meals').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Returns the set of meal types already recorded for a given date */
export async function getRecordedMealTypes(date: string): Promise<MealType[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('meals')
    .select('meal_type')
    .eq('meal_date', date);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { meal_type: MealType }) => r.meal_type);
}
